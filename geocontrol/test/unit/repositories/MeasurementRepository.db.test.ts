import { MeasurementsRepository } from "@repositories/MeasurementsRepository";
import {
  initializeTestDataSource,
  closeTestDataSource,
  TestDataSource
} from "@test/setup/test-datasource";
import { MeasurementDAO } from "@dao/MeasurementDAO";

let repo: MeasurementsRepository;

beforeAll(async () => {
  await initializeTestDataSource();
  repo = new MeasurementsRepository();
});

afterAll(async () => {
  await closeTestDataSource();
});

beforeEach(async () => {
  await TestDataSource.getRepository(MeasurementDAO).clear();
});

describe("MeasurementsRepository (SQLite in-memory)", () => {
  const sensorMac = "SENSOR123";

  it("storeMeasurements saves entities", async () => {
    const measurements = [
      { createdAt: new Date("2023-01-01"), value: 10 },
      { createdAt: new Date("2023-01-02"), value: 20, isOutlier: true },
    ];
    const saved = await repo.storeMeasurements(sensorMac, measurements);
    expect(saved.length).toBe(2);
    expect(saved[0].sensorMacAddress).toBe(sensorMac);
  });

  const testDateFilters = async (method: keyof MeasurementsRepository) => {
    const startDate = new Date("2023-01-01");
    const endDate = new Date("2023-02-01");

    // No dates
    const noDateResult = await (repo as any)[method](sensorMac);
    expect(Array.isArray(noDateResult)).toBe(true);

    // Only startDate
    const startDateResult = await (repo as any)[method](sensorMac, startDate);
    expect(Array.isArray(startDateResult)).toBe(true);

    // Only endDate
    const endDateResult = await (repo as any)[method](sensorMac, undefined, endDate);
    expect(Array.isArray(endDateResult)).toBe(true);

    // Both dates
    const bothDatesResult = await (repo as any)[method](sensorMac, startDate, endDate);
    expect(Array.isArray(bothDatesResult)).toBe(true);
  };

  it("getMeasurements supports date filters", async () => {
    await testDateFilters("getMeasurements");
  });

  it("getOutliers supports date filters", async () => {
    await testDateFilters("getOutliers");
  });

  it("getMeasurementsForSensors supports date filters", async () => {
    const sensorMacs = [sensorMac, "SENSOR456"];
    // No dates
    let result = await repo.getMeasurementsForSensors(sensorMacs);
    expect(Array.isArray(result)).toBe(true);

    // Only startDate
    const startDate = new Date("2023-01-01");
    result = await repo.getMeasurementsForSensors(sensorMacs, startDate);
    expect(Array.isArray(result)).toBe(true);

    // Only endDate
    const endDate = new Date("2023-02-01");
    result = await repo.getMeasurementsForSensors(sensorMacs, undefined, endDate);
    expect(Array.isArray(result)).toBe(true);

    // Both dates
    result = await repo.getMeasurementsForSensors(sensorMacs, startDate, endDate);
    expect(Array.isArray(result)).toBe(true);
  });

  it("getOutliersForSensors supports date filters", async () => {
    const sensorMacs = [sensorMac, "SENSOR789"];
    // No dates
    let result = await repo.getOutliersForSensors(sensorMacs);
    expect(Array.isArray(result)).toBe(true);

    // Only startDate
    const startDate = new Date("2023-01-01");
    result = await repo.getOutliersForSensors(sensorMacs, startDate);
    expect(Array.isArray(result)).toBe(true);

    // Only endDate
    const endDate = new Date("2023-02-01");
    result = await repo.getOutliersForSensors(sensorMacs, undefined, endDate);
    expect(Array.isArray(result)).toBe(true);

    // Both dates
    result = await repo.getOutliersForSensors(sensorMacs, startDate, endDate);
    expect(Array.isArray(result)).toBe(true);
  });
});
