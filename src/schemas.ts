// SPDX-License-Identifier: MIT
import { z } from "zod";

export const CREDIT_ROLE_IDS = [
  "conceptualization",
  "data-curation",
  "formal-analysis",
  "funding-acquisition",
  "investigation",
  "methodology",
  "project-administration",
  "resources",
  "software",
  "supervision",
  "validation",
  "visualization",
  "writing-original-draft",
  "writing-review-editing",
] as const;

export type CreditRoleId = (typeof CREDIT_ROLE_IDS)[number];

export const ARTICLE_TYPES = ["all", "review", "empirical"] as const;
export type ArticleType = (typeof ARTICLE_TYPES)[number];

export const CONTRIBUTION_DEGREES = ["lead", "equal", "supporting"] as const;
export type ContributionDegree = (typeof CONTRIBUTION_DEGREES)[number];

export const JOURNAL_FORMATS = [
  "plain",
  "markdown",
  "plos",
  "elsevier",
  "frontiers",
  "jats",
] as const;
export type JournalFormat = (typeof JOURNAL_FORMATS)[number];

export const EXPORT_FORMATS = ["csv", "jats"] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const CREDIT_MATRIX_ACTIONS = [
  "generate",
  "export",
  "import",
  "parse_authors",
] as const;
export type CreditMatrixAction = (typeof CREDIT_MATRIX_ACTIONS)[number];

export const authorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  orcid: z.string().optional(),
  affiliation: z.string().optional(),
  equalContribution: z.boolean().optional(),
  corresponding: z.boolean().optional(),
});

export type CreditAuthor = z.infer<typeof authorSchema>;

export const cellAssignmentSchema = z.object({
  assigned: z.boolean(),
  degree: z.enum(CONTRIBUTION_DEGREES).optional(),
});

export type CellAssignment = z.infer<typeof cellAssignmentSchema>;

export const creditMatrixInputSchema = z.object({
  action: z.enum(CREDIT_MATRIX_ACTIONS),
  authors: z.array(authorSchema).optional(),
  assignments: z.record(z.string(), z.record(z.string(), cellAssignmentSchema)).optional(),
  articleType: z.enum(ARTICLE_TYPES).optional(),
  showDegree: z.boolean().optional(),
  includeAuditHeader: z.boolean().optional(),
  journalFormat: z.enum(JOURNAL_FORMATS).optional(),
  lastModified: z.string().optional(),
  authors_text: z.string().optional(),
  format: z.enum(EXPORT_FORMATS).optional(),
  content: z.string().optional(),
});

export type CreditMatrixInput = z.infer<typeof creditMatrixInputSchema>;

export function parseRunInput(input: unknown): CreditMatrixInput {
  return creditMatrixInputSchema.parse(input);
}
