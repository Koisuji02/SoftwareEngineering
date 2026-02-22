import * as utils from "../../src/utils";

describe("parseStringArrayParam", () => {
  it("returns undefined if input is undefined", () => {
    expect(utils.parseStringArrayParam(undefined)).toBeUndefined();
  });
  it("parses single string", () => {
    expect(utils.parseStringArrayParam("A")).toEqual(["A"]);
  });
  it("parses array of strings", () => {
    expect(utils.parseStringArrayParam(["A", "B"])).toEqual(["A", "B"]);
  });
  it("parses comma-separated string", () => {
    expect(utils.parseStringArrayParam("A,B")).toEqual(["A", "B"]);
  });
  it("handles non-string elements in array", () => {
    expect(utils.parseStringArrayParam(["A", 42, null, "B"])).toEqual([
      "A",
      "B",
    ]);
  });
});

describe("parseISODateParamToUTC", () => {
  it("returns undefined if input is undefined", () => {
    expect(utils.parseISODateParamToUTC(undefined)).toBeUndefined();
  });
  it("parses valid ISO date", () => {
    expect(utils.parseISODateParamToUTC("2024-01-01T00:00:00Z")).toBeInstanceOf(
      Date
    );
  });
  it("parses invalid date as undefined", () => {
    expect(utils.parseISODateParamToUTC("not-a-date")).toBeUndefined();
  });
});
