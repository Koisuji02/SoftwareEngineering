import { NetworkRepository } from "@repositories/NetworkRepository";
import { NetworkDAO } from "@dao/NetworkDAO";
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
      if (entity === "GatewayDAO") return { save: jest.fn() };
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

describe("NetworkRepository (mocked DB)", () => {
  const repo = new NetworkRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("getAllNetworks returns empty array when none exist", async () => {
    mockFind.mockResolvedValue([]);
    const result = await repo.getAllNetworks();
    expect(result).toEqual([]);
  });

  it("get all networks", async () => {
    const networks = [new NetworkDAO()];
    mockFind.mockResolvedValue(networks);

    const result = await repo.getAllNetworks();
    expect(result).toBe(networks);
  });

  it("get network by code: found", async () => {
    const network = new NetworkDAO();
    network.code = "NET001";
    mockFind.mockResolvedValue([network]);

    const result = await repo.getNetworkByCode("NET001");
    expect(result.code).toBe("NET001");
  });

  it("get network by code: not found", async () => {
    mockFind.mockResolvedValue([]);
    await expect(repo.getNetworkByCode("NET404")).rejects.toThrow(NotFoundError);
  });

  it("create network: success", async () => {
    mockFind.mockResolvedValueOnce([]);
    const saved = new NetworkDAO();
    saved.code = "NET123";
    saved.name = "Network";
    saved.description = "Test";

    mockSave.mockResolvedValue(saved);

    const result = await repo.createNetwork("NET123", "Network", "Test");
    expect(result.code).toBe("NET123");
  });

  it("create network: conflict", async () => {
    const existing = new NetworkDAO();
    existing.code = "NET123";
    mockFind.mockResolvedValueOnce([existing]);

    await expect(repo.createNetwork("NET123", "Dup", "Desc")).rejects.toThrow(ConflictError);
  });

  it("delete network", async () => {
    const net = new NetworkDAO();
    net.code = "NET001";
    mockFind.mockResolvedValue([net]);

    await repo.deleteNetwork("NET001");
    expect(mockRemove).toHaveBeenCalledWith(net);
  });

  it("delete non-existent network throws NotFoundError", async () => {
    mockFind.mockResolvedValue([]);
    await expect(repo.deleteNetwork("MISSING")).rejects.toThrow(NotFoundError);
  });

  it("update network: name only", async () => {
    const net = new NetworkDAO();
    net.code = "NET001";
    net.name = "Old";
    net.gateways = [];

    mockFind.mockResolvedValueOnce([net]);
    mockSave.mockResolvedValue({ ...net, name: "New" });

    const updated = await repo.updateNetwork("NET001", { name: "New" });
    expect(updated.name).toBe("New");
  });

  it("update network: description only", async () => {
    const net = new NetworkDAO();
    net.code = "NET002";
    net.description = "OldDesc";
    net.gateways = [];

    mockFind.mockResolvedValueOnce([net]);
    mockSave.mockResolvedValue({ ...net, description: "NewDesc" });

    const updated = await repo.updateNetwork("NET002", { description: "NewDesc" });
    expect(updated.description).toBe("NewDesc");
  });

  it("update network: code conflict", async () => {
    const net = new NetworkDAO();
    net.code = "NET001";
    net.gateways = [];

    mockFind
      .mockResolvedValueOnce([net]) // getNetworkByCode
      .mockResolvedValueOnce([{ code: "NET999" }]); // conflict

    await expect(
      repo.updateNetwork("NET001", { code: "NET999" })
    ).rejects.toThrow(ConflictError);
  });

  it("update non-existent network throws NotFoundError", async () => {
    mockFind.mockResolvedValue([]);
    await expect(repo.updateNetwork("MISSING", { name: "X" })).rejects.toThrow(NotFoundError);
  });
});
