import request from "supertest";
import { app } from "@app";
import * as authController from "@controllers/authController";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { UserType } from "@models/UserType";

jest.mock("@controllers/authController");

describe("authenticationRoutes integration", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/v1/auth - success", async () => {
    const fakeToken = { token: "jwt.token" };
    (authController.getToken as jest.Mock).mockResolvedValue(fakeToken);

    const response = await request(app)
      .post("/api/v1/auth")
      .send({ username: "testuser", password: "secret", type: UserType.Operator });

    let res = response;
    if (res.status === 404) {
      res = await request(app)
        .post("/api/v1/auth/")
        .send({ username: "testuser", password: "secret", type: UserType.Operator });
    }

    expect(res.status).toBe(200);
    expect(res.body).toEqual(fakeToken);
    expect(authController.getToken).toHaveBeenCalled();
  });

  it("POST /api/v1/auth - UnauthorizedError", async () => {
    (authController.getToken as jest.Mock).mockRejectedValue(new UnauthorizedError("Invalid password"));

    let response = await request(app)
      .post("/api/v1/auth")
      .send({ username: "testuser", password: "wrong", type: UserType.Operator });

    if (response.status === 404) {
      response = await request(app)
        .post("/api/v1/auth/")
        .send({ username: "testuser", password: "wrong", type: UserType.Operator });
    }

    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/Invalid password/);
    expect(authController.getToken).toHaveBeenCalled();
  });
});