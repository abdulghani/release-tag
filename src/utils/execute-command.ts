import { spawn } from "child_process";

async function executeCommand(
  command: string,
  args?: string[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args);
    const stream: string[] = [];
    const errStream: String[] = [];

    cmd.stdout.on("data", (data: Buffer) => {
      stream.push(
        ...data
          .toString()
          .trim()
          .split("\n")
          .map((item) => item.trim())
      );
    });

    cmd.stderr.on("data", (data: Buffer) => {
      errStream.push(
        ...data
          .toString()
          .trim()
          .split("\n")
          .map((item) => item.trim())
      );
    });

    cmd.on("exit", (code) => {
      if (Number(code) === 0) {
        resolve(stream.join("\n"));
      }

      reject(errStream.join("\n"));
    });
  });
}

export default executeCommand;
