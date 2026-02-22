import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Measurements E2E", () => {
  let token: string;

  // Example data consistent with Swagger and tests
  const networkCode = "NET1";
  const gatewayMac = "GW1";
  const sensorMac = "SEN1";

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
    // Setup: create network, gateway, sensor and at least one measurement
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: networkCode,
        name: "Network 1",
        description: "Network for measurements test",
      });
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: gatewayMac,
        name: "Gateway 1",
        description: "Gateway for measurements test",
      });
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: sensorMac,
        name: "Sensor 1",
        variable: "temperature",
        unit: "C",
        description: "desc",
      });
    // Insert at least 5 similar measurements and one very distant outlier, all with different dates
    await request(app)
      .post(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
      )
      .set("Authorization", `Bearer ${token}`)
      .send([
        { createdAt: "2025-02-18T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-19T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-20T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-21T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-22T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-23T17:00:00+01:00", value: 10000 },
      ]);
  });

  afterAll(async () => {
    // Cleanup: delete sensor, gateway and network
    await request(app)
      .delete(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}`
      )
      .set("Authorization", `Bearer ${token}`);
    await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
      .set("Authorization", `Bearer ${token}`);
    await request(app)
      .delete(`/api/v1/networks/${networkCode}`)
      .set("Authorization", `Bearer ${token}`);
    await afterAllE2e();
  });

  it("GET measurements for a sensor", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sensorMacAddress).toBe(sensorMac);
    expect(Array.isArray(res.body.measurements)).toBe(true);
  });

  it("GET stats for a sensor", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("mean");
    expect(res.body).toHaveProperty("variance");
  });

  it("GET outliers for a sensor", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`
      )
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.sensorMacAddress).toBe(sensorMac);
    expect(Array.isArray(res.body.measurements)).toBe(true);
    // Check that at least one outlier is present
    expect(res.body.measurements.length).toBeGreaterThan(0);
    expect(res.body.measurements.some((m) => m.isOutlier === true)).toBe(true);
  });

  // POST - success
  it("POST measurements for a sensor", async () => {
    // Precondition: create the sensor if it does not exist
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: sensorMac,
        name: "Sensor 1",
        variable: "temperature",
        unit: "C",
        description: "desc",
      });
    // Insert at least 3 similar measurements and one outlier, all with different dates
    await request(app)
      .post(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
      )
      .set("Authorization", `Bearer ${token}`)
      .send([
        { createdAt: "2025-02-22T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-23T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-24T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-25T17:00:00+01:00", value: 1000 },
      ]);
    const res = await request(app)
      .post(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
      )
      .set("Authorization", `Bearer ${token}`)
      .send([{ createdAt: `2025-02-26T17:00:00+01:00`, value: 2.5 }]);
    expect(res.status).toBe(201);
  });

  // POST - 403 viewer
  it("POST measurements - 403 viewer", async () => {
    // Precondition: create the sensor if it does not exist
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: sensorMac,
        name: "Sensor 1",
        variable: "temperature",
        unit: "C",
        description: "desc",
      });
    const viewerToken = generateToken(TEST_USERS.viewer);
    const res = await request(app)
      .post(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
      )
      .set("Authorization", `Bearer ${viewerToken}`)
      .send([{ createdAt: `2025-02-21T17:00:00+01:00`, value: 1.8567 }]);
    expect(res.status).toBe(403);
  });

  // GET - 401 without token
  it("GET measurements - 401", async () => {
    const res = await request(app).get(
      `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
    );
    expect(res.status).toBe(401);
  });

  it("GET stats for a sensor - 401", async () => {
    const res = await request(app).get(
      `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/stats`
    );
    expect(res.status).toBe(401);
  });

  it("GET outliers for a sensor - 401", async () => {
    const res = await request(app).get(
      `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/outliers`
    );
    expect(res.status).toBe(401);
  });

  it("GET outliers for a sensor - 200", async () => {
    const sensorMac2 = "SEN2";

    await request(app)
      .post(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
      )
      .set("Authorization", `Bearer ${token}`)
      .send([
        { createdAt: "2025-02-18T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-19T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-20T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-21T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-22T17:00:00+01:00", value: 10 },
        { createdAt: "2025-02-23T17:00:00+01:00", value: 10000 },
      ]);

    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/outliers`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("GET measurements of network without measurements", async () => {
    await request(app)
      .post("/api/v1/networks/")
      .set("Authorization", `Bearer ${token}`)
      .send({
        code: "NET_EMPTY",
        name: "Alp Monitor",
        description: "Alpine Weather Monitoring Network",
      });
    await request(app)
      .post("/api/v1/networks/NET_EMPTY/gateways")
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "GW_EMPTY",
        name: "GW01",
        description: "on-field aggregation node",
      });
    await request(app)
      .post("/api/v1/networks/NET_EMPTY/gateways/GW_EMPTY")
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "GW_EMPTY",
        name: "GW01",
        description: "on-field aggregation node",
      });
    await request(app)
      .post("/api/v1/networks/NET_EMPTY/gateways/GW_EMPTY/sensors")
      .set("Authorization", `Bearer ${token}`)
      .send({
        macAddress: "SEN_EMPTY",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C",
      });

    const res = await request(app)
      .get(`/api/v1/networks/NET_EMPTY/measurements`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  // POST - 401 without token
  it("POST measurements for a sensor - 401", async () => {
    const res = await request(app)
      .post(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
      )
      .send([{ createdAt: "2025-02-28T17:00:00+01:00", value: 10 }]);
    expect(res.status).toBe(401);
  });

  it("POST measurements for a sensor - 403 viewer", async () => {
    const viewerToken = generateToken(TEST_USERS.viewer);
    const res = await request(app)
      .post(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements`
      )
      .set("Authorization", `Bearer ${viewerToken}`)
      .send([{ createdAt: "2025-02-28T17:00:00+01:00", value: 10 }]);
    expect(res.status).toBe(403);
  });

  // GET - 400 malformed data
  it("GET measurements - 400 bad date", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/${sensorMac}/measurements?startDate=notadate`
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  // GET - 404 non-existent sensor
  it("GET measurements - 404 non-existent sensor", async () => {
    const res = await request(app)
      .get(
        `/api/v1/networks/${networkCode}/gateways/${gatewayMac}/sensors/NOTFOUND/measurements`
      )
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });
});