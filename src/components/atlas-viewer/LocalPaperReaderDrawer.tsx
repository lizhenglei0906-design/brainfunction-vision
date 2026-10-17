import { siteUrl } from "../../lib/siteUrl";
import { publicPaperTargets, isPublicPaperHtmlResponse } from "../../lib/publicPaperReading";
import { useEffect, useMemo, useState } from "react";

export interface LocalPaperReaderTarget {
  path?: string;
  href: string;
  fileName?: string;
  kind?: string;
  role?: string;
}

export interface LocalPaperReaderFallback {
  href: string;
  label?: string;
  kind?: string;
}

export interface LocalPaperReviewDoc {
  path?: string;
  href?: string;
  label?: string;
  kind?: string;
}

export interface LocalPaperReaderSource {
  sourceId: string;
  title: string;
  citation?: string;
  year?: number;
  sourceType?: string;
  supportScope?: string;
  supports?: string;
  safeUse?: string;
  boundary?: string;
  materialState?: string;
  localTargets: LocalPaperReaderTarget[];
  externalFallbacks: LocalPaperReaderFallback[];
  localReviewDocs: LocalPaperReviewDoc[];
}

export interface LocalPaperReaderSelection {
  source: LocalPaperReaderSource;
  target: LocalPaperReaderTarget;
}

interface LocalPaperReaderDrawerProps {
  selection: LocalPaperReaderSelection;
  supportLabel?: string;
  onClose: () => void;
  onSelectTarget: (target: LocalPaperReaderTarget) => void;
}

interface LocalPaperReaderContentProps {
  className?: string;
  headingLabel?: string;
  selection: LocalPaperReaderSelection;
  supportLabel?: string;
  onClose?: () => void;
  onSelectTarget: (target: LocalPaperReaderTarget) => void;
}

function targetLabel(target: LocalPaperReaderTarget) {
  const kind = target.kind?.toUpperCase() ?? "LOCAL";
  return [kind, target.role, target.fileName].filter(Boolean).join(" · ");
}

interface ReaderParagraph {
  id: string;
  text: string;
}

function paragraphSourceLabel(target?: LocalPaperReaderTarget | null) {
  if (!target) {
    return "暂无可选段落文本";
  }
  if (target.kind === "text") {
    return "已载入 TXT 段落";
  }
  if (target.kind === "html") {
    return "已从 HTML 提取段落";
  }
  return "全文预览";
}

function cleanParagraphText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function paragraphsFromHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const nodes = Array.from(doc.querySelectorAll("h1, h2, h3, p, li, blockquote"));
  const paragraphs = nodes
    .map((node) => cleanParagraphText(node.textContent ?? ""))
    .filter((paragraph) => paragraph.length > 80)
    .filter((paragraph, index, all) => all.indexOf(paragraph) === index)
    .slice(0, 60);

  return paragraphs.map((paragraph, index) => ({
    id: `p-${index + 1}`,
    text: paragraph,
  }));
}

export function LocalPaperReaderContent({
  className,
  headingLabel = "本地全文阅读窗口",
  selection,
  supportLabel,
  onClose,
  onSelectTarget,
}: LocalPaperReaderContentProps) {
  const { source, target } = selection;
  const readableTargets = useMemo(() => publicPaperTargets(source.sourceId), [source.sourceId]);
  const paragraphTarget = useMemo(() => readableTargets.find((item) => item.href === target.href) ?? readableTargets[0] ?? null, [readableTargets, target.href]);
  const [validatedHtml, setValidatedHtml] = useState<string | null>(null);
  const [paragraphs, setParagraphs] = useState<ReaderParagraph[]>([]);
  const [paragraphStatus, setParagraphStatus] = useState("正在载入可选择段落...");
  const [selectedParagraphIds, setSelectedParagraphIds] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [preparedPrompt, setPreparedPrompt] = useState("");
  const selectedParagraphs = paragraphs.filter((paragraph) => selectedParagraphIds.includes(paragraph.id));

  useEffect(() => {
    let cancelled = false;
    setSelectedParagraphIds([]);
    setPreparedPrompt("");
    setValidatedHtml(null);
    setParagraphs([]);

    if (!paragraphTarget || !["text", "html"].includes(paragraphTarget.kind ?? "")) {
      setParagraphs([]);
      setParagraphStatus("这篇本地文件当前只有原文预览，没有可直接选择的段落文本。");
      return () => {
        cancelled = true;
      };
    }

    setParagraphStatus("正在载入可选择段落...");

    fetch(siteUrl(paragraphTarget.href))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.text().then((content) => {
          if (!isPublicPaperHtmlResponse(response.headers.get("content-type") ?? "", content, paragraphTarget.href)) {
            throw new Error("Response is not a bundled article reading edition");
          }
          return content;
        });
      })
      .then((content) => {
        if (cancelled) {
          return;
        }
        setValidatedHtml(content);
        const nextParagraphs =
          paragraphsFromHtml(content);
        setParagraphs(nextParagraphs);
        setParagraphStatus(
          nextParagraphs.length > 0
            ? `已整理 ${nextParagraphs.length} 段，可先选段落再提问。`
            : "已打开全文预览，但这份文件没有抽出适合直接选择的段落。",
        );
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setParagraphs([]);
        setValidatedHtml(null);
        setParagraphStatus("未能载入随附全文，请使用上方原始来源入口。");
      });

    return () => {
      cancelled = true;
    };
  }, [paragraphTarget]);

  function toggleParagraph(paragraphId: string) {
    setPreparedPrompt("");
    setSelectedParagraphIds((current) =>
      current.includes(paragraphId)
        ? current.filter((id) => id !== paragraphId)
        : [...current, paragraphId],
    );
  }

  function prepareQuestion() {
    const trimmedQuestion = question.trim();
    const paragraphSummary = selectedParagraphs
      .map((paragraph, index) => `${index + 1}. ${paragraph.text}`)
      .join("\n\n");
    setPreparedPrompt(
      [
        `论文：${source.title}`,
        source.citation ? `来源：${source.citation}` : "",
        `选中段落：${selectedParagraphs.length} 段`,
        paragraphSummary,
        trimmedQuestion ? `问题：${trimmedQuestion}` : "问题：请围绕选中段落解释它和当前范式的关系。",
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }

  return (
      <aside
        className={["local-paper-reader", className].filter(Boolean).join(" ")}
        role="dialog"
        aria-label={`${source.title} 本地全文阅读窗口`}
      >
        <header className="local-paper-reader-head">
          <div>
            <span>{headingLabel}</span>
            <strong>{source.title}</strong>
            {source.citation && <p>{source.citation}</p>}
          </div>
          {onClose && (
            <button aria-label="关闭" className="local-paper-reader-close" onClick={onClose} type="button">
              x
            </button>
          )}
        </header>

        <nav className="local-paper-reader-provenance" aria-label="原始来源">
          {source.externalFallbacks.map((link) => <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label ?? "原始来源"}</a>)}
        </nav>
        <section className="local-paper-reader-paper" aria-label="本地全文原文">
          <details className="local-paper-reader-source-menu">
            <summary>
              <span>来源与文件</span>
              <strong>{targetLabel(target)}</strong>
            </summary>
            <div className="local-paper-reader-meta" aria-label="论文来源信息">
              {source.year && <span>{source.year}</span>}
              {source.sourceType && <span>{source.sourceType}</span>}
              {supportLabel && <span>{supportLabel}</span>}
              {source.materialState && <span>{source.materialState}</span>}
              <span>{paragraphSourceLabel(paragraphTarget)}</span>
            </div>

            <nav className="local-paper-reader-provenance" aria-label="本地与外部来源">
              {readableTargets.map((item) => (
                <button
                  className={item.href === target.href ? "active" : undefined}
                  key={`${item.href}-${item.role ?? ""}`}
                  onClick={() => onSelectTarget(item)}
                  type="button"
                >
                  {targetLabel(item)}
                </button>
              ))}
              {source.externalFallbacks.map((fallback) => (
                <a href={fallback.href} key={fallback.href} rel="noreferrer" target="_blank">
                  {fallback.label ?? fallback.kind ?? "外部出处"}
                </a>
              ))}
            </nav>
          </details>
          {validatedHtml ? <iframe className="local-paper-reader-frame" sandbox="allow-same-origin allow-popups" srcDoc={validatedHtml} title={`${source.title} 本地全文`} /> : <p role="status">{paragraphStatus}</p>}
        </section>

        <section className="local-paper-reader-workbench" aria-label="段落选择与提问">
          <div className="local-paper-reader-workbench-head">
            <div>
              <span>选段落</span>
              <strong>{selectedParagraphs.length > 0 ? `已选 ${selectedParagraphs.length} 段` : "先选和问题有关的段落"}</strong>
            </div>
            <button
              disabled={selectedParagraphIds.length === 0}
              onClick={() => {
                setPreparedPrompt("");
                setSelectedParagraphIds([]);
              }}
              type="button"
            >
              清空
            </button>
          </div>

          <div className="local-paper-reader-paragraph-status">{paragraphStatus}</div>

          <div className="local-paper-reader-paragraphs" aria-label="可选择段落">
            {paragraphs.length > 0 ? (
              paragraphs.map((paragraph, index) => {
                const selected = selectedParagraphIds.includes(paragraph.id);
                return (
                  <button
                    className={selected ? "selected" : undefined}
                    key={paragraph.id}
                    onClick={() => toggleParagraph(paragraph.id)}
                    type="button"
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{paragraph.text}</p>
                  </button>
                );
              })
            ) : (
              <div className="local-paper-reader-empty">
                {validatedHtml ? "已载入文字阅读版，当前没有可选择的段落。" : "全文尚未成功载入，请查看上方读取状态或使用原始来源。"}
              </div>
            )}
          </div>

          <div className="local-paper-reader-question" aria-label="向论文提问">
            <label htmlFor="local-paper-reader-question">要问这篇论文什么？</label>
            <textarea
              id="local-paper-reader-question"
              onChange={(event) => {
                setPreparedPrompt("");
                setQuestion(event.target.value);
              }}
              placeholder="例如：这几段能不能支持我在家长端讲“冲突管理”？边界在哪里？"
              value={question}
            />
            <button disabled={selectedParagraphs.length === 0} onClick={prepareQuestion} type="button">
              用选中段落提问
            </button>
            {preparedPrompt && (
              <output className="local-paper-reader-prepared">
                以下是整理好的选段与问题，可复制到你选择的工具中。<pre>{preparedPrompt}</pre>
              </output>
            )}
          </div>

          {(source.supports || source.safeUse || source.boundary) && (
            <details className="local-paper-reader-brief-details">
              <summary>证据边界</summary>
              <section className="local-paper-reader-brief" aria-label="证据使用边界">
                {source.supports && (
                  <article>
                    <strong>这项研究说明什么</strong>
                    <p>{source.supports}</p>
                  </article>
                )}
                {source.safeUse && (
                  <article>
                    <strong>可以怎样讲</strong>
                    <p>{source.safeUse}</p>
                  </article>
                )}
                {source.boundary && (
                  <article>
                    <strong>不能越过的边界</strong>
                    <p>{source.boundary}</p>
                  </article>
                )}
              </section>
            </details>
          )}

          {source.localReviewDocs.length > 0 && (
            <div className="local-paper-reader-docs" aria-label="后台复核文档">
              {source.localReviewDocs.slice(0, 3).map((doc) => (
                <span key={doc.href ?? doc.path ?? doc.label}>{doc.label ?? doc.kind ?? "复核文档"}</span>
              ))}
            </div>
          )}
        </section>
      </aside>
  );
}

export function LocalPaperReaderDrawer({
  selection,
  supportLabel,
  onClose,
  onSelectTarget,
}: LocalPaperReaderDrawerProps) {
  return (
    <>
      <button
        aria-label="关闭本地论文阅读"
        className="local-paper-reader-backdrop"
        onClick={onClose}
        type="button"
      />
      <LocalPaperReaderContent
        selection={selection}
        supportLabel={supportLabel}
        onClose={onClose}
        onSelectTarget={onSelectTarget}
      />
    </>
  );
}
