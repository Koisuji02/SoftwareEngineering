import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as gatewayController from "@controllers/gatewayController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { Gateway as GatewayDTO } from "@dto/Gateway";

jest.mock("@services/authService");
jest.mock("@controllers/gatewayController");

describe("GatewayRoutes integration", () => {
  const token = "Bearer faketoken";
  const baseUrl = "/api/v1/networks/NET1/gateways";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET all gateways", async () => {
    const mockGateways: GatewayDTO[] = [
      { macAddress: "GW1", name: "Gateway 1" },
      { macAddress: "GW2", name: "Gateway 2" }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.getAllGateways as jest.Mock).mockResolvedValue(mockGateways);

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockGateways);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin, UserType.Operator, UserType.Viewer
    ]);
    expect(gatewayController.getAllGateways).toHaveBeenCalledWith("NET1");
  });

  it("POST create gateway", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.createGateway as jest.Mock).mockResolvedValue(undefined);

    const gatewayDto = { macAddress: "GW1", name: "Gateway 1" };

    const response = await request(app)
      .post(baseUrl)
      .set("Authorization", token)
      .send(gatewayDto);

    expect(response.status).toBe(201);
    expect(gatewayController.createGateway).toHaveBeenCalledWith(gatewayDto, "NET1");
  });

  it("GET single gateway", async () => {
    const mockGateway: GatewayDTO = { macAddress: "GW1", name: "Gateway 1" };
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.getGateway as jest.Mock).mockResolvedValue(mockGateway);

    const response = await request(app)
      .get(`${baseUrl}/GW1`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockGateway);
    expect(gatewayController.getGateway).toHaveBeenCalledWith("NET1", "GW1");
  });

  it("PATCH update gateway", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.updateGateway as jest.Mock).mockResolvedValue(undefined);

    const updates = { name: "Updated Gateway" };

    const response = await request(app)
      .patch(`${baseUrl}/GW1`)
      .set("Authorization", token)
      .send(updates);

    expect(response.status).toBe(204);
    expect(gatewayController.updateGateway).toHaveBeenCalledWith("NET1", "GW1", updates);
  });

  it("DELETE gateway", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (gatewayController.deleteGateway as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`${baseUrl}/GW1`)
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(gatewayController.deleteGateway).toHaveBeenCalledWith("NET1", "GW1");
  });

  it("GET all gateways: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("GET all gateways: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });
});