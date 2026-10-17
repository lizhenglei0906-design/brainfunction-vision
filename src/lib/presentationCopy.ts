export function publicPresentationText(text: string | undefined) {
  if (!text) {
    return "";
  }

  return text
    .replace(/候选骨架/g, "参考骨架")
    .replace(/候选关系/g, "参考关系")
    .replace(/候选网络/g, "相关网络")
    .replace(/候选文献/g, "待核文献")
    .replace(/候选证据/g, "参考证据")
    .replace(/候选来源/g, "待核来源")
    .replace(/候选点位/g, "待核点位")
    .replace(/候选代理/g, "点位代理")
    .replace(/候选机制/g, "参考机制")
    .replace(/候选支架/g, "参考支架")
    .replace(/候选伙伴/g, "参考伙伴")
    .replace(/候选图/g, "参考图")
    .replace(/候选区/g, "参考区")
    .replace(/候选/g, "参考");
}
