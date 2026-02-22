import { GatewayRepository } from "@repositories/GatewayRepository";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NotFoundError } from "@models/errors/NotFoundError";
import { ConflictError } from "@models/errors/ConflictError";

const mockFind = jest.fn();
const mockSave = jest.fn();
const mockRemove = jest.fn();
const mockDelete = jest.fn();
const mockCreate = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: (entity: any) => {
      if (entity === "SensorDAO") return { save: jest.fn() };
      if (entity && entity.name === "NetworkDAO") {
        return {
          find: jest.fn(({ where }) => {
            if (where && where.code === "NET001") return Promise.resolve([{ code: "NET001" }]);
            return Promise.resolve([]);
          })
        };
      }
      return {
        find: mockFind,
        save: mockSave,
        remove: mockRemove,
        delete: mockDelete,
        create: mockCreate,
      };
    }
  }
}));

describe("GatewayRepository (mocked DB)", () => {
  const repo = new GatewayRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("get all gateways", async () => {
    const mockGateways = [new GatewayDAO()];
    mockFind.mockResolvedValue(mockGateways);

    const result = await repo.getAllGateways("NET001");
    expect(result).toEqual(mockGateways);
  });

  it("get gateway by MAC: found", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "MAC123";
    mockFind.mockResolvedValue([gateway]);

    const result = await repo.getGatewayByMac("NET001", "MAC123");
    expect(result).toBe(gateway);
  });

  it("get gateway by MAC: not found", async () => {
    mockFind.mockResolvedValue([]);
    await expect(repo.getGatewayByMac("NET001", "UNKNOWN")).rejects.toThrow(NotFoundError);
  });

  it("create gateway: success", async () => {
    mockFind.mockResolvedValueOnce([]);
    const network = {} as any;
    mockSave.mockResolvedValue({ macAddress: "MAC123", name: "G1", network });

    const result = await repo.createGateway(network, "MAC123", "G1", "desc");
    expect(result.macAddress).toBe("MAC123");
  });

  it("create gateway: conflict", async () => {
    mockFind.mockResolvedValueOnce([new GatewayDAO()]);
    await expect(
      repo.createGateway({} as any, "MAC123", "G1")
    ).rejects.toThrow(ConflictError);
  });

  it("delete gateway", async () => {
    const gateway = new GatewayDAO();
    gateway.macAddress = "TO:DELETE";
    mockFind.mockResolvedValue([gateway]);

    await repo.deleteGateway("NET001", "TO:DELETE");
    expect(mockRemove).toHaveBeenCalledWith(gateway);
  });

  it("get all gateways returns empty array when none exist", async () => {
    mockFind.mockResolvedValueOnce([]);
    const result = await repo.getAllGateways("NET001");
    expect(result).toEqual([]);
  });

  it("get all gateways for non-existent network throws NotFoundError", async () => {
    mockFind.mockResolvedValueOnce([]);
    await expect(repo.getAllGateways("BAD_NET")).rejects.toThrow(NotFoundError);
  });

  it("update non-existent gateway throws NotFoundError", async () => {
    mockFind.mockResolvedValueOnce([]);
    await expect(
      repo.updateGateway("NET001", "NO_MAC", { name: "X" })
    ).rejects.toThrow(NotFoundError);
  });

  it("delete non-existent gateway throws NotFoundError", async () => {
    mockFind.mockResolvedValueOnce([]);
    await expect(repo.deleteGateway("NET001", "NO_MAC")).rejects.toThrow(NotFoundError);
  });

  it("update gateway: description only", async () => {
    const gw = new GatewayDAO();
    gw.macAddress = "MAC1";
    mockFind.mockReset();
    mockFind.mockResolvedValueOnce([{ code: "NET001" }]);
    mockFind.mockResolvedValueOnce([gw]);
    mockFind.mockResolvedValueOnce([gw]);
    mockSave.mockResolvedValue({ ...gw, description: "NewDesc" });

    const updated = await repo.updateGateway("NET001", "MAC1", { description: "NewDesc" });
    expect(updated.description).toBe("NewDesc");
  });

  it("update gateway: create and then update", async () => {
    const gw = new GatewayDAO();
    gw.macAddress = "MAC_UPDATE";
    mockFind.mockResolvedValueOnce([gw]);
    mockSave.mockResolvedValue({ ...gw, name: "UpdatedName" });
    mockFind.mockResolvedValueOnce([gw]);

    const updated = await repo.updateGateway("NET001", "MAC_UPDATE", { name: "UpdatedName" });
    expect(updated.name).toBe("UpdatedName");
  });
});