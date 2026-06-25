import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_wgwljrxihsvhmvudimzz", // Replace with your project ID from https://dashboard.trigger.dev
  runtime:"node",
  dirs: ["trigger"],
  maxDuration: 300,
  retries:{
    enabledInDev: false,
    default:{
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
    }
  }
});
