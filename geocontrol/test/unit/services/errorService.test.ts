import { createAppError } from "@services/errorService";
import { AppError } from "@errors/AppError";
import { createErrorDTO } from "@services/mapperService";
import { logError } from "@services/loggingService";

jest.mock("@services/mapperService", () => ({
  createErrorDTO: jest.fn(),
}));

jest.mock("@services/loggingService", () => ({
  logError: jest.fn(),
}));

describe("createAppError", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle a generic error", () => {
    const error = new Error("Something went wrong");

    (createErrorDTO as jest.Mock).mockReturnValue({
      status: 500,
      message: "Something went wrong",
      name: "InternalServerError",
    });

    const result = createAppError(error);

    expect(createErrorDTO).toHaveBeenCalledWith(500, "Something went wrong", "InternalServerError");
    expect(logError).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      status: 500,
      message: "Something went wrong",
      name: "InternalServerError",
    });
  });

   it("should handle an error without message", () => {
    const error = new Error();

    (createErrorDTO as jest.Mock).mockReturnValue({
      status: 500,
      message: "Internal Server Error",
      name: "InternalServerError",
    });

    const result = createAppError(error);

    expect(createErrorDTO).toHaveBeenCalledWith(500, "Internal Server Error", "InternalServerError");
    expect(logError).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      status: 500,
      message: "Internal Server Error",
      name: "InternalServerError",
    });
  });

  it("should handle an AppError", () => {
    const error = new AppError("Custom app error", 400);

    (createErrorDTO as jest.Mock).mockReturnValue({
      status: 400,
      message: "Custom app error",
    });

    const result = createAppError(error);
    
    expect(createErrorDTO).toHaveBeenLastCalledWith(400, "Custom app error", "Error");
    expect(createErrorDTO).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      status: 400,
      message: "Custom app error",
    });
  });

  it("should handle an error with status (non-AppError)", () => {
    const error = {
      message: "Bad Request",
      status: 400,
      name: "BadRequest",
    };

    (createErrorDTO as jest.Mock).mockReturnValue({
      status: 400,
      message: "Bad Request",
      name: "BadRequest",
    });

    const result = createAppError(error);

    expect(createErrorDTO).toHaveBeenCalledWith(400, "Bad Request", "BadRequest");
    expect(result).toEqual({
      status: 400,
      message: "Bad Request",
      name: "BadRequest",
    });
  });
});
