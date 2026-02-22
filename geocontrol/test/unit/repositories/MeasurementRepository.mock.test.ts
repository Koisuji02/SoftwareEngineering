import { MeasurementsRepository } from "@repositories/MeasurementsRepository";

const mockFind = jest.fn();
const mockSave = jest.fn();

jest.mock("@database", () => ({
  AppDataSource: {
    getRepository: () => ({
      find: mockFind,
      save: mockSave,
      create: jest.fn((data) => data),
    }),
  },
}));

describe("MeasurementsRepository (mocked DB)", () => {
  const repo = new MeasurementsRepository();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("storeMeasurements", () => {
    it("should save created entities", async () => {
      const measurements = [
        { createdAt: new Date("2023-01-01"), value: 10 },
        { createdAt: new Date("2023-01-02"), value: 20, isOutlier: true },
      ];
      mockSave.mockResolvedValue(measurements);

      const result = await repo.storeMeasurements("sensor1", measurements);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(measurements);
    });
  });

  const sensorMac = "sensor1";
  const sensorMacs = ["sensor1", "sensor2"];
  const startDate = new Date("2023-01-01");
  const endDate = new Date("2023-02-01");

  const testFindMethod = async (
    methodName: keyof MeasurementsRepository,
    args: any[]
  ) => {
    mockFind.mockResolvedValue([]);

    await (repo as any)[methodName](...args);

    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
        order: expect.any(Object),
      })
    );
  };

  it("getMeasurements calls find with various date filters", async () => {
    await testFindMethod("getMeasurements", [sensorMac]);
    await testFindMethod("getMeasurements", [sensorMac, startDate]);
    await testFindMethod("getMeasurements", [sensorMac, undefined, endDate]);
    await testFindMethod("getMeasurements", [sensorMac, startDate, endDate]);
  });

  it("getOutliers calls find with various date filters", async () => {
    await testFindMethod("getOutliers", [sensorMac]);
    await testFindMethod("getOutliers", [sensorMac, startDate]);
    await testFindMethod("getOutliers", [sensorMac, undefined, endDate]);
    await testFindMethod("getOutliers", [sensorMac, startDate, endDate]);
  });

  it("getMeasurementsForSensors calls find with various date filters", async () => {
    await testFindMethod("getMeasurementsForSensors", [sensorMacs]);
    await testFindMethod("getMeasurementsForSensors", [sensorMacs, startDate]);
    await testFindMethod("getMeasurementsForSensors", [
      sensorMacs,
      undefined,
      endDate,
    ]);
    await testFindMethod("getMeasurementsForSensors", [
      sensorMacs,
      startDate,
      endDate,
    ]);
  });

  it("getOutliersForSensors calls find with various date filters", async () => {
    await testFindMethod("getOutliersForSensors", [sensorMacs]);
    await testFindMethod("getOutliersForSensors", [sensorMacs, startDate]);
    await testFindMethod("getOutliersForSensors", [sensorMacs, undefined, endDate]);
    await testFindMethod("getOutliersForSensors", [sensorMacs, startDate, endDate]);
  });
});
