import { SensorRepository } from "@repositories/SensorRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

beforeAll(async () => {
  await initializeTestDataSource();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(SensorDAO).clear();
  await TestDataSource.getRepository(GatewayDAO).clear();
  await TestDataSource.getRepository(NetworkDAO).clear();
});

describe("SensorRepository: SQLite in-memory", () => {
  let repo: SensorRepository;
  let network: NetworkDAO;
  let gateway: GatewayDAO;

  beforeEach(async () => {
    repo = new SensorRepository();
    network = new NetworkDAO();
    network.code = "NET1";
    network.name = "Network 1";
    await TestDataSource.getRepository(NetworkDAO).save(network);

    gateway = new GatewayDAO();
    gateway.macAddress = "GW1";
    gateway.name = "Gateway 1";
    gateway.network = network;
    await TestDataSource.getRepository(GatewayDAO).save(gateway);
  });

  it("createSensor and getAllSensor", async () => {
    await repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C");
    await repo.createSensor(gateway, "SEN2", "Sensor 2", "desc2", "hum", "%");
    const sensors = await repo.getAllSensor("NET1", "GW1");
    expect(sensors.length).toBe(2);
    expect(sensors[0].gateway.macAddress).toBe("GW1");
  });

  it("createSensor: conflict", async () => {
    await repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C");
    await expect(
      repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C")
    ).rejects.toThrow(ConflictError);
  });

  it("getSensor: found", async () => {
    await repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C");
    const sensor = await repo.getSensor("NET1", "GW1", "SEN1");
    expect(sensor.macAddress).toBe("SEN1");
    expect(sensor.gateway.macAddress).toBe("GW1");
  });

  it("getSensor: not found", async () => {
    await expect(
      repo.getSensor("NET1", "GW1", "NOT_EXIST")
    ).rejects.toThrow(NotFoundError);
  });

  it("getSensorMacsByNetworkCode", async () => {
    await repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C");
    await repo.createSensor(gateway, "SEN2", "Sensor 2", "desc2", "hum", "%");
    const macs = await repo.getSensorMacsByNetworkCode("NET1");
    expect(macs).toContain("SEN1");
    expect(macs).toContain("SEN2");
  });

  it("updateSensor: update name/desc", async () => {
    await repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C");
    const updated = await repo.updateSensor("NET1", "GW1", "SEN1", { name: "NewName", description: "newdesc" });
    expect(updated.name).toBe("NewName");
    expect(updated.description).toBe("newdesc");
  });

  it("updateSensor: change macAddress", async () => {
    await repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C");
    const updated = await repo.updateSensor("NET1", "GW1", "SEN1", { macAddress: "SEN2" });
    expect(updated.macAddress).toBe("SEN2");
    await expect(repo.getSensor("NET1", "GW1", "SEN1")).rejects.toThrow(NotFoundError);
    const found = await repo.getSensor("NET1", "GW1", "SEN2");
    expect(found.macAddress).toBe("SEN2");
  });

  it("updateSensor: change macAddress (conflict)", async () => {
    await repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C");
    await repo.createSensor(gateway, "SEN2", "Sensor 2", "desc2", "hum", "%");
    await expect(
      repo.updateSensor("NET1", "GW1", "SEN1", { macAddress: "SEN2" })
    ).rejects.toThrow(ConflictError);
  });

  it("deleteSensor", async () => {
    await repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C");
    await repo.deleteSensor("NET1", "GW1", "SEN1");
    await expect(repo.getSensor("NET1", "GW1", "SEN1")).rejects.toThrow(NotFoundError);
  });
});