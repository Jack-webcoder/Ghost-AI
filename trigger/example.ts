import { task } from "@trigger.dev/sdk";

export const helloWorld = task({
  id: "hello-world",
  run: async (payload: { name: string }) => {
    console.log(`Hello, ${payload.name}!`);
    return { message: `Processed ${payload.name}` };
  },
});
