import * as gatewayController from "@controllers/gatewayController";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { Gateway as GatewayDTO } from "@dto/Gateway";
import { GatewayDAO } from "@dao/GatewayDAO";
import { NetworkDAO } from "@dao/NetworkDAO";

jest.mock("@repositories/GatewayRepository");
jest.mock("@repositories/NetworkRepository");
jest.mock("@services/mapperService", () => ({
  mapGatewayDAOToDTO: (dao: any) => ({ ...dao, mapped: true }),
  mapGatewayDTOToDAO: (dto: any) => ({ ...dto, mapped: true })
}));

describe("gatewayController integration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getAllGateways: mapperService integration", async () => {
    const fakeGatewayDAO: GatewayDAO = {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "desc",
      network: {} as NetworkDAO,
      sensors: []
    };
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getAllGateways: jest.fn().mockResolvedValue([fakeGatewayDAO])
    }));

    const result = await gatewayController.getAllGateways("NET1");
    expect(result[0]).toMatchObject({ macAddress: "GW1", mapped: true });
  });

  it("getGateway: mapperService integration", async () => {
    const fakeGatewayDAO: GatewayDAO = {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "desc",
      network: {} as NetworkDAO,
      sensors: []
    };
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMac: jest.fn().mockResolvedValue(fakeGatewayDAO)
    }));

    const result = await gatewayController.getGateway("NET1", "GW1");
    expect(result).toMatchObject({ macAddress: "GW1", mapped: true });
  });

  it("createGateway: calls repo with mapped args", async () => {
    const fakeNetwork: NetworkDAO = { code: "NET1", name: "Network 1", description: "NET1", gateways: [] };
    const fakeGatewayDTO: GatewayDTO = {
      macAddress: "GW1",
      name: "Gateway 1",
      description: "desc"
    };
    const createGateway = jest.fn();
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getNetworkByCode: jest.fn().mockResolvedValue(fakeNetwork)
    }));
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      createGateway
    }));

    await gatewayController.createGateway(fakeGatewayDTO, "NET1");
    expect(createGateway).toHaveBeenCalledWith(
      fakeNetwork,
      fakeGatewayDTO.macAddress,
      fakeGatewayDTO.name,
      fakeGatewayDTO.description
    );
  });

  it("updateGateway: calls repo with mapped updates", async () => {
    const updateGateway = jest.fn();
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      updateGateway
    }));

    await gatewayController.updateGateway("NET1", "GW1", { name: "newName" });
    expect(updateGateway).toHaveBeenCalledWith("NET1", "GW1", { name: "newName", mapped: true });
  });

  it("deleteGateway: calls repo", async () => {
    const deleteGateway = jest.fn();
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      deleteGateway
    }));

    await gatewayController.deleteGateway("NET1", "GW1");
    expect(deleteGateway).toHaveBeenCalledWith("NET1", "GW1");
  });
});