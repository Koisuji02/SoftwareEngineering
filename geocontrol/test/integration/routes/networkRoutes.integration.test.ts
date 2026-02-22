import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as networkController from "@controllers/networkController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { Network as NetworkDTO } from "@dto/Network";

jest.mock("@services/authService");
jest.mock("@controllers/networkController");

describe("NetworkRoutes integration", () => {
  const token = "Bearer faketoken";
  const baseUrl = "/api/v1/networks";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET all networks", async () => {
    const mockNetworks: NetworkDTO[] = [
      { code: "NET1", name: "Network 1", description: "desc" },
      {
        code: "NET2",
        name: "Network 2",
        description: "desc2",
        gateways: [
          { macAddress: "GW1", name: "Gate1" },
          { macAddress: "GW2", name: "Gate2" },
        ],
      },
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getAllNetworks as jest.Mock).mockResolvedValue(
      mockNetworks
    );

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetworks);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin,
      UserType.Operator,
      UserType.Viewer,
    ]);
    expect(networkController.getAllNetworks).toHaveBeenCalled();
  });

  it("POST create network", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNetwork as jest.Mock).mockResolvedValue(undefined);

    const networkDto = { code: "NET1", name: "Network 1", description: "desc" };

    const response = await request(app)
      .post(baseUrl)
      .set("Authorization", token)
      .send(networkDto);

    expect(response.status).toBe(201);
    expect(networkController.createNetwork).toHaveBeenCalledWith(networkDto);
  });

  it("GET single network", async () => {
    const mockNetwork: NetworkDTO = {
      code: "NET1",
      name: "Network 1",
      description: "desc",
      gateways: [
        { macAddress: "GW1", name: "Gate1" },
        { macAddress: "GW2", name: "Gate2" },
      ],
    };
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getNetwork as jest.Mock).mockResolvedValue(mockNetwork);

    const response = await request(app)
      .get(`${baseUrl}/NET1`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockNetwork);
    expect(networkController.getNetwork).toHaveBeenCalledWith("NET1");
  });

  it("PATCH update network", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockResolvedValue(undefined);

    const updates = { name: "Updated Network" };

    const response = await request(app)
      .patch(`${baseUrl}/NET1`)
      .set("Authorization", token)
      .send(updates);

    expect(response.status).toBe(204);
    expect(networkController.updateNetwork).toHaveBeenCalledWith(
      "NET1",
      updates
    );
  });

  it("DELETE network", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.deleteNetwork as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`${baseUrl}/NET1`)
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(networkController.deleteNetwork).toHaveBeenCalledWith("NET1");
  });

  it("GET all networks: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("GET all networks: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("GET all networks: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getAllNetworks as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("POST create network: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.createNetwork as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const networkDto = { code: "NET1", name: "Network 1", description: "desc" };

    const response = await request(app)
      .post(baseUrl)
      .set("Authorization", token)
      .send(networkDto);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET single network: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.getNetwork as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const response = await request(app)
      .get(`${baseUrl}/NET1`)
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("PATCH update network: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.updateNetwork as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const updates = { name: "Updated Network" };

    const response = await request(app)
      .patch(`${baseUrl}/NET1`)
      .set("Authorization", token)
      .send(updates);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("DELETE network: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (networkController.deleteNetwork as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const response = await request(app)
      .delete(`${baseUrl}/NET1`)
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });
});
