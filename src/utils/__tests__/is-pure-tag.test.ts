import isPureTag from "../is-pure-tags";

describe("is pure tag test suite", () => {
  it("check if tag string is pure tag", () => {
    const isPure = isPureTag("v1.0.0");

    expect(isPure).toBe(true);
  });

  it("check if tag string is pure tag", () => {
    const isPure = isPureTag("v1.0.0-story-1190.10");

    expect(isPure).toBe(false);
  });

  it("check if tag string is pure tag", () => {
    const isPure = isPureTag("1.0.0-story-1190.10");

    expect(isPure).toBe(false);
  });

  it("check if tag string is pure tag", () => {
    const isPure = isPureTag("1.3.10");

    expect(isPure).toBe(true);
  });
});
