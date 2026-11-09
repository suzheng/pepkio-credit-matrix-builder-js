import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PepkioClient } from "../src/client.js";
import {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "../src/config.js";
import { parseRunInput } from "../src/schemas.js";
import { PepkioAPIError, type ToolManifest } from "../src/types.js";

const mockManifest: ToolManifest = {
  schema_version: "1.0",
  tool_id: TOOL_ID,
  title: "CRediT Matrix Builder",
  description: "Build author × CRediT role matrices, generate journal-ready contribution statements, and export CSV or JATS XML.",
  examples: [
    {
      name: "generate_example",
      description: "Generate a CRediT statement for three authors",
      input: {
        action: "generate",
        articleType: "empirical",
        showDegree: true,
        includeAuditHeader: true,
        journalFormat: "plain",
        lastModified: "2026-08-01T10:00:00.000Z",
        authors: [
          {
            id: "author-1",
            name: "Dr. Elena Vasquez",
            orcid: "0000-0002-1825-0097",
            affiliation: "Department of Molecular Biology, Stanford University",
            corresponding: true,
          },
          {
            id: "author-2",
            name: "Alex Chen",
            equalContribution: true,
          },
        ],
        assignments: {
          "author-1": {
            conceptualization: { assigned: true, degree: "lead" },
            methodology: { assigned: true, degree: "lead" },
          },
          "author-2": {
            investigation: { assigned: true, degree: "lead" },
          },
        },
      },
      output: {
        statement: "Conceptualization: Dr. Elena Vasquez",
      },
    },
    {
      name: "export_csv",
      description: "Export matrix as CSV",
      input: {
        action: "export",
        format: "csv",
        authors: [{ id: "author-1", name: "Dr. Elena Vasquez" }],
        assignments: { "author-1": { conceptualization: { assigned: true } } },
      },
      output: { mime_type: "text/csv" },
    },
    {
      name: "parse_authors",
      description: "Parse author names",
      input: {
        action: "parse_authors",
        authors_text: "Dr. Elena Vasquez\nAlex Chen\n",
      },
      output: { authors: [] },
    },
  ],
};

describe("PepkioClient unit tests", () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env = { ...originalEnv };
  });

  it("getManifest() fetches and returns tool_id", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const manifest = await client.getManifest();

    expect(manifest.tool_id).toBe(TOOL_ID);
    expect(manifest.title).toBe("CRediT Matrix Builder");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/manifest`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("caches getManifest() calls", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);
    globalThis.fetch = fetchMock;

    const client = new PepkioClient({ apiKey: "test-key" });
    await client.getManifest();
    await client.getManifest();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("listExamples() extracts examples from manifest", () => {
    const client = new PepkioClient({ apiKey: "test-key" });
    const examples = client.listExamples(mockManifest);
    expect(examples).toHaveLength(3);
    expect(examples[0].name).toBe("generate_example");
    expect(examples[1].name).toBe("export_csv");
    expect(examples[2].name).toBe("parse_authors");
  });

  it("getExampleInput() retrieves and parses example", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const input = await client.getExampleInput("generate_example");
    expect(input.action).toBe("generate");
    expect(input.articleType).toBe("empirical");
    expect(input.authors).toHaveLength(2);
    expect(input.authors?.[0].name).toBe("Dr. Elena Vasquez");
  });

  it("getExampleInput() throws on unknown example name", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockManifest),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(client.getExampleInput("nonexistent")).rejects.toThrow(
      /Example "nonexistent" not found/,
    );
  });

  it("run() sends validated input and options", async () => {
    const mockResponse = {
      run_id: "test-run-123",
      status: "completed",
      result: {
        statement: "Conceptualization: Dr. Elena Vasquez",
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const res = await client.run(
      {
        action: "generate",
        articleType: "empirical",
        journalFormat: "plain",
        authors: [{ id: "a1", name: "Dr. Elena Vasquez" }],
        assignments: { a1: { conceptualization: { assigned: true, degree: "lead" } } },
      },
      { label: "my-credit-run" },
    );

    expect(res.run_id).toBe("test-run-123");
    expect(res.status).toBe("completed");
    expect(res.result?.statement).toBe("Conceptualization: Dr. Elena Vasquez");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/tools/${TOOL_ID}/run`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        }),
      }),
    );
  });

  it("generateStatement() convenience helper formats and calls run()", async () => {
    const mockResponse = {
      run_id: "stmt-run-1",
      status: "completed",
      result: { statement: "Author contributions..." },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const runSpy = vi.spyOn(client, "run");

    const result = await client.generateStatement({
      authors: [{ id: "author-1", name: "Dr. Elena Vasquez" }],
      assignments: { "author-1": { conceptualization: { assigned: true, degree: "lead" } } },
      journalFormat: "markdown",
    });

    expect(result.status).toBe("completed");
    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "generate",
        articleType: "empirical",
        journalFormat: "markdown",
        authors: [{ id: "author-1", name: "Dr. Elena Vasquez" }],
      }),
      undefined,
    );
  });

  it("exportMatrix() convenience helper formats and calls run()", async () => {
    const mockResponse = {
      run_id: "export-run-1",
      status: "completed",
      result: { mime_type: "text/csv", content: "Author,Role\n..." },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const runSpy = vi.spyOn(client, "run");

    const result = await client.exportMatrix({
      authors: [{ id: "author-1", name: "Dr. Elena Vasquez" }],
      assignments: { "author-1": { conceptualization: { assigned: true } } },
      format: "csv",
    });

    expect(result.status).toBe("completed");
    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "export",
        format: "csv",
        authors: [{ id: "author-1", name: "Dr. Elena Vasquez" }],
      }),
      undefined,
    );
  });

  it("importMatrix() convenience helper formats and calls run()", async () => {
    const mockResponse = {
      run_id: "import-run-1",
      status: "completed",
      result: { authors: [{ id: "a1", name: "Dr. Elena Vasquez" }] },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const runSpy = vi.spyOn(client, "run");

    const result = await client.importMatrix({
      content: "Author,Role\n...",
      format: "csv",
    });

    expect(result.status).toBe("completed");
    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "import",
        content: "Author,Role\n...",
        format: "csv",
      }),
      undefined,
    );
  });

  it("parseAuthors() convenience helper formats and calls run()", async () => {
    const mockResponse = {
      run_id: "parse-run-1",
      status: "completed",
      result: {
        authors: [
          { id: "author-1", name: "Dr. Elena Vasquez" },
          { id: "author-2", name: "Alex Chen" },
        ],
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(mockResponse),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const runSpy = vi.spyOn(client, "run");

    const result = await client.parseAuthors("Dr. Elena Vasquez\nAlex Chen\n");

    expect(result.status).toBe("completed");
    expect(runSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "parse_authors",
        authors_text: "Dr. Elena Vasquez\nAlex Chen\n",
      }),
      undefined,
    );
  });

  it("getRun() fetches previous run by ID", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "prev-run-456",
          status: "completed",
          result: { statement: "Previous statement" },
        }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    const run = await client.getRun("prev-run-456");

    expect(run.run_id).toBe("prev-run-456");
    expect(run.status).toBe("completed");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${DEFAULT_API_BASE_URL}/api/tools/v1/runs/prev-run-456`,
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("waitForRun() polls until run is completed", async () => {
    let callCount = 0;
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      callCount += 1;
      if (callCount < 2) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ run_id: "poll-1", status: "running" }),
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            run_id: "poll-1",
            status: "completed",
            result: { statement: "Done" },
          }),
      } as unknown as Response;
    });

    const client = new PepkioClient({ apiKey: "test-key" });
    const result = await client.waitForRun("poll-1", { intervalMs: 10, timeoutMs: 500 });
    expect(result.status).toBe("completed");
    expect(callCount).toBe(2);
  });

  it("waitForRun() throws on timeout", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ run_id: "timeout-run", status: "running" }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.waitForRun("timeout-run", { intervalMs: 20, timeoutMs: 50 }),
    ).rejects.toThrow(/Timed out/);
  });

  it("throws PepkioAPIError on HTTP 500 error", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => JSON.stringify({ error: "Something broke internally" }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({
        action: "generate",
      }),
    ).rejects.toThrow("Something broke internally");
  });

  it("throws PepkioAPIError when error field is present in response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          run_id: "err-run",
          status: "failed",
          error: "Invalid authors array",
        }),
    } as unknown as Response);

    const client = new PepkioClient({ apiKey: "test-key" });
    await expect(
      client.run({
        action: "generate",
      }),
    ).rejects.toThrow("Invalid authors array");
  });

  it("throws when calling run() without API key", async () => {
    delete process.env.PEPKIO_API_KEY;
    delete process.env.LOCAL_PEPKIO_API_KEY;

    const client = new PepkioClient();
    await expect(
      client.run({
        action: "generate",
      }),
    ).rejects.toThrow(/API key required/);
  });

  it("resolves config and URLs correctly", () => {
    expect(resolveBaseUrl()).toBe(DEFAULT_API_BASE_URL);
    expect(resolveBaseUrl("https://custom.com/")).toBe("https://custom.com");
    expect(apiPath("https://custom.com", "my/path")).toBe("https://custom.com/api/tools/v1/my/path");

    process.env.PEPKIO_API_KEY = "prod-key";
    process.env.LOCAL_PEPKIO_API_KEY = "local-key";

    expect(resolveApiKey("https://tools.pepkio.com")).toBe("prod-key");
    expect(resolveApiKey("https://tools.localtest.me")).toBe("local-key");
  });

  it("validates input schema with parseRunInput", () => {
    const valid = parseRunInput({
      action: "generate",
      articleType: "empirical",
    });
    expect(valid.action).toBe("generate");

    expect(() =>
      parseRunInput({
        action: "invalid_action",
      }),
    ).toThrow();
  });
});
