export type EvidenceUpgradePriority = "p0" | "p1" | "p2";

export type EvidenceUpgradeStage =
  | "seeded"
  | "source_candidates"
  | "ready_for_review"
  | "reviewed_network"
  | "reviewed_parcel";

export type EvidenceUpgradeClaimTarget =
  | "network_level"
  | "task_family"
  | "parcel_candidate"
  | "specialized_atlas_needed";

export type EvidenceSourceCandidateStatus = "verified_metadata" | "candidate_unverified";

export type EvidenceSourceKind =
  | "review"
  | "meta_analysis"
  | "task_study"
  | "behavioral_paradigm"
  | "atlas_note";

export interface EvidenceSourceCandidate {
  id: string;
  title: string;
  citation: string;
  year: number;
  doi?: string;
  url?: string;
  kind: EvidenceSourceKind;
  status: EvidenceSourceCandidateStatus;
  useFor: string;
}

export interface ParadigmEvidenceUpgradeItem {
  paradigmId: string;
  priority: EvidenceUpgradePriority;
  stage: EvidenceUpgradeStage;
  claimTarget: EvidenceUpgradeClaimTarget;
  upgradeQuestion: string;
  nextAction: string;
  riskNote: string;
  sourceCandidateIds: string[];
}

export interface ParadigmEvidenceUpgradePlan {
  id: string;
  version: string;
  status: "draft";
  sourceNote: string;
  sources: EvidenceSourceCandidate[];
  items: ParadigmEvidenceUpgradeItem[];
}
