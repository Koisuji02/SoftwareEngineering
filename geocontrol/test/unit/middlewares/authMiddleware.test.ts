import { authenticateUser } from "@middlewares/authMiddleware";
import { UserType } from "@models/UserType";

jest.mock("@services/authService", () => ({
  processToken: jest.fn()
}));
const { processToken } = require("@services/authService");

describe("authenticateUser middleware", () => {
  let req, res, next;
  beforeEach(() => {
    req = { headers: { authorization: "Bearer token" } };
    res = {};
    next = jest.fn();
    processToken.mockReset();
  });

  it("calls next if processToken resolves", async () => {
    processToken.mockResolvedValue({});
    await authenticateUser([UserType.Admin])(req, res, next);
    expect(processToken).toHaveBeenCalledWith("Bearer token", [UserType.Admin]);
    expect(next).toHaveBeenCalledWith();
  });

  it("calls next with error if processToken throws", async () => {
    const error = new Error("invalid");
    processToken.mockRejectedValue(error);
    await authenticateUser([UserType.Admin])(req, res, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it("passes empty allowedRoles if not specified", async () => {
    processToken.mockResolvedValue({});
    await authenticateUser()(req, res, next);
    expect(processToken).toHaveBeenCalledWith("Bearer token", []);
    expect(next).toHaveBeenCalledWith();
  });
});