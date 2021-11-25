import getVersionDetail from "../get-version-detail";

describe("get version detail test suite", () => {
  it("get version detail", () => {
    const vDetail = getVersionDetail("v0.0.1");

    expect(vDetail.major).toBe(0);
    expect(vDetail.minor).toBe(0);
    expect(vDetail.patch).toBe(1);
    expect(vDetail.stage).toBe(undefined);
    expect(vDetail.iteration).toBe(0);
  });

  it("get version detail with stage", () => {
    const vDetail = getVersionDetail("v0.0.1-story-1190.0");

    expect(vDetail.major).toBe(0);
    expect(vDetail.minor).toBe(0);
    expect(vDetail.patch).toBe(1);
    expect(vDetail.stage).toBe("story/1190");
    expect(vDetail.iteration).toBe(0);
  });

  it("get version detail with rc stage", () => {
    const vDetail = getVersionDetail("v0.0.1-rc.1");

    expect(vDetail.major).toBe(0);
    expect(vDetail.minor).toBe(0);
    expect(vDetail.patch).toBe(1);
    expect(vDetail.stage).toBe("rc");
    expect(vDetail.iteration).toBe(1);
  });

  it("get version detail with stage", () => {
    const vDetail = getVersionDetail("v0.0.1-story-1190-20.15");

    expect(vDetail.major).toBe(0);
    expect(vDetail.minor).toBe(0);
    expect(vDetail.patch).toBe(1);
    expect(vDetail.stage).toBe("story/1190/20");
    expect(vDetail.iteration).toBe(15);
  });

  it("throw if input with invalid version", () => {
    const vDetail = (() => {
      try {
        return getVersionDetail("vv1.0.0");
      } catch (err) {
        return "thrown_error";
      }
    })();

    expect(vDetail).toBe("thrown_error");
  });
});
