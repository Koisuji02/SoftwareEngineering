import request from "supertest";
import { app } from "@app";
import * as measurementController from "@controllers/measurementsController";
import * as authService from "@services/authService";
import { generateToken } from "@services/authService";
import { TEST_USERS } from "@test/e2e/lifecycle";

jest.mock("@controllers/measurementsController");
jest.mock("@services/authService");

describe("measurementRoutes integration", () => {
  let token: string;
  const networkCode = "NET1";
  const gatewayMac = "GW1";
  const sensorMac = "S1";
  const baseSensorPath = `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`;
  const baseNetworkPath = `/api/v1/networks/${networkCode}`;
  beforeAll(() => {
    (authService.processToken as jest.Mock).mockResolvedValue(undefined);
    token = generateToken(TEST_USERS.admin);
  });
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements - success", async () => {
    (measurementController.storeMeasurements as jest.Mock).mockResolvedValue(
      undefined
    );

    const response = await request(app)
      .post(`${baseSensorPath}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send([{ createdAt: new Date(), value: 10 }]);

    expect(response.status).toBe(201);
    expect(measurementController.storeMeasurements).toHaveBeenCalledWith(
      networkCode,
      gatewayMac,
      sensorMac,
      expect.any(Array)
    );
  });

  it("POST /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements - error", async () => {
    (measurementController.storeMeasurements as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const response = await request(app)
      .post(`${baseSensorPath}/measurements`)
      .set("Authorization", `Bearer ${token}`)
      .send([{ createdAt: new Date(), value: 10 }]);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements - success", async () => {
    (measurementController.getMeasurements as jest.Mock).mockResolvedValue({
      sensorMacAddress: sensorMac,
      stats: {
        mean: 10,
        variance: 0,
        upperThreshold: 10,
        lowerThreshold: 10,
        startDate: new Date(),
        endDate: new Date(),
      },
      measurements: [{ value: 10 }],
    });

    const response = await request(app)
      .get(`${baseSensorPath}/measurements`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.sensorMacAddress).toBe(sensorMac);
    expect(Array.isArray(response.body.measurements)).toBe(true);
  });

  it("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/measurements - error", async () => {
    (measurementController.getMeasurements as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const response = await request(app)
      .get(`${baseSensorPath}/measurements`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats - success", async () => {
    (measurementController.getStats as jest.Mock).mockResolvedValue({
      mean: 10,
      variance: 0,
      upperThreshold: 10,
      lowerThreshold: 10,
      startDate: new Date(),
      endDate: new Date(),
    });

    const response = await request(app)
      .get(`${baseSensorPath}/stats`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.mean).toBe(10);
  });

  it("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/stats - error", async () => {
    (measurementController.getStats as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const response = await request(app)
      .get(`${baseSensorPath}/stats`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers - success", async () => {
    (measurementController.getOutliers as jest.Mock).mockResolvedValue({
      sensorMacAddress: sensorMac,
      stats: {
        mean: 10,
        variance: 0,
        upperThreshold: 10,
        lowerThreshold: 10,
        startDate: new Date(),
        endDate: new Date(),
      },
      measurements: [{ value: 100, isOutlier: true }],
    });

    const response = await request(app)
      .get(`${baseSensorPath}/outliers`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.sensorMacAddress).toBe(sensorMac);
    expect(response.body.measurements[0].isOutlier).toBe(true);
  });

  it("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers - error", async () => {
    (measurementController.getOutliers as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const response = await request(app)
      .get(`${baseSensorPath}/outliers`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET /networks/:networkCode/gateways/:gatewayMac/sensors/:sensorMac/outliers - isOutlier undefined", async () => {
    (measurementController.getOutliers as jest.Mock).mockResolvedValue({
      sensorMacAddress: sensorMac,
      stats: {
        mean: 10,
        variance: 0,
        upperThreshold: 10,
        lowerThreshold: 10,
        startDate: new Date(),
        endDate: new Date(),
      },
      measurements: [{ value: 100 }],
    });

    const response = await request(app)
      .get(`${baseSensorPath}/outliers`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.measurements[0].isOutlier).toBe(false);
  });

  it("GET /networks/:networkCode/measurements - success", async () => {
    (
      measurementController.getMeasurementsForNetwork as jest.Mock
    ).mockResolvedValue([
      {
        sensorMacAddress: sensorMac,
        stats: {
          mean: 10,
          variance: 0,
          upperThreshold: 10,
          lowerThreshold: 10,
          startDate: new Date(),
          endDate: new Date(),
        },
        measurements: [{ value: 10 }],
      },
    ]);

    const response = await request(app)
      .get(`${baseNetworkPath}/measurements`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].sensorMacAddress).toBe(sensorMac);
  });

  it("GET /networks/:networkCode/measurements - error", async () => {
    (
      measurementController.getMeasurementsForNetwork as jest.Mock
    ).mockRejectedValue(new Error("fail"));

    const response = await request(app)
      .get(`${baseNetworkPath}/measurements`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET /networks/:networkCode/measurements - isOutlier undefined", async () => {
    (
      measurementController.getMeasurementsForNetwork as jest.Mock
    ).mockResolvedValue([
      {
        sensorMacAddress: sensorMac,
        stats: {
          mean: 10,
          variance: 0,
          upperThreshold: 10,
          lowerThreshold: 10,
          startDate: new Date(),
          endDate: new Date(),
        },
        measurements: [{ value: 10 }],
      },
    ]);

    const response = await request(app)
      .get(`${baseNetworkPath}/measurements`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[0].measurements[0].isOutlier).toBe(false);
  });

  it("GET /networks/:networkCode/measurements - isOutlier true", async () => {
    (
      measurementController.getMeasurementsForNetwork as jest.Mock
    ).mockResolvedValue([
      {
        sensorMacAddress: sensorMac,
        stats: {
          mean: 10,
          variance: 0,
          upperThreshold: 10,
          lowerThreshold: 10,
          startDate: new Date(),
          endDate: new Date(),
        },
        measurements: [{ value: 10, isOutlier: true }],
      },
    ]);

    const response = await request(app)
      .get(`${baseNetworkPath}/measurements`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[0].measurements[0].isOutlier).toBe(true);
  });

  it("GET /networks/:networkCode/stats - success", async () => {
    (measurementController.getStatsForNetwork as jest.Mock).mockResolvedValue([
      {
        sensorMacAddress: sensorMac,
        stats: {
          mean: 10,
          variance: 0,
          upperThreshold: 10,
          lowerThreshold: 10,
          startDate: new Date(),
          endDate: new Date(),
        },
      },
    ]);

    const response = await request(app)
      .get(`${baseNetworkPath}/stats`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].stats.mean).toBe(10);
  });

  it("GET /networks/:networkCode/stats - error", async () => {
    (measurementController.getStatsForNetwork as jest.Mock).mockRejectedValue(
      new Error("fail")
    );

    const response = await request(app)
      .get(`${baseNetworkPath}/stats`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET /networks/:networkCode/outliers - success", async () => {
    (
      measurementController.getOutliersForNetwork as jest.Mock
    ).mockResolvedValue([
      {
        sensorMacAddress: sensorMac,
        stats: {
          mean: 10,
          variance: 0,
          upperThreshold: 10,
          lowerThreshold: 10,
          startDate: new Date(),
          endDate: new Date(),
        },
        measurements: [{ value: 100, isOutlier: true }],
      },
    ]);

    const response = await request(app)
      .get(`${baseNetworkPath}/outliers`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].sensorMacAddress).toBe(sensorMac);
    expect(response.body[0].measurements[0].isOutlier).toBe(true);
  });

  it("GET /networks/:networkCode/outliers - error", async () => {
    (
      measurementController.getOutliersForNetwork as jest.Mock
    ).mockRejectedValue(new Error("fail"));

    const response = await request(app)
      .get(`${baseNetworkPath}/outliers`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.message).toMatch(/fail/);
  });

  it("GET /networks/:networkCode/outliers - isOutlier undefined", async () => {
    (
      measurementController.getOutliersForNetwork as jest.Mock
    ).mockResolvedValue([
      {
        sensorMacAddress: sensorMac,
        stats: {
          mean: 10,
          variance: 0,
          upperThreshold: 10,
          lowerThreshold: 10,
          startDate: new Date(),
          endDate: new Date(),
        },
        measurements: [{ value: 100 }],
      },
    ]);

    const response = await request(app)
      .get(`${baseNetworkPath}/outliers`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body[0].measurements[0].isOutlier).toBe(false);
  });
});
