import { NetworkRepository } from "@repositories/NetworkRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource,
} from "@test/setup/test-datasource";
import { NetworkDAO } from "@dao/NetworkDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

let repo: NetworkRepository;

beforeAll(async () => {
  await initializeTestDataSource();
  repo = new NetworkRepository();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("NetworkRepository (SQLite in-memory)", () => {
  const createNetwork = async (
    code = "NET001",
    name = "Network",
    description = "Desc"
  ) => {
    return await repo.createNetwork(code, name, description);
  };

  const createGateway = async (code: string) => {
    const network = await TestDataSource.getRepository(
      NetworkDAO
    ).findOneOrFail({
      where: { code },
    });

    const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
    const gw = new GatewayDAO();
    gw.macAddress = "MAC:ADDR";
    gw.name = "Gateway";
    gw.description = "Desc";
    gw.network = network;
    return await gatewayRepo.save(gw);
  };

  const createGatewayWithMac = async (
    networkCode: string,
    macAddress: string
  ) => {
    const network = await TestDataSource.getRepository(
      NetworkDAO
    ).findOneOrFail({
      where: { code: networkCode },
    });

    const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
    const gw = new GatewayDAO();
    gw.macAddress = macAddress;
    gw.name = `Gateway ${macAddress}`;
    gw.description = "Desc";
    gw.network = network;
    return await gatewayRepo.save(gw);
  };

  it("getAllNetworks returns empty array when none exist", async () => {
    const all = await repo.getAllNetworks();
    expect(all).toEqual([]);
  });

  it("create and get network", async () => {
    const net = await createNetwork();
    const found = await repo.getNetworkByCode("NET001");
    expect(found.code).toBe("NET001");
  });

  it("create network: conflict", async () => {
    await createNetwork("NET123");
    await expect(repo.createNetwork("NET123", "Dup")).rejects.toThrow(
      ConflictError
    );
  });

  it("get all networks", async () => {
    await createNetwork("NETA");
    await createNetwork("NETB");

    const all = await repo.getAllNetworks();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it("delete network", async () => {
    await createNetwork("NETDEL");
    await repo.deleteNetwork("NETDEL");

    await expect(repo.getNetworkByCode("NETDEL")).rejects.toThrow(
      NotFoundError
    );
  });

  it("delete non-existent network throws NotFoundError", async () => {
    await expect(repo.deleteNetwork("MISSING")).rejects.toThrow(NotFoundError);
  });

  it("update network: name only", async () => {
    await createNetwork("NETUPDATE", "Old");

    const updated = await repo.updateNetwork("NETUPDATE", { name: "New" });
    expect(updated.name).toBe("New");
  });

  it("update network: description only", async () => {
    await createNetwork("NETDESC", "Name", "OldDesc");
    const updated = await repo.updateNetwork("NETDESC", {
      description: "NewDesc",
    });
    expect(updated.description).toBe("NewDesc");
  });

  it("update network: code change without gateways", async () => {
    await createNetwork("NETX");

    const result = await repo.updateNetwork("NETX", {
      code: "NETY",
      name: "Renamed",
    });

    expect(result.code).toBe("NETY");
    expect(result.name).toBe("Renamed");

    const all = await repo.getAllNetworks();
    expect(all.some((n) => n.code === "NETY")).toBe(true);
    expect(all.some((n) => n.code === "NETX")).toBe(false);
  });

  it("update network: code change with gateways", async () => {
    await createNetwork("NETG");
    await createGateway("NETG");

    const result = await repo.updateNetwork("NETG", { code: "NETZ" });
    expect(result.code).toBe("NETZ");

    const gateway = await TestDataSource.getRepository(GatewayDAO).findOne({
      where: { macAddress: "MAC:ADDR" },
      relations: ["network"],
    });

    expect(gateway?.network.code).toBe("NETZ");
  });

  it("update network: code change with multiple gateways", async () => {
    await createNetwork("NETM");
    await createGateway("NETM");
    await createGatewayWithMac("NETM", "MAC:ADDR2");

    const result = await repo.updateNetwork("NETM", { code: "NETN" });
    expect(result.code).toBe("NETN");

    const gateway1 = await TestDataSource.getRepository(GatewayDAO).findOne({
      where: { macAddress: "MAC:ADDR" },
      relations: ["network"],
    });

    const gateway2 = await TestDataSource.getRepository(GatewayDAO).findOne({
      where: { macAddress: "MAC:ADDR2" },
      relations: ["network"],
    });

    expect(gateway1?.network.code).toBe("NETN");
    expect(gateway2?.network.code).toBe("NETN");
  });

  it("update network: conflict", async () => {
    await createNetwork("A");
    await createNetwork("B");

    await expect(repo.updateNetwork("A", { code: "B" })).rejects.toThrow(
      ConflictError
    );
  });

  it("update non-existent network throws NotFoundError", async () => {
    await expect(repo.updateNetwork("MISSING", { name: "X" })).rejects.toThrow(
      NotFoundError
    );
  });

  it("get network by code: not found", async () => {
    await expect(repo.getNetworkByCode("MISSING")).rejects.toThrow(
      NotFoundError
    );
  });

  it("update network: code change with multiple gateways DEBUG", async () => {
    await createNetwork("NETDEBUG");
    const gw1 = await createGatewayWithMac("NETDEBUG", "MAC:DEBUG1");
    const gw2 = await createGatewayWithMac("NETDEBUG", "MAC:DEBUG2");
    const gw3 = await createGatewayWithMac("NETDEBUG", "MAC:DEBUG3");

    const gatewaysBefore = await TestDataSource.getRepository(GatewayDAO).find({
      relations: ["network"],
    });

    const result = await repo.updateNetwork("NETDEBUG", {
      code: "NETNEWDEBUG",
    });
    expect(result.code).toBe("NETNEWDEBUG");

    const gatewaysAfter = await TestDataSource.getRepository(GatewayDAO).find({
      relations: ["network"],
    });

    gatewaysAfter.forEach((gateway) => {
      expect(gateway.network.code).toBe("NETNEWDEBUG");
    });
  });
});
