#!/usr/bin/env node

import GitTags from "@package/utils/git-tags";

(async () => {
  try {
    const instance = new GitTags();
    await instance.createRelease();
  } catch (err: any) {
    console.log("FAILED", err.message);
  }
})();
