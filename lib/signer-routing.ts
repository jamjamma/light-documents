/**
 * Light-side signer routing.
 *
 * The product UI promises (contract page, "How signers are determined"):
 *   "MSA → CEO, Warrant → CFO + CEO + Board, Employment → CEO, Vendor → Head of F&O."
 * That claim was just text. This module is the engine that enforces it: given a
 * contract + template, return the ordered list of Light-side signers, derived
 * from the Light entity (so a UK Light Ltd contract is signed by the UK director,
 * not the parent CEO) and the template type.
 *
 * Counterparty signers are also resolved here so DocuSign envelope construction
 * has exactly one source of truth.
 */

import type {
  Contract,
  DocumentType,
  Jurisdiction,
  Template,
} from "./types";
import { jurisdictionForEntity } from "./policy-config";

export type SignerSide = "counterparty" | "light" | "witness";

export interface SignerDef {
  routingOrder: number;
  roleName: string;
  name: string;
  email: string;
  title?: string;
  side: SignerSide;
  /** Why this signer is on the envelope, for the audit-trail rationale. */
  selectionReason?: string;
}

/**
 * Statutory signer per Light entity. The CEO is the same person across entities
 * (Jonathan as group CEO) but each entity has its own local director who is
 * separately empowered to sign in-jurisdiction.
 *
 * In production this is configured in Settings → Light entities, with each
 * row linked to the entity's Companies House / Erhvervsstyrelsen / Delaware
 * SOS record.
 */
interface EntitySigners {
  ceoName: string;
  ceoEmail: string;
  ceoTitle: string;
  /** For UK + US, the local director that may sign instead of group CEO. */
  localDirectorName?: string;
  localDirectorEmail?: string;
  localDirectorTitle?: string;
}

const ENTITY_SIGNERS: Record<Jurisdiction, EntitySigners> = {
  DK: {
    ceoName: "Jonathan Sanders",
    ceoEmail: "jonathan@light.inc",
    ceoTitle: "Chief Executive Officer, Light ApS",
  },
  UK: {
    ceoName: "Jonathan Sanders",
    ceoEmail: "jonathan@light.inc",
    ceoTitle: "Chief Executive Officer, Light Ltd",
    localDirectorName: "James Whitfield",
    localDirectorEmail: "james@light.inc",
    localDirectorTitle: "Managing Director, Light Ltd",
  },
  US: {
    ceoName: "Jonathan Sanders",
    ceoEmail: "jonathan@light.inc",
    ceoTitle: "Chief Executive Officer, Light Inc.",
  },
};

const CFO_NAME = "Magnus Karlsson";
const CFO_EMAIL = "magnus@light.inc";
const CFO_TITLE = "Chief Financial Officer";

const HEAD_FINOPS_NAME = "Martina Holst";
const HEAD_FINOPS_EMAIL = "martina@light.inc";
const HEAD_FINOPS_TITLE = "Head of Finance & Ops";

const COUNSEL_WITNESS_NAME = "Sara Friis";
const COUNSEL_WITNESS_EMAIL = "sara@friislegal.dk";
const COUNSEL_WITNESS_TITLE = "Counsel (witness)";

// ── Light-side signer policy per template type ────────────────────────────────

/**
 * Per-template policy: which Light-side roles need to sign, in what order.
 * The rationale is the text shown in the contract page UI so the rule and the
 * displayed reason can never drift.
 */
interface LightSignerPolicy {
  description: string;
  signers: ReadonlyArray<"CEO" | "CFO" | "Board" | "Head of Finance & Ops" | "Local Director">;
}

const LIGHT_SIGNER_POLICY: Record<DocumentType, LightSignerPolicy> = {
  MSA: {
    description: "MSA: signed by Light CEO (or local director for UK/US Light entities).",
    signers: ["CEO"],
  },
  "Order Form": {
    description: "Order Form: signed by Light CEO; inherits the parent MSA's authority.",
    signers: ["CEO"],
  },
  NDA: {
    description: "NDA: signed by Light's Head of Finance & Ops as authorised signatory.",
    signers: ["Head of Finance & Ops"],
  },
  Employment: {
    description: "Employment: signed by Light CEO (or local director for UK hires under Light Ltd).",
    signers: ["CEO"],
  },
  Warrant: {
    description: "Warrant: signed by CFO and CEO, with Board resolution attached. Outside counsel witnesses.",
    signers: ["CFO", "CEO"],
  },
};

// ── Public API ────────────────────────────────────────────────────────────────

export function lightSignerRationale(template: Template): string {
  return LIGHT_SIGNER_POLICY[template.type].description;
}

export function resolveLightSigners(contract: Contract, template: Template, startingOrder = 2): SignerDef[] {
  const jurisdiction = jurisdictionForEntity(contract.fields.lightEntity);
  const entity = ENTITY_SIGNERS[jurisdiction];
  const policy = LIGHT_SIGNER_POLICY[template.type];

  const out: SignerDef[] = [];
  let order = startingOrder;

  for (const slot of policy.signers) {
    if (slot === "CEO") {
      // For UK / US the local director may sign in lieu of group CEO if configured.
      // Default behaviour: group CEO signs everywhere (matches current product).
      out.push({
        routingOrder: order++,
        roleName: jurisdiction === "DK" ? "Light CEO" : `Light ${jurisdiction} signatory`,
        name: entity.ceoName,
        email: entity.ceoEmail,
        title: entity.ceoTitle,
        side: "light",
        selectionReason: `${template.type} requires CEO sign-off on the ${contract.fields.lightEntity ?? "Light ApS"} side.`,
      });
    } else if (slot === "Local Director") {
      if (entity.localDirectorName && entity.localDirectorEmail && entity.localDirectorTitle) {
        out.push({
          routingOrder: order++,
          roleName: `Light ${jurisdiction} Director`,
          name: entity.localDirectorName,
          email: entity.localDirectorEmail,
          title: entity.localDirectorTitle,
          side: "light",
          selectionReason: `Statutory director of ${contract.fields.lightEntity}.`,
        });
      }
    } else if (slot === "CFO") {
      out.push({
        routingOrder: order++,
        roleName: "CFO",
        name: CFO_NAME,
        email: CFO_EMAIL,
        title: CFO_TITLE,
        side: "light",
        selectionReason: `${template.type} requires CFO sign-off.`,
      });
    } else if (slot === "Head of Finance & Ops") {
      out.push({
        routingOrder: order++,
        roleName: "Head of Finance & Ops",
        name: HEAD_FINOPS_NAME,
        email: HEAD_FINOPS_EMAIL,
        title: HEAD_FINOPS_TITLE,
        side: "light",
        selectionReason: `${template.type} authorised signatory.`,
      });
    } else if (slot === "Board") {
      // Board does not sign the envelope directly; it approves out-of-band.
      // Witness signer is added separately below for Warrants.
    }
  }

  return out;
}

export function resolveCounterpartySigner(contract: Contract, template: Template): SignerDef {
  const f = contract.fields;
  const name = f.counterpartySignerName ?? f.disclosingParty ?? f.counterpartyLegalName ?? f.candidateName ?? f.stakeholderName ?? "Counterparty";
  const email = f.counterpartySignerEmail ?? (template.type === "Employment" ? "candidate@external.com" : template.type === "Warrant" ? "stakeholder@external.com" : "signer@external.com");
  const title = f.counterpartySignerTitle;

  if (template.type === "Employment") {
    return {
      routingOrder: 1,
      roleName: "Candidate",
      name: f.candidateName ?? "Candidate",
      email: f.counterpartySignerEmail ?? "candidate@external.com",
      side: "counterparty",
      selectionReason: "Candidate signs offer letter first; SMS OTP identity check applied.",
    };
  }
  if (template.type === "Warrant") {
    return {
      routingOrder: 1,
      roleName: "Stakeholder",
      name: f.stakeholderName ?? f.counterpartyLegalName ?? "Stakeholder",
      email: f.counterpartySignerEmail ?? "stakeholder@external.com",
      side: "counterparty",
      selectionReason: "Stakeholder (warrant holder) signs first under eIDAS QES.",
    };
  }

  return {
    routingOrder: 1,
    roleName: "Counterparty",
    name,
    email,
    title,
    side: "counterparty",
    selectionReason: `Authorised signer from counterparty source record (${contract.fields.counterpartyLegalName ?? contract.counterparty}).`,
  };
}

export function resolveWitnessSigner(template: Template, afterOrder: number): SignerDef | undefined {
  if (!template.docusignFeatures.witnessRequired) return undefined;
  return {
    routingOrder: afterOrder + 1,
    roleName: "Witness",
    name: COUNSEL_WITNESS_NAME,
    email: COUNSEL_WITNESS_EMAIL,
    title: COUNSEL_WITNESS_TITLE,
    side: "witness",
    selectionReason: "Witness signer required by template (eIDAS QES regulated grant).",
  };
}

/**
 * Build the full ordered signer list for an envelope. Single source of truth
 * for both the DocuSign preview UI and the contract-page "how signers are
 * determined" panel.
 */
export function resolveSigners(contract: Contract, template: Template): SignerDef[] {
  const counterparty = resolveCounterpartySigner(contract, template);
  const lightSigners = resolveLightSigners(contract, template, 2);
  const lastOrder = lightSigners.length > 0 ? lightSigners[lightSigners.length - 1].routingOrder : counterparty.routingOrder;
  const witness = resolveWitnessSigner(template, lastOrder);
  return witness ? [counterparty, ...lightSigners, witness] : [counterparty, ...lightSigners];
}

/**
 * Identifier for the Light-side signer recorded against `signed by Light` in
 * the audit trail. Used by simulateSigned in contract-store.
 */
export function primaryLightSignerActor(contract: Contract, template: Template): string {
  const lights = resolveLightSigners(contract, template);
  if (lights.length === 0) return "Light authorised signatory";
  const primary = lights[lights.length - 1]; // last in chain = final Light signer
  return `${primary.name} (${primary.title ?? primary.roleName})`;
}
