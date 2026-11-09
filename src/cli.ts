#!/usr/bin/env node
// SPDX-License-Identifier: MIT
import { Command } from "commander";
import { PepkioClient } from "./client.js";
import { PepkioAPIError } from "./types.js";
import fs from "node:fs";

const program = new Command();

program
  .name("pepkio-credit-matrix-builder")
  .description("CLI for the Pepkio CRediT Matrix Builder tool")
  .option("--base-url <url>", "API base URL (default: PEPKIO_API_BASE_URL or production)")
  .option("--api-key <key>", "API key (default: PEPKIO_API_KEY or LOCAL_PEPKIO_API_KEY)");

program
  .command("manifest")
  .description("Fetch and print the tool manifest")
  .option("--examples", "List example names and descriptions only")
  .action(async (_opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    try {
      const client = new PepkioClient({
        baseUrl: globalOpts.baseUrl,
        apiKey: globalOpts.apiKey,
      });
      const manifest = await client.getManifest();
      if (_opts.examples) {
        const examples = client.listExamples(manifest);
        for (const ex of examples) {
          console.log(`${ex.name}\t${ex.description ?? ""}`);
        }
      } else {
        console.log(JSON.stringify(manifest, null, 2));
      }
    } catch (err) {
      printError(err);
    }
  });

program
  .command("run")
  .description("Run the tool with example input or custom JSON")
  .option(
    "--example <name>",
    "Run a named manifest example (e.g. generate_example, export_csv, export_jats, parse_authors)",
  )
  .option("--input-json <json>", "Run with custom input JSON string")
  .option("--input-file <path>", "Run with input JSON loaded from a file")
  .option("--label <label>", "Optional run label")
  .option("--idempotency-key <key>", "Optional idempotency key")
  .action(async (opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    const inputSources = [opts.example, opts.inputJson, opts.inputFile].filter(Boolean);

    if (inputSources.length > 1) {
      console.error("Provide at most one of --example, --input-json, or --input-file");
      process.exit(1);
    }

    try {
      const client = new PepkioClient({
        baseUrl: globalOpts.baseUrl,
        apiKey: globalOpts.apiKey,
      });

      let input;
      if (opts.example) {
        input = await client.getExampleInput(opts.example);
      } else if (opts.inputJson) {
        input = JSON.parse(opts.inputJson);
      } else if (opts.inputFile) {
        const content = fs.readFileSync(opts.inputFile, "utf8");
        input = JSON.parse(content);
      } else {
        // Default to first example if no input specified
        input = await client.getExampleInput("generate_example");
      }

      const runOpts: { label?: string; idempotency_key?: string } = {};
      if (opts.label) runOpts.label = opts.label;
      if (opts.idempotencyKey) runOpts.idempotency_key = opts.idempotencyKey;

      const result = await client.run(
        input,
        Object.keys(runOpts).length > 0 ? runOpts : undefined,
      );
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      printError(err);
    }
  });

program
  .command("get-run <runId>")
  .description("Fetch result of a previous run by run ID")
  .action(async (runId: string, _opts, cmd) => {
    const globalOpts = cmd.parent?.opts() ?? {};
    try {
      const client = new PepkioClient({
        baseUrl: globalOpts.baseUrl,
        apiKey: globalOpts.apiKey,
      });
      const result = await client.getRun(runId);
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      printError(err);
    }
  });

function printError(err: unknown): void {
  if (err instanceof PepkioAPIError) {
    console.error(`Error (${err.status}): ${err.message}`);
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`);
  } else {
    console.error("Error:", err);
  }
  process.exit(1);
}

program.parse();
