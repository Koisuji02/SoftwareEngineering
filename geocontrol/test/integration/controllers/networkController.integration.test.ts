import * as networkController from "@controllers/networkController";
import { NetworkRepository } from "@repositories/NetworkRepository";
import { Network as NetworkDTO } from "@dto/Network";
import { NetworkDAO } from "@dao/NetworkDAO";

jest.mock("@repositories/NetworkRepository");
jest.mock("@services/mapperService", () => ({
  mapNetworkDAOToDTO: (dao: any) => ({ ...dao, mapped: true }),
  mapNetworkDTOToDAO: (dto: any) => ({ ...dto, mapped: true }),
}));

jest.mock("@services/authService", () => ({
  processToken: jest.fn(),
}));

describe("networkController integration", () => {
  const baseUrl = "/api/v1/networks";
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getAllNetworks: mapperService integration", async () => {
    const fakeNetworkDAO: NetworkDAO = {
      code: "NET1",
      name: "Network 1",
      description: "desc",
      gateways: [],
    };
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getAllNetworks: jest.fn().mockResolvedValue([fakeNetworkDAO]),
    }));

    const result = await networkController.getAllNetworks();
    expect(result[0]).toMatchObject({ code: "NET1", mapped: true });
  });

  it("getNetwork: mapperService integration", async () => {
    const fakeNetworkDAO: NetworkDAO = {
      code: "NET1",
      name: "Network 1",
      description: "desc",
      gateways: [],
    };

    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getNetworkByCode: jest.fn().mockResolvedValue(fakeNetworkDAO),
    }));

    const result = await networkController.getNetwork("NET1");
    expect(result).toMatchObject({ code: "NET1", mapped: true });
  });

  // it("getNetwork nicola", async () => {
  //   const fakeGateway: GatewayDAO = {
  //     macAddress: "GW1",
  //     name: "Gate1",
  //     description: undefined,
  //     sensors: [],
  //     network: undefined as any, // risolviamo dopo
  //   };
  //   const fakeGateway2: GatewayDAO = {
  //     macAddress: "GW2",
  //     name: "Gate2",
  //     description: undefined,
  //     sensors: [],
  //     network: undefined as any,
  //   };

  //   const fakeNetworkDAO: NetworkDAO = {
  //     code: "NET1",
  //     name: "Network 1",
  //     description: "desc",
  //     gateways: [fakeGateway, fakeGateway2],
  //   };
  //   fakeGateway.network = fakeNetworkDAO;
  //   fakeGateway2.network = fakeNetworkDAO;

  //   (processToken as jest.Mock).mockResolvedValue(undefined);
  //   jest
  //     .spyOn(NetworkRepository.prototype, "getNetworkByCode")
  //     .mockResolvedValue(fakeNetworkDAO);

  //   const response = await request(app)
  //     .get(`${baseUrl}/NET1`)
  //     .set("Authorization", token);

  //   expect(response.status).toBe(200);
  //   expect(response.body).toEqual({
  //     code: "NET1",
  //     name: "Network 1",
  //     description: "desc",
  //     gateways: [
  //       {
  //         macAddress: "GW1",
  //         name: "Gate1",
  //         description: undefined,
  //         sensors: [],
  //       },
  //       {
  //         macAddress: "GW2",
  //         name: "Gate2",
  //         description: undefined,
  //         sensors: [],
  //       },
  //     ],
  //   });
  // });

  it("createNetwork: calls repo", async () => {
    const createNetwork = jest.fn();
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      createNetwork,
    }));

    const networkDto: NetworkDTO = {
      code: "NET1",
      name: "Network 1",
      description: "desc",
    };

    await networkController.createNetwork(networkDto);
    expect(createNetwork).toHaveBeenCalledWith("NET1", "Network 1", "desc");
  });

  it("updateNetwork: calls repo with mapped updates", async () => {
    const updateNetwork = jest.fn();
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      updateNetwork,
    }));

    await networkController.updateNetwork("NET1", { name: "newName" });
    expect(updateNetwork).toHaveBeenCalledWith("NET1", {
      name: "newName",
      mapped: true,
    });
  });

  it("deleteNetwork: calls repo", async () => {
    const deleteNetwork = jest.fn();
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      deleteNetwork,
    }));

    await networkController.deleteNetwork("NET1");
    expect(deleteNetwork).toHaveBeenCalledWith("NET1");
  });
});
