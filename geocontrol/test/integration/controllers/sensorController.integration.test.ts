import * as sensorController from "@controllers/sensorController";
import { SensorRepository } from "@repositories/SensorRepository";
import { GatewayRepository } from "@repositories/GatewayRepository";
import { Sensor as SensorDTO } from "@models/dto/Sensor";
import { SensorDAO } from "@dao/SensorDAO";
import { GatewayDAO } from "@dao/GatewayDAO";

jest.mock("@repositories/SensorRepository");
jest.mock("@repositories/GatewayRepository");
jest.mock("@services/mapperService", () => ({
  mapSensorDAOToDTO: (dao: any) => ({ ...dao, mapped: true }),
  mapSensorDTOToDAO: (dto: any) => ({ ...dto, mapped: true })
}));

describe("sensorController integration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("getAllSensors: mapperService integration", async () => {
    const fakeSensorDAO: SensorDAO = {
      macAddress: "S1",
      name: "Sensor 1",
      description: "desc",
      variable: "temp",
      unit: "C",
      gateway: {} as GatewayDAO
    };
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getAllSensor: jest.fn().mockResolvedValue([fakeSensorDAO])
    }));

    const result = await sensorController.getAllSensors("NET1", "GW1");
    expect(result[0]).toMatchObject({ macAddress: "S1", mapped: true });
  });

  it("getSensor: mapperService integration", async () => {
    const fakeSensorDAO: SensorDAO = {
      macAddress: "S1",
      name: "Sensor 1",
      description: "desc",
      variable: "temp",
      unit: "C",
      gateway: {} as GatewayDAO
    };
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      getSensor: jest.fn().mockResolvedValue(fakeSensorDAO)
    }));

    const result = await sensorController.getSensor("NET1", "GW1", "S1");
    expect(result).toMatchObject({ macAddress: "S1", mapped: true });
  });

  it("createSensor: calls repo with correct args", async () => {
    const fakeGateway: GatewayDAO = { macAddress: "GW1", name: "Gateway 1" } as GatewayDAO;
    const createSensor = jest.fn();
    (GatewayRepository as jest.Mock).mockImplementation(() => ({
      getGatewayByMac: jest.fn().mockResolvedValue(fakeGateway)
    }));
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      createSensor
    }));

    const sensorDto: SensorDTO = {
      macAddress: "S1",
      name: "Sensor 1",
      description: "desc",
      variable: "temp",
      unit: "C"
    };

    await sensorController.createSensor("NET1", "GW1", sensorDto);
    expect(createSensor).toHaveBeenCalledWith(
      fakeGateway,
      "S1",
      "Sensor 1",
      "desc",
      "temp",
      "C"
    );
  });

  it("updateSensor: calls repo with mapped updates", async () => {
    const updateSensor = jest.fn();
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      updateSensor
    }));

    await sensorController.updateSensor("NET1", "GW1", "S1", { name: "newName" });
    expect(updateSensor).toHaveBeenCalledWith("NET1", "GW1", "S1", { name: "newName", mapped: true });
  });

  it("deleteSensor: calls repo", async () => {
    const deleteSensor = jest.fn();
    (SensorRepository as jest.Mock).mockImplementation(() => ({
      deleteSensor
    }));

    await sensorController.deleteSensor("NET1", "GW1", "S1");
    expect(deleteSensor).toHaveBeenCalledWith("NET1", "GW1", "S1");
  });
});