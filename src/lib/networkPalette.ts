import type { BrainNetworkDefinition, Yeo7Network } from "../types/brainAtlas";

export const NETWORK_PALETTE: Record<Yeo7Network, string> = {
  visual: "#6d6096",
  somatomotor: "#4d7893",
  dorsal_attention: "#4f8978",
  ventral_attention: "#b98b3b",
  limbic: "#8f7661",
  frontoparietal: "#bd6258",
  default_mode: "#a76382",
};

export function getNetworkColor(networkId: Yeo7Network | string | undefined) {
  return networkId && networkId in NETWORK_PALETTE
    ? NETWORK_PALETTE[networkId as Yeo7Network]
    : "#61717d";
}

export function withNetworkPalette(network: BrainNetworkDefinition): BrainNetworkDefinition {
  return {
    ...network,
    color: getNetworkColor(network.id),
  };
}
