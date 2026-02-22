import * as authService from "@services/authService";
import { UserType } from "@models/UserType";
import { UnauthorizedError } from "@models/errors/UnauthorizedError";
import { InsufficientRightsError } from "@models/errors/InsufficientRightsError";

jest.mock("@repositories/UserRepository", () => {
  return {
    UserRepository: jest.fn().mockImplementation(() => ({
      getUserByUsername: jest.fn((username: string) => {
        if (username === "notfound") throw new Error("not found");
        if (username === "user") return Promise.resolve({ username, type: UserType.Viewer });
        return Promise.resolve({ username, type: UserType.Admin });
      }),
    })),
  };
});

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(() => "token"),
  verify: jest.fn((token: string) => {
    if (token === "invalid") throw new Error("jwt error");
    if (token === "forbidden") return { username: "user", type: UserType.Viewer };
    if (token === "notfound") return { username: "notfound", type: UserType.Admin };
    return { username: "admin", type: UserType.Admin };
  }),
}));

const validToken = "Bearer valid";
const forbiddenToken = "Bearer forbidden";
const notfoundToken = "Bearer notfound";
const invalidToken = "Bearer invalid";

describe("authService", () => {
  it("processToken: UnauthorizedError if user not found (line 25)", async () => {
    await expect(authService.processToken(notfoundToken)).rejects.toThrow(UnauthorizedError);
  });

  it("processToken: InsufficientRightsError if role not allowed (line 39)", async () => {
    await expect(
      authService.processToken(forbiddenToken, [UserType.Admin])
    ).rejects.toThrow(InsufficientRightsError);
  });

  it("processToken: UnauthorizedError if jwt.verify throws generic error (line 47)", async () => {
    await expect(authService.processToken(invalidToken)).rejects.toThrow(UnauthorizedError);
  });

  it("processToken: UnauthorizedError if header missing (line 52)", async () => {
    await expect(authService.processToken(undefined)).rejects.toThrow(UnauthorizedError);
  });

  it("processToken: UnauthorizedError if header has invalid format (line 52)", async () => {
    await expect(authService.processToken("Token abc")).rejects.toThrow(UnauthorizedError);
    await expect(authService.processToken("Bearer")).rejects.toThrow(UnauthorizedError);
    await expect(authService.processToken("abc")).rejects.toThrow(UnauthorizedError);
  });
});