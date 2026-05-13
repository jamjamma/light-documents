import type { Template } from "./types";
import { ShieldCheck, Mail, Eye } from "lucide-react";
import type { ReactNode } from "react";

export interface TemplateBullet {
  text: string;
  icon?: ReactNode;
}

/**
 * Returns 3-5 scannable bullets summarising a template for cards and pickers.
 * First bullet is short (under 6 words) for fast scanning.
 * Used by both TemplateCard (Templates page) and TemplatePicker (New Contract intake).
 */
export function bulletsForTemplate(t: Template): TemplateBullet[] {
  const used = useCaseFor(t);
  const owner = `Owned by ${t.ownerTeam}`;
  const jurisdictions =
    t.jurisdictions.length === 1 ? `${t.jurisdictions[0]} only` : `${t.jurisdictions.length} jurisdictions`;
  const dsFeatures: TemplateBullet[] = [];
  if (t.docusignFeatures.qesRequired) dsFeatures.push({ text: "eIDAS QES required", icon: <ShieldCheck className="h-3 w-3" /> });
  if (t.docusignFeatures.smsVerification) dsFeatures.push({ text: "SMS identity check", icon: <Mail className="h-3 w-3" /> });
  if (t.docusignFeatures.witnessRequired) dsFeatures.push({ text: "Witness signer", icon: <Eye className="h-3 w-3" /> });
  return [{ text: used }, { text: owner }, { text: jurisdictions }, ...dsFeatures];
}

function useCaseFor(t: Template): string {
  switch (t.id) {
    case "nda_v3_1":
      return "Early sales + candidate intros";
    case "msa_v4_2":
      return "Standard commercial customer deals";
    case "msa_pilot_v1_0":
      return "Short 3-month POC trials";
    case "order_form_v2_0":
      return "Pricing companion to MSA";
    case "employment_dk_v2_0":
      return "Denmark full-time hires";
    case "employment_uk_v1_0":
      return "United Kingdom full-time hires";
    case "warrant_v1_5":
      return "Board-level + senior advisor grants";
    case "warrant_advisor_v1_0":
      return "Individual advisor grants ≤ 0.5%";
    default:
      return "Master template";
  }
}
