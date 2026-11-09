// SPDX-License-Identifier: MIT

export {
  PepkioClient,
  type ExportMatrixOptions,
  type GenerateStatementOptions,
  type ImportMatrixOptions,
  type PepkioClientOptions,
} from "./client.js";

export {
  DEFAULT_API_BASE_URL,
  TOOL_ID,
  apiPath,
  resolveApiKey,
  resolveBaseUrl,
} from "./config.js";

export {
  ARTICLE_TYPES,
  CONTRIBUTION_DEGREES,
  CREDIT_MATRIX_ACTIONS,
  CREDIT_ROLE_IDS,
  EXPORT_FORMATS,
  JOURNAL_FORMATS,
  authorSchema,
  cellAssignmentSchema,
  creditMatrixInputSchema,
  parseRunInput,
  type ArticleType,
  type CellAssignment,
  type ContributionDegree,
  type CreditAuthor,
  type CreditMatrixAction,
  type CreditMatrixInput,
  type CreditRoleId,
  type ExportFormat,
  type JournalFormat,
} from "./schemas.js";

export {
  PepkioAPIError,
  type CreditMatrixResult,
  type ExampleMeta,
  type ManifestExample,
  type RunOptions,
  type RunResult,
  type RunStatus,
  type ToolManifest,
} from "./types.js";
