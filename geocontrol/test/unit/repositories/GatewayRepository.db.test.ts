import { GatewayRepository } from "@repositories/GatewayRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource,
} from "@test/setup/test-datasource";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { SensorDAO } from "@dao/SensorDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

let repo: GatewayRepository;

beforeAll(async () => {
  await initializeTestDataSource();
  repo = new GatewayRepository();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("GatewayRepository (SQLite in-memory)", () => {
  const createNetwork = async (code = "NET001") => {
    const netRepo = TestDataSource.getRepository(NetworkDAO);
    const net = new NetworkDAO();
    net.code = code;
    net.name = "Test Network";
    net.description = "Test";
    return await netRepo.save(net);
  };

  const createGateway = async (
    network: NetworkDAO,
    mac: string,
    name = "GW"
  ) => {
    return await repo.createGateway(network, mac, name, "desc");
  };

  const createSensor = async (
    mac: string,
    name: string,
    gateway: GatewayDAO
  ) => {
    const sensorRepo = TestDataSource.getRepository(SensorDAO);
    const sensor = new SensorDAO();
    sensor.macAddress = mac;
    sensor.name = name;
    sensor.description = "A sensor";
    sensor.variable = "temp";
    sensor.unit = "°C";
    sensor.gateway = gateway;
    return await sensorRepo.save(sensor);
  };

  it("create and get gateway", async () => {
    const net = await createNetwork();
    const gateway = await createGateway(net, "AA:BB:CC");

    const found = await repo.getGatewayByMac(net.code, "AA:BB:CC");
    expect(found.name).toBe("GW");
    expect(found.network.code).toBe(net.code);
  });

  it("create gateway: conflict", async () => {
    const net = await createNetwork();
    await createGateway(net, "DUP:LIC:ATE");
    await expect(createGateway(net, "DUP:LIC:ATE", "Another")).rejects.toThrow(
      ConflictError
    );
  });

  it("get all gateways", async () => {
    const net = await createNetwork();
    await createGateway(net, "MAC1");
    await createGateway(net, "MAC2");

    const all = await repo.getAllGateways(net.code);
    expect(all).toHaveLength(2);
  });

  it("delete gateway", async () => {
    const net = await createNetwork();
    await createGateway(net, "TO:DEL");
    await repo.deleteGateway(net.code, "TO:DEL");

    await expect(repo.getGatewayByMac(net.code, "TO:DEL")).rejects.toThrow(
      NotFoundError
    );
  });

  it("update gateway: simple name change", async () => {
    const net = await createNetwork();
    await createGateway(net, "SAME:MAC", "Old Name");

    const updated = await repo.updateGateway(net.code, "SAME:MAC", {
      name: "New Name",
    });
    expect(updated.name).toBe("New Name");
  });

  it("update gateway: MAC change with sensor reassignment", async () => {
    const net = await createNetwork();
    await createGateway(net, "OLD:MAC", "Gateway Old");

    const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
    const oldGateway = await gatewayRepo.findOneOrFail({
      where: { macAddress: "OLD:MAC" },
    });

    await createSensor("SEN:001", "Sensor1", oldGateway);

    const gatewayWithSensors = await gatewayRepo.findOneOrFail({
      where: { macAddress: "OLD:MAC" },
      relations: ["sensors"],
    });

    expect(gatewayWithSensors.sensors.length).toBeGreaterThan(0);

    const updated = await repo.updateGateway(net.code, "OLD:MAC", {
      macAddress: "NEW:MAC",
      name: "Updated Gateway",
    });

    expect(updated.macAddress).toBe("NEW:MAC");

    const updatedSensor = await TestDataSource.getRepository(SensorDAO).findOne(
      {
        where: { macAddress: "SEN:001" },
        relations: ["gateway"],
      }
    );

    expect(updatedSensor?.gateway.macAddress).toBe("NEW:MAC");
  });

  it("update gateway: MAC change with più sensori", async () => {
    const net = await createNetwork();
    await createGateway(net, "OLD:MAC", "Gateway Old");
    const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
    const oldGateway = await gatewayRepo.findOneOrFail({
      where: { macAddress: "OLD:MAC" },
    });
    // Crea due sensori associati al gateway
    await createSensor("SEN:001", "Sensor1", oldGateway);
    await createSensor("SEN:002", "Sensor2", oldGateway);

    const sensorsBefore = await TestDataSource.getRepository(SensorDAO).find({
      where: [{ macAddress: "SEN:001" }, { macAddress: "SEN:002" }],
      relations: ["gateway"],
    });
    expect(sensorsBefore[0].gateway.macAddress).toBe("OLD:MAC");
    expect(sensorsBefore[1].gateway.macAddress).toBe("OLD:MAC");

    const updated = await repo.updateGateway(net.code, "OLD:MAC", {
      macAddress: "NEW:MAC",
      name: "Updated Gateway",
    });
    expect(updated.macAddress).toBe("NEW:MAC");

    const updatedSensors = await TestDataSource.getRepository(SensorDAO).find({
      where: [{ macAddress: "SEN:001" }, { macAddress: "SEN:002" }],
      relations: ["gateway"],
    });
    expect(updatedSensors[0].gateway.macAddress).toBe("NEW:MAC");
    expect(updatedSensors[1].gateway.macAddress).toBe("NEW:MAC");
  });

  it("update gateway: MAC conflict", async () => {
    const net = await createNetwork();
    await createGateway(net, "EXIST:MAC");
    await createGateway(net, "TO:CHANGE");

    await expect(
      repo.updateGateway(net.code, "TO:CHANGE", { macAddress: "EXIST:MAC" })
    ).rejects.toThrow(ConflictError);
  });

  it("get gateway by MAC: not found", async () => {
    const net = await createNetwork();
    await expect(repo.getGatewayByMac(net.code, "UNKNOWN")).rejects.toThrow(
      NotFoundError
    );
  });

  it("update gateway: triggers create/save/delete block when MAC changes and no sensors", async () => {
    const net = await createNetwork();

    // Create a gateway with OLD:MAC
    await createGateway(net, "OLD:MAC", "Original");

    const gatewayRepo = TestDataSource.getRepository(GatewayDAO);

    // Reload with sensors: [] to satisfy relation
    const gateway = await gatewayRepo.findOneOrFail({
      where: { macAddress: "OLD:MAC" },
      relations: ["sensors"],
    });
    expect(gateway.sensors).toEqual([]); // Ensure no sensors — important

    const updated = await repo.updateGateway(net.code, "OLD:MAC", {
      macAddress: "NEW:MAC",
      name: "Changed Name",
    });

    expect(updated.macAddress).toBe("NEW:MAC");
    expect(updated.name).toBe("Changed Name");

    const all = await repo.getAllGateways(net.code);

    // Verify old is deleted
    const oldStillExists = await gatewayRepo.findOne({
      where: { macAddress: "OLD:MAC" },
    });
    expect(oldStillExists).toBeNull();

    // Verify new exists
    const newOne = await gatewayRepo.findOne({
      where: { macAddress: "NEW:MAC" },
    });
    expect(newOne).not.toBeNull();
  });

  // ——————————————
  // partial-update tests
  // ——————————————

  it("get all gateways returns empty array when none exist", async () => {
    const net = await createNetwork();
    const list = await repo.getAllGateways(net.code);
    expect(list).toEqual([]);
  });

  it("get all gateways for non-existent network throws NotFoundError", async () => {
    await expect(repo.getAllGateways("BAD_NET")).rejects.toThrow(NotFoundError);
  });

  it("update non-existent gateway throws NotFoundError", async () => {
    const net = await createNetwork();
    await expect(
      repo.updateGateway(net.code, "NO_MAC", { name: "X" })
    ).rejects.toThrow(NotFoundError);
  });

  it("delete non-existent gateway throws NotFoundError", async () => {
    const net = await createNetwork();
    await expect(repo.deleteGateway(net.code, "NO_MAC")).rejects.toThrow(
      NotFoundError
    );
  });

  it("update gateway: description only", async () => {
    const net = await createNetwork();
    await createGateway(net, "MAC:DESC", "G");
    const updated = await repo.updateGateway(net.code, "MAC:DESC", {
      description: "NewDesc",
    });
    expect(updated.description).toBe("NewDesc");
  });

  it("update gateway: MAC change with zero sensors", async () => {
    const net = await createNetwork();
    await createGateway(net, "OLD:MAC", "Gateway Old");
    const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
    // Nessun sensore associato
    const updated = await repo.updateGateway(net.code, "OLD:MAC", {
      macAddress: "NEW:MAC",
      name: "Updated Gateway",
    });
    expect(updated.macAddress).toBe("NEW:MAC");
    // Verifica che non ci siano sensori associati
    const sensors = await TestDataSource.getRepository(SensorDAO).find({
      where: { gateway: { macAddress: "NEW:MAC" } },
      relations: ["gateway"],
    });
    expect(sensors.length).toBe(0);
  });

  it("update gateway: MAC change with one sensor", async () => {
    const net = await createNetwork();
    await createGateway(net, "OLD:MAC", "Gateway Old");
    const gatewayRepo = TestDataSource.getRepository(GatewayDAO);
    const oldGateway = await gatewayRepo.findOneOrFail({
      where: { macAddress: "OLD:MAC" },
    });
    await createSensor("SEN:ONLY", "SensorOnly", oldGateway);
    const updated = await repo.updateGateway(net.code, "OLD:MAC", {
      macAddress: "NEW:MAC",
      name: "Updated Gateway",
    });
    expect(updated.macAddress).toBe("NEW:MAC");
    const updatedSensor = await TestDataSource.getRepository(SensorDAO).findOne(
      {
        where: { macAddress: "SEN:ONLY" },
        relations: ["gateway"],
      }
    );
    expect(updatedSensor?.gateway.macAddress).toBe("NEW:MAC");
  });
});
