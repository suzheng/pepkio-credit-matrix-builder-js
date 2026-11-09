# Pepkio CRediT Matrix Builder

Typed Node.js and TypeScript client for assembling author-by-role CRediT matrices, generating journal-ready attribution statements, and exporting JATS XML via the Pepkio REST API.

# What It Does

Assigning Contributor Roles Taxonomy (CRediT) roles across multi-author scientific manuscripts is often challenging, prone to clerical errors, and difficult to format consistently for different journal requirements.

This package provides a typed Node.js client and command-line interface (CLI) for the hosted Pepkio CRediT Matrix Builder REST API. It models contributor assignments across all 14 official ANSI/NISO Z39.104-2022 roles, validates mandatory roles based on article type (empirical vs. review), handles contributor degree weighting (Lead, Equal, Supporting), parses raw author text lists into structured records, and formats submission-ready statements or structured JATS XML.

Programmatic runs require a network connection and a Pepkio API key. Attributions, validations, and statement formatting are computed remotely by the Pepkio API engine.

# Features

- **Standard 14 NISO CRediT Roles**: Full support for Conceptualization, Data curation, Formal analysis, Funding acquisition, Investigation, Methodology, Project administration, Resources, Software, Supervision, Validation, Visualization, Writing – original draft, and Writing – review & editing.
- **Granular Contribution Degrees**: Assign Lead, Equal, or Supporting contribution degrees per author-role pairing.
- **Multi-Publisher Formatter**: Generates compliant contribution statements for PLOS, Elsevier, Frontiers, plain text, and Markdown.
- **JATS XML & CSV Export**: Produces machine-readable `<contrib>` XML tags with embedded `<role vocab="credit">` metadata and tabular CSV matrices.
- **Author Entity Parser**: Converts unstructured author lists into structured author entities with affiliations, ORCIDs, and corresponding author indicators.
- **Typed ESM Client**: Full TypeScript definitions with Zod schema validation and promise-based helper methods (`generateStatement`, `exportMatrix`, `parseAuthors`, `getManifest`, `run`).
- **Command-Line Interface (CLI)**: Inspect manifests, list built-in examples, and execute CRediT matrix operations directly from your terminal.

# Installation

```bash
npm install pepkio-credit-matrix-builder
```

Requires Node.js 18 or newer.

# Configuration

Set an API key with **tools:run** scope before invoking `run()` or convenience helpers:

```bash
export PEPKIO_API_KEY="your-api-key"
```

Create and manage keys in your [Pepkio Account](https://www.pepkio.com/account/api-keys).

Optional configuration variables:

| Variable | Purpose |
|----------|---------|
| `PEPKIO_API_KEY` | Production API key (required for `run`) |
| `LOCAL_PEPKIO_API_KEY` | Local development key when `PEPKIO_API_BASE_URL` points to `tools.localtest.me` |
| `PEPKIO_API_BASE_URL` | API base URL (default: `https://tools.pepkio.com`) |

# Quick Example

```javascript
import { PepkioClient } from "pepkio-credit-matrix-builder";

const client = new PepkioClient();

// Generate a PLOS-formatted CRediT author statement
const result = await client.generateStatement({
  authors: [
    { id: "author-1", name: "Dr. Elena Vasquez", isCorresponding: true },
    { id: "author-2", name: "Alex Chen", isEqualContribution: true },
  ],
  assignments: {
    "author-1": {
      conceptualization: "lead",
      methodology: "lead",
      writing_original_draft: "lead",
    },
    "author-2": {
      investigation: "lead",
      validation: "lead",
    },
  },
  journalFormat: "plos",
  articleType: "empirical",
});

if (result.result?.statement) {
  console.log("CRediT Statement:\n", result.result.statement);
}
```

# CLI

Inspect tool metadata and available examples:

```bash
npx pepkio-credit-matrix-builder manifest --examples
```

Execute a CRediT statement generation run using a built-in example:

```bash
npx pepkio-credit-matrix-builder run --example generate_example
```

# Typical Use Cases

- **Journal Submission Preparation**: Generate compliant contributor statements formatted for PLOS ONE, Elsevier journals, or Frontiers publications.
- **Preprint and XML Archiving**: Export structured JATS XML 1.3 contribution blocks for preprint ingestion and institutional repositories.
- **Collaborative Authorship Auditing**: Establish transparent contributor role agreements among multidisciplinary teams before manuscript submission.
- **Title Page Parsing**: Parse raw author and affiliation blocks into normalized author objects with ORCID identifiers.

# Scientific Background

The Contributor Roles Taxonomy (CRediT), formalized under ANSI/NISO Z39.104-2022, standardizes individual contribution attribution across modern scientific literature. Unlike traditional linear author sequences, CRediT transparently delineates specific intellectual, experimental, and administrative inputs across 14 distinct roles. Programmatic author-by-role matrices ensure strict consistency between manuscript contribution sections, repository metadata, and publisher JATS XML ingestion pipelines.

# Web Application

For researchers who prefer a graphical interface, an interactive web version is available.

Web Application: https://www.pepkio.com/tools/credit-matrix-builder

The web application includes visual role assignment grids, real-time validation warnings for empirical and review papers, multi-journal preview toggles, and instant CSV/JATS XML downloads.

# Documentation and Resources

GitHub Repository: https://github.com/pepkio/pepkio-credit-matrix-builder-js

Web Application: https://www.pepkio.com/tools/credit-matrix-builder

Python client (PyPI): https://pypi.org/project/pepkio-credit-matrix-builder/

# About Pepkio

Pepkio (https://www.pepkio.com/) develops software tools and bioinformatics solutions for life science researchers, including laboratory calculators and analysis services (https://www.pepkio.com/cro).

A semantic, AI-native version of this document in the K2F format is available at https://k2f.dev (https://k2f.dev/v/27e9b17f1988efc633ab5390e1cf07d19784a9878698ea28ff3ab91160365098)
