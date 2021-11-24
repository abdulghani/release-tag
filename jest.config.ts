import type { Config } from "@jest/types";
import fs from "fs";
import { parse } from "jsonc-parser";
import path from "path";
import { pathsToModuleNameMapper } from "ts-jest/utils";

const tsconfig = parse(
  fs.readFileSync(path.resolve(__dirname, "tsconfig.json"), {
    encoding: "utf-8",
  })
);

const config: Config.InitialOptions = {
  testEnvironment: "node",
  preset: "ts-jest",
  displayName: "TEST",
  rootDir: __dirname,
  coverageDirectory: "<rootDir>/.coverage",
  testPathIgnorePatterns: ["<rootDir>/.build"],
  moduleNameMapper: pathsToModuleNameMapper(tsconfig.compilerOptions.paths, {
    prefix: "<rootDir>",
  }),
};

export default config;
