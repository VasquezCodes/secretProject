import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["app/lib/**/*.test.ts"],
    environment: "node",
  },
});
