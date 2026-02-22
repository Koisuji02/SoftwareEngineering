import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("Networks E2E", () => {
  let adminToken: string;
  let operatorToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    await beforeAllE2e();
    adminToken = generateToken(TEST_USERS.admin);
    operatorToken = generateToken(TEST_USERS.operator);
    viewerToken = generateToken(TEST_USERS.viewer);

    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "NET1",
        name: "Network 1",
        description: "Network for test",
      });
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "NET_TEST",
        name: "Test Network",
        description: "Network for testing",
      });
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({
        code: "NET_OP",
        name: "Operator Net",
        description: "Operator test net",
      });
  });

  afterAll(async () => {
    await request(app)
      .delete("/api/v1/networks/NET1")
      .set("Authorization", `Bearer ${adminToken}`);
    await request(app)
      .delete("/api/v1/networks/NET_TEST")
      .set("Authorization", `Bearer ${adminToken}`);
    await request(app)
      .delete("/api/v1/networks/NET_OP")
      .set("Authorization", `Bearer ${adminToken}`);
    await afterAllE2e();
  });

  const networkData = {
    code: "NET_TEST",
    name: "Test Network",
    description: "Network for testing",
  };

  it("GET all networks", async () => {
    await request(app)
      .post("/api/v1/networks/NET1/gateways")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: "GW1",
        name: "Gate 1",
        description: "Gate test of NET 1",
      });
    await request(app)
      .post("/api/v1/networks/NET1/gateways")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        macAddress: "GW2",
        name: "Gate 2",
        description: "Gate test of NET 1",
      });

    const res = await request(app)
      .get("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty("code");
    expect(res.body[0]).toHaveProperty("name");
  });

  it("GET single network", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NET1")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe("NET1");
  });

  it("GET single network - 404", async () => {
    const res = await request(app)
      .get("/api/v1/networks/NOTFOUND")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });

  it("GET all networks - 401", async () => {
    const res = await request(app).get("/api/v1/networks");
    expect(res.status).toBe(401);
  });

  it("POST create network - admin", async () => {
    const uniqueCode = `NET_ADMIN_${Date.now()}`;
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: uniqueCode,
        name: "Test Network",
        description: "Network for testing",
      });
    expect(res.status).toBe(201);
    await request(app)
      .delete(`/api/v1/networks/${uniqueCode}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });

  it("POST create network - operator", async () => {
    const uniqueCode = `NET_OP_${Date.now()}`;
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ code: uniqueCode, name: "Operator Net" });
    expect(res.status).toBe(201);
    await request(app)
      .delete(`/api/v1/networks/${uniqueCode}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });

  it("POST create network - viewer forbidden", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ code: "NET_VIEW", name: "Viewer Net" });

    expect(res.status).toBe(403);
  });

  it("POST create network - 400 missing code", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "No Code" });

    expect(res.status).toBe(400);
  });

  it("POST create network - 409 already exists", async () => {
    const res = await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(networkData);

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      code: 409,
      name: "ConflictError",
    });
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("PATCH update network - admin", async () => {
    const code = `NET_PATCH_ADMIN_${Date.now()}`;
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code, name: "Patch Admin", description: "desc" });
    const res = await request(app)
      .patch(`/api/v1/networks/${code}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code, name: "Updated Name", description: "Updated Desc" });
    expect(res.status).toBe(204);
    await request(app)
      .delete(`/api/v1/networks/${code}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });

  it("PATCH update network - operator", async () => {
    const code = `NET_PATCH_OP_${Date.now()}`;
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ code, name: "Patch Operator", description: "desc" });
    const res = await request(app)
      .patch(`/api/v1/networks/${code}`)
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ code, name: "Operator Updated", description: "desc" });
    expect(res.status).toBe(204);
    await request(app)
      .delete(`/api/v1/networks/${code}`)
      .set("Authorization", `Bearer ${adminToken}`);
  });

  it("PATCH update network - viewer forbidden", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/${networkData.code}`)
      .set("Authorization", `Bearer ${viewerToken}`)
      .send({ name: "Nope" });

    expect(res.status).toBe(403);
  });

  it("PATCH update network - 404 not found", async () => {
    const res = await request(app)
      .patch(`/api/v1/networks/NOTFOUND`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Nope" });

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });

  it("DELETE network - admin", async () => {
    const code = `NET_DEL_ADMIN_${Date.now()}`;
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ code, name: "Delete Admin", description: "desc" });
    const res = await request(app)
      .delete(`/api/v1/networks/${code}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
  });

  it("DELETE network - operator", async () => {
    const code = `NET_DEL_OP_${Date.now()}`;
    await request(app)
      .post("/api/v1/networks")
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ code, name: "Delete Operator", description: "desc" });
    const res = await request(app)
      .delete(`/api/v1/networks/${code}`)
      .set("Authorization", `Bearer ${operatorToken}`);

    expect(res.status).toBe(204);
  });

  it("DELETE network - viewer forbidden", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/NET1`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it("DELETE network - 404 not found", async () => {
    const res = await request(app)
      .delete(`/api/v1/networks/NOTFOUND`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });
});