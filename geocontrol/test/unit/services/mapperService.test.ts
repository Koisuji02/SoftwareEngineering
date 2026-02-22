import { createErrorDTO, createTokenDTO, createUserDTO, mapUserDAOToDTO} from "@services/mapperService";
import { UserType } from "@models/UserType";
import { UserDAO } from "@models/dao/UserDAO";
import { removeNullAttributes } from "@services/mapperService";

describe("createTokenDTO", () => {
  it("should return a token dto with token", () => {
    const dto = createTokenDTO("abc123");
    expect(dto).toEqual({ token: "abc123" });
  });

  it("should remove undefined token", () => {
    const dto = createTokenDTO(undefined);
    expect(dto).toEqual({});
  });
});

describe("createUserDTO", () => {
  it("should return full user dto with all fields", () => {
    const dto = createUserDTO("user1", UserType.Admin, "secret");
    expect(dto).toEqual({
      username: "user1",
      type: UserType.Admin,
      password: "secret"
    });
  });

  it("should remove password if undefined", () => {
    const dto = createUserDTO("user1", UserType.Admin);
    expect(dto).toEqual({
      username: "user1",
      type: UserType.Admin
    });
  });

  it("should remove password if null", () => {
    const dto = createUserDTO("user1", UserType.Admin, null);
    expect(dto).toEqual({
      username: "user1",
      type: UserType.Admin
    });
  });
});

describe("mapUserDAOToDTO", () => {
  it("should map UserDAO to DTO", () => {
    const dao: UserDAO = {
      username: "user2",
      type: UserType.Viewer
    } as UserDAO;

    const dto = mapUserDAOToDTO(dao);
    expect(dto).toEqual({
      username: "user2",
      type: UserType.Viewer
    });
  });
});

describe("createErrorDTO", () => {
  it("should include all non-null fields", () => {
    const dto = createErrorDTO(500, "Server error", "InternalError");
    expect(dto).toEqual({
      code: 500,
      message: "Server error",
      name: "InternalError"
    });
  });

  it("should exclude null fields", () => {
    const dto = createErrorDTO(404, null, "NotFound");
    expect(dto).toEqual({
      code: 404,
      name: "NotFound"
    });
  });

  it("should exclude undefined fields", () => {
    const dto = createErrorDTO(403, undefined, "Forbidden");
    expect(dto).toEqual({
      code: 403,
      name: "Forbidden"
    });
  });
});
describe("removeNullAttributes", () => {
  it("should exclude fields with empty arrays", () => {
    const input = {
      code: 400,
      message: "Invalid",
      name: "Bad",
      extra: [],
    };

    const output = removeNullAttributes(input);

    expect(output).toEqual({
      code: 400,
      message: "Invalid",
      name: "Bad"
    });
  });
});
