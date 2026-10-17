export type EvidenceReviewScope =
  | "seed_only"
  | "candidate_task_family"
  | "candidate_network"
  | "reviewed_network"
  | "specialized_atlas_needed";

export type EvidenceReviewStatus = "seed_only" | "candidate" | "reviewed";

export interface EvidenceSourceReview {
  sourceId: string;
  supportScope: EvidenceReviewScope;
  supports: string;
  safeUse: string;
  boundary: string;
}

export interface ParadigmReviewContract {
  paradigmId: string;
  reviewStatus: EvidenceReviewStatus;
  supportScope: EvidenceReviewScope;
  supportedTask: string;
  safeClaim: string;
  avoidClaim: string;
  mappingSummary: string;
}

export interface ParadigmEvidenceReviewContracts {
  id: string;
  version: string;
  status: "draft";
  sourceNote: string;
  sourceReviews: EvidenceSourceReview[];
  paradigmReviews: ParadigmReviewContract[];
}
