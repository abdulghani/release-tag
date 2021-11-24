import executeCommand from "@package/utils/execute-command";

describe("test execute command", () => {
  it("test successful command", async () => {
    const res = await executeCommand("node", ["-v"]);

    expect(res).toBeTruthy();
    expect(!!res.match(/^v/i)).toBe(true);
  });

  it("throws failed command", async () => {
    const res = await executeCommand("node", [
      "console.log('hello world')",
    ]).catch((err) => {
      return "thrown_error";
    });

    expect(res).toBe("thrown_error");
  });
});
