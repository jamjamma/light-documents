# Demo script (Loom)

Target: 4 to 5 minutes. Narrate the click path, lead with the reframe, end on the ledger writeback. Do not over-explain the build.

## 0:00 to 0:30: The reframe

> "The stated problem is manual Word edits and hand-placed DocuSign fields. The workflow you're about to see eliminates both. While we're in there, the strategic opening for Light: commercial contracts carry structured data that belongs in the systems of record. MSAs and Order Forms map to revenue, Employment to headcount, Warrants to the cap table. NDAs are the exception, retention only. So my answer is: wrap DocuSign as infrastructure, keep Word for authoring, build the workflow layer in between, and emit the structured payload into Light's receivers."

Open `http://localhost:3000`. Point at the AboutWidget on the Dashboard. Read the one sentence.

## 0:30 to 1:30: Dashboard + the high-risk path (Bolt MSA)

> "Dashboard is built for an operator. The top KPIs are 'Awaiting me', 'Blocked over 3 days', and 'In review'. What Martina has to act on, not vanity counts. Cycle health is demoted below. There's a 'Try the MSA flow' callout for first-time reviewers. Let me click into the high-risk one."

Click Bolt MSA.

> "Bolt is a €180k UK deal. The clause checker found three deviations from the master template: Net 60 instead of Net 30, unlimited liability instead of €500k cap, customer-only indemnity instead of mutual. Each deviation has a severity and a reason attached."

Scroll to Routing.

> "The routing rules engine fires three approvers: Counsel because of clause deviations, Head of Finance because ARR is over €50k, CFO because ARR is over €100k. Each approval has its 'why' attached so the audit is clean."

Scroll to Approval chain.

> "Approvers are notified via Slack DM. Demo affordance: let me simulate Counsel approving. Note my own row says 'Approve' instead of 'Simulate', because I'm signed in as Martina. The product is honest about who's actually clicking what."

Click "Simulate Sara approves" (Counsel). Chip flips green.

## 1:30 to 2:30: The DocuSign envelope (the field placement answer)

Click "Preview envelope".

> "This is the populated MSA. Variables substituted from the intake form, highlighted in amber so you can see them. Note the signature blocks at the bottom: those are placed automatically by DocuSign using anchor tags counsel typed into the Word template once, as white-on-white text. No one drags a field by hand. Ever."

Point at the right panel.

> "DocuSign features per template: this MSA uses sequential signing, 30-day expiry, day-3-7-14 reminders, eIDAS QES because it's an EU contract over €100k. Conditional sections attached automatically: Service Level Exhibit always, DPA because the customer needs it, QES because of the value + jurisdiction trigger."

## 2:30 to 3:30: Run the happy path (Acme MSA, end-to-end)

Close modal. Go back to Dashboard. Click Acme MSA.

> "Acme is the happy path. €60k Salesforce deal, all clauses standard. Routing auto-approves Head of Finance by standing rule. Send is enabled."

Click Send via DocuSign. Wait for the simulated 1.5 seconds.

> "Signed and filed."

## 3:30 to 4:00: The structured writeback

Point at the LedgerImpactPanel on the Signed Record page.

> "This is the part that makes the answer Light-specific. The signed contract emits a structured payload in this shape. The prototype renders it. Production lands it wherever Light exposes a receiver: ledger, billing, or CRM. The PDF stays as the audit artifact, the data is the product. NDAs file for retention only."

Point at the Audit Trail.

> "Every step is captured: created, auto-approved, sent, viewed, signed by counterparty, signed by Light, filed. Each event has actor, timestamp, and channel."

## 4:00 to 4:30: The workflow exits an operator actually needs

Go back to a contract in flight and click an approval. Then click **Undo my approval** on that row.

> "Real product point: I'm Martina, Head of Finance and Ops. I approve. I change my mind. I can withdraw before the envelope is sent. The chain walks back, the audit trail records the withdrawal. Once DocuSign has the envelope, undo is refused. That's the line."

Click into Templates, expand "Rogue templates detected in Drive".

> "Daily scan finds Word docs outside the master folder that look like master templates. Four flagged here. I can Archive one with one click. Or Notify owner."

Click **Notify owner** on a row where lastUsedBy is still at the company.

> "Inline Slack DM preview. Real recipient routing: still-employed last user gets a DM by name. Someone who left the company falls through to the team channel. No last user goes to a triage channel. The exact message body is shown. Send writes a record locally. In production, this fires `chat.postMessage` with interactive Approve / Reroute / Snooze buttons that thread back into the audit log."

## 4:30 to 5:00: The other doc types + close

Click Templates in sidebar.

> "Eight templates supported: NDA, MSA, MSA Pilot, Order Form, Employment DK, Employment UK, Warrant, Advisor Warrant. Each has its own clause rules, DocuSign feature config, and conditional sections. Warrants require eIDAS QES and a witness signer. Employment offers use SMS identity verification. NDAs deliberately don't write to the ledger; they file for retention only. The pattern is consistent: counsel keeps Word, we read it, DocuSign signs it, the ledger absorbs what belongs there."

Resize the browser to mobile width briefly.

> "Same product on mobile. Sticky top bar with the nav drawer. KPIs stack. Clause review collapses to cards instead of squeezing a four-column table. Every action bar wraps without horizontal scroll. The case study is responsive on the surfaces an operator actually uses on the go."

Click About in sidebar (briefly), then close.

> "That is the full submission. Repo is on the screen, README walks through it, six docs in /docs/ for deeper architectural detail. Thanks for watching."

## What to NOT do in the recording

- Do not narrate the engineering ("we built this in Next.js with TypeScript..."). They do not care.
- Do not list the file tree. Show the product.
- Do not apologise for stubs. Acknowledge them honestly when relevant ("simulated send for demo speed") but move on.
- Do not exceed 5 minutes. Cut ruthlessly.
- Do not use jargon ("CLM", "AOV", "ICP") without context.

## Backup talk track if asked questions in the interview

- **"Why not just use DocuSign templates?"** → Anchor tags survive content reflow. DocuSign templates are bound to a specific layout. Anchor tags scale across template versions.
- **"Why not buy Ironclad?"** → Too heavy at 50-100/mo volume. Revisit at 500+/mo. Light Documents is the right size for now and uniquely positioned because of the ledger integration.
- **"How long to build the real version?"** → 6-10 weeks for an internal-replace MVP with 1 PM + 2 backend + 1 frontend + 0.5 designer.
- **"What if Light does not use Salesforce?"** → Pluggable adapters. Demo shows Salesforce, HubSpot, Attio, Personio, Ashby, Manual entry all working through the same interface.
- **"Why white-on-white anchor tags?"** → Invisible to signer in printed PDF, findable by DocuSign API `searchString` tabs. Standard DocuSign practice at scale.
- **"What is the AI for?"** → Phase 2: Claude API for natural-language clause comparison against the master template. Production swap is a one-file change because the UI binds to `ClauseCheckResult[]`.
- **"Did you talk to anyone at Light?"** → No, I worked from the brief and publicly available info. Assumptions stated in README.
