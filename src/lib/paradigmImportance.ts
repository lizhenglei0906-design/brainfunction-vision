import type {
  CognitiveParadigm,
  FunctionParadigmImportanceRegistry,
  ParadigmImportanceTier,
} from "../types/paradigmLibrary";

const TIER_WEIGHT: Record<ParadigmImportanceTier, number> = {
  core: 0,
  supporting: 1,
  related: 2,
  context: 3,
};

export function getParadigmImportance(
  registry: FunctionParadigmImportanceRegistry,
  functionId: string,
  paradigmId: string,
) {
  return registry.functions
    .find((entry) => entry.functionId === functionId)
    ?.paradigms.find((entry) => entry.paradigmId === paradigmId);
}

export function sortParadigmsByImportance(
  paradigms: CognitiveParadigm[],
  registry: FunctionParadigmImportanceRegistry,
  functionId: string,
) {
  return [...paradigms].sort((first, second) => {
    const firstImportance = getParadigmImportance(registry, functionId, first.id);
    const secondImportance = getParadigmImportance(registry, functionId, second.id);
    const firstRank = firstImportance?.rank ?? 999;
    const secondRank = secondImportance?.rank ?? 999;
    const firstTier = firstImportance ? TIER_WEIGHT[firstImportance.tier] : 9;
    const secondTier = secondImportance ? TIER_WEIGHT[secondImportance.tier] : 9;

    return firstRank - secondRank || firstTier - secondTier || first.label.localeCompare(second.label, "zh-Hans-CN");
  });
}
