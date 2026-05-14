# Decisions

The key architectural and product decisions, with alternatives considered and what we explicitly did not build.

## 1. Wrap DocuSign, do not replace

**Decision:** Use DocuSign as the e-signature, identity, and audit trail infrastructure. Build the workflow layer around it.

**Alternatives considered:**

- **Option A:** Just use DocuSign templates / AutoPlace and call it done. **Rejected** because it only solves the last-mile field placement. Does not solve template version drift, variable correctness, approval routing, or post-signature data flow.
- **Option B:** Buy a full CLM (Ironclad, Juro, SpotDraft, LinkSquares, Contractbook). **Rejected** for now. Overkill at 50-100 / mo volume. Expensive. Implementation effort. Light's workflow would be forced into another vendor's structure. Revisit at 500+ / month or when post-signature obligation tracking becomes critical.
- **Option C:** Replace DocuSign with our own e-signature stack. **Strongly rejected.** Means inheriting eIDAS, ESIGN, UETA, and a decade of case-law compliance. Wrong battle for a Series A finance company.
- **Chosen:** Build the workflow layer around DocuSign.

**Why:**
1. DocuSign already solves the legally binding signature layer.
2. Light's pain is upstream and downstream of DocuSign, not in DocuSign itself.
3. Maximum leverage per engineering hour. We touch only the surface that needs touching.

## 2. Contracts are first-class structured data, written to the relevant system of record

**Decision:** Every signed contract emits structured data into the relevant system of record. The PDF is the audit artifact, not the product. Routing per document type:

- **MSAs and Order Forms** → revenue and billing (MRR, ARR, renewal date)
- **Employment contracts** → headcount and compensation
- **Warrant agreements** → cap table
- **Vendor agreements** → AP and obligation tracking
- **NDAs** → retention metadata only (no commercial impact; see ADR 14)

**Alternatives considered:**

- Store signed PDFs in Drive and let RevOps manually update each system (status quo). **Rejected.** This is the entire problem.
- Store contract metadata in a separate "contracts DB" disconnected from the systems of record. **Rejected.** Creates a second source of truth that has to reconcile.
- **Chosen:** Type-conditional writeback into the system of record that matters for that document type.

**Why:**
1. Matches Light's product thesis: Light is the ERP. Other CLMs ship integrations into N ERPs; Light is inside one.
2. Eliminates manual re-keying.
3. Closes the loop on obligations (renewal alerts, payment schedules, vesting tracking).
4. Sets up Light Documents to ship as a customer-facing module after internal use proves it.

## 3. Counsel never leaves Word

**Decision:** Master templates live as Word docs in Google Drive (or SharePoint), owned by Legal. Counsel uses `{{variables}}` and `\sig:tags\` typed directly into the document as text. Our platform reads the docx, never hosts the editing.

**Alternatives considered:**

- **In-app rich text editor for templates.** Rejected. Counsel will not adopt. Word is their environment.
- **Templates uploaded once and stored in our DB.** Rejected. Creates a separate source of truth from where counsel actually edits.
- **DocuSign Templates feature.** Rejected for primary template storage. Less flexible than anchor tags. Bound to specific docx layout.
- **Chosen:** Drive (or SharePoint) sync, parse docx with `docxtemplater` or `python-docx`, version-pin at contract create time.

**Why:**
1. Counsel keeps their preferred tooling.
2. Zero vendor lock: templates are plain docx files anyone can read.
3. Variables and anchor tags are just text counsel types. No special tool, no special syntax to learn.
4. Drive webhooks make sync automatic.

## 4. Anchor tags over absolute positioning for DocuSign fields

**Decision:** Counsel embeds anchor strings like `\sig:counterparty\` in templates as white-on-white text. DocuSign API places fields by finding the anchors via `searchString`. No (x, y) coordinates.

**Alternatives considered:**

- **Absolute (x, y) positioning** of fields per docx. Rejected. Breaks on any content reflow. Brittle.
- **DocuSign Templates feature** with pre-placed fields on stored documents. Rejected. Bound to specific docx layout. Breaks when counsel updates a clause.
- **Chosen:** Anchor strings.

**Why:**
1. Anchors move with text reflow, immune to layout changes.
2. Counsel sets up the anchors once when authoring the master template. Forever after, every contract gets fields placed automatically.
3. Documented DocuSign feature, used at enterprise scale.

## 5. CRM-agnostic source records

**Decision:** `SourceRecord` type carries a `system` field. Adapter pattern in production reads from whichever source systems the customer connects.

**Alternatives considered:**

- Hardcode Salesforce as the only supported CRM. Rejected. Light may not use Salesforce. Many EU SaaS companies use HubSpot, Attio, Pipedrive.
- Build N tightly coupled integrations. Rejected. Heavy maintenance.
- **Chosen:** Common interface, pluggable adapters.

**Why:**
1. Light may not use Salesforce. Many EU companies use HubSpot or Attio.
2. Same pattern applies to HRIS (Personio, Ashby, Workday all viable).
3. Manual entry as a fallback for stakeholders, vendors, ad-hoc records.
4. Demonstrates architectural maturity even if a specific customer uses just one system.

## 6. Three Light entities (assumed)

**Decision:** Assume three entities: Light ApS (Denmark, primary), Light Ltd (United Kingdom), Light Inc. (US Delaware). Would verify with Head of F&O in week one.

**Why this is the realistic shape:**
1. Standard Series A multi-jurisdiction setup for a Danish-headquartered SaaS company.
2. UK split is the post-Brexit norm when serving UK customers under GDPR.
3. US Delaware Inc. is the typical structure for US expansion (and Light has signalled US presence in Series A press).
4. The shape affects governing law defaults, jurisdiction clauses, and employment templates per entity, so the prototype models it end-to-end.

The numbers and named entities are inputs; if Light is on a different structure the same engines run unchanged.

## 7. Deterministic rules engine for clause check (in this prototype)

**Decision:** Use a typed rules engine with explicit `predicate(fields) → boolean` per clause. Pure function over `ClauseRule[]`.

**Alternatives considered:**

- Call Claude API directly from the prototype. Rejected. Requires API key, costs money per prototype run, slower demo. Production absolutely uses Claude.
- Hardcoded if-else logic. Rejected. Less maintainable, less auditable.
- **Chosen:** Typed rules engine, swappable with a Claude call in production.

**Why:**
1. Demo runs anywhere with no API keys.
2. Output is deterministic and explainable.
3. Same `ClauseCheckResult[]` shape the UI binds to whether the engine is rules or LLM.
4. Rules are auditable, owned by the team that defines them.

## 8. Approval rules engine over routing config

**Decision:** Typed `RoutingRule[]` with `appliesTo(template)`, `trigger(fields, results)`, `approver`, `channel`, `reason`. Centralized in one file.

**Why:**
1. Each rule's reason is attached, so the UI shows "CFO required because: ARR > €100k" not a vague "needs approval".
2. Head of Finance & Ops owns this file in production. Rules engine makes it owner-editable rather than developer-only.
3. Adding a rule is a one-line append.
4. Deduplication by approver role is centralized.

## 9. localStorage state in the prototype

**Decision:** Single localStorage key `light-documents-state` holding a JSON blob. Atomic writes. State machine enforced.

**Alternatives considered:**

- In-memory state only. Rejected. Refreshing the page would lose all demo state.
- Real backend with Postgres. Rejected for prototype. Overkill, slow to build.
- IndexedDB. Rejected. localStorage is simpler and fast enough for ~10 contracts.
- **Chosen:** localStorage.

**Why:**
1. Zero infra.
2. Survives page refresh.
3. Reset Demo button clears and re-seeds with one click.
4. State machine logic is identical to what would run on a real backend.

## 10. Group-based approver selection (added 2026-05-12)

**Decision:** Routing rules name a role (Legal, CFO). The role is resolved to an individual at routing time by `lib/approver-directory.ts`, which holds an `ApproverGroup` per role with 1..N members, specialty tags, and active PTO delegations.

**Why this exists:** the first prototype had role-to-person resolution hard-coded in three files (`components/ApprovalChain.tsx`, `app/contracts/[id]/page.tsx`, `components/DocuSignPreviewModal.tsx`), each mapping each role to exactly one person. A reviewer rightly asked "if Legal is a team, how is *Sara* picked over the others?". There was no engine, only a constant.

**How it works:**
- Each group declares a strategy: `specialty_match`, `named_default`, `all_required`, or `any_round_robin`.
- Specialty tags are typed (`type:MSA`, `jurisdiction:UK`, `entity:Light Ltd (United Kingdom)`, `value:>=100000`). The picker weights them so `type:` matches dominate `entity:` and `jurisdiction:` matches (a Warrant routes to outside counsel even when the in-house counsel happens to share jurisdiction).
- Active `Delegation` records (PTO with named backup) automatically reroute. The chain UI surfaces "Sara Friis (delegating for Anna Lind, PTO until 20 May 2026)" with the reason.

**Alternatives considered:**
- Round-robin only. Rejected. Loses the matching of specialty (UK Senior Counsel for UK MSAs) that a real Legal team relies on.
- Hard-coded 1:1 (status quo). Rejected. Cannot handle teams, can't model PTO, can't explain selection.
- Per-rule explicit `assignedUserId`. Rejected. Pushes routing decisions into the rules engine, doubling rule count whenever a person leaves.

**Settings UI shape (production):** `Settings → Approvers` lists members per role with specialty chips; `My delegates` lets users mark themselves out-of-office.

## 11. Light-side signer routing by entity + template (added 2026-05-12)

**Decision:** `lib/signer-routing.ts` is the single source of truth for who signs on the Light side of every envelope. It reads the Light entity (`Light ApS`, `Light Ltd`, `Light Inc.`) and template type, returns ordered `SignerDef[]` with rationale per signer.

**Why this exists:** the contract page UI claimed "MSA → CEO, Warrant → CFO + CEO + Board, Employment → CEO, Vendor → Head of F&O" but no code enforced it. Three components (DocuSign modal, contract page, contract-store's `simulateSigned`) had three separate ad-hoc resolutions, all hard-coded as "Jonathan Sanders (CEO)". A Light Ltd (UK) contract was therefore "signed by Light ApS CEO" in audit records, which would not pass UK Companies House scrutiny.

**How it works:**
- `ENTITY_SIGNERS` maps each jurisdiction to its statutory signer (entity-specific title: "Light Ltd" vs "Light ApS"), with optional local-director slot for UK + US.
- `LIGHT_SIGNER_POLICY` per `DocumentType` declares which roles must sign and in what order.
- `resolveSigners()` returns the ordered list including witness signer when the template requires one.
- `primaryLightSignerActor()` returns the entity-aware audit-trail string used by `simulateSigned`.

## 12. Policy data lives in one file (added 2026-05-12)

**Decision:** `lib/policy-config.ts` holds the governing-law allow-list, salary bands, and entity-to-jurisdiction map. Everything else imports from here.

**Why this exists:** the accepted-governing-law list was inline in 3 places (`routing-rules.ts`, `IntakeForm.tsx` × 2, `mock-data.ts`). The MSA intake form had a stricter regex than the actual rule (missed UK), so the form was warning Sales about "non-EU governing law" for perfectly fine UK contracts. Salary bands were also a single Record without jurisdiction dimension, so UK hires were being checked against Danish bands.

## 13. Template version pinning + channel collision (added 2026-05-12)

**Decision:** `Contract.templateVersion` is set at create time. When the live master template version differs from the pinned one, the detail page surfaces a banner ("Master template updated since this contract was drafted. Restart with new version?"). The clause checks continue to run against the live rules; the banner lets the owner consciously choose to restart.

**Channel collision:** when two rules for the same role declare different notification channels, the most-restrictive one wins (`Email magic link` > `Slack DM` > `Slack channel` > `In-app only`). The merged Approval surfaces the collision in its reason text so the rules-engine owner can see when their rule set is over-prescribing channels.

## 14. NDAs do not write to the ledger (added 2026-05-14)

**Decision:** NDAs are filed for retention only. They do not produce a Light ledger entry. The audit trail is the system of record (who signed, when, on which template version). The signed-record page surfaces this explicitly: "NDAs do not write to the ledger by design. There is no MRR, headcount, or equity to record."

**Why this exists:** ADR 2 says contracts emit structured data into a system of record. The implicit assumption (that every contract type maps to the *ledger*) is wrong for NDAs. An NDA has no commercial value, no headcount, no cap-table impact, and no obligation worth posting to the GL. Forcing one in would create a phantom record that downstream consumers (renewal alerts, MRR rollups, board reporting) would have to filter out anyway. The system of record for an NDA is the retention metadata + audit trail; that is intentional, not an omission.

**Where it lives in code:** `buildLedgerImpact()` in `lib/contract-store.ts` short-circuits with `null` for `type === "NDA"`. `simulateSigned()` only attaches `contract.ledger` when the result is non-null, and the audit event reads "Filed to Drive (retention only, no ledger writeback)" instead of the standard "Filed to Drive, ledger updated".

**General rule this implies:** when a strategic claim is type-conditional ("contracts are structured data"), the catch-all path in code must distinguish "real exception" from "type we forgot to handle". Generic fallthroughs in dispatch logic are a smell: they tend to absorb cases that should have been explicit exceptions, producing copy that contradicts the narrative elsewhere in the product.

## 15. What we deliberately did NOT build

Each cut listed below was deliberate, to keep the case study right-sized.

- **Real DocuSign API integration.** Simulated send with realistic UX. Real integration is Phase 2, well-documented API.
- **Real LLM clause check.** Deterministic rules engine produces the same shape of output.
- **Real Slack notifications.** Audit trail shows "Slack DM sent" events. Real product fires the DMs.
- **OAuth integrations for source systems.** Mock data prefills source records.
- **Authentication.** Single-user demo. Real product has SSO + RBAC.
- **Counterparty redline portal.** Phase 3.
- **Renewal and obligation tracking with calendar alerts.** Phase 3, very high value.
- **Inbound vendor contracts.** Phase 3.
- **Bulk Send / PowerForm flows.** Phase 2 as DocuSign capability is integrated.
- **Daily digest emails.** Phase 2.
- **Watchers panel.** Cut as UX bloat for the case.
- **i18n.** English only.

Every cut is honest. Every stubbed piece is labeled in the UI.
