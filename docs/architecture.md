# Architecture

## High-level flow

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Salesforce / │  │ Personio /   │  │ Google Drive │  │ Light Ledger │
│ HubSpot /    │  │ Ashby /      │  │ (master      │  │ (MRR, HC,    │
│ Attio (deals)│  │ Workday (HR) │  │  templates)  │  │  cap table)  │
└───────┬──────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
        │  read           │  read          │  read+write    │  read+write
        └─────────────────┼────────────────┼────────────────┘
                          ▼                ▼
                  ┌───────────────────────────────┐
                  │   LIGHT DOCUMENTS             │
                  │   workflow + state machine    │
                  └───────┬───────────┬──────┬────┘
                          │           │      │
                          ▼           ▼      ▼
                    ┌─────────┐ ┌─────────┐ ┌────────┐
                    │  Slack  │ │DocuSign │ │ Email  │
                    │ DM +    │ │envelope │ │ magic  │
                    │ channel │ │ create  │ │ links  │
                    └─────────┘ └─────────┘ └────────┘
```

## State model

Every contract has a deterministic state machine with explicit valid transitions:

```
draft ─→ checks_running ─→ in_review        ─→ awaiting_approval ─→ ready_to_send ─→ sent ─→ signed ─→ filed
   ↓             ↓             ↓                    ↓
needs_info  ready_to_send    draft              ready_to_send
                                                in_review
```

Defined in `lib/contract-store.ts` as `VALID_TRANSITIONS: Record<Stage, Stage[]>`. Transitions throw on invalid moves and append to the audit log atomically. All updates are immutable: every command returns a new `Contract` object.

## Three logic engines

### 1. Clause checker (`lib/clause-checker.ts`)

Pure function over typed `ClauseRule[]` attached to each template. Each rule has:
- `predicate(fields) → boolean` (is this standard?)
- `observed(fields) → string` (what value is in the contract?)
- `expected` (display string for the master value)
- `severity` (info / warn / block)
- `reason` (why it matters)

Output: `ClauseCheckResult[]` with status standard or deviation per rule.

This is a stand-in for a real LLM clause comparator. The UI binds to `ClauseCheckResult[]`. Swapping the engine for a Claude API call is a one-file change.

### 2. Routing rules (`lib/routing-rules.ts`)

12 typed `RoutingRule` objects with:
- `appliesTo(template) → boolean` (which templates does this rule pertain to?)
- `trigger(fields, clauseResults) → boolean` (does this rule fire?)
- `approver` (which role is needed)
- `channel` (Slack DM, channel post, or email magic link)
- `autoApproveIfStandard` (auto-approve when no clause deviations)
- `reason` (attached to the approval for auditability)

`computeRouting(template, fields, clauseResults)` evaluates all rules, deduplicates by approver role (an approver only appears once even if multiple rules require them), concatenates reasons, and returns the required `Approval[]` chain.

Salary bands defined as data, editable by Head of People in production.

### 3. State machine (`lib/contract-store.ts`)

`VALID_TRANSITIONS` table plus journey commands:
- `createContract` (intake → draft)
- `runClauseChecks` (draft → checks_running → in_review or ready_to_send)
- `approve` (records approver decision, transitions to ready_to_send if all approved)
- `send` (ready_to_send → sent, generates DocuSign envelope ID)
- `simulateSigned` (sent → signed → filed, generates ledger impact)

Storage: single `localStorage` key `light-documents-state` holding `{version, contracts, seededAt}`. Atomic writes (single `setItem`).

## Data layer

### Templates (`lib/mock-data.ts`)

8 templates, each with:
- `clauseRules: ClauseRule[]` (drives the clause checker)
- `docusignFeatures: { qesRequired, smsVerification, witnessRequired, powerFormCapable, bulkSendCapable, expiryDays, reminderDays, signingOrder }` (per-template DocuSign config)
- `conditionalSections: ConditionalSection[]` (exhibits attached based on field values, e.g., commission plan exhibit for sales roles)
- `anchorTags: string[]` (anchor strings counsel places in the Word template for DocuSign to find and place fields at)
- `jurisdictions: string[]` (Denmark, UK, US, etc.)

### Source records

CRM-agnostic: a `SourceRecord` carries a `system` field. Mock data spans Salesforce, HubSpot, Attio, Personio, Ashby, and Manual entry. In production, pluggable adapters behind a common interface read from whichever source systems the customer connects.

### Seed contracts

14 pre-seeded contracts spanning all lifecycle stages. Pre-hydrated at module load: contracts past `draft` stage have their `clauseResults` and `approvals` pre-computed by running the actual engines, so the detail page renders meaningful data on first open.

## How Word documents connect

Master templates live as Word docs in Google Drive (or SharePoint), owned by Legal. Counsel types `{{counterparty.legal_name}}` and `\sig:counterparty\` directly into the document as text. On save, Drive webhooks our platform. We parse the docx (zip of XML), extract variables and anchor tags, version-pin at contract create time.

Per-contract substitution in production uses `docxtemplater` (Node) or `python-docx`. Output is still a valid docx that opens in Word. Anchor tags are formatted as white-on-white text so invisible to signers but findable by DocuSign API `searchString` tabs.

This means:
- Counsel never logs into our tool to author a contract.
- No vendor lock: templates are plain docx files in Drive. We just read them.
- Version-pinned at create time: counsel updates mid-flow do not disrupt in-flight contracts.

## How DocuSign integrates (production)

Auth: OAuth 2.0 with JWT grant (service account for backend operations).

Send: `POST /v2.1/accounts/{accountId}/envelopes` with the populated docx (base64), recipients with routing order, and tabs with `anchorString` set to each anchor tag.

Receive: Connect webhooks fire on every envelope state change. On `envelope-completed`, our backend fetches the signed PDF, stores it (S3 or Drive), and writes the structured data to the Light ledger.

Features used per template (defined in `docusignFeatures`):
- AutoPlace (anchor tags) for all templates
- Identify QES for Warrant and high-value MSAs
- SMS / phone identity verification for Employment offers
- Witness signer for Warrants in regulated jurisdictions
- PowerForms for NDAs at scale (recruitment funnel, conferences)
- Bulk Send for mass NDA updates

## Frontend architecture

Next.js 15 App Router with TypeScript strict mode and Tailwind 3.4.

- `app/layout.tsx` is a Server Component (the shell).
- All stateful components are explicitly marked `"use client"`.
- localStorage reads happen inside `useEffect` to avoid hydration mismatch.
- Navigation is real Next.js routing. Refresh on any page reconstitutes from localStorage.

## Production architecture (out of prototype scope)

For Light to actually ship this:

| Component | Choice | Why |
|---|---|---|
| Frontend | Next.js (same as prototype) | Same UI |
| Backend | Next.js API routes or separate Node service | Webhook receivers, business logic, integrations |
| Database | Postgres | Contracts, templates, approvals, audit log, users |
| File storage | S3 or Google Cloud Storage | Signed PDFs |
| Queue | Redis (BullMQ) | Background jobs (reminders, daily digest, retry failed webhooks) |
| Auth | Google Workspace SSO or Okta | RBAC, audit |
| DocuSign | eSignature REST API v2.1, Connect webhooks | Signing infrastructure |
| Salesforce / HubSpot / HRIS | OAuth + webhooks | Source data |
| Drive / SharePoint | API + watch endpoints | Template sync |
| Slack | Bot user + interactive messages | Approval surface |
| Hosting | Vercel or AWS | App + workers |

Realistic build team: 1 PM + 2 backend engineers + 1 frontend engineer + 0.5 designer + 0.25 legal counsel for template setup. MVP that replaces the manual workflow internally at Light: 6 to 10 weeks. Hardened, customer-facing module: another 8 to 12 weeks.

## Security considerations (production)

Documented for completeness, out of prototype scope:

- SSO + OAuth, never password-based auth.
- Tenant isolation in DB (row-level security).
- Secrets in env, never in client code. Vault or AWS Secrets Manager for rotation.
- Webhook signatures verified (HMAC) on every inbound DocuSign / Slack / Salesforce call.
- Audit log append-only at the DB layer.
- Anchor tags formatted as invisible text to prevent leak in printed PDF.
- PII redaction in application logs (signer names, contract values masked).
- Encryption at rest for the contract DB and S3 buckets.
- GDPR Article 30 records of processing activities for the EU customers.
