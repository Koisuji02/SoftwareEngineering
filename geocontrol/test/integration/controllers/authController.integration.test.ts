import * as authController from "@controllers/authController";
import { UserRepository } from "@repositories/UserRepository";
import { UnauthorizedError } from "@errors/UnauthorizedError";
import { UserType } from "@models/UserType";

jest.mock("@repositories/UserRepository");
jest.mock("@services/authService", () => ({
  generateToken: jest.fn(() => "signed.jwt.token")
}));
jest.mock("@services/mapperService", () => ({
  createTokenDTO: (token: string) => ({ token }),
  createUserDTO: (username: string, type: UserType, password: string) => ({ username, type, password })
}));

describe("authController integration", () => {
  const fakeUserDAO = {
    username: "testuser",
    password: "secret",
    type: UserType.Operator
  };

  it("getToken: success", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockResolvedValue(fakeUserDAO)
    }));

    const result = await authController.getToken({
      username: "testuser",
      password: "secret",
      type: UserType.Operator
    });

    expect(result).toEqual({ token: "signed.jwt.token" });
  });

  it("getToken: wrong password throws UnauthorizedError", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockResolvedValue(fakeUserDAO)
    }));

    await expect(
      authController.getToken({
        username: "testuser",
        password: "wrong",
        type: UserType.Operator
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it("getToken: user not found throws NotFoundError", async () => {
    (UserRepository as jest.Mock).mockImplementation(() => ({
      getUserByUsername: jest.fn().mockResolvedValue(undefined)
    }));

    await expect(
      authController.getToken({
        username: "notfound",
        password: "irrelevant",
        type: UserType.Operator
      })
    ).rejects.toThrow("User not found");
  });
});