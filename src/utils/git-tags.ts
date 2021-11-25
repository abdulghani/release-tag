import ReleaseStage from "@package/constants/release-stage";
import ReleaseType from "@package/constants/release-type";
import fs from "fs";
import { parse } from "jsonc-parser";
import lodash from "lodash";
import path from "path";
import yargs from "yargs";
import executeCommand from "./execute-command";
import getVersionDetail from "./get-version-detail";
import isPureTag from "./is-pure-tags";

class GitTags {
  private currentBranch!: string | null;
  private stage: ReleaseStage;
  private type: ReleaseType;
  private writeToPackage: boolean;

  constructor() {
    const { stage, type, writeToPackage } = this.getArguments();
    this.stage = stage;
    this.type = type;
    this.writeToPackage = writeToPackage;
  }

  private getArguments() {
    const args = yargs(process.argv).argv;
    const type = ((): ReleaseType => {
      const argval = args.type as any;
      if (argval in ReleaseType) {
        return (ReleaseType as any)[argval];
      }
      if (argval === undefined || argval === true) {
        // DEFAULT TO MINOR RELEASE
        return ReleaseType.minor;
      }
      console.log(
        `invalid type (${argval}). valid --type arguments (${Object.values(
          ReleaseType
        ).join(", ")})`
      );
      process.exit(1);
    })();
    const stage = ((): ReleaseStage => {
      const argval = args.stage as any;
      if (argval in ReleaseStage) {
        return (ReleaseStage as any)[argval];
      }
      console.log(
        `invalid stage (${argval}). valid --stage arguments (${Object.values(
          ReleaseStage
        ).join(", ")})`
      );
      process.exit(1);
    })();
    const writeToPackage = (() => {
      const argval = !!args["write-to-package"];

      return argval;
    })();

    return { stage, type, writeToPackage };
  }

  private async getCurrentBranch() {
    if (this.currentBranch) {
      return this.currentBranch;
    }
    this.currentBranch = await executeCommand("git", [
      "branch",
      "--show-current",
    ]);
    return this.currentBranch;
  }

  private async pruneLocalTags() {
    const tags = await executeCommand("git", ["tag", "-l"]).then(
      (res) => res.split("\n").filter((i) => i.trim() !== "") ?? []
    );
    if (tags.length) {
      await executeCommand("git", ["tag", "-d", ...tags]);
    }
  }

  private sortTags(tags: string[]) {
    return tags.sort((a, b) => {
      const [vA, vB] = [getVersionDetail(a), getVersionDetail(b)];

      if (vA.major !== vB.major) {
        return vB.major - vA.major;
      } else if (vA.minor !== vB.minor) {
        return vB.minor - vA.minor;
      } else if (vA.patch !== vB.patch) {
        return vB.patch - vA.patch;
      } else if (vA.stage !== vB.stage) {
        return (!vA.stage && vB.stage) ||
          (vA.stage === "rc" && vB.stage !== "rc")
          ? -1
          : 1;
      }
      return vB.iteration - vA.iteration;
    });
  }

  private async getRemoteTags() {
    await this.pruneLocalTags();
    const stash = await executeCommand("git", [
      "stash",
      "--include-untracked",
    ]).then((res) => !res.match(/no local changes to save/i));
    const branch = await this.getCurrentBranch();
    await executeCommand("git", ["fetch", "origin", branch, "--tags"]);
    if (stash) await executeCommand("git", ["stash", "pop"]);
    const tags = await executeCommand("git", ["tag", "-l"]).then((res) => {
      const tags = (res.split("\n") ?? []).map((i) => i.trim());
      tags.push("v0.0.0");
      return this.sortTags(tags);
    });
    return tags;
  }

  private async cleanupRelatedTags(version: string) {
    const versionDetail = getVersionDetail(version);
    const tags = await this.getRemoteTags();
    const relatedTags = tags.filter((item) => {
      if (item.match(/^v([0-9]+)\.([0-9]+)\.([0-9]+)$/i)) {
        return false;
      }
      const itemDetail = getVersionDetail(item);
      return (
        versionDetail.major === itemDetail.major &&
        versionDetail.minor === itemDetail.minor &&
        versionDetail.patch === itemDetail.patch
      );
    });
    if (relatedTags.length > 0) {
      console.log("CLEANING UP TAGS");
      console.log("DELETING REMOTE TAGS", relatedTags);
      await executeCommand("git", [
        "push",
        "--delete",
        "--no-verify",
        "origin",
        ...relatedTags,
      ]);
    }
  }

  private async genNewTag() {
    const tags = await this.getRemoteTags();
    const pureTags = tags.filter((i) => isPureTag(i));
    const branch = await this.getCurrentBranch();

    // BUMP VERSION
    const bumpedVersion = (() => {
      const v = getVersionDetail(pureTags[0]);
      if (this.type === ReleaseType.patch) {
        v.patch += 1;
      } else if (this.type === ReleaseType.minor) {
        v.minor += 1;
      } else if (this.type === ReleaseType.major) {
        v.major += 1;
      }

      return `v${v.major}.${v.minor}.${v.patch}`;
    })();

    // ITERATION
    const iterations = (() => {
      const v = getVersionDetail(bumpedVersion);
      const relatedTags = tags.filter((i) => {
        if (isPureTag(i)) return false;
        const idetail = getVersionDetail(i);
        return (
          v.major === idetail.major &&
          v.minor === idetail.minor &&
          v.patch === idetail.patch &&
          (this.stage === ReleaseStage.stage ? branch : "rc") === idetail.stage
        );
      });
      return relatedTags;
    })();

    const newTag = (() => {
      if (this.stage === ReleaseStage.stage) {
        return `${bumpedVersion}-${lodash.kebabCase(branch)}.${
          iterations.length
        }`;
      } else if (this.stage === ReleaseStage.rc) {
        return `${bumpedVersion}-rc.${iterations.length}`;
      }
      // DEFAULT TO STAGE RELEASE
      return bumpedVersion;
    })();

    console.log(`LATEST TAG (${iterations[0] ?? pureTags[0]})`);
    console.log(`BUMPING TAG (${newTag})`);

    return newTag;
  }

  private async createTag(tag: string) {
    tag = tag.replace(/\//gi, "-");
    const branch = await this.getCurrentBranch();
    await executeCommand("git", [
      "tag",
      tag,
      "-m",
      `release: ${this.type} release ${tag}, from branch (${branch}).`,
    ]);
    await executeCommand("git", ["push", "--no-verify", "origin", tag]);
    console.log(`CREATED NEW TAG ${tag}`);
  }

  private async commitFile(path: string, message?: string) {
    const branch = await this.getCurrentBranch();
    await executeCommand("git", ["add", path]);
    const commitArgs = ["commit"];
    if (message) commitArgs.push("-m", message);
    await executeCommand("git", commitArgs);
    await executeCommand("git", ["push", "--no-verify", "origin", branch]);
  }

  private async writeVersion(tag: string) {
    const stripped = tag.replace(/^(?:v)?/i, "");
    const packagePath = path.resolve(process.cwd(), "package.json");
    const isExist = fs.existsSync(packagePath);

    if (isExist) {
      const config = parse(fs.readFileSync(packagePath, { encoding: "utf-8" }));
      if (config.version) {
        config.version = stripped;
        fs.writeFileSync(packagePath, JSON.stringify(config, null, 2) + "\n", {
          encoding: "utf-8",
        });
        console.log("PUSHING CHANGES TO package.json");
        await this.commitFile(
          packagePath,
          `chore: update package.json version (${tag})`
        );
      }
    }
  }

  public async createRelease() {
    console.log();
    console.log("FETCHING REMOTE TAGS...");
    const newTag = await this.genNewTag();
    if (this.stage === ReleaseStage.release) {
      await this.cleanupRelatedTags(newTag);
    }
    if (this.writeToPackage) {
      await this.writeVersion(newTag);
    }
    await this.createTag(newTag);
    console.log();
  }
}

export default GitTags;
