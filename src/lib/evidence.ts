import type { BrainParcel, Yeo7Network } from "../types/brainAtlas";
import type {
  EvidenceDomain,
  ParcelDomainMatch,
  ResearchEvidenceIndex,
} from "../types/researchEvidence";

export function getParcelDomainMatches(
  parcel: BrainParcel,
  evidenceIndex: ResearchEvidenceIndex,
): ParcelDomainMatch[] {
  const networkIds = parcel.networkMemberships.map((membership) => membership.network);
  return evidenceIndex.domains
    .filter((domain) =>
      domain.relatedNetworks.some((networkId) => networkIds.includes(networkId)),
    )
    .map((domain) => ({
      domain,
      matchType:
        domain.primaryNetwork && networkIds.includes(domain.primaryNetwork)
          ? "primary_network"
          : "related_network",
    }));
}

export function getNetworkDomains(
  networkId: Yeo7Network,
  evidenceIndex: ResearchEvidenceIndex,
): EvidenceDomain[] {
  return evidenceIndex.domains.filter((domain) => domain.relatedNetworks.includes(networkId));
}

export function countDomainsByNetwork(evidenceIndex: ResearchEvidenceIndex) {
  return evidenceIndex.domains.reduce<Record<Yeo7Network, number>>(
    (counts, domain) => {
      domain.relatedNetworks.forEach((networkId) => {
        counts[networkId] += 1;
      });
      return counts;
    },
    {
      visual: 0,
      somatomotor: 0,
      dorsal_attention: 0,
      ventral_attention: 0,
      limbic: 0,
      frontoparietal: 0,
      default_mode: 0,
    },
  );
}
