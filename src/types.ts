// SPDX-License-Identifier: MIT
import type {
  ArticleType,
  CellAssignment,
  ContributionDegree,
  CreditAuthor,
  CreditMatrixAction,
  CreditRoleId,
  ExportFormat,
  JournalFormat,
} from "./schemas.js";

export type RunStatus = "queued" | "running" | "completed" | "failed" | (string & {});

export interface RunOptions {
  idempotency_key?: string;
  label?: string;
  [key: string]: unknown;
}

export interface RunResult<T = CreditMatrixResult> {
  run_id: string;
  status: RunStatus;
  result?: T;
  error?: string | { message?: string; code?: string; details?: unknown } | null;
  result_url?: string;
  permalink?: string;
  duration_ms?: number;
}

export interface ManifestExample {
  name: string;
  description?: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
}

export interface ToolManifest {
  schema_version: string;
  tool_id: string;
  title: string;
  description?: string;
  tags?: string[];
  category?: string;
  execution_mode?: string;
  estimated_runtime_sec?: number;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  agent_notes?: string;
  example_prompts?: string[];
  examples?: ManifestExample[];
  limits?: Record<string, unknown>;
  input_schema?: Record<string, unknown>;
}

export interface ExampleMeta {
  name: string;
  description?: string;
}

export type {
  ArticleType,
  CellAssignment,
  ContributionDegree,
  CreditAuthor,
  CreditMatrixAction,
  CreditRoleId,
  ExportFormat,
  JournalFormat,
};

export interface CreditMatrixResult {
  statement?: string;
  authors?: CreditAuthor[];
  assignments?: Record<string, Record<string, CellAssignment>>;
  warnings?: string[];
  errors?: string[];
  content?: string;
  filename?: string;
  mime_type?: string;
  roleCounts?: Record<string, number>;
  error?: string;
  [key: string]: unknown;
}

export class PepkioAPIError extends Error {
  readonly status: number;
  readonly body?: unknown;
  readonly runId?: string;
  readonly code?: string;

  constructor(
    message: string,
    opts: { status: number; body?: unknown; runId?: string; code?: string },
  ) {
    super(message);
    this.name = "PepkioAPIError";
    this.status = opts.status;
    this.body = opts.body;
    this.runId = opts.runId;
    this.code = opts.code;
  }
}
