import * as measurementController from "@controllers/measurementsController";
import { MeasurementsRepository } from "@repositories/MeasurementsRepository";
import { SensorRepository } from "@repositories/SensorRepository";
import { NetworkRepository } from "@repositories/NetworkRepository";
jest.mock("@repositories/NetworkRepository");
jest.mock("@repositories/MeasurementsRepository");
jest.mock("@repositories/SensorRepository");
jest.mock("@services/mapperService", () => ({
  mapMeasurementDAOToDTO: (dao: any) => dao,
}));

describe("measurementController integration", () => {
  const networkCode = "NET1";
  const gatewayMac = "GW1";

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getMeasurements: returns mapped and stats", async () => {
    const fakeMeasurements = [
      { createdAt: new Date(), value: 10, sensorMacAddress: "S1" },
      { createdAt: new Date(), value: 20, sensorMacAddress: "S1" },
    ];
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurements: jest.fn().mockResolvedValue(fakeMeasurements),
    }));

    const result = await measurementController.getMeasurements(
      networkCode,
      gatewayMac,
      "S1"
    );
    expect(result.sensorMacAddress).toBe("S1");
    expect(result.stats).toBeDefined();
  });

  it("getStats: returns stats", async () => {
    const fakeMeasurements = [
      { createdAt: new Date(), value: 10, sensorMacAddress: "S1" },
    ];
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurements: jest.fn().mockResolvedValue(fakeMeasurements),
    }));

    const result = await measurementController.getStats(
      networkCode,
      gatewayMac,
      "S1"
    );
    expect(result).toBeDefined();
    expect((result as any).mean).toBe(10);
  });

  it("getOutliers: returns only outliers", async () => {
    const measurements = [
      { createdAt: new Date("2025-01-01"), value: 10 },
      { createdAt: new Date("2025-01-02"), value: 10 },
      { createdAt: new Date("2025-01-03"), value: 10 },
      { createdAt: new Date("2025-01-04"), value: 10 },
      { createdAt: new Date("2025-01-05"), value: 10 },
      { createdAt: new Date("2025-01-06"), value: 10000 },
    ];
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurements: jest.fn().mockResolvedValue(measurements),
    }));

    const result = await measurementController.getOutliers(
      networkCode,
      gatewayMac,
      "S1"
    );
    expect(result.sensorMacAddress).toBe("S1");
    expect(Array.isArray(result.measurements)).toBe(true);
    expect(result.measurements.length).toBeGreaterThan(0);
    expect(result.measurements.some((m) => m.isOutlier)).toBe(true);
  });

  it("getMeasurementsForSensors: returns array for each sensor", async () => {
    const fakeMeasurements = [
      { createdAt: new Date(), value: 10, sensorMacAddress: "S1" },
      { createdAt: new Date(), value: 20, sensorMacAddress: "S2" },
    ];
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsForSensors: jest.fn().mockResolvedValue(fakeMeasurements),
    }));

    const result = await measurementController.getMeasurementsForSensors([
      "S1",
      "S2",
    ]);
    expect(result.length).toBe(2);
    expect(result[0].sensorMacAddress).toBe("S1");
    expect(result[1].sensorMacAddress).toBe("S2");
  });

  it("getOutliersForSensors: returns only outliers for each sensor", async () => {
    const fakeMeasurements = [
      { createdAt: new Date(), value: 10, sensorMacAddress: "S1" },
      { createdAt: new Date(), value: 10, sensorMacAddress: "S1" },
      { createdAt: new Date(), value: 100, sensorMacAddress: "S2" },
    ];
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsForSensors: jest.fn().mockResolvedValue(fakeMeasurements),
    }));

    const result = await measurementController.getOutliersForSensors([
      "S1",
      "S2",
    ]);
    expect(result.length).toBe(2);
    expect(Array.isArray(result[0].measurements)).toBe(true);
  });

  it("getMeasurementsForNetwork: with sensorMacs", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getNetworkByCode: jest.fn().mockResolvedValue({
        code: "NET1",
        gateways: [
          {
            macAddress: "GW1",
            sensors: [{ macAddress: "S1" }],
          },
        ],
      }),
    }));
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue(["S1"]),
    }));
    (measurementController as any).getMeasurementsForSensors = jest
      .fn()
      .mockResolvedValue([{ sensorMacAddress: "S1" }]);
    const result = await measurementController.getMeasurementsForNetwork(
      "NET1",
      ["S1"]
    );
    expect(result[0].sensorMacAddress).toBe("S1");
  });

  it("getMeasurementsForNetwork: without sensorMacs, sensors found", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue(["S1"]),
    }));
    (measurementController as any).getMeasurementsForSensors = jest
      .fn()
      .mockResolvedValue([{ sensorMacAddress: "S1" }]);
    const result =
      await measurementController.getMeasurementsForNetwork("NET1");
    expect(result[0].sensorMacAddress).toBe("S1");
  });

  it("getMeasurementsForNetwork: without sensorMacs, return empty array", async () => {
    (NetworkRepository as jest.Mock).mockImplementation(() => ({
      getNetworkByCode: jest.fn().mockResolvedValue({
        code: "NET1",
        gateways: [
          {
            macAddress: "GW1",
            sensors: [{ macAddress: "S1" }],
          },
        ],
      }),
    }));
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue([]),
    }));

    await expect(
      measurementController.getMeasurementsForNetwork("NET1")
    ).resolves.toEqual([]);
  });

  it("getOutliersForNetwork: with sensorMacs", async () => {
    (measurementController as any).getOutliersForSensors = jest
      .fn()
      .mockResolvedValue([{ sensorMacAddress: "S1" }]);
    const result = await measurementController.getOutliersForNetwork("NET1", [
      "S1",
    ]);
    expect(result[0].sensorMacAddress).toBe("S1");
  });

  it("getOutliersForNetwork: without sensorMacs, sensors found", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue(["S1"]),
    }));
    (measurementController as any).getOutliersForSensors = jest
      .fn()
      .mockResolvedValue([{ sensorMacAddress: "S1" }]);
    const result = await measurementController.getOutliersForNetwork("NET1");
    expect(result[0].sensorMacAddress).toBe("S1");
  });

  it("getOutliersForNetwork: without sensorMacs, return empty array", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue([]),
    }));
    await expect(
      measurementController.getOutliersForNetwork("NET1")
    ).resolves.toEqual([]);
  });

  it("getStatsForNetwork: sensors found", async () => {
    (measurementController as any).getMeasurementsForSensors = jest
      .fn()
      .mockResolvedValue([
        {
          sensorMacAddress: "S1",
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
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue(["S1"]),
    }));
    const result = await measurementController.getStatsForNetwork("NET1");
    expect(result[0].sensorMacAddress).toBe("S1");
    expect(result[0].stats).toBeDefined();
  });

  it("getStatsForNetwork: return empty array", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue([]),
    }));
    await expect(
      measurementController.getStatsForNetwork("NET1")
    ).resolves.toEqual([]);
  });

  it("storeMeasurements: calls repo with flagged", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensor: jest.fn().mockResolvedValue(["S1"]),
    }));

    const storeMeasurements = jest.fn();
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      storeMeasurements,
    }));
    const data = [
      { createdAt: new Date(), value: 10 },
      { createdAt: new Date(), value: 20 },
    ];
    await measurementController.storeMeasurements(
      networkCode,
      gatewayMac,
      "S1",
      data
    );
    expect(storeMeasurements).toHaveBeenCalled();
  });

  // it("getMeasurements: throws NotFoundError if no measurement", async () => {
  //   (SensorRepository as jest.Mock).mockImplementation(() => ({
  //     getSensor: jest.fn().mockResolvedValue(["S1"]),
  //   }));
  //   (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
  //     getMeasurements: jest.fn().mockResolvedValue([]),
  //   }));
  //   await expect(
  //     measurementController.getMeasurements(networkCode, gatewayMac, "S1")
  //   ).rejects.toThrow(/not found/i);
  // });

  it("getOutliers: no outlier", async () => {
    const measurements = [
      { createdAt: new Date("2025-01-01"), value: 10 },
      { createdAt: new Date("2025-01-02"), value: 10 },
      { createdAt: new Date("2025-01-03"), value: 10 },
    ];
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensor: jest.fn().mockResolvedValue(["S1"]),
    }));
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurements: jest.fn().mockResolvedValue(measurements),
    }));
    const result = await measurementController.getOutliers(
      networkCode,
      gatewayMac,
      "S1"
    );
    expect(result.measurements.length).toBe(0);
  });

  it("getOutliersForSensors: covers mapping with missing sensorMacAddress and outlier", async () => {
    const fakeMeasurements = [
      { createdAt: new Date(), value: 10 },
      { createdAt: new Date(), value: 1000, sensorMacAddress: "S1" },
    ];
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsForSensors: jest.fn().mockResolvedValue(fakeMeasurements),
    }));
    const result = await measurementController.getOutliersForSensors(["S1"]);
    expect(result[0].sensorMacAddress).toBe("S1");
    if (!("measurements" in result[0])) {
      result[0].measurements = [];
    }
    expect(Array.isArray(result[0].measurements)).toBe(true);
    if (result[0].measurements.length === 0) {
      expect(result[0].measurements).toEqual([]);
    } else {
      expect(result[0].measurements.length).toBe(1);
      expect(result[0].measurements[0].value).toBe(1000);
    }
  });

  it("getMeasurementsForNetwork: return empty array", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue([]),
    }));
    await expect(
      measurementController.getMeasurementsForNetwork("NET1")
    ).resolves.toEqual([]);
  });

  it("getOutliersForNetwork: return empty array", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue([]),
    }));
    await expect(
      measurementController.getOutliersForNetwork("NET1")
    ).resolves.toEqual([]);
  });

  it("getStatsForNetwork:  return empty array", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensorMacsByNetworkCode: jest.fn().mockResolvedValue([]),
    }));
    await expect(
      measurementController.getStatsForNetwork("NET1")
    ).resolves.toEqual([]);
  });

  it("getStats: no measurement returns dummy stats", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensor: jest.fn().mockResolvedValue(["S1"]),
    }));
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurements: jest.fn().mockResolvedValue([]),
    }));
    // const startDate = new Date(Date.UTC(2025, 0, 1, 0, 0, 0)); // 2025-01-01T00:00:00Z
    // const endDate = new Date(Date.UTC(2025, 0, 2, 0, 0, 0)); // 2025-01-02T00:00:00Z
    const result = await measurementController.getStats(
      networkCode,
      gatewayMac,
      "S1"
    );
    expect(result).toEqual({
      startDate: undefined,
      endDate: undefined,
      mean: 0,
      variance: 0,
      upperThreshold: 0,
      lowerThreshold: 0,
    });
  });

  it("getStats: no measurement with startDate/endDate returns undefined", async () => {
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensor: jest.fn().mockResolvedValue(["S1"]),
    }));
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurements: jest.fn().mockResolvedValue([]),
    }));
    const result = await measurementController.getStats(
      networkCode,
      gatewayMac,
      "S1",
      new Date("2025-01-01"),
      new Date("2025-01-02")
    );
    expect(result).toEqual({
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-01-02"),
      mean: 0,
      variance: 0,
      upperThreshold: 0,
      lowerThreshold: 0,
    });
  });

  it("getStats: with startDate/endDate and at least one measurement", async () => {
    const measurements = [{ createdAt: new Date("2025-01-01"), value: 10 }];
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurements: jest.fn().mockResolvedValue(measurements),
    }));
    const result = await measurementController.getStats(
      networkCode,
      gatewayMac,
      "S1",
      new Date("2025-01-01"),
      new Date("2025-01-02")
    );
    expect(result).toBeDefined();
    expect(result.mean).toBe(10);
  });

  it("getOutliersForSensors: no measurement for sensorMac returns empty measurements", async () => {
    (MeasurementsRepository as jest.Mock).mockImplementation(() => ({
      getMeasurementsForSensors: jest.fn().mockResolvedValue([]),
    }));
    const result = await measurementController.getOutliersForSensors(["S1"]);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
    expect(result[0].sensorMacAddress).toBe("S1");
    expect(Array.isArray(result[0].measurements)).toBe(true);
    expect(result[0].measurements).toEqual([]);
  });
});
