import request from "supertest";
import { app } from "@app";
import * as authService from "@services/authService";
import * as sensorController from "@controllers/sensorController";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";
import { Sensor as SensorDTO } from "@models/dto/Sensor";

jest.mock("@services/authService");
jest.mock("@controllers/sensorController");

describe("SensorRoutes integration", () => {
  const token = "Bearer faketoken";
  const baseUrl = "/api/v1/networks/NET1/gateways/GW1/sensors";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GET all sensors", async () => {
    const mockSensors: SensorDTO[] = [
      { macAddress: "S1", name: "Sensor 1", description: "desc", variable: "temp", unit: "C" },
      { macAddress: "S2", name: "Sensor 2", description: "desc2", variable: "hum", unit: "%" }
    ];

    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getAllSensors as jest.Mock).mockResolvedValue(mockSensors);

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSensors);
    expect(authService.processToken).toHaveBeenCalledWith(token, [
      UserType.Admin, UserType.Operator, UserType.Viewer
    ]);
    expect(sensorController.getAllSensors).toHaveBeenCalledWith("NET1", "GW1");
  });

  it("POST create sensor", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.createSensor as jest.Mock).mockResolvedValue(undefined);

    const sensorDto = { macAddress: "S1", name: "Sensor 1", description: "desc", variable: "temp", unit: "C" };

    const response = await request(app)
      .post(baseUrl)
      .set("Authorization", token)
      .send(sensorDto);

    expect(response.status).toBe(201);
    expect(sensorController.createSensor).toHaveBeenCalledWith("NET1", "GW1", sensorDto);
  });

  it("GET single sensor", async () => {
    const mockSensor: SensorDTO = { macAddress: "S1", name: "Sensor 1", description: "desc", variable: "temp", unit: "C" };
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getSensor as jest.Mock).mockResolvedValue(mockSensor);

    const response = await request(app)
      .get(`${baseUrl}/S1`)
      .set("Authorization", token);

    expect(response.status).toBe(200);
    expect(response.body).toEqual(mockSensor);
    expect(sensorController.getSensor).toHaveBeenCalledWith("NET1", "GW1", "S1");
  });

  it("PATCH update sensor", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.updateSensor as jest.Mock).mockResolvedValue(undefined);

    const updates = { name: "Updated Sensor" };

    const response = await request(app)
      .patch(`${baseUrl}/S1`)
      .set("Authorization", token)
      .send(updates);

    expect(response.status).toBe(204);
    expect(sensorController.updateSensor).toHaveBeenCalledWith("NET1", "GW1", "S1", updates);
  });

  it("DELETE sensor", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.deleteSensor as jest.Mock).mockResolvedValue(undefined);

    const response = await request(app)
      .delete(`${baseUrl}/S1`)
      .set("Authorization", token);

    expect(response.status).toBe(204);
    expect(sensorController.deleteSensor).toHaveBeenCalledWith("NET1", "GW1", "S1");
  });

  it("GET all sensors: 401 UnauthorizedError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new UnauthorizedError("Unauthorized: No token provided");
    });

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", "Bearer invalid");

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Unauthorized/);
  });

  it("GET all sensors: 403 InsufficientRightsError", async () => {
    (authService.processToken as jest.Mock).mockImplementation(() => {
      throw new InsufficientRightsError("Forbidden: Insufficient rights");
    });

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", token);

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/Insufficient rights/);
  });

  it("GET all sensors: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getAllSensors as jest.Mock).mockRejectedValue(new Error("fail"));

    const response = await request(app)
      .get(baseUrl)
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("POST create sensor: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.createSensor as jest.Mock).mockRejectedValue(new Error("fail"));

    const sensorDto = { macAddress: "S1", name: "Sensor 1", description: "desc", variable: "temp", unit: "C" };

    const response = await request(app)
      .post(baseUrl)
      .set("Authorization", token)
      .send(sensorDto);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET single sensor: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.getSensor as jest.Mock).mockRejectedValue(new Error("fail"));

    const response = await request(app)
      .get(`${baseUrl}/S1`)
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("PATCH update sensor: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.updateSensor as jest.Mock).mockRejectedValue(new Error("fail"));

    const updates = { name: "Updated Sensor" };

    const response = await request(app)
      .patch(`${baseUrl}/S1`)
      .set("Authorization", token)
      .send(updates);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("DELETE sensor: 500 generic error", async () => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    (sensorController.deleteSensor as jest.Mock).mockRejectedValue(new Error("fail"));

    const response = await request(app)
      .delete(`${baseUrl}/S1`)
      .set("Authorization", token);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });
});