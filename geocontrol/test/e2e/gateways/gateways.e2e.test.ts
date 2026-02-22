import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Gateways E2E", () => {
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;
  const networkCode = "NET1";
  const gatewayMac = "GW1";
  const newGatewayMac = "AA:BB:CC:DD:EE:FF";
  const operatorGatewayMac = "GW_OP";

  beforeAll(async () => {
    await beforeAllE2e();
    adminToken = generateToken(TEST_USERS.admin);
    operatorToken = generateToken(TEST_USERS.operator);
    viewerToken = generateToken(TEST_USERS.viewer);

    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: networkCode,
        name: "Network 1",
        description: "Network for gateways test",
      });
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: gatewayMac,
        name: "Gateway 1",
        description: "Gateway for test",
      });
  });

  afterAll(async () => {
    await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
      .set("Authorization", `Bearer ${adminToken}`);
    await request(app)
      .delete(`/api/v1/networks/${networkCode}`)
      .set("Authorization", `Bearer ${adminToken}`);
    await afterAllE2e();
  });

  // GET all gateways
  it("GET all gateways for a network", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("macAddress");
    expect(res.body[0]).toHaveProperty("name");
  });

  it("GET all gateways for a network - 401", async () => {
    const res = await request(app).get(
      `/api/v1/networks/${networkCode}/gateways`
    );
    expect(res.status).toBe(401);
  });

  it("GET all gateways for a network - 404", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/NOTFOUND/gateways`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });

  // GET single gateway
  it("GET single gateway", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.macAddress).toBe(gatewayMac);
  });

  it("GET single gateway - 401", async () => {
    const res = await request(app).get(
      `/api/v1/networks/${networkCode}/gateways/${gatewayMac}`
    );
    expect(res.status).toBe(401);
  });

  it("GET single gateway - 404", async () => {
    const res = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/NOTFOUND`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });

  it("POST create gateway - admin", async () => {
    const mac = `AA:BB:CC:${Date.now().toString().slice(-6)}`;
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: mac, name: "GWNEW", description: "desc" });
    expect(res.status).toBe(201);
    // Cleanup
    await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });

  it("POST create gateway - operator", async () => {
    const mac = `GW_OP_${Date.now()}`;
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ macAddress: mac, name: "GW Operator" });
    expect(res.status).toBe(201);
    // Cleanup
    await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });

  it("POST create gateway - viewer forbidden", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ macAddress: "GW_VIEW", name: "GW Viewer" });
    expect(res.status).toBe(403);
  });

  it("POST create gateway - 400 input not valid", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "GWNEW" });
    expect(res.status).toBe(400);
  });

  it("POST create gateway - 401 without token", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .send({ macAddress: "GW401", name: "GW401" });
    expect(res.status).toBe(401);
  });

  it("POST create gateway - 404 network not exists", async () => {
    const res = await request(app)
      .post(`/api/v1/networks/NOTFOUND/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: "GW404", name: "GW404" });
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });

  it("POST create gateway - 409 already exists", async () => {
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: newGatewayMac, name: "GWNEW" });

    const res = await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: newGatewayMac, name: "GWNEW" });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      code: 409,
      name: "ConflictError",
    });
    expect(res.body.message).toMatch(/already exists/i);
  });

  // PATCH update gateway
  it("PATCH update gateway - admin", async () => {
    const mac = `GW_PATCH_ADMIN_${Date.now()}`;
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: mac, name: "Patch Admin", description: "desc" });

    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${mac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: "SEN1",
        name: "TH01",
        description: "External thermometer",
        variable: "temperature",
        unit: "C",
      });
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways/${mac}/sensors`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: "SEN2",
        name: "TH02",
        description: "External thermometer",
        variable: "temperature",
        unit: "C",
      });

    const gw = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: "GW_PATCH",
        name: "Updated Name",
        description: "Updated Desc",
      });

    const gwPatched = await request(app)
      .get(`/api/v1/networks/${networkCode}/gateways/GW_PATCH`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
    // Cleanup
    await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });

  it("PATCH update gateway - operator", async () => {
    const mac = `GW_PATCH_OP_${Date.now()}`;
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ macAddress: mac, name: "Patch Operator", description: "desc" });
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ macAddress: mac, name: "Operator Updated", description: "desc" });
    expect(res.status).toBe(204);
    // Cleanup
    await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });

  it("PATCH update gateway - viewer forbidden", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${newGatewayMac}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ name: "Nope" });
    expect(res.status).toBe(403);
  });

  it("PATCH update gateway - 400 input not valid", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${newGatewayMac}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: "" });
    expect(res.status).toBe(400);
  });

  it("PATCH update gateway - 401 without token", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${newGatewayMac}`)
      .send({ name: "NoToken" });
    expect(res.status).toBe(401);
  });

  it("PATCH update gateway - 404 not found", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/NOTFOUND`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Nope" });
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });

  it("PATCH update gateway - 409 mac already exists", async () => {
    const mac1 = `GW_CONFLICT1_${Date.now()}`;
    const mac2 = `GW_CONFLICT2_${Date.now()}`;
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: mac1, name: "GW1" });
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: mac2, name: "GW2" });

    const res = await request(app)
      .patch(`/api/v1/networks/${networkCode}/gateways/${mac2}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: mac1 });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      code: 409,
      name: "ConflictError",
    });
    expect(res.body.message).toMatch("Gateway mac address already in use");
  });

  // DELETE gateway
  it("DELETE gateway - admin", async () => {
    const mac = `GW_DEL_ADMIN_${Date.now()}`;
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ macAddress: mac, name: "Delete Admin", description: "desc" });
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it("DELETE gateway - operator", async () => {
    const mac = `GW_DEL_OP_${Date.now()}`;
    await request(app)
      .post(`/api/v1/networks/${networkCode}/gateways`)
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ macAddress: mac, name: "Delete Operator", description: "desc" });
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${mac}`)
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(204);
  });

  it("DELETE gateway - viewer forbidden", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/${gatewayMac}`)
      .set("Authorization", `Bearer ${viewerToken}`);
    expect(res.status).toBe(403);
  });

  it("DELETE gateway - 401 without token", async () => {
    const res = await request(app).delete(
      `/api/v1/networks/${networkCode}/gateways/${gatewayMac}`
    );
    expect(res.status).toBe(401);
  });

  it("DELETE gateway - 404 not found", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/${networkCode}/gateways/NOTFOUND`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });
});
