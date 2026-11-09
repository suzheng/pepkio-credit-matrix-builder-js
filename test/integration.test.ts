import { describe, expect, it } from "vitest";
import { PepkioClient } from "../src/client.js";
import { TOOL_ID } from "../src/config.js";

const LOCAL_BASE_URL = "https://tools.localtest.me";
const PRODUCTION_BASE_URL = "https://tools.pepkio.com";

function envConfig(env: "local" | "production") {
  const baseUrl = process.env.PEPKIO_API_BASE_URL
    ? process.env.PEPKIO_API_BASE_URL.replace(/\/$/, "")
    : env === "local"
      ? LOCAL_BASE_URL
      : PRODUCTION_BASE_URL;

  const isLocal = baseUrl.includes("localtest.me");
  const apiKey = isLocal
    ? process.env.LOCAL_PEPKIO_API_KEY ?? process.env.PEPKIO_API_KEY
    : process.env.PEPKIO_API_KEY;

  return { baseUrl, apiKey, isLocal };
}

describe("integration: local", () => {
  const { baseUrl, apiKey } = envConfig("local");

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("CRediT Matrix Builder");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("generate_example");
      expect(names).toContain("export_csv");
      expect(names).toContain("export_jats");
      expect(names).toContain("parse_authors");
    },
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs generate_example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("generate_example");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result).toBeDefined();
      expect(result.result?.statement).toBeDefined();
      expect(result.result?.statement).toContain("Conceptualization");
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs export_csv",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("export_csv");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.mime_type).toBe("text/csv");
      expect(result.result?.content).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs export_jats",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("export_jats");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.mime_type).toBe("application/xml");
      expect(result.result?.content).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs parse_authors",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("parse_authors");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.authors).toBeDefined();
      expect(result.result?.authors?.length).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs generateStatement helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.generateStatement({
        authors: [
          { id: "author-1", name: "Dr. Elena Vasquez", corresponding: true },
          { id: "author-2", name: "Alex Chen", equalContribution: true },
        ],
        assignments: {
          "author-1": { conceptualization: { assigned: true, degree: "lead" } },
          "author-2": { investigation: { assigned: true, degree: "lead" } },
        },
        journalFormat: "plain",
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.statement).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs exportMatrix helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.exportMatrix({
        authors: [{ id: "author-1", name: "Dr. Elena Vasquez" }],
        assignments: {
          "author-1": { conceptualization: { assigned: true } },
        },
        format: "csv",
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.mime_type).toBe("text/csv");
      expect(result.result?.content).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || !baseUrl.includes("localtest.me"))(
    "runs parseAuthors helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.parseAuthors("Dr. Elena Vasquez\nAlex Chen\n");

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.authors?.length).toBe(2);
    },
    60_000,
  );
});

describe("integration: production", () => {
  const { baseUrl, apiKey } = envConfig("production");

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "fetches manifest",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const manifest = await client.getManifest();

      expect(manifest.tool_id).toBe(TOOL_ID);
      expect(manifest.title).toBe("CRediT Matrix Builder");
      const names = manifest.examples?.map((e) => e.name) ?? [];
      expect(names).toContain("generate_example");
      expect(names).toContain("export_csv");
      expect(names).toContain("export_jats");
      expect(names).toContain("parse_authors");
    },
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs generate_example",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("generate_example");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result).toBeDefined();
      expect(result.result?.statement).toBeDefined();
      expect(result.result?.statement).toContain("Conceptualization");
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs export_csv",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("export_csv");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.mime_type).toBe("text/csv");
      expect(result.result?.content).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs export_jats",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("export_jats");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.mime_type).toBe("application/xml");
      expect(result.result?.content).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs parse_authors",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const input = await client.getExampleInput("parse_authors");
      const result = await client.run(input);

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.authors).toBeDefined();
      expect(result.result?.authors?.length).toBeGreaterThan(0);
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs generateStatement helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.generateStatement({
        authors: [
          { id: "author-1", name: "Dr. Elena Vasquez", corresponding: true },
          { id: "author-2", name: "Alex Chen", equalContribution: true },
        ],
        assignments: {
          "author-1": { conceptualization: { assigned: true, degree: "lead" } },
          "author-2": { investigation: { assigned: true, degree: "lead" } },
        },
        journalFormat: "plain",
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.statement).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs exportMatrix helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.exportMatrix({
        authors: [{ id: "author-1", name: "Dr. Elena Vasquez" }],
        assignments: {
          "author-1": { conceptualization: { assigned: true } },
        },
        format: "csv",
      });

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.mime_type).toBe("text/csv");
      expect(result.result?.content).toBeDefined();
    },
    60_000,
  );

  it.skipIf(!apiKey || baseUrl.includes("localtest.me"))(
    "runs parseAuthors helper",
    async () => {
      const client = new PepkioClient({ baseUrl, apiKey });
      const result = await client.parseAuthors("Dr. Elena Vasquez\nAlex Chen\n");

      expect(result.status).toBe("completed");
      expect(result.error).toBeFalsy();
      expect(result.result?.authors?.length).toBe(2);
    },
    60_000,
  );
});
