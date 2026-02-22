import request from "supertest";
import { app } from "@app";
import { generateToken } from "@services/authService";
import { beforeAllE2e, afterAllE2e, TEST_USERS } from "@test/e2e/lifecycle";

describe("GET /users (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("get all users", async () => {
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);

    const usernames = res.body.map((u: any) => u.username).sort();
    const types = res.body.map((u: any) => u.type).sort();

    expect(usernames).toEqual(["admin", "operator", "viewer"]);
    expect(types).toEqual(["admin", "operator", "viewer"]);
  });

  it("should return 401 if no token is provided (GET /users)", async () => {
    const res = await request(app).get("/api/v1/users");
    expect(res.status).toBe(401);
  });

  it("should return 403 if not admin (GET /users)", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .get("/api/v1/users")
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(403);
  });
});

describe("POST /users (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should return 409 if username already exists", async () => {
    // Crea un utente
    await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "uniqueuser", password: "pass123", type: "admin" })
      .expect(201);

    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "uniqueuser", password: "pass123", type: "admin" });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      code: 409,
      name: "ConflictError",
    });
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("should return 201 when user is created", async () => {
    const uniqueUser = `user${Date.now()}`;
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: uniqueUser, password: "pass123", type: "admin" });
    expect(res.status).toBe(201);
    // Cleanup
    await request(app)
      .delete(`/api/v1/users/${uniqueUser}`)
      .set("Authorization", `Bearer ${token}`);
  });

  it("should return 400 if required fields are missing (POST /users)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "baduser" });
    expect(res.status).toBe(400);
  });

  it("should return 400 if password too short (POST /users)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: "baduser", password:"p", type:"viewer" }); 
    expect(res.status).toBe(400);
  });

  it("should return 401 if no token is provided (POST /users)", async () => {
    const res = await request(app)
      .post("/api/v1/users")
      .send({ username: "baduser", password: "pass123", type: "admin" });
    expect(res.status).toBe(401);
  });

  it("should return 403 if not admin (POST /users)", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${operatorToken}`)
      .send({ username: "baduser", password: "pass123", type: "admin" });
    expect(res.status).toBe(403);
  });
});

describe("GET /users/:userName (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should return 404 if user does not exist", async () => {
    const res = await request(app)
      .get("/api/v1/users/notfounduser")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });

  it("should return 401 if no token is provided (GET /users/:userName)", async () => {
    const res = await request(app).get("/api/v1/users/notfounduser");
    expect(res.status).toBe(401);
  });

  it("should return 403 if not admin (GET /users/:userName)", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .get("/api/v1/users/notfounduser")
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(403);
  });
});

describe("DELETE /users/:userName (e2e)", () => {
  let token: string;

  beforeAll(async () => {
    await beforeAllE2e();
    token = generateToken(TEST_USERS.admin);
  });

  afterAll(async () => {
    await afterAllE2e();
  });

  it("should return 404 if user does not exist", async () => {
    const res = await request(app)
      .delete("/api/v1/users/notfounduser")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      code: 404,
      name: "NotFoundError",
    });
    expect(res.body.message).toMatch(/not found/i);
  });

  it("should return 204 when user is deleted", async () => {
    const uniqueUser = `user${Date.now()}`;
    await request(app)
      .post("/api/v1/users")
      .set("Authorization", `Bearer ${token}`)
      .send({ username: uniqueUser, password: "pass123", type: "admin" });
    const res = await request(app)
      .delete(`/api/v1/users/${uniqueUser}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  it("should return 401 if no token is provided (DELETE /users/:userName)", async () => {
    const res = await request(app).delete("/api/v1/users/notfounduser");
    expect(res.status).toBe(401);
  });

  it("should return 403 if not admin (DELETE /users/:userName)", async () => {
    const operatorToken = generateToken(TEST_USERS.operator);
    const res = await request(app)
      .delete("/api/v1/users/notfounduser")
      .set("Authorization", `Bearer ${operatorToken}`);
    expect(res.status).toBe(403);
  });
});
