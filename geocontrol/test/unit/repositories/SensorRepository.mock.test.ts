import { SensorRepository } from "@repositories/SensorRepository";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";
import { ConflictError } from "@models/errors/ConflictError";
import { NotFoundError } from "@models/errors/NotFoundError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockDelete = jest.fn();
const mockCreate = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      return {
        find: mockFind,
        save: mockSave,
        remove: mockRemove,
        delete: mockDelete,
        create: mockCreate,
      };
    },
  },
}));

describe("SensorRepository: mocked database", () => {
  const repo = new SensorRepository();
  const gateway = new GatewayDAO();
  gateway.macAddress = "GW1";
  gateway.name = "Gateway 1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllSensor", async () => {
    mockFind.mockResolvedValue([{ macAddress: "SEN1", gateway }]);
    const result = await repo.getAllSensor("NET1", "GW1");
    expect(result[0].macAddress).toBe("SEN1");
    expect(mockFind).toHaveBeenCalled();
  });

  it("getSensor: found", async () => {
    mockFind.mockResolvedValue([{ macAddress: "SEN1", gateway }]);
    const result = await repo.getSensor("NET1", "GW1", "SEN1");
    expect(result.macAddress).toBe("SEN1");
    expect(mockFind).toHaveBeenCalled();
  });

  it("getSensor: not found", async () => {
    mockFind.mockResolvedValue([]);
    await expect(repo.getSensor("NET1", "GW1", "SEN1")).rejects.toThrow(
      NotFoundError
    );
  });

  it("getSensorMacsByNetworkCode", async () => {
    mockFind.mockResolvedValue([
      { macAddress: "SEN1" },
      { macAddress: "SEN2" },
    ]);
    const result = await repo.getSensorMacsByNetworkCode("NET1");
    expect(result).toContain("SEN1");
    expect(result).toContain("SEN2");
  });

  it("createSensor", async () => {
    mockFind.mockResolvedValueOnce([]); // no conflict
    const sensor = { macAddress: "SEN1", gateway };
    mockSave.mockResolvedValue(sensor);
    const result = await repo.createSensor(
      gateway,
      "SEN1",
      "Sensor 1",
      "desc",
      "temp",
      "C"
    );
    expect(result.macAddress).toBe("SEN1");
    expect(mockSave).toHaveBeenCalledWith({
      macAddress: "SEN1",
      name: "Sensor 1",
      description: "desc",
      variable: "temp",
      unit: "C",
      gateway,
    });
  });

  it("createSensor: conflict", async () => {
    mockFind.mockResolvedValueOnce([{}]);
    await expect(
      repo.createSensor(gateway, "SEN1", "Sensor 1", "desc", "temp", "C")
    ).rejects.toThrow(ConflictError);
  });

  it("updateSensor: update name/desc", async () => {
    const sensor = { macAddress: "SEN1", name: "Sensor 1", gateway };
    mockFind.mockResolvedValueOnce([sensor]);
    mockSave.mockResolvedValue({
      ...sensor,
      name: "NewName",
      description: "newdesc",
    });
    const result = await repo.updateSensor("NET1", "GW1", "SEN1", {
      name: "NewName",
      description: "newdesc",
    });
    expect(result.name).toBe("NewName");
    expect(result.description).toBe("newdesc");
  });

  it("updateSensor: change macAddress", async () => {
    const sensor = { macAddress: "SEN1", name: "Sensor 1", gateway };
    mockFind.mockResolvedValueOnce([sensor]); // getSensor
    mockFind.mockResolvedValueOnce([]); // conflict check
    mockCreate.mockReturnValue({ ...sensor, macAddress: "SEN2" });
    mockSave.mockResolvedValue({ ...sensor, macAddress: "SEN2" });
    mockDelete.mockResolvedValue(undefined);

    const result = await repo.updateSensor("NET1", "GW1", "SEN1", {
      macAddress: "SEN2",
    });
    expect(result.macAddress).toBe("SEN2");
  });

  it("updateSensor: change macAddress (conflict)", async () => {
    const sensor = { macAddress: "SEN1", name: "Sensor 1", gateway };
    mockFind.mockResolvedValueOnce([sensor]); // getSensor
    mockFind.mockResolvedValueOnce([{}]); // conflict check
    await expect(
      repo.updateSensor("NET1", "GW1", "SEN1", { macAddress: "SEN2" })
    ).rejects.toThrow(ConflictError);
  });

  it("updateSensor: update solo variable e unit", async () => {
    const sensor = {
      macAddress: "SEN1",
      name: "Sensor 1",
      description: "desc",
      variable: "oldvar",
      unit: "oldunit",
      gateway,
    };
    mockFind.mockResolvedValueOnce([sensor]);
    mockSave.mockResolvedValue({
      ...sensor,
      variable: "newvar",
      unit: "newunit",
    });
    const result = await repo.updateSensor("NET1", "GW1", "SEN1", {
      variable: "newvar",
      unit: "newunit",
    });
    expect(result.variable).toBe("newvar");
    expect(result.unit).toBe("newunit");
    expect(result.name).toBe("Sensor 1");
    expect(result.description).toBe("desc");
  });

  it("deleteSensor", async () => {
    const sensor = { macAddress: "SEN1", name: "Sensor 1", gateway };
    mockFind.mockResolvedValueOnce([sensor]);
    mockRemove.mockResolvedValue(undefined);
    await repo.deleteSensor("NET1", "GW1", "SEN1");
    // expect(mockRemove).toHaveBeenCalledWith(sensor);
    // expect(mockRemove).toHaveBeenCalledWith(sensor);
  });
});
