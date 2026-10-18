import {
  App, ItemView, Keymap, MarkdownRenderer, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile,
  WorkspaceLeaf, normalizePath, prepareSimpleSearch, requestUrl,
} from "obsidian";

/* =========================================================================
 * 設定
 * ========================================================================= */

export interface VaultRagSettings {
  openaiApiKey: string;
  claudeApiKey: string;
  targetFolder: string;
  includeSourceTypes: string[];
  excludeSubfolders: string[];
  excludeRootFiles: boolean;
  excludeSections: string[];
  embeddingProvider: string;       // "gemini" | "openai"。フォールバックはしない
  embeddingModel: string;
  embeddingDimensions: number;
  chatModelPriority: string[];
  chatFallbackMode: string;        // "auto" | "manual"
  geminiApiKey: string;
  geminiFreeTier: boolean;         // true の間、Gemini の費用を totalCostUsd に入れない
  chunkSize: number;
  chunkOverlap: number;
  embedBatchSize: number;
  embedIntervalMs: number;
  testModeNoteLimit: number;
  summaryChannel: string;
  summaryFolder: string;
  summaryModel: string;
  summaryMaxOutputTokens: number;
  summaryIntervalMs: number;
  summaryTokenBudgetPerMin: number;
  summaryMinSourceNotes: number;
  answerMaxTokens: number;
  vectorTopK: number;
  keywordTopK: number;
  finalTopK: number;
  rrfK: number;
  keywordSearchEnabled: boolean;
  maxChunksPerNote: number;
  reindexDebounceMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalEmbeddingTokens: number;
  totalCostUsd: number;
}

export const DEFAULT_SETTINGS: VaultRagSettings = {
  openaiApiKey: "",
  claudeApiKey: "",
  targetFolder: "Source/Obsidian/Youtube清書",
  includeSourceTypes: ["youtube", "knowledge_note", "integration_note", "channel_summary"],
  excludeSubfolders: [".ai"],      // 任意の階層でフォルダ名が一致したら除外
  excludeRootFiles: true,          // 対象フォルダ直下の .md を除外
  excludeSections: [
    "YouTube清書から活かせること",
    "関連リンク",
    "関連テーマ",
    "関連MOC",
    "概要欄",
    "関連する清書",                 // knowledge_note のリンク集
    "代表ノート",                   // integration_note のリンク集
    "使いどころ",                   // knowledge_note 16本で同一文面
    "使い方",                       // integration_note 8本で同一文面
    "目次",                         // channel_summary のトピック名の羅列。関連リンクと同じ性質
  ],
  // 埋め込み（フォールバック無し。切り替えたら全件再インデックス）
  embeddingProvider: "openai",     // "openai" | "gemini"（Gemini無料枠では全件完了不可）
  embeddingModel: "text-embedding-3-small",
  embeddingDimensions: 1536,       // Gemini の既定は3072。1536にしてOpenAI経路と揃える

  // 回答生成（こちらはフォールバックあり。ステップ5で使う）
  // 判断軸は金銭のみ。Gemini は5問すべて合格（単価は CHAT_PRICING を参照）、Haiku は約1.7円（見積もり）
  chatModelPriority: ["gemini-3.5-flash-lite", "claude-haiku-4-5", "gpt-5.6-luna"],
  chatFallbackMode: "auto",        // "auto" = 上から順に試す / "manual" = 先頭のみ
  geminiApiKey: "",
  // 無料枠かどうかは「モデル」ではなく「API キーの契約状態」で決まる。
  // 実測: 9/30 のまとめ生成のエラーに generate_content_free_tier_input_token_count が出ており、
  // まとめ生成と回答生成は同じ geminiApiKey を使う。だからスイッチ 1 つで管理する
  geminiFreeTier: true,

  chunkSize: 800,
  chunkOverlap: 160,
  embedBatchSize: 100,
  embedIntervalMs: 1000,           // バッチ間のウェイト。全件54リクエストを連続で投げると無料枠の上限に当たる
  testModeNoteLimit: 0,            // 0 = 無効。N>0 なら先頭N件のノートだけ処理する

  // チャンネルまとめノート（SUMMARY_NOTES.md / 試作フェーズ）
  summaryChannel: "2chお金スレ",
  summaryFolder: "Source/Obsidian/チャンネルまとめ",   // Youtube清書の外に置く
  summaryModel: "gemini-3.5-flash-lite",
  summaryMaxOutputTokens: 65536,
  summaryIntervalMs: 3000,         // チャンネル間の最小ウェイト
  summaryTokenBudgetPerMin: 240000, // 実測上限 250,000 に対する余裕込みの予算
  summaryMinSourceNotes: 3,        // source_notes がこれ未満のまとめノートは RAG 対象外（ファイルは残す）
  answerMaxTokens: 4096,           // 回答の最大トークン数
  vectorTopK: 30,
  keywordTopK: 30,
  finalTopK: 8,
  rrfK: 60,
  // 既定はベクトル単独。日本語のキーワード検索は5問すべてでベクトル単独に負けた（落とし穴#30）
  keywordSearchEnabled: false,
  maxChunksPerNote: 3,             // 1つのノートから最終結果に入れるチャンクの上限（ステップ4で使う）
  reindexDebounceMs: 5000,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalEmbeddingTokens: 0,
  totalCostUsd: 0,
};

/* =========================================================================
 * 本文抽出（CLAUDE.md「本文抽出仕様（確定版）」の手順1〜5）
 *
 * 本文の切り出し（手順2）とチャンク分割（手順5）は別処理。混同すると本文が消える。
 * ========================================================================= */

const BODY_START_HEADING = "清書";
const MEMO_HEADING = "自分のメモ";
const SUMMARY_HEADINGS = ["1行要約", "要点"];
const SUMMARY_CHUNK_HEADING = "1行要約・要点";

/**
 * `## 見出し` にだけ一致する。`### 見出し` は3文字目が空白でないため一致しない。
 * セクション境界（`##` と `###` の両方）とは別物。除外セクションの範囲判定は `##` 単位のまま。
 */
const H2_RE = /^##[ \t]+(.+?)[ \t]*$/;

/** セクション分割用。`##` と `###` に一致し、`####` 以下には一致しない。 */
const SECTION_HEADING_RE = /^(#{2,3})[ \t]+(.+?)[ \t]*$/;

/** 本文の終端。`## 概要欄` でも素の `概要欄` 行でも終端とする（実測4本）。 */
const BODY_END_RE = /^#{0,6}\s*概要欄\s*$/;

/** `---` / `***` / `___` だけの区切り線。 */
const HORIZONTAL_RULE_RE = /^[ \t]*(-{3,}|\*{3,}|_{3,})[ \t]*$/;

function h2Name(line: string): string | null {
  const m = H2_RE.exec(line);
  return m ? m[1] : null;
}

function sectionHeadingName(line: string): string | null {
  const m = SECTION_HEADING_RE.exec(line);
  return m ? m[2] : null;
}

function isH2(line: string, name: string): boolean {
  return h2Name(line) === name;
}

export function splitFrontmatter(raw: string): { frontmatter: string; body: string } {
  // BOM が混ざっていても frontmatter を見失わないように落としておく
  const text = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return { frontmatter: "", body: text };
  return { frontmatter: m[1], body: text.slice(m[0].length) };
}

function unquote(value: string): string {
  const v = value.trim();
  const first = v.charAt(0);
  const last = v.charAt(v.length - 1);
  if (v.length >= 2 && first === last && (first === '"' || first === "'")) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * frontmatter から必要なスカラー値だけ取る簡易パーサ。
 * インデントされた行（aliases のリスト項目など）は読まない。aliases は埋め込み対象外のため。
 */
export function parseFrontmatter(fm: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of fm.split(/\r?\n/)) {
    if (line.length === 0 || /^[ \t]/.test(line)) continue;
    const m = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (!m) continue;
    out[m[1]] = unquote(m[2]);
  }
  return out;
}

/** `## name` の直後から次の `## ` または末尾まで。見出し行自体は含めない。 */
export function extractSectionBody(body: string, name: string): string {
  const lines = body.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isH2(lines[i], name)) { start = i; break; }
  }
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (h2Name(lines[i]) !== null) { end = i; break; }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

/** 末尾の空行と区切り線（`---` など）を落とす。概要欄の直前に置かれていることがある。 */
function trimTrailingRules(lines: string[]): string[] {
  let end = lines.length;
  let changed = true;
  while (changed) {
    changed = false;
    while (end > 0 && lines[end - 1].trim().length === 0) { end--; changed = true; }
    if (end > 0 && HORIZONTAL_RULE_RE.test(lines[end - 1])) { end--; changed = true; }
  }
  return lines.slice(0, end);
}

/**
 * 手順2: 本文を切り出す。
 * - `## 清書` がある（youtube）: 直後から概要欄の直前、無ければ EOF まで。
 *   この段階で見出しごとに切ってはいけない（落とし穴#1）。
 * - `## 清書` がない（knowledge_note / integration_note）: h1 を除いた全体。
 * 終端は `## 概要欄` だけでなく素の `概要欄` 行も見る（2026-09-21 追加。実測4本）。
 */
export function extractMainBody(body: string): string {
  const lines = body.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isH2(lines[i], BODY_START_HEADING)) { start = i; break; }
  }
  if (start < 0) {
    return trimTrailingRules(lines.filter((l) => !/^#[ \t]/.test(l))).join("\n").trim();
  }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (BODY_END_RE.test(lines[i])) { end = i; break; }
  }
  return trimTrailingRules(lines.slice(start + 1, end)).join("\n").trim();
}

/**
 * 手順3: 切り出した本文から、除外セクションの見出しブロックを改めて落とす。
 * 実測14本で `## 関連テーマ` が `## 清書` の内側にあり、手順2で飲み込まれるため必要（落とし穴#10）。
 */
export function stripExcludedSections(text: string, excludeSections: string[]): string {
  const excluded = new Set(excludeSections);
  const lines = text.split(/\r?\n/);
  const kept: string[] = [];
  let skipping = false;
  for (const line of lines) {
    const name = h2Name(line);
    if (name !== null) {
      skipping = excluded.has(name);
      if (skipping) continue;
    }
    if (!skipping) kept.push(line);
  }
  return kept.join("\n").trim();
}

/** 箇条書きの空マーカー（"- " だけの行）しか無いセクションは空とみなす。 */
export function isEffectivelyEmpty(text: string): boolean {
  return text.replace(/^[ \t]*[-*+][ \t]*$/gm, "").replace(/\s+/g, "").length === 0;
}

export interface ExtractedNote {
  frontmatter: Record<string, string>;
  sourceType: string;
  summary: string;   // 手順4: `## 1行要約` + `## 要点`（youtube のみ）
  main: string;      // 手順2〜3 適用後の本文
  memo: string;      // `## 自分のメモ`（空でなければ）
}

export function extractNote(raw: string, settings: VaultRagSettings): ExtractedNote {
  const split = splitFrontmatter(raw);
  const frontmatter = parseFrontmatter(split.frontmatter);
  const sourceType = frontmatter["source_type"] || "";

  const main = stripExcludedSections(extractMainBody(split.body), settings.excludeSections);

  // 手順4: 1行要約と要点を結合して1チャンクにする。
  // 別々にすると `## 1行要約` が数十文字の単独チャンクになり、ヘッダのほうが長くなる。
  let summary = "";
  if (sourceType === "youtube") {
    const parts: string[] = [];
    for (const name of SUMMARY_HEADINGS) {
      const text = extractSectionBody(split.body, name);
      if (text.length > 0 && !isEffectivelyEmpty(text)) parts.push(text);
    }
    summary = parts.join("\n\n").trim();
  }

  // `## 自分のメモ` は「空でなければ含める」。実測では全件空だが、将来の記入に備える。
  const memoRaw = extractSectionBody(split.body, MEMO_HEADING);
  const memo = isEffectivelyEmpty(memoRaw) ? "" : memoRaw;

  return { frontmatter, sourceType, summary, main, memo };
}

/* =========================================================================
 * チャンク分割（手順5: 貪欲パッキング方式）
 * ========================================================================= */

export interface SectionText {
  heading: string;
  level: number;     // 2 = `##`, 3 = `###`。見出しなしは 0
  text: string;
}

/**
 * 手順5前半: `##` と `###` を境界にセクションへ分ける（2026-09-21 変更）。
 * `####` 以下では分けず親に残す。細かく分けても後段の貪欲パッキングが詰め直す。
 */
export function splitByHeadings(body: string): SectionText[] {
  const lines = body.split(/\r?\n/);
  const out: SectionText[] = [];
  let heading = "";
  let level = 0;
  let buf: string[] = [];
  const flush = () => {
    const text = buf.join("\n").trim();
    // 本文が空でも見出しがあれば残す。`## 大見出し` の直下に `### 小見出し` が続く構造が多く、
    // 捨てると親見出しの文脈がチャンクから消える（実測 758 件）。
    if (text.length > 0 || heading.length > 0) out.push({ heading, level, text });
    buf = [];
  };
  for (const line of lines) {
    const m = SECTION_HEADING_RE.exec(line);
    if (m) {
      flush();
      level = m[1].length;
      heading = m[2];
      continue;
    }
    buf.push(line);
  }
  flush();
  return out;
}

/** 手順5後半: chunkSize を超える場合のみ chunkSize / chunkOverlap で再分割。 */
export function splitBySize(text: string, chunkSize: number, chunkOverlap: number): string[] {
  if (text.length <= chunkSize) return [text];
  const step = Math.max(1, chunkSize - chunkOverlap);
  const out: string[] = [];
  for (let i = 0; i < text.length; i += step) {
    out.push(text.slice(i, i + chunkSize));
    if (i + chunkSize >= text.length) break;
  }
  return out;
}

/** チャンク1個ぶんの中身。コンテキストヘッダはまだ付いていない。 */
export interface ChunkPlan {
  kind: "summary" | "body";
  headings: string[];
  text: string;
}

const SECTION_SEPARATOR = "\n\n";

/**
 * セクションをチャンク本文の形にする。見出しは本文の中に残す（コンテキストヘッダの
 * `{見出しがあれば見出し}` と同じ形）。見出しもチャンク長に数える。
 */
function renderSection(sec: SectionText): string {
  if (sec.heading.length === 0) return sec.text;
  // `##` / `###` の接頭辞ごと残す。`###` も分割対象になったため、接頭辞が無いと
  // 1チャンクに複数の見出しが入ったときに親子関係が読めなくなる。
  const marker = "#".repeat(Math.max(2, sec.level)) + " ";
  return sec.text.length > 0 ? marker + sec.heading + "\n" + sec.text : marker + sec.heading;
}

/**
 * 貪欲パッキング（2026-09-21 変更）。
 * セクション中央値は 284 文字しかないため、1セクション=1チャンクにすると
 * 130 文字のチャンクが大量にでき、コンテキストヘッダがベクトルを支配する（落とし穴#13）。
 * 連続するセクションを chunkSize まで詰め、単体で超えるものだけ重複つきで再分割する。
 * ノートをまたいでは詰めない（呼び出し側が1ノート分ずつ渡す）。
 */
export function packSections(sections: SectionText[], chunkSize: number, chunkOverlap: number): ChunkPlan[] {
  const out: ChunkPlan[] = [];
  let buf: SectionText[] = [];
  let bufLen = 0;

  const flush = () => {
    if (buf.length === 0) return;
    const headings: string[] = [];
    for (const s of buf) if (s.heading.length > 0) headings.push(s.heading);
    out.push({ kind: "body", headings, text: buf.map(renderSection).join(SECTION_SEPARATOR) });
    buf = [];
    bufLen = 0;
  };

  for (const sec of sections) {
    const secLen = renderSection(sec).length;
    // 単体で chunkSize を超えるセクションだけ、重複つきで切る
    if (secLen > chunkSize) {
      flush();
      const headings = sec.heading.length > 0 ? [sec.heading] : [];
      for (const piece of splitBySize(renderSection(sec), chunkSize, chunkOverlap)) {
        out.push({ kind: "body", headings: headings.slice(), text: piece });
      }
      continue;
    }
    const addLen = buf.length === 0 ? secLen : SECTION_SEPARATOR.length + secLen;
    if (buf.length > 0 && bufLen + addLen > chunkSize) flush();
    bufLen += buf.length === 0 ? secLen : SECTION_SEPARATOR.length + secLen;
    buf.push(sec);
  }
  flush();
  return out;
}

/** 1ノートぶんのチャンク（コンテキストヘッダは buildChunkText で付ける）。 */
export function buildChunkPlans(note: ExtractedNote, chunkSize: number, chunkOverlap: number): ChunkPlan[] {
  const out: ChunkPlan[] = [];

  // 手順4: サマリーチャンクは本文と混ぜずに独立させる
  if (note.summary.length > 0) {
    const sec: SectionText = { heading: SUMMARY_CHUNK_HEADING, level: 2, text: note.summary };
    for (const piece of splitBySize(renderSection(sec), chunkSize, chunkOverlap)) {
      out.push({ kind: "summary", headings: [SUMMARY_CHUNK_HEADING], text: piece });
    }
  }

  for (const plan of packSections(splitByHeadings(note.main), chunkSize, chunkOverlap)) out.push(plan);

  if (note.memo.length > 0) {
    const sec: SectionText = { heading: MEMO_HEADING, level: 2, text: note.memo };
    for (const piece of splitBySize(renderSection(sec), chunkSize, chunkOverlap)) {
      out.push({ kind: "body", headings: [MEMO_HEADING], text: piece });
    }
  }
  return out;
}

/* =========================================================================
 * コンテキストヘッダ（手順6）
 * ========================================================================= */

/** 空のフィールドは区切りの `｜` ごと省く。channel も date も無ければ `[タイトル]`。 */
export function buildContextHeader(title: string, channel: string, date: string): string {
  const parts: string[] = [];
  for (const v of [title, channel, date]) {
    const t = (v || "").trim();
    if (t.length > 0) parts.push(t);
  }
  return "[" + parts.join("｜") + "]";
}

/**
 * 埋め込み対象になる最終的なチャンク本文。
 * 見出しは plan.text の中に既に入っているので、ここで重ねて出さない。
 */
export function buildChunkText(plan: ChunkPlan, title: string, channel: string, date: string): string {
  return buildContextHeader(title, channel, date) + "\n" + plan.text;
}

/* =========================================================================
 * Chunk（vault-rag-index.json に入る形。vector は .bin 側に持つ）
 * ========================================================================= */

export interface Chunk {
  id: string;
  path: string;
  title: string;
  channel: string;
  category: string;
  date: string;
  url: string;
  sourceType: string;
  kind: "summary" | "body";
  headings: string[];
  text: string;
  mtime: number;
}

export function buildChunks(note: ExtractedNote, path: string, mtime: number, settings: VaultRagSettings): Chunk[] {
  const fm = note.frontmatter;
  const base = path.slice(path.lastIndexOf("/") + 1);
  const title = base.endsWith(".md") ? base.slice(0, -3) : base;
  const channel = fm["channel"] || "";
  const date = fm["date"] || "";

  const plans = buildChunkPlans(note, settings.chunkSize, settings.chunkOverlap);
  const out: Chunk[] = [];
  for (let i = 0; i < plans.length; i++) {
    const plan = plans[i];
    out.push({
      id: `${path}#${i}`,
      path,
      title,
      channel,
      category: fm["category"] || "",
      date,
      url: fm["url"] || "",
      sourceType: note.sourceType,
      kind: plan.kind,
      headings: plan.headings,
      text: buildChunkText(plan, title, channel, date),
      mtime,
    });
  }
  return out;
}

/* =========================================================================
 * 対象ノートの収集
 * ========================================================================= */

export function isUnderFolder(path: string, folder: string): boolean {
  if (folder.length === 0) return true;
  const prefix = folder.endsWith("/") ? folder : folder + "/";
  return path.startsWith(prefix);
}

/** 対象フォルダ直下（サブフォルダに入っていない）か。 */
export function isDirectChild(path: string, folder: string): boolean {
  const prefix = folder.endsWith("/") ? folder : folder + "/";
  return path.startsWith(prefix) && path.slice(prefix.length).indexOf("/") < 0;
}

/** 任意の階層でフォルダ名が一致したら除外（`.ai` は実測で2階層に存在）。 */
export function hasExcludedFolder(path: string, excludeSubfolders: string[]): boolean {
  if (excludeSubfolders.length === 0) return false;
  const segments = path.split("/");
  // 最後の要素はファイル名なので見ない
  for (let i = 0; i < segments.length - 1; i++) {
    if (excludeSubfolders.indexOf(segments[i]) >= 0) return true;
  }
  return false;
}

export interface CountResult {
  filesUnderTarget: number;
  filesFromApiUnderAiFolder: number;
  skippedByFolderRule: number;
  skippedByRootRule: number;
  readErrors: string[];
  bySourceType: Record<string, number>;
  includedNotes: number;
  extractedChars: number;   // 抽出した本文の実文字数（重複を数えない）
  includedChars: number;    // チャンクの合計文字数（重複分を二重に数える＝埋め込みに送る量）
  includedChunks: number;
  summaryChunks: number;
  bodyChunks: number;
  thinSummariesSkipped: number;
  charsBySourceType: Record<string, number>;
  chunksBySourceType: Record<string, number>;
  elapsedMs: number;
}

export function emptyCountResult(): CountResult {
  return {
    filesUnderTarget: 0,
    filesFromApiUnderAiFolder: 0,
    skippedByFolderRule: 0,
    skippedByRootRule: 0,
    readErrors: [],
    bySourceType: {},
    includedNotes: 0,
    extractedChars: 0,
    includedChars: 0,
    includedChunks: 0,
    summaryChunks: 0,
    bodyChunks: 0,
    thinSummariesSkipped: 0,
    charsBySourceType: {},
    chunksBySourceType: {},
    elapsedMs: 0,
  };
}

/**
 * まとめノートのうち、元ノートが少なすぎるものを RAG 対象から外す。
 * 内容が元ノートとほぼ同一で、同じ話が 2 チャンク上位に並んで検索枠を食うだけになる。
 * ファイルは削除しない（ユーザーが読む用途では残す）。
 */
export function isSummaryTooThin(note: ExtractedNote, settings: VaultRagSettings): boolean {
  if (note.sourceType !== "channel_summary") return false;
  const raw = note.frontmatter["source_notes"];
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!isFinite(n)) return false;   // 読めないものは落とさない
  return n < settings.summaryMinSourceNotes;
}

/** 1ノートぶんの集計を result に足し込む。Obsidian に依存しないので単体で検証できる。 */
export function tallyNote(result: CountResult, raw: string, settings: VaultRagSettings, path: string): void {
  const note = extractNote(raw, settings);
  const key = note.sourceType.length > 0 ? note.sourceType : "(判定不能)";
  result.bySourceType[key] = (result.bySourceType[key] || 0) + 1;

  if (note.sourceType.length === 0) {
    console.warn("[Vault RAG] source_type が読めないため除外:", path);
    return;
  }
  if (settings.includeSourceTypes.indexOf(note.sourceType) < 0) return;
  if (isSummaryTooThin(note, settings)) { result.thinSummariesSkipped++; return; }

  const chunks = buildChunkPlans(note, settings.chunkSize, settings.chunkOverlap);
  let chars = 0;
  for (const c of chunks) {
    chars += c.text.length;
    if (c.kind === "summary") result.summaryChunks++; else result.bodyChunks++;
  }

  result.includedNotes++;
  result.extractedChars += note.summary.length + note.main.length + note.memo.length;
  result.includedChars += chars;
  result.includedChunks += chunks.length;
  result.charsBySourceType[note.sourceType] = (result.charsBySourceType[note.sourceType] || 0) + chars;
  result.chunksBySourceType[note.sourceType] = (result.chunksBySourceType[note.sourceType] || 0) + chunks.length;
}

/* =========================================================================
 * 中断制御・進捗表示・リトライ
 * （../My-YouTube-Summarizer-Plugin/src/main.ts からの移植。元ファイルは変更していない）
 * ========================================================================= */

/** 中断で打ち切ったときに投げる。通常のエラーと Notice を出し分けるために区別する。 */
class AbortedError extends Error {
  constructor(message = "処理を停止しました") {
    super(message);
    this.name = "AbortedError";
  }
}

function isAbortedError(err: unknown): boolean {
  return err instanceof AbortedError;
}

/**
 * 1回の実行ぶんの停止スイッチ。
 * requestUrl は中断できないので「送信済みの1リクエストは待ち、次の区切りで止まる」動きになる。
 * 流用元にあった子プロセス管理は、このプラグインが子プロセスを起動しないため落としている。
 */
class RunController {
  private aborted = false;
  private wakeups = new Set<() => void>();

  get isAborted(): boolean {
    return this.aborted;
  }

  abort(): void {
    if (this.aborted) return;
    this.aborted = true;
    for (const wake of Array.from(this.wakeups)) wake();
    this.wakeups.clear();
  }

  throwIfAborted(): void {
    if (this.aborted) throw new AbortedError();
  }

  /** リトライ待機用。停止されたら待たずに AbortedError で抜ける。 */
  sleep(ms: number): Promise<void> {
    this.throwIfAborted();
    return new Promise<void>((resolve, reject) => {
      let timer = 0;
      const wake = () => {
        window.clearTimeout(timer);
        this.wakeups.delete(wake);
        reject(new AbortedError());
      };
      timer = window.setTimeout(() => {
        this.wakeups.delete(wake);
        resolve();
      }, ms);
      this.wakeups.add(wake);
    });
  }
}

/**
 * 自動で消えない進捗Notice（duration=0）を1本に束ねる。
 * 個別に作っていると、途中で例外が出たとき後半のNoticeが消えずに残る。
 */
class ProgressNotice {
  private current: Notice | null = null;

  show(message: string): void {
    this.hide();
    this.current = new Notice(message, 0);
  }

  hide(): void {
    this.current?.hide();
    this.current = null;
  }
}

const RETRY_BASE_DELAY_MS = 2000;
const RETRY_RATE_LIMIT_BASE_DELAY_MS = 15000;
const RETRY_MAX_DELAY_MS = 60000;
const EMBED_MAX_ATTEMPTS = 3;

function isRateLimitMessage(message: string): boolean {
  return /rate limit|rate_limit|RESOURCE_EXHAUSTED|429|tokens per minute|レート制限/i.test(message || "");
}

/**
 * 待っても直らないエラー。リトライせず即座に止める。
 * OpenAI は残高切れにも HTTP 429 を返すため、ステータスだけでは
 * 一時的なレート制限と区別できない（実測: type=insufficient_quota / code=credit_balance_exhausted）。
 *
 * ⚠ 判定順が重要。Gemini の分あたり上限超過メッセージには
 * 「please check your plan and billing details」が含まれるため、`billing` だけを見ると
 * 待てば直るエラーを「回復しない」と誤判定して実行全体を落とす（2026-09-26 に実際に踏んだ）。
 * RESOURCE_EXHAUSTED / Please retry in … を含むものは、先にリトライ可能と判定する。
 */
function isNonRetryableApiError(message: string): boolean {
  const text = message || "";
  if (/RESOURCE_EXHAUSTED|please retry in|rate limit|rate_limit|tokens per minute/i.test(text)) return false;
  return /insufficient_quota|credit_balance_exhausted|invalid_api_key|API_KEY_INVALID|PERMISSION_DENIED|account_deactivated|billing|HTTP 401|HTTP 403/i.test(text);
}

/** サーバーが「Please retry in 14.88s」と待ち時間を返してくることがある。素直に従う。 */
function parseRetryAfterMs(message: string): number | null {
  const m = /please retry in\s*([\d.]+)\s*s/i.exec(message || "");
  if (!m) return null;
  const sec = parseFloat(m[1]);
  if (!isFinite(sec) || sec <= 0) return null;
  return Math.min(Math.ceil(sec * 1000) + 1000, RETRY_MAX_DELAY_MS);   // 1秒だけ余裕を足す
}

// リトライ待ち時間: 指数バックオフ + ジッター（±25%）。
// レート制限が原因のときは初回から長めに待つ（1秒固定だと3回とも同じ制限窓に当たって全滅するため）。
function calcRetryDelayMs(attempt: number, rateLimited: boolean): number {
  const base = rateLimited ? RETRY_RATE_LIMIT_BASE_DELAY_MS : RETRY_BASE_DELAY_MS;
  const backoff = Math.min(base * Math.pow(2, Math.max(0, attempt - 1)), RETRY_MAX_DELAY_MS);
  return Math.round(backoff * (0.75 + Math.random() * 0.5));
}

/* =========================================================================
 * 料金
 * ========================================================================= */

const USD_TO_JPY = 150;

const EMBEDDING_PRICING: Record<string, number> = {
  "text-embedding-3-small": 0.02,   // per 1M tokens
  "text-embedding-3-large": 0.13,
};

function calcEmbeddingCostUsd(model: string, tokens: number): number {
  const unit = EMBEDDING_PRICING[model];
  return (tokens / 1_000_000) * (typeof unit === "number" ? unit : EMBEDDING_PRICING["text-embedding-3-small"]);
}

function formatUsdJpy(usd: number): string {
  return `$${usd.toFixed(4)}（約${(usd * USD_TO_JPY).toFixed(1)}円）`;
}

/* =========================================================================
 * 埋め込みプロバイダ
 *
 * ⛔ フォールバック禁止（落とし穴#19）。モデルが違えばベクトル空間が違うため、
 *    途中で切り替えると1つのインデックスに比較不可能なベクトルが混在する。
 *    しかもエラーが出ない。レート制限時は「同じモデルで」リトライする。
 * ========================================================================= */

export interface EmbeddingBatchResult {
  vectors: number[][];
  tokens: number;
}

/** ノート側と質問側で使い分ける。逆にしても省略しても動くが精度が落ちる。 */
export type EmbeddingTaskType = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

export interface EmbeddingOptions {
  dimensions: number;
  taskType: EmbeddingTaskType;
}

interface EmbeddingProvider {
  embed(texts: string[], apiKey: string, model: string, options: EmbeddingOptions): Promise<EmbeddingBatchResult>;
}

const openaiEmbeddingProvider: EmbeddingProvider = {
  /** OpenAI は input に配列を渡すと個別のベクトルが返る（Gemini とは挙動が違う。落とし穴#20）。 */
  async embed(texts: string[], apiKey: string, model: string, options: EmbeddingOptions): Promise<EmbeddingBatchResult> {
    const res = await requestUrl({
      url: "https://api.openai.com/v1/embeddings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      // OpenAI に taskType は無い。次元数の指定は dimensions（v3 系のみ）
      body: JSON.stringify({ model, input: texts, dimensions: options.dimensions }),
      throw: false,
    });

    const data = res.json;
    if (!data || data.error) {
      const err = data && data.error ? data.error : null;
      const message = err ? err.message : `HTTP ${res.status}`;
      // type / code をメッセージに含める。残高切れも 429 で返るため、
      // ステータスだけでは一時的なレート制限と区別できない。
      const detail = err && (err.type || err.code) ? ` [${err.type || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
      throw new Error(`OpenAI embeddings エラー: ${message}${detail}`);
    }
    if (!Array.isArray(data.data) || data.data.length !== texts.length) {
      throw new Error(`OpenAI embeddings: 要求 ${texts.length} 件に対し ${Array.isArray(data.data) ? data.data.length : 0} 件しか返りませんでした`);
    }

    // index でソートし直す。順序が入れ替わるとチャンクとベクトルの対応がずれる。
    const sorted = data.data.slice().sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    const vectors: number[][] = [];
    for (let i = 0; i < sorted.length; i++) {
      const v = sorted[i].embedding;
      if (!Array.isArray(v)) throw new Error("OpenAI embeddings: embedding が配列ではありません");
      vectors.push(v);
    }

    const usage = data.usage || {};
    const tokens = typeof usage.total_tokens === "number"
      ? usage.total_tokens
      : (typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : 0);
    return { vectors, tokens };
  },
};

const geminiEmbeddingProvider: EmbeddingProvider = {
  /**
   * 間違えてもエラーが出ない箇所が3つある（落とし穴#20 / #22 / #23）。
   * 1. batchEmbedContents の requests[] に 1テキスト 1リクエストで入れる。
   *    embedContent の content に複数 parts を並べると「全入力を集約した1ベクトル」が返る
   * 2. taskType を指定する。ノート側は RETRIEVAL_DOCUMENT、質問側は RETRIEVAL_QUERY
   * 3. outputDimensionality を指定する。既定は 3072 で .bin が倍になる
   */
  async embed(texts: string[], apiKey: string, model: string, options: EmbeddingOptions): Promise<EmbeddingBatchResult> {
    const modelPath = model.startsWith("models/") ? model : `models/${model}`;
    const requests = texts.map((text) => ({
      model: modelPath,
      content: { parts: [{ text }] },     // 1テキスト = 1リクエスト。複数を1つに並べない
      taskType: options.taskType,
      outputDimensionality: options.dimensions,
    }));

    const res = await requestUrl({
      url: `https://generativelanguage.googleapis.com/v1beta/${modelPath}:batchEmbedContents`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ requests }),
      throw: false,
    });

    const data = res.json;
    if (!data || data.error) {
      const err = data && data.error ? data.error : null;
      const message = err ? err.message : `HTTP ${res.status}`;
      const detail = err && (err.status || err.code) ? ` [${err.status || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
      throw new Error(`Gemini embeddings エラー: ${message}${detail}`);
    }
    if (!Array.isArray(data.embeddings)) {
      throw new Error("Gemini embeddings: embeddings が配列ではありません");
    }
    // 1件しか返らないのは、集約された1ベクトルを掴まされたサイン（落とし穴#20）
    if (data.embeddings.length !== texts.length) {
      throw new Error(`Gemini embeddings: 要求 ${texts.length} 件に対し ${data.embeddings.length} 件しか返りませんでした（集約された可能性があります）`);
    }

    const vectors: number[][] = [];
    for (const e of data.embeddings) {
      const v = e && e.values;
      if (!Array.isArray(v)) throw new Error("Gemini embeddings: values が配列ではありません");
      vectors.push(v);
    }
    // batchEmbedContents は usage を返さない。費用は無料枠なので 0 のまま扱う
    return { vectors, tokens: 0 };
  },
};

function getEmbeddingProvider(name: string): EmbeddingProvider {
  return name === "openai" ? openaiEmbeddingProvider : geminiEmbeddingProvider;
}

function getEmbeddingApiKey(settings: VaultRagSettings): string {
  return settings.embeddingProvider === "openai" ? settings.openaiApiKey : settings.geminiApiKey;
}

/**
 * ベクトルを L2 正規化する。
 * Gemini は outputDimensionality に 3072 以外を指定すると正規化されていないベクトルを返す。
 * 保存時に正規化しておけば、検索側は内積をそのままコサイン類似度として使える。
 */
export function normalizeVector(v: number[]): number[] {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  const norm = Math.sqrt(sum);
  if (norm === 0 || !isFinite(norm)) return v;
  const out = new Array<number>(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

/* =========================================================================
 * インデックスファイル（2ファイル。ベクトルを JSON の数値配列にしない）
 * ========================================================================= */

// 2: includeSourceTypes に channel_summary を追加し、対象フォルダが2つになった
// 3: excludeSections に「目次」を追加した
export const INDEX_VERSION = 3;
const INDEX_JSON_FILE = "vault-rag-index.json";
const INDEX_BIN_FILE = "vault-rag-vectors.bin";

export interface IndexLoadTiming {
  jsonBytes: number;
  jsonReadMs: number;
  jsonParseMs: number;
  binBytes: number;
  binReadMs: number;
  totalMs: number;
}

export interface IndexMeta {
  embeddingProvider: string;
  embeddingModel: string;
  dimensions: number;
  chunkSize: number;
  chunkOverlap: number;
  indexVersion: number;
  targetFolder: string;
  chunkCount: number;
  builtAt: string;
}

export interface VaultRagIndex {
  meta: IndexMeta;
  chunks: Chunk[];   // 配列の index が .bin 内のベクトルの順序と一対一で対応する
}

export function currentIndexMeta(settings: VaultRagSettings, chunkCount: number): IndexMeta {
  return {
    embeddingProvider: settings.embeddingProvider,
    embeddingModel: settings.embeddingModel,
    dimensions: settings.embeddingDimensions,
    chunkSize: settings.chunkSize,
    chunkOverlap: settings.chunkOverlap,
    indexVersion: INDEX_VERSION,
    targetFolder: settings.targetFolder,
    chunkCount,
    builtAt: new Date().toISOString(),
  };
}

/**
 * 設定が変わって既存ベクトルが無効になったかを判定する。
 * ⚠ 次元数が違うベクトル同士でコサイン類似度を計算してはいけない。計算は通るが結果が無意味になる。
 */
export function needsFullReindex(saved: IndexMeta, current: IndexMeta): boolean {
  return saved.embeddingProvider !== current.embeddingProvider
      || saved.embeddingModel !== current.embeddingModel
      || saved.dimensions     !== current.dimensions
      || saved.chunkSize      !== current.chunkSize
      || saved.chunkOverlap   !== current.chunkOverlap
      || saved.indexVersion   !== current.indexVersion
      || saved.targetFolder   !== current.targetFolder;
}

/**
 * 2ファイルの整合性検証（必須）。
 * 片方だけ更新された状態で検索すると別チャンクのベクトルを引くが、エラーは出ない（落とし穴#14）。
 */
export function validateIndexIntegrity(meta: IndexMeta, chunkLength: number, binByteLength: number): string | null {
  if (meta.chunkCount !== chunkLength) {
    return `chunkCount(${meta.chunkCount}) と chunks.length(${chunkLength}) が一致しません`;
  }
  const expected = meta.chunkCount * meta.dimensions * 4;
  if (binByteLength !== expected) {
    return `${INDEX_BIN_FILE} のバイト長(${binByteLength}) が期待値(${expected}) と一致しません`;
  }
  return null;
}

/* =========================================================================
 * チャンネルまとめノート（SUMMARY_NOTES.md / 試作フェーズ）
 *
 * 1チャンネル分の `## 清書` 本文をまとめて1リクエストで投げ、
 * 重複を除いた1本のノートにする（Q24: V2 重複除去。要約ではない）。
 * ========================================================================= */

/**
 * SUMMARY_NOTES.md「生成プロンプトのルール > プロンプト本文」から機械的に転記した。
 * 3分類（比喩は削る / 固有名詞の例示は残す / 数値は絶対に残す）は実測に基づく確定事項。
 * ⛔ 要約・言い換え・加筆をしてはいけない。
 */
const SUMMARY_PROMPT_RULES = `あなたは、あるYouTubeチャンネルの動画要約ノート群を、1本のまとめノートに集約します。

## 絶対ルール

1. 与えられたノートに書かれている情報だけを使うこと。
   あなたが学習で得た知識で補完してはならない。

2. 以下は必ず残すこと。1つでも落としたら失敗とみなす。
   - すべての数値（金額・パーセント・年号・件数・倍率・期間）と、その条件
     例:「月3万円を年利5%で運用した場合」は、月3万円も年利5%も条件も全部残す
   - すべての固有名詞（製品名・指数名・企業名・人名・サービス名）
   - 主張と、その根拠

3. 以下は削ってよい。
   - 話者の雑談・挨拶・チャンネル宣伝
   - 同じ主張の言い換え・繰り返し
   - 純粋な比喩（「〜は博物館のようなもの」「波のようなパターン」など、
     理解を助けるためだけの例え）
   - 冗長な前置き

   ただし「S&P500のような分散指数」「Cursorのようなサービス」のような
   固有名詞を含む例示は比喩ではない。残すこと。

4. 重複の扱い
   - 複数の動画が同じ主張をしている場合、主張は1回にまとめ、
     出典を全部並べる
   - 主張が同じでも根拠の数値や事例が違う場合は、全部残す
   - 意見が分かれている場合は、どちらが正しいか判断せず両論を残す

   【集約してよい唯一の例外】
   匿名の個人が自己申告した数値（口座残高・年収・貯金額・年齢など）が
   羅列されている場合に限り、集約してよい。
   ただし次の形式を必ず守ること。

     「◯◯の報告値は △△ 〜 □□（n=件数）」

   例:「30代前半の口座残高の報告値は 149,176円 〜 468万744円（n=12）」

   下限・上限・件数を必ず書くこと。「ばらつきが大きい」のような
   定性的な表現だけにしてはならない。

   これ以外の数値 ―― 制度・統計・調査結果・商品仕様・料金・
   リターン率・日付 ―― は1つも落としてはならない。集約もしてはならない。
   ルール2とルール3が競合したときは、常にルール2（残す）が優先する。

5. 出典
   - 参考ノートには [N1] [N2] … の番号が付いている。
     すべての箇条書きの末尾に、その番号だけを ⟨出典: N3⟩ の形で付けること
   - 複数のノートが根拠なら ⟨出典: N3 / N17 / N42⟩ と番号を並べる
   - **ノートのファイル名を書いてはならない。番号だけを書くこと。**
     ファイル名は長く、書き写すと必ず崩れる。番号は後から機械的に置き換える
   - 出典のない記述を書いてはならない

6. 構造
   - 冒頭に「## このチャンネルの軸」を置き、1〜3行でこのチャンネルが
     何を伝えているかを書く
   - 次に「## 目次」でトピック名を列挙する
   - 以降、トピックごとに「## トピック名」のセクションを作る
   - トピックの分け方はチャンネルの内容から決めてよい
   - **小見出しを箇条書きにしてはならない。**
     「- Gemini 3.5の登場」「- **モデルの比較**」のような見出しだけの箇条書きを作らず、
     「### Gemini 3.5の登場」のように ### 見出しにすること
   - **箇条書きは必ず主張か事実を含み、末尾に出典を付けること。**
     内容を持たない箇条書き（次の項目を導入するだけの行）を作ってはならない

## 参考ノート`;

export interface SummarySourceNote {
  title: string;
  path: string;
  body: string;
}

/**
 * 規則部分は変更せず、末尾の「## 参考ノート」の後ろに実ノートを並べる。
 * ノートには `[N1]` から順に番号を振る。モデルにはこの番号だけを書かせ、
 * 保存時にコードが実在のファイル名へ置き換える（落とし穴 S4）。
 */
export function buildSummaryPrompt(notes: SummarySourceNote[]): string {
  const parts: string[] = [SUMMARY_PROMPT_RULES];
  for (let i = 0; i < notes.length; i++) parts.push(`[N${i + 1}] ${notes[i].title}\n${notes[i].body}`);
  return parts.join("\n\n");
}

/**
 * `⟨出典: N3 / N17⟩` の番号を実在のファイル名に置き換える。
 * 番号が範囲外なら `不明` にする。モデルにファイル名を書かせないので、
 * 名前の崩れ・表記ゆれ・捏造が構造的に起きない。
 */
export interface CitationNumberResult {
  text: string;
  resolved: number;      // 実在ファイル名に置き換えた番号の箇所数
  unknown: number;       // 範囲外だった箇所数
  unknownTokens: string[];
  nonNumeric: string[];  // 番号ではなく名前を書いてきたもの（プロンプト違反）
}

export function resolveCitationNumbers(text: string, notes: SummarySourceNote[]): CitationNumberResult {
  let resolved = 0;
  let unknown = 0;
  const unknownTokens: string[] = [];
  const nonNumeric: string[] = [];

  const fixed = normalizeCitationLabels(text).text.replace(/⟨出典:\s*([^⟩]*)⟩/g, (_whole, inner: string) => {
    const out: string[] = [];
    let sawUnknown = false;

    for (const rawPart of inner.split("/")) {
      const part = rawPart.trim().replace(/^\[+/, "").replace(/\]+$/, "").trim();
      if (part.length === 0) continue;
      if (part === "同上" || part === "不明") { out.push(part); continue; }

      const m = /^N\s*(\d+)$/i.exec(part);
      if (!m) {
        // 番号ではなく名前を書いてきた。既存の近似マッチに任せるため素通しする
        nonNumeric.push(part);
        out.push(part);
        continue;
      }
      const index = parseInt(m[1], 10) - 1;
      if (index >= 0 && index < notes.length) {
        out.push(notes[index].title);
        resolved++;
      } else {
        unknown++;
        unknownTokens.push(part);
        sawUnknown = true;
      }
    }

    if (out.length === 0) return "⟨出典: 不明⟩";
    return `⟨出典: ${out.join(" / ")}${sawUnknown ? " / 不明" : ""}⟩`;
  });

  return { text: fixed, resolved, unknown, unknownTokens, nonNumeric };
}

export function buildSummaryFrontmatter(
  channel: string,
  sourceNotes: number,
  sourceChars: number,
  model: string,
): string {
  const today = new Date().toISOString().slice(0, 10);
  return [
    "---",
    "source_type: channel_summary",
    `channel: "${channel}"`,
    `source_notes: ${sourceNotes}`,
    `source_chars: ${sourceChars}`,
    `generated: ${today}`,
    `model: ${model}`,
    "status: 試作",
    "---",
  ].join("\n");
}

export interface SummaryVerifyResult {
  channel: string;
  notes: number;
  sourceChars: number;
  summaryChars: number;
  ratio: number;
  aggregateLines: number;
  malformedAggregates: number;
  malformedSamples: string[];
  bulletsWithoutCitation: number;
  bulletSamples: string[];
  citations: number;
  distinctCitations: number;
  unresolvedNames: string[];
  unknownLabels: number;
}

export interface SummaryBuildResult {
  channel: string;
  variants: string[];
  notes: number;
  sourceChars: number;
  outChars: number;
  ratio: number;
  inputTokens: number;
  outputTokens: number;
  truncated: boolean;
  citationsRepaired: number;
  citationsUnresolved: number;
  numberResolved: number;
  numberUnknown: number;
  nonNumeric: number;
  outPath: string;
  existed: boolean;
}

export interface ChatCallResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  truncated: boolean;
}

/** Gemini の generateContent。埋め込みと違いこちらはモデルを変えても保存状態に影響しない。 */
async function callGeminiText(
  apiKey: string,
  model: string,
  prompt: string,
  maxOutputTokens: number,
): Promise<ChatCallResult> {
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;
  const res = await requestUrl({
    url: `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`,
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens },
    }),
    throw: false,
  });

  const data = res.json;
  if (!data || data.error) {
    const err = data && data.error ? data.error : null;
    const message = err ? err.message : `HTTP ${res.status}`;
    const detail = err && (err.status || err.code) ? ` [${err.status || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
    throw new Error(`Gemini generateContent エラー: ${message}${detail}`);
  }
  const candidate = Array.isArray(data.candidates) ? data.candidates[0] : null;
  if (!candidate) {
    const blocked = data.promptFeedback && data.promptFeedback.blockReason;
    throw new Error(`Gemini generateContent: candidates が空です${blocked ? `（blockReason: ${blocked}）` : ""}`);
  }
  const parts = candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts : [];
  const text = parts.map((p: { text?: string }) => (typeof p.text === "string" ? p.text : "")).join("");
  if (text.length === 0) throw new Error("Gemini generateContent: 本文が空です");

  const usage = data.usageMetadata || {};
  return {
    text,
    inputTokens: typeof usage.promptTokenCount === "number" ? usage.promptTokenCount : 0,
    outputTokens: typeof usage.candidatesTokenCount === "number" ? usage.candidatesTokenCount : 0,
    // 出力上限で打ち切られると末尾が欠ける。黙って短いまとめになるのを防ぐ
    truncated: candidate.finishReason === "MAX_TOKENS",
  };
}

/* ---------- 検証（SUMMARY_NOTES.md の K1〜K5）---------- */

/** タイムスタンプ（1:54 など）は本文の数値ではないので除く。 */
const TIMESTAMP_RE = /\d{1,2}:\d{2}(?::\d{2})?/g;
const NUMBER_TOKEN_RE = /\d[\d,]*(?:\.\d+)?[ \t]*(?:兆|億|万|千|%|％|倍|円|ドル|ヶ月|か月|カ月|年|月|日|歳|人|件|回|本|社|位|時間|分|秒)?/g;

export function extractNumberTokens(text: string): string[] {
  const cleaned = text.replace(TIMESTAMP_RE, " ");
  const out: string[] = [];
  const matches = cleaned.match(NUMBER_TOKEN_RE);
  if (!matches) return out;
  for (const m of matches) {
    const t = m.replace(/[,\s]/g, "").replace(/％/g, "%");
    if (t.length > 0) out.push(t);
  }
  return out;
}

/** カタカナ語と英数字トークン。固有名詞の代理として使う。 */
/**
 * K2 の抽出条件（2026-09-23 に限定）。
 * 以前は「カタカナ3文字以上」も拾っていたため、「スレッド」「コメント」「ワイ」のような
 * 一般語まで固有名詞として数えて指標が役に立たなかった。
 * 英大文字を含む語か、カタカナと英数字の複合語だけに絞る。
 */
const PROPER_NOUN_RE = /[ァ-ヶー]+[A-Za-z0-9][A-Za-z0-9ァ-ヶー]*|[A-Za-z0-9]+[ァ-ヶー]{2,}|[A-Za-z][A-Za-z0-9.&+-]*[A-Z][A-Za-z0-9.&+-]*/g;

export function extractProperNouns(text: string): string[] {
  const matches = text.match(PROPER_NOUN_RE);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
}

export function extractCitations(text: string): string[] {
  const out: string[] = [];
  const re = /⟨出典:\s*([^⟩]*)⟩/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    for (const name of m[1].split("/")) {
      // モデルは ⟨出典: [ノート名]⟩ と角括弧を付けてくることがある。実在判定の前に外す
      const t = name.trim().replace(/^\[+/, "").replace(/\]+$/, "").trim();
      if (t.length > 0) out.push(t);
    }
  }
  return out;
}

/**
 * 箇条書き行のうち ⟨出典: ⟩ を持たないものを返す（K3）。
 *
 * 免除するもの:
 * - `## 目次` の中身。トピック名の列挙であって主張ではない
 * - 子項目に出典がある導入行（2026-09-25 追加）。ただし免除するのは
 *   「末尾が `：` で、数値を含まない」行だけ。導入行自体が主張や数値を持つなら出典必須のまま
 */
export function findBulletsWithoutCitation(text: string): string[] {
  const lines = text.split(/\r?\n/);
  const indentOf = (line: string): number => (/^(\s*)/.exec(line) || ["", ""])[1].length;

  /** その行の下にぶら下がる、より深い箇条書きに出典があるか。 */
  const hasCitedChild = (index: number): boolean => {
    const base = indentOf(lines[index]);
    for (let j = index + 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim().length === 0) continue;
      if (/^#{1,6}[ \t]/.test(line)) break;
      const isBullet = /^\s*[-*+]\s+\S/.test(line);
      if (isBullet && indentOf(line) <= base) break;       // 兄弟以降に入ったので終わり
      if (isBullet && line.indexOf("⟨出典:") >= 0) return true;
    }
    return false;
  };

  const out: string[] = [];
  let inToc = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = /^#{2,3}[ \t]+(.+?)[ \t]*$/.exec(line);
    if (heading) { inToc = heading[1].trim() === "目次"; continue; }
    if (inToc) continue;
    if (!/^\s*[-*+]\s+\S/.test(line)) continue;
    if (line.indexOf("⟨出典:") >= 0) continue;

    const isLeadIn = /[：:]\s*$/.test(line) && extractNumberTokens(line).length === 0;
    if (isLeadIn && hasCitedChild(i)) continue;
    out.push(line.trim());
  }
  return out;
}

/* ---------- 入力トークンの分あたり上限を守るペース調整（2026-09-26） ---------- */

/**
 * Gemini Flash-Lite 無料枠の実測上限は
 * `generate_content_free_tier_input_token_count, limit: 250000`（1分あたりの入力トークン数）。
 * 仕様に書かれていた TPM 1,000,000 は誤りだった。
 * 大きいチャンネルは1本で 20万トークン前後になるため、連続で投げると2本目で必ず落ちる。
 */
export const GEMINI_FREE_INPUT_TOKENS_PER_MIN = 250000;

/** 文字数からトークン数を見積もる。実測 185,993文字 → 115,536トークン（約0.62）を基準に余裕を持たせる。 */
export function estimateTokensFromChars(chars: number): number {
  return Math.ceil(chars * 0.7);
}

/** 直近60秒に送った入力トークン数を覚えておき、予算を超えないように待たせる。 */
export class TokenRateLimiter {
  private events: Array<{ at: number; tokens: number }> = [];

  constructor(private budgetPerMin: number, private windowMs = 60000) {}

  /** いま `tokens` を送るために待つべきミリ秒。0 なら待たなくてよい。 */
  waitMsFor(tokens: number, now = Date.now()): number {
    this.prune(now);
    let used = 0;
    for (const e of this.events) used += e.tokens;
    if (used + tokens <= this.budgetPerMin) return 0;

    // 古いものから順に窓の外へ出し、予算に収まる時点まで待つ
    let remaining = used + tokens - this.budgetPerMin;
    for (const e of this.events) {
      remaining -= e.tokens;
      if (remaining <= 0) return Math.max(0, e.at + this.windowMs - now);
    }
    // 1件で予算を超える場合は窓が空くまで待つしかない
    const oldest = this.events.length > 0 ? this.events[0].at : now;
    return Math.max(0, oldest + this.windowMs - now);
  }

  record(tokens: number, now = Date.now()): void {
    this.events.push({ at: now, tokens });
    this.prune(now);
  }

  private prune(now: number): void {
    const cutoff = now - this.windowMs;
    while (this.events.length > 0 && this.events[0].at < cutoff) this.events.shift();
  }
}

/* ---------- チャンネル名の正規化とファイル名（2026-09-25） ---------- */

/**
 * frontmatter の `channel` は表記ゆれがある。実測で3組が別チャンネル扱いになっていた。
 *   「海外Yパパラジオ　世界を読み解く」(全角空白) と「海外Yパパラジオ 世界を読み解く」(半角)
 *   「飯塚浩也 ｜ Obsidian…」(全角縦棒) と「飯塚浩也 | Obsidian…」(半角)
 *   「まさやん【AIギルドch】- …」と「まさやんAIギルドch- …」
 * このまま作ると同じチャンネルのまとめノートが2本できるので、突き合わせ用の鍵を作る。
 */
export function normalizeChannelKey(channel: string): string {
  return channel
    .replace(/[｜|]/g, "")
    .replace(/[【】\[\]（）()]/g, "")
    .replace(/[\s　]/g, "")
    .replace(/[-－ー–—]/g, "")
    .toLowerCase();
}

/** Windows のファイル名に使えない文字を落とす。`飯塚浩也 | Obsidian…` の `|` が実際に該当する。 */
export function toSafeFileName(name: string, maxLength = 80): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/[\s　]+/g, " ")
    .replace(/^\.+/, "")
    .trim();
  return (cleaned.length > maxLength ? cleaned.slice(0, maxLength).trim() : cleaned) || "untitled";
}

export interface ChannelGroup {
  /** 表示・frontmatter に使う名前（そのグループで最も多く使われている表記） */
  displayName: string;
  /** 同じチャンネルとして束ねた表記のゆれ（2つ以上なら統合が起きている） */
  variants: string[];
  notes: SummarySourceNote[];
  chars: number;
}

/** チャンネル名の表記ゆれを吸収してノートをグループ化する。 */
export function groupNotesByChannel(entries: Array<{ channel: string; note: SummarySourceNote }>): ChannelGroup[] {
  const buckets = new Map<string, { counts: Map<string, number>; notes: SummarySourceNote[]; chars: number }>();
  for (const e of entries) {
    if (!e.channel) continue;
    const key = normalizeChannelKey(e.channel);
    if (key.length === 0) continue;
    let b = buckets.get(key);
    if (!b) { b = { counts: new Map(), notes: [], chars: 0 }; buckets.set(key, b); }
    b.counts.set(e.channel, (b.counts.get(e.channel) || 0) + 1);
    b.notes.push(e.note);
    b.chars += e.note.body.length;
  }

  const out: ChannelGroup[] = [];
  buckets.forEach((b) => {
    let displayName = "";
    let best = -1;
    const variants: string[] = [];
    b.counts.forEach((count, name) => {
      variants.push(name);
      if (count > best) { best = count; displayName = name; }
    });
    out.push({ displayName, variants, notes: b.notes, chars: b.chars });
  });
  out.sort((a, b) => b.chars - a.chars);
  return out;
}

/* ---------- K1a / K1b の切り分け（2026-09-23） ---------- */

/**
 * K1a（制度・統計・商品仕様の数値）を判定するための手がかり語。
 * 仕様には「制度名・調査機関名・商品名・料金・リターン率・日付と同じ行にあるもの」とあるが
 * 語の一覧までは決まっていないため、実データから拾ってここに置いている。調整可能。
 */
const K1A_MARKERS = [
  // 制度
  "NISA", "iDeCo", "確定拠出年金", "年金", "税制", "控除", "非課税", "課税", "特定口座",
  "ふるさと納税", "社会保険", "健康保険", "住民税", "所得税", "給付", "補助",
  // 調査・統計
  "調査", "統計", "平均", "中央値", "世帯", "割合", "分布", "上位", "committee",
  "金融広報", "野村総研", "総務省", "厚生労働", "国税庁", "GPIF", "機構", "委員会", "白書",
  // 商品・サービス
  "カード", "クレカ", "Pay", "ペイ", "ETF", "ファンド", "投資信託", "投信", "指数",
  "S&P", "オルカン", "アプリ", "プラン", "証券", "銀行", "保険", "ローン", "口座連携",
  // 料金・率
  "年会費", "月額", "手数料", "料金", "還元", "利回り", "年利", "リターン", "金利",
  "配当", "利率", "上限", "限度", "無料", "有料", "価格", "定価",
];

const YEAR_RE = /(19|20)\d{2}\s*年/;

/** その行の数値を K1a（制度・統計・商品仕様）として扱うか。 */
export function isK1aLine(line: string): boolean {
  if (YEAR_RE.test(line)) return true;
  for (const marker of K1A_MARKERS) {
    if (line.indexOf(marker) >= 0) return true;
  }
  return false;
}

/** 行単位で数値を拾い、K1a と K1b に振り分ける。 */
export function collectNumbersByClass(text: string): { k1a: Map<string, string>; k1b: Map<string, string> } {
  const k1a = new Map<string, string>();
  const k1b = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const tokens = extractNumberTokens(line);
    if (tokens.length === 0) continue;
    const target = isK1aLine(line) ? k1a : k1b;
    const context = line.trim().slice(0, 120);
    for (const t of tokens) if (!target.has(t)) target.set(t, context);
  }
  return { k1a, k1b };
}

/** K1b: 「◯◯の報告値は △△ 〜 □□（n=件数）」形式になっているかを見る。 */
const AGGREGATE_RE = /（\s*n\s*=\s*\d+\s*[^）]*）|\(\s*n\s*=\s*\d+\s*[^)]*\)/;
const RANGE_RE = /[〜~～]/;

export interface AggregateCheck {
  line: string;
  hasRange: boolean;
  hasCount: boolean;
}

/** 「報告値」を含む行を集め、範囲と件数が書かれているかを判定する。 */
export function checkAggregateLines(text: string): AggregateCheck[] {
  const out: AggregateCheck[] = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.indexOf("報告値") < 0) continue;
    out.push({ line: line.trim(), hasRange: RANGE_RE.test(line), hasCount: AGGREGATE_RE.test(line) });
  }
  return out;
}

/* ---------- K4: 出典名の近似マッチ補正 ---------- */

/** 比較用にファイル名を正規化する。全角半角や記号のゆれを吸収する。 */
function normalizeTitleForMatch(title: string): string {
  return title
    .replace(/[\[\]【】（）()「」『』]/g, "")
    .replace(/[ｗWwＷ]/g, "")
    .replace(/[\s　]/g, "")
    .replace(/[！!？?。、,.／/・]/g, "")
    .toLowerCase();
}

/** 2つの文字列の最長共通部分列の長さ（短い方に対する割合を出すのに使う）。 */
function lcsLength(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  let cur = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    const tmp = prev; prev = cur; cur = tmp;
    cur.fill(0);
  }
  return prev[b.length];
}

export interface CitationFix {
  before: string;
  after: string | null;   // null = 補正できなかった（捏造）
  similarity: number;
}

/**
 * 出典名を実在ファイル名に寄せる。
 * このチャンネルは `〜2chお金スレ` と `〜2ch有益スレ` が混在していて、
 * モデルが接頭辞・接尾辞を取り違える。内容は正しいのでリンク切れだけ直す。
 */
export function matchCitationToTitle(name: string, titles: string[], threshold = 0.85): CitationFix {
  const target = normalizeTitleForMatch(name);
  let best: string | null = null;
  let bestScore = 0;
  for (const t of titles) {
    const cand = normalizeTitleForMatch(t);
    const len = lcsLength(target, cand);
    const score = len / Math.max(target.length, cand.length);
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return { before: name, after: bestScore >= threshold ? best : null, similarity: Number(bestScore.toFixed(3)) };
}

/**
 * 行全体が `- **〇〇**` だけの箇条書きを `### 〇〇` に格上げする（2026-09-30 追加）。
 *
 * モデルはルール6（小見出しを箇条書きにしない）を守りきれず、見出しだけの箇条書きを作る。
 * 内容を持たないので出典が付けられず、K3 で出典なしとして数えられてしまう。
 *
 * 触らないもの:
 * - 本文を含む行（`- **30万〜100万円**: 最初の壁は…`）。情報が入っているので箇条書きのまま
 * - インデントされた行（`  - **レイヤー1**:`）。子項目を持つ入れ子の親なので、
 *   見出しに格上げすると階層が壊れる
 */
const BOLD_ONLY_BULLET_RE = /^[-*+][ \t]+\*\*(.+?)\*\*[ \t]*[:：]?[ \t]*$/;

export function promoteBoldOnlyBullets(text: string): { text: string; promoted: number } {
  let promoted = 0;
  const out = text.split(/\r?\n/).map((line) => {
    const m = BOLD_ONLY_BULLET_RE.exec(line);
    if (!m) return line;
    const title = m[1].trim();
    if (title.length === 0) return line;
    promoted++;
    return `### ${title}`;
  });
  return { text: out.join("\n"), promoted };
}

/**
 * `⟨ノート名⟩` のように `出典:` を落としてくることがある（実測 101 箇所）。
 * ラベルが無いだけで出典としては正しいので、判定の前に形を揃える。
 */
export function normalizeCitationLabels(text: string): { text: string; added: number } {
  let added = 0;
  const fixed = text.replace(/⟨\s*([^⟩]*)⟩/g, (whole, inner: string) => {
    const body = inner.trim();
    if (body.length === 0) return whole;
    if (/^出典\s*[:：]/.test(body)) return whole;
    added++;
    return `⟨出典: ${body}⟩`;
  });
  return { text: fixed, added };
}

/** まとめノート本文の ⟨出典: ...⟩ を実在名に置き換える。直せないものは ⟨出典: 不明⟩ にする。 */
export function fixCitationsInText(text: string, titles: string[]): { text: string; fixes: CitationFix[]; labelsAdded: number } {
  const fixes: CitationFix[] = [];
  const known = new Set(titles);
  const cache = new Map<string, CitationFix>();
  const normalized = normalizeCitationLabels(text);

  const fixed = normalized.text.replace(/⟨出典:\s*([^⟩]*)⟩/g, (_whole, inner: string) => {
    const names = inner.split("/").map((x: string) => x.trim()).filter((x: string) => x.length > 0);
    const resolved: string[] = [];
    let anyUnknown = false;

    for (const raw of names) {
      const name = raw.replace(/^\[+/, "").replace(/\]+$/, "").trim();
      if (name.length === 0) continue;
      // 「不明」は前回の補正で置いた印。再補正で二重に数えない
      if (name === "同上" || name === "不明" || known.has(name)) { resolved.push(name); continue; }

      let fix = cache.get(name);
      if (!fix) { fix = matchCitationToTitle(name, titles); cache.set(name, fix); fixes.push(fix); }
      if (fix.after) resolved.push(fix.after);
      else anyUnknown = true;
    }

    if (resolved.length === 0) return "⟨出典: 不明⟩";
    // 一部だけ直せなかった場合は、直せた分を残したうえで不明を併記する
    return `⟨出典: ${resolved.join(" / ")}${anyUnknown ? " / 不明" : ""}⟩`;
  });

  return { text: fixed, fixes, labelsAdded: normalized.added };
}

/* =========================================================================
 * ハイブリッド検索（ベクトル + キーワード → RRF）
 * ========================================================================= */

export interface SearchCandidate {
  chunkIndex: number;
  cosine: number;               // ベクトル検索のスコア（正規化済みなので内積＝コサイン）
  vectorRank: number | null;    // 1始まり。ベクトル検索の上位に入らなければ null
  keywordScore: number | null;
  keywordTerms: number | null;  // 一致した語の数
  keywordRank: number | null;   // 1始まり
  rrf: number;
}

export interface SearchTiming {
  embedMs: number;
  vectorMs: number;
  keywordMs: number;
  rrfMs: number;
  totalMs: number;
}

export interface SearchResult {
  query: string;
  terms: string[];                 // 語分割の結果
  vectorOnly: SearchCandidate[];   // ベクトル検索のみの並び（上位 vectorTopK）
  fused: SearchCandidate[];        // RRF 統合後（maxChunksPerNote 未適用）
  capped: SearchCandidate[];       // RRF 統合後（maxChunksPerNote 適用）
  keywordHits: number;             // キーワード検索でスコアが付いたチャンク数
  timing: SearchTiming;
}

/**
 * 質問文を語に区切る（2026-09-30 追加）。
 *
 * `prepareSimpleSearch()` はクエリを空白で分割するが、日本語には空白がないため
 * 質問文全体が 1 語になり、部分一致でまず当たらない（実測: 5,631 チャンクに対しヒット 0 件）。
 * 語そのものは存在する（`NotebookLM` 110 チャンク / `新NISA` 397 チャンク）。
 *
 * ここでやるのは**前処理だけ**。索引もスコアリングも作らず、区切った語を
 * `prepareSimpleSearch()` に 1 語ずつ渡す。語の重みづけ（一般語を下げる等）は入れない。
 * 助詞はひらがななので、カタカナ語・漢字語・英数字語は壊れない。
 */
const QUERY_DELIMITERS = /(?:から|まで|より|って|[のはがをにでともへや、。・？?！!\s　])+/g;

export function tokenizeQuery(query: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const part of query.split(QUERY_DELIMITERS)) {
    const t = part.trim();
    if (t.length < 2) continue;      // 1 文字しかない語は捨てる
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/**
 * 正規化済みベクトル同士の内積。保存時に L2 正規化しているので、これがそのままコサイン類似度。
 * 5,631 チャンク × 1536 次元の総当たりで約 865 万回の乗算。
 */
export function dotProduct(a: Float32Array, aOffset: number, b: Float32Array, dimensions: number): number {
  let sum = 0;
  for (let i = 0; i < dimensions; i++) sum += a[aOffset + i] * b[i];
  return sum;
}

/** RRF: 順位の逆数を足し合わせる。スコアの絶対値を使わないので値域の違いに影響されない。 */
export function rrfScore(ranks: Array<number | null>, rrfK: number): number {
  let score = 0;
  for (const rank of ranks) if (rank !== null) score += 1 / (rrfK + rank);
  return score;
}

/** 1つのノートから採るチャンク数に上限をかける。上限を超えた分は飛ばして次のノートへ。 */
export function capPerNote(candidates: SearchCandidate[], chunks: Chunk[], maxPerNote: number, limit: number): SearchCandidate[] {
  const used = new Map<string, number>();
  const out: SearchCandidate[] = [];
  for (const c of candidates) {
    if (out.length >= limit) break;
    const path = chunks[c.chunkIndex].path;
    const n = used.get(path) || 0;
    if (n >= maxPerNote) continue;
    used.set(path, n + 1);
    out.push(c);
  }
  return out;
}

/* =========================================================================
 * 回答生成（ステップ5）
 *
 * 埋め込みと違い、回答生成はモデルが変わっても保存状態に影響しないのでフォールバックを入れる。
 * ========================================================================= */

interface ChatModelInfo {
  id: string;
  provider: "anthropic" | "gemini" | "openai";
  label: string;
}

/** ../My-YouTube-Summarizer-Plugin の MODEL_REGISTRY を流用し、このプラグインで使うモデルに絞った。 */
const CHAT_MODEL_REGISTRY: ChatModelInfo[] = [
  { id: "claude-haiku-4-5", provider: "anthropic", label: "Claude Haiku 4.5" },
  { id: "claude-sonnet-5", provider: "anthropic", label: "Claude Sonnet 5" },
  { id: "claude-opus-5", provider: "anthropic", label: "Claude Opus 5" },
  { id: "gemini-3.5-flash-lite", provider: "gemini", label: "Gemini 3.5 Flash-Lite" },
  { id: "gemini-3.5-flash", provider: "gemini", label: "Gemini 3.5 Flash" },
  { id: "gpt-5.6-luna", provider: "openai", label: "GPT-5.6 Luna" },
  { id: "gpt-5.6-terra", provider: "openai", label: "GPT-5.6 Terra" },
];

export function getChatModelInfo(modelId: string): ChatModelInfo {
  for (const m of CHAT_MODEL_REGISTRY) if (m.id === modelId) return m;
  // 未知の ID は Anthropic 扱いにする（既定の chatModelPriority が Claude 中心のため）
  return { id: modelId, provider: "anthropic", label: modelId };
}

export function getChatModelLabel(modelId: string): string {
  return modelId ? getChatModelInfo(modelId).label : "未使用";
}

/** モデル ID から使う API キーを引く（流用元と同じ考え方）。 */
export function getApiKeyForChatModel(settings: VaultRagSettings, modelId: string): string {
  const provider = getChatModelInfo(modelId).provider;
  if (provider === "gemini") return settings.geminiApiKey;
  if (provider === "openai") return settings.openaiApiKey;
  return settings.claudeApiKey;
}

/** API キーが設定済みのモデルだけを候補にする。manual なら先頭のみ。 */
export function getCallableChatModelIds(settings: VaultRagSettings): string[] {
  const candidates = settings.chatFallbackMode === "manual"
    ? settings.chatModelPriority.slice(0, 1)
    : settings.chatModelPriority;
  return candidates.filter((id) => getApiKeyForChatModel(settings, id).length > 0);
}

const CHAT_PRICING: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
  "claude-sonnet-5": { input: 2.0, output: 10.0 },
  "claude-opus-5": { input: 5.0, output: 25.0 },
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
  "gemini-3.5-flash": { input: 1.5, output: 9.0 },
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
  "gpt-5.6-terra": { input: 2.0, output: 12.0 },
};

export function calcChatCostUsd(model: string, inputTokens: number, outputTokens: number): number {
  const p = CHAT_PRICING[model] || CHAT_PRICING["claude-haiku-4-5"];
  return (inputTokens / 1_000_000) * p.input + (outputTokens / 1_000_000) * p.output;
}

/**
 * その呼び出しが無料枠か。`geminiFreeTier` が on で、使ったモデルが Gemini のときだけ true。
 * `totalCostUsd` は「実際に払った金額」の累計にするので、無料枠の分は入れない。
 * Claude / OpenAI は常に課金対象。Gemini が上限に当たって Claude に切り替わった回答は
 * Claude の費用として加える（モデル名で判定するのでそうなる）。
 */
export function isFreeTierChatUsage(settings: VaultRagSettings, modelId: string): boolean {
  return settings.geminiFreeTier === true && getChatModelInfo(modelId).provider === "gemini";
}

/** `totalCostUsd` に加える金額。無料枠なら 0。表示用の「有料換算」は calcChatCostUsd を使う。 */
export function chargeableChatCostUsd(
  settings: VaultRagSettings, modelId: string, inputTokens: number, outputTokens: number,
): number {
  if (isFreeTierChatUsage(settings, modelId)) return 0;
  return calcChatCostUsd(modelId, inputTokens, outputTokens);
}

/** 参考ノートの本文。CLAUDE.md「ユーザープロンプトの構造」の通り。 */
export function buildAnswerUserPrompt(query: string, hits: SearchCandidate[], chunks: Chunk[]): string {
  const parts: string[] = ["## 参考ノート", ""];
  for (let i = 0; i < hits.length; i++) {
    const c = chunks[hits[i].chunkIndex];
    const head = [c.title, c.channel, c.date].filter((v) => v && v.length > 0).join("｜");
    parts.push(`[${i + 1}] ${head}`);
    parts.push(c.text);
    parts.push("");
  }
  parts.push("## 質問");
  parts.push(query);
  return parts.join("\n");
}

/**
 * 出典ブロックはモデルに書かせず、コード側で finalTopK の結果から機械的に作る。
 * R2（必ず出典を表示する）を 100% 保証するため。
 * 欠損フィールドは項目ごと省く（空文字やプレースホルダを出さない）。
 */
/** 回答本文から `[N]` 形式の出典番号を集める。出典ブロック自体は渡さない。 */
export function extractReferencedNumbers(answerBody: string): Set<number> {
  const out = new Set<number>();
  for (const m of answerBody.matchAll(/\[(\d+)\]/g)) {
    const n = parseInt(m[1], 10);
    if (isFinite(n)) out.add(n);
  }
  return out;
}

interface CitationGroup {
  path: string;
  numbers: number[];     // そのノートに当たる番号（昇順）
  chunk: Chunk;
  referenced: boolean;   // 番号のどれか1つでも本文で参照されているか
}

/** 同じ `Chunk.path` のヒットを1グループにまとめる。グループは最小番号の昇順。 */
export function groupCitationsByNote(
  hits: SearchCandidate[],
  chunks: Chunk[],
  referenced: Set<number>,
): CitationGroup[] {
  const byPath = new Map<string, CitationGroup>();
  for (let i = 0; i < hits.length; i++) {
    const c = chunks[hits[i].chunkIndex];
    const num = i + 1;
    let g = byPath.get(c.path);
    if (!g) { g = { path: c.path, numbers: [], chunk: c, referenced: false }; byPath.set(c.path, g); }
    g.numbers.push(num);
    if (referenced.has(num)) g.referenced = true;
  }
  const groups = Array.from(byPath.values());
  for (const g of groups) g.numbers.sort((a, b) => a - b);
  // 行の順序は各ノートの最小番号の昇順
  groups.sort((a, b) => a.numbers[0] - b.numbers[0]);
  return groups;
}

function formatCitationLine(g: CitationGroup): string {
  const c = g.chunk;
  const meta = [c.channel, c.date].filter((v) => v && v.length > 0).join("・");
  // `[[パス|タイトル]]` 形式。ファイル名だけだと、同じ basename の別ノートが開く
  // （実測: 対象フォルダ内に 5 組。`講義10 推論` は年度違いの別講義）
  const linkPath = c.path.endsWith(".md") ? c.path.slice(0, -3) : c.path;
  // 番号は範囲表記にせず全部並べる
  let line = `${g.numbers.map((n) => `[${n}]`).join("")} [[${linkPath}|${c.title}]]`;
  if (meta.length > 0) line += `（${meta}）`;
  if (c.url && c.url.length > 0) line += ` — [動画](${c.url})`;
  return line;
}

const CITATION_HEADING = "### 出典";
const UNREFERENCED_HEADING = "### 検索で見つかった他のノート（本文では未参照）";

/**
 * 出典ブロックを組み立てる。
 *
 * - 同じノートのヒットは 1 行にまとめ、番号を昇順で並べる（`[1][2][7]`）
 * - 本文で参照された番号を持つノートと、持たないノートを別の見出しに分ける
 * - 本文中の `[N]` の番号は振り直さない。検索結果の順位がそのまま番号になる
 *
 * **本文の参照が 0 件のときは `### 出典` の見出しを出さない。**
 * R3 の「該当する情報がノート内に見つかりませんでした」に「出典」と付けると、
 * その回答の根拠に見えてしまう。何を検索で見つけたかは見せたいので行は消さず、
 * 全行を未参照の見出しの下に出す。
 */
export function buildCitationBlock(hits: SearchCandidate[], chunks: Chunk[], answerBody = ""): string {
  const referenced = extractReferencedNumbers(answerBody);
  const groups = groupCitationsByNote(hits, chunks, referenced);

  const cited = groups.filter((g) => g.referenced);
  const uncited = groups.filter((g) => !g.referenced);

  const lines: string[] = ["", "---"];

  // 参照が 1 件も無いとき（R3 の「見つかりませんでした」など）は「出典」を名乗らない
  if (cited.length === 0) {
    lines.push(UNREFERENCED_HEADING);
    for (const g of groups) lines.push(formatCitationLine(g));
    return lines.join("\n");
  }

  lines.push(CITATION_HEADING);
  for (const g of cited) lines.push(formatCitationLine(g));
  if (uncited.length > 0) {
    lines.push("");
    lines.push(UNREFERENCED_HEADING);
    for (const g of uncited) lines.push(formatCitationLine(g));
  }
  return lines.join("\n");
}

/**
 * モデルが `[1, 2, 3]` とカンマ区切りで書いてくる箇所を `[1][2][3]` に直す（2026-09-30 追加）。
 * プロンプトは「[1] [2] の形式」と指定しているが、Gemini は一部でカンマ区切りを使う
 * （実測: Q1 に 2 箇所 / Q3 に 4 箇所）。プロンプトは変えず、後処理で揃える。
 * 全角カンマ・読点・中黒の区切りも対象にする。
 */
export function normalizeCitationRefs(text: string): { text: string; fixed: number } {
  let fixed = 0;
  const out = text.replace(/\[\s*(\d+(?:\s*[,、，・]\s*\d+)+)\s*\]/g, (_whole, inner: string) => {
    const nums = inner.split(/[,、，・]/).map((x) => x.trim()).filter((x) => x.length > 0);
    if (nums.length < 2) return _whole;
    fixed++;
    return nums.map((n) => `[${n}]`).join("");
  });
  return { text: out, fixed };
}

/** R3 の決まり文句。ANSWER_SYSTEM_PROMPT のルール3と同じ文字列。 */
const NOT_FOUND_ANSWER = "該当する情報がノート内に見つかりませんでした";

/**
 * 最初の段落が「該当する情報がノート内に見つかりませんでした」だけの回答から、
 * その段落の `[N]` を取り除く（2026-10-10 追加）。
 * Gemini はこの回答にも `[N]` を付けることがあり、そのままだと出典ブロックが
 * `### 出典` になって、何も根拠にしていない回答の根拠に見える。
 * ANSWER_SYSTEM_PROMPT への追記では直らなかった（2026-10-04）ので、後処理で直す。
 *
 * - 最初の段落 = 先頭から、最初の空行（空白だけの行を含む）の手前まで
 * - 判定: 最初の段落から `[N]` をすべて除き、前後の空白と末尾の「。」を除いた残りが
 *   NOT_FOUND_ANSWER と完全に一致するか
 * - 一致したら、最初の段落の `[N]` だけを、直前の空白（半角・全角）ごと取り除く
 *   （`でした [3]。` → `でした。`）。2 段落目以降の `[N]` は残す
 *   （後ろの段落で本当にノートを引用している場合に、正しい出典を消さないため）
 * - 一致しなければ何もしない（一部だけ見つかった回答の出典番号は残す）
 *
 * normalizeCitationRefs() の後、buildCitationBlock() の前に通す。
 * `[N]` の形は extractReferencedNumbers() と同じ。
 */
export function stripNotFoundCitations(text: string): { text: string; stripped: number } {
  const lines = text.split("\n");
  let end = lines.findIndex((l) => l.trim().length === 0);
  if (end < 0) end = lines.length;

  const rest = lines.slice(0, end).join("\n").replace(/\[\d+\]/g, "").trim().replace(/。$/, "").trim();
  if (rest !== NOT_FOUND_ANSWER) return { text, stripped: 0 };

  // [N] の直前の空白（半角・全角）も一緒に取り除く。残すと「でした 。」になる
  let stripped = 0;
  for (let i = 0; i < end; i++) {
    lines[i] = lines[i].replace(/[ 　]*\[\d+\]/g, () => { stripped++; return ""; });
  }
  return { text: lines.join("\n"), stripped };
}

export interface AnswerResult {
  query: string;
  answer: string;          // モデルの本文
  citations: string;       // コード生成の出典ブロック
  modelUsed: string;
  attempts: Array<{ model: string; error: string }>;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;         // 有料ティアで計算した金額（表示用）
  chargedUsd: number;      // 実際に totalCostUsd に加えた金額。無料枠なら 0
  freeTier: boolean;       // この回答が無料枠だったか
  hits: SearchCandidate[];
  elapsedMs: number;
  citationRefsFixed: number;   // [1, 2] → [1][2] に直した箇所数
}

/** Anthropic Messages API。 */
async function callClaudeText(
  apiKey: string, model: string, systemPrompt: string, userPrompt: string, maxTokens: number,
): Promise<ChatCallResult> {
  const res = await requestUrl({
    url: "https://api.anthropic.com/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
    throw: false,
  });

  const data = res.json;
  if (!data || data.error) {
    const err = data && data.error ? data.error : null;
    const message = err ? err.message : `HTTP ${res.status}`;
    const detail = err && err.type ? ` [${err.type}]` : ` [HTTP ${res.status}]`;
    throw new Error(`Claude API エラー: ${message}${detail}`);
  }
  const blocks = Array.isArray(data.content) ? data.content : [];
  const text = blocks.map((b: { type?: string; text?: string }) => (b && b.type === "text" && typeof b.text === "string" ? b.text : "")).join("");
  if (text.length === 0) throw new Error("Claude API から本文が返りませんでした");
  const usage = data.usage || {};
  return {
    text,
    inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : 0,
    outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : 0,
    truncated: data.stop_reason === "max_tokens",
  };
}

/** OpenAI Responses API。 */
async function callOpenAiText(
  apiKey: string, model: string, systemPrompt: string, userPrompt: string, maxTokens: number,
): Promise<ChatCallResult> {
  const res = await requestUrl({
    url: "https://api.openai.com/v1/responses",
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      instructions: systemPrompt,
      input: [{ type: "message", role: "user", content: [{ type: "input_text", text: userPrompt }] }],
      max_output_tokens: maxTokens,
    }),
    throw: false,
  });
  const data = res.json;
  if (!data || data.error) {
    const err = data && data.error ? data.error : null;
    const message = err ? err.message : `HTTP ${res.status}`;
    const detail = err && (err.type || err.code) ? ` [${err.type || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
    throw new Error(`OpenAI API エラー: ${message}${detail}`);
  }
  const output = Array.isArray(data.output) ? data.output : [];
  let text = "";
  for (const item of output) {
    const content = item && Array.isArray(item.content) ? item.content : [];
    for (const c of content) if (c && c.type === "output_text" && typeof c.text === "string") text += c.text;
  }
  if (text.length === 0) throw new Error("OpenAI API から本文が返りませんでした");
  const usage = data.usage || {};
  return {
    text,
    inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : 0,
    outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : 0,
    truncated: data.status === "incomplete",
  };
}

/** system は Gemini では systemInstruction に入れる。 */
async function callGeminiChat(
  apiKey: string, model: string, systemPrompt: string, userPrompt: string, maxTokens: number,
): Promise<ChatCallResult> {
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;
  const res = await requestUrl({
    url: `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`,
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: maxTokens },
    }),
    throw: false,
  });
  const data = res.json;
  if (!data || data.error) {
    const err = data && data.error ? data.error : null;
    const message = err ? err.message : `HTTP ${res.status}`;
    const detail = err && (err.status || err.code) ? ` [${err.status || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
    throw new Error(`Gemini API エラー: ${message}${detail}`);
  }
  const candidate = Array.isArray(data.candidates) ? data.candidates[0] : null;
  if (!candidate) throw new Error("Gemini API から candidates が返りませんでした");
  const parts = candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts : [];
  const text = parts.map((p: { text?: string }) => (typeof p.text === "string" ? p.text : "")).join("");
  if (text.length === 0) throw new Error("Gemini API から本文が返りませんでした");
  const usage = data.usageMetadata || {};
  return {
    text,
    inputTokens: typeof usage.promptTokenCount === "number" ? usage.promptTokenCount : 0,
    outputTokens: typeof usage.candidatesTokenCount === "number" ? usage.candidatesTokenCount : 0,
    truncated: candidate.finishReason === "MAX_TOKENS",
  };
}

export async function callChatModel(
  settings: VaultRagSettings, modelId: string, systemPrompt: string, userPrompt: string,
): Promise<ChatCallResult> {
  const apiKey = getApiKeyForChatModel(settings, modelId);
  const provider = getChatModelInfo(modelId).provider;
  const maxTokens = settings.answerMaxTokens;
  if (provider === "gemini") return callGeminiChat(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
  if (provider === "openai") return callOpenAiText(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
  return callClaudeText(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
}

/**
 * CLAUDE.md「回答生成仕様 > システムプロンプト（要件 R1・R3 の実装。変更禁止）」から機械的に転記した。
 * ⛔ 要約・言い換え・加筆をしてはいけない。R1（ノートの情報だけを使う）と
 *    R3（無ければ「見つかりませんでした」と答える）の実装そのもの。
 */
const ANSWER_SYSTEM_PROMPT = `あなたはユーザーのObsidianノートに対する質問応答アシスタントです。

## 絶対ルール
1. 以下に与えられた「参考ノート」に書かれている情報だけを使って回答すること。
2. あなたが学習で得た知識を使って補完してはならない。参考ノートに書かれていない
   ことは、たとえ一般常識であっても書いてはならない。
3. 参考ノートに答えが見つからない場合は、推測せず
   「該当する情報がノート内に見つかりませんでした」とだけ答えること。
   その上で、どういう語で検索し直すと見つかりそうかを提案してよい。
4. 回答の各主張の直後に、根拠となったノートの番号を [1] [2] の形式で付けること。
5. 参考ノートの内容が互いに矛盾している場合は、どちらが正しいか判断せず、
   両方の主張を出典付きで併記すること。

## 参考ノートの性質（重要）
参考ノートはすべてYouTube動画の要約です。つまり動画の話者の主張であり、
検証された事実ではありません。数字・時期・制度・固有名詞については
「〜と述べられています」という伝聞の形で書くこと。断定しないこと。`;

/* =========================================================================
 * 回答パネル（右サイドバー）と質問モーダル
 * ========================================================================= */

const ANSWER_VIEW_TYPE = "vault-rag-answer";

class VaultRagAnswerView extends ItemView {
  private markdown = "";
  private answerBody = "";  // コピー対象（出典・フッターなし）

  constructor(leaf: WorkspaceLeaf, private plugin: VaultRagPlugin) {
    super(leaf);
  }

  getViewType(): string { return ANSWER_VIEW_TYPE; }
  getDisplayText(): string { return "Vault RAG の回答"; }
  getIcon(): string { return "search"; }

  async onOpen(): Promise<void> {
    await this.render(this.markdown || "_まだ回答がありません。コマンド「Vault RAG: 質問する」を実行してください。_");
  }

  /**
   * Markdown をレンダリングする。answerBody を渡すとコピーボタンを表示する。
   *
   * ⚠ `MarkdownRenderer.render` は `a.internal-link` の DOM を作るが、
   * 独自の `ItemView` ではクリック処理を付けてくれない（落とし穴#31）。
   * DOM は正しく生成されるためリンクに見えるが、押しても何も起きない。
   * そのため下の `registerLinkHandlers()` で自分で `openLinkText()` を呼ぶ。
   *
   * `sourcePath` は空文字を渡す。出典は `[[パス|タイトル]]` 形式で
   * Vault ルートからのパスを書いているので、相対解決は不要。
   */
  async render(markdown: string, answerBody = ""): Promise<void> {
    this.markdown = markdown;
    this.answerBody = answerBody;
    const el = this.contentEl;
    el.empty();
    el.addClass("vault-rag-answer");

    if (answerBody) {
      const toolbar = el.createDiv({ cls: "vault-rag-toolbar" });
      const copyBtn = toolbar.createEl("button", { cls: "vault-rag-copy-btn", text: "コピー" });
      this.registerDomEvent(copyBtn, "click", () => {
        navigator.clipboard.writeText(this.answerBody).then(
          () => {
            copyBtn.textContent = "✓ コピーしました";
            setTimeout(() => { copyBtn.textContent = "コピー"; }, 2000);
          },
          () => { new Notice("クリップボードへのコピーに失敗しました"); },
        );
      });
    }

    const body = el.createDiv({ cls: "markdown-rendered" });
    await MarkdownRenderer.render(this.app, markdown, body, "", this);
    this.registerLinkHandlers(body);
  }

  /**
   * 内部リンクのクリックを拾ってノートを開く。
   * `registerDomEvent` で登録しているので、ビューを閉じると自動で解除される。
   * 中クリックは `click` ではなく `auxclick` で来るため両方を登録する。
   */
  private registerLinkHandlers(container: HTMLElement): void {
    const open = (evt: MouseEvent): void => {
      const target = evt.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest("a.internal-link") as HTMLAnchorElement | null;
      if (!anchor) return;

      // data-href が本来のリンク先。無い場合だけ href を見る
      const linktext = anchor.getAttr("data-href") || anchor.getAttr("href");
      if (!linktext) return;

      evt.preventDefault();
      // Ctrl/Cmd+クリックと中クリックは新しいタブ。通常クリックは現在のタブ
      this.app.workspace.openLinkText(linktext, "", Keymap.isModEvent(evt));
    };

    this.registerDomEvent(container, "click", open);
    this.registerDomEvent(container, "auxclick", (evt: MouseEvent) => {
      if (evt.button !== 1) return;   // 中ボタンだけ
      open(evt);
    });
  }
}

class AskModal extends Modal {
  private query = "";

  constructor(app: App, private onSubmit: (query: string) => Promise<void>) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "🔍 ノートに質問する" });

    contentEl.createEl("p", {
      text: "自分のノートに書かれている情報だけを根拠に回答します。見つからない場合は「見つかりませんでした」と答えます。",
      cls: "vault-rag-desc",
    });

    const input = contentEl.createEl("textarea", { cls: "vault-rag-query" });
    input.rows = 4;
    input.style.width = "100%";
    input.placeholder = "例: 新NISAで最初にやるべきことは？";
    input.addEventListener("input", () => { this.query = input.value; });
    input.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Enter") {
        if (ev.ctrlKey || ev.metaKey) {
          // Ctrl+Enter: 改行（デフォルト動作に任せる）
        } else {
          ev.preventDefault();
          this.submit();
        }
      }
    });

    contentEl.createEl("p", {
      text: "Enter で送信 ／ 改行は Ctrl+Enter ／ 実行中は Esc で中断",
      cls: "vault-rag-desc",
    });

    new Setting(contentEl).addButton((b) =>
      b.setButtonText("検索して回答 ▶").setCta().onClick(() => { this.submit(); }),
    );
    input.focus();
  }

  private submit(): void {
    const q = this.query.trim();
    if (q.length === 0) {
      new Notice("Vault RAG: 質問を入力してください", 5000);
      return;
    }
    this.close();
    void this.onSubmit(q);
  }

  onClose(): void { this.contentEl.empty(); }
}

/* =========================================================================
 * まとめノートの更新（2026-10-03）
 *
 * 変更があったチャンネルのまとめノートを丸ごと作り直す。増分追記はしない。
 * チャンネルの単位は frontmatter の `channel` 値（9/30 の全件生成と同じグループ化）。
 * ========================================================================= */

const SUMMARY_STATE_FILE = "summary-state.json";
const SUMMARY_BACKUP_DIR = "summary-backup";
export const SUMMARY_STATE_VERSION = 1;

/** 文字数からの入力トークン推定。2chお金スレの実測（191,820文字 → 115,757トークン）による。 */
export const TOKENS_PER_CHAR = 0.603;

export function estimateInputTokens(chars: number): number {
  return Math.round(chars * TOKENS_PER_CHAR);
}

/**
 * 新しいまとめが前の版のこの割合を下回ったら上書きしない（落とし穴#33）。
 * 実測: 正常だった飯塚が 89.8%、劣化した海外Yパパが 27.5%。
 * 形式の検査（K1b / K3 / K4）は形式しか見ないので内容の減少を検出できない。
 * 設定画面には出さない。
 */
export const SUMMARY_MIN_RATIO_VS_PREVIOUS = 0.5;

/**
 * 1 チャンネルを作り直すときの試行回数の上限（1 回目 ＋ やり直し 2 回）。設定画面には出さない。
 * 同じ入力でも Gemini の出力長が振れる（実測 5,925 / 7,019 / 10,397 / 32,047 文字）ので、
 * 長さの歯止めに落ちたら同じ実行の中でやり直す。
 * API エラー（429 など）のリトライは `buildOneChannelSummary()` の中で別に数える。
 */
export const SUMMARY_MAX_ATTEMPTS = 3;

/** 1 回の生成の結果。上書きしなかった試行も使用量に数えるため全部残す。 */
export interface SummaryAttempt {
  attempt: number;        // 1 から
  chars: number;          // 生成した内容の文字数（frontmatter を含むファイル全体）
  inputTokens: number;
  outputTokens: number;
  truncated: boolean;     // finishReason === "MAX_TOKENS"
  tooShort: boolean;      // 長さの歯止めに落ちた
  accepted: boolean;      // この試行で上書きしたか
}

/** チャンネル 1 件の試行の経過。 */
export interface SummaryAttemptLog {
  channel: string;
  prevChars: number;      // 上書き対象の前の版の文字数（新規は 0）
  attempts: SummaryAttempt[];
  accepted: boolean;
  candidatePath: string;  // 全試行が不合格のとき保存した候補。合格なら空文字
}

/** 試行の経過から、通知に出す 1 行を作る。 */
export function describeAttempts(log: SummaryAttemptLog): string {
  const sizes = log.attempts.map((a) => a.chars.toLocaleString()).join(" → ");
  if (log.accepted) {
    const n = log.attempts.length;
    return `${log.channel}: ${n}回目で上書き（${sizes} 文字）`;
  }
  const longest = log.attempts.reduce((m, a) => Math.max(m, a.chars), 0);
  const why = log.attempts.every((a) => a.truncated) ? "打ち切られたため" : "短すぎるため";
  return `${log.channel}: ${log.attempts.length}回とも${why}上書きせず` +
    `（最長 ${longest.toLocaleString()} / 前 ${log.prevChars.toLocaleString()}）`;
}

export interface SummaryLengthGuard {
  ok: boolean;
  prevChars: number;
  newChars: number;
  ratio: number;      // 百分率。前の版が無いときは 0
  skipped: boolean;   // 判定して「短すぎる」と決めたか（前の版が無いときは false）
}

/**
 * 長さの歯止め。比較するのは**ファイル全体の文字数**（frontmatter を含む）。
 * 実測値 27.5%（21,531 → 5,925）/ 89.8%（11,631 → 10,440）と同じ数え方にするため。
 * 前の版が無い（新規チャンネル）場合は判定しない。
 */
export function judgeSummaryLength(prevChars: number, newChars: number): SummaryLengthGuard {
  if (prevChars <= 0) return { ok: true, prevChars, newChars, ratio: 0, skipped: false };
  const ratio = (newChars / prevChars) * 100;
  const ok = newChars >= prevChars * SUMMARY_MIN_RATIO_VS_PREVIOUS;
  return { ok, prevChars, newChars, ratio, skipped: !ok };
}

/**
 * 既定値にあって保存値に無い**配列の要素**。自動移行はせず報告だけする（落とし穴#34）。
 *
 * **単独のキーは対象にしない。** キーは `Object.assign` で既定値が入るので動作に影響しない。
 * 影響が出たのは配列だけ（`includeSourceTypes` に `channel_summary` が入らなかった件）。
 * キーを足すたびに通知が出ると、通知そのものが意味を持たなくなる。
 */
export interface SettingsDrift {
  missingArrayItems: Array<{ key: string; items: string[] }>;
}

/**
 * `DEFAULT_SETTINGS` と `data.json` の保存値を突き合わせる。
 * `Object.assign` は配列を丸ごと上書きするので、既定値に後から足した要素は
 * 既に保存値がある環境には永久に入らない。エラーは出ないので起動時に知らせる。
 */
export function detectSettingsDrift(
  defaults: Record<string, unknown>,
  saved: Record<string, unknown> | null,
): SettingsDrift {
  const missingArrayItems: Array<{ key: string; items: string[] }> = [];
  if (!saved) return { missingArrayItems };   // 初回起動は差分なし扱い

  for (const key of Object.keys(defaults)) {
    const d = defaults[key];
    if (!Array.isArray(d)) continue;                       // 単独のキーは見ない
    const s = saved[key];
    if (!Array.isArray(s)) continue;                       // 保存値に無い配列は既定値がそのまま入る
    const items = d.filter((x) => s.indexOf(x) < 0).map((x) => String(x));
    if (items.length > 0) missingArrayItems.push({ key, items });
  }
  return { missingArrayItems };
}

export interface SummarySourceRecord {
  path: string;
  size: number;
  hash: string;
}

export interface SummaryChannelState {
  summaryPath: string;
  summarySize: number;
  summaryHash: string;
  generatedAt: string;
  sources: SummarySourceRecord[];
}

export interface SummaryState {
  version: number;
  updatedAt: string;
  channels: Record<string, SummaryChannelState>;
}

/**
 * SHA-256。Web Crypto を使う。
 * Node の `require("crypto")` は使わない（ビルドコマンドで external 指定していないため、
 * バンドルに巻き込まれて Obsidian で壊れる）。
 */
export async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(digest);
  let out = "";
  for (let i = 0; i < view.length; i++) out += view[i].toString(16).padStart(2, "0");
  return out;
}

export type ChangeKind = "new" | "changed" | "unchanged" | "sourcesGone";

export interface ChannelDiff {
  key: string;
  displayName: string;
  kind: ChangeKind;
  noteCount: number;
  chars: number;
  estimatedTokens: number;
  added: string[];
  removed: string[];
  modified: string[];
  manuallyEdited: boolean;    // まとめノートの現在のハッシュが記録と違う
  summaryExists: boolean;
  overBudget: boolean;        // 推定トークンが予算を超える＝作成不可
}

export interface SummaryUpdatePlan {
  diffs: ChannelDiff[];
  unchangedCount: number;
  isFirstRun: boolean;
}

/**
 * チャンネルごとに 追加 / 削除 / 変更 / 新規 / 手動編集 を判定する。
 * 元ノートの比較は `path` + `size` + 内容ハッシュ。**mtime は使わない**
 * （mtime は frontmatter の自動更新や同期ツールでも動くため）。
 */
export function diffSummaryState(
  current: Array<{ key: string; displayName: string; noteCount: number; chars: number; sources: SummarySourceRecord[]; summaryExists: boolean; summaryHash: string }>,
  saved: SummaryState | null,
  budgetPerMin: number,
): SummaryUpdatePlan {
  const diffs: ChannelDiff[] = [];
  let unchangedCount = 0;

  for (const c of current) {
    const prev = saved ? saved.channels[c.key] : undefined;
    const estimatedTokens = estimateInputTokens(c.chars);
    const overBudget = estimatedTokens > budgetPerMin;

    if (!prev) {
      diffs.push({
        key: c.key, displayName: c.displayName, kind: "new",
        noteCount: c.noteCount, chars: c.chars, estimatedTokens,
        added: c.sources.map((s) => s.path), removed: [], modified: [],
        manuallyEdited: false, summaryExists: c.summaryExists, overBudget,
      });
      continue;
    }

    const prevByPath = new Map(prev.sources.map((s) => [s.path, s]));
    const curByPath = new Map(c.sources.map((s) => [s.path, s]));
    const added: string[] = [];
    const modified: string[] = [];
    const removed: string[] = [];

    curByPath.forEach((s, p) => {
      const old = prevByPath.get(p);
      if (!old) { added.push(p); return; }
      if (old.size !== s.size || old.hash !== s.hash) modified.push(p);
    });
    prevByPath.forEach((_s, p) => { if (!curByPath.has(p)) removed.push(p); });

    const manuallyEdited = c.summaryExists && prev.summaryHash.length > 0 && c.summaryHash !== prev.summaryHash;
    const hasChange = added.length > 0 || removed.length > 0 || modified.length > 0;

    if (c.sources.length === 0) {
      // 元ノートが全部消えたチャンネル。まとめノートは削除しない（報告のみ）
      diffs.push({
        key: c.key, displayName: c.displayName, kind: "sourcesGone",
        noteCount: 0, chars: 0, estimatedTokens: 0,
        added, removed, modified, manuallyEdited, summaryExists: c.summaryExists, overBudget: false,
      });
      continue;
    }

    if (!hasChange) {
      unchangedCount++;
      diffs.push({
        key: c.key, displayName: c.displayName, kind: "unchanged",
        noteCount: c.noteCount, chars: c.chars, estimatedTokens,
        added, removed, modified, manuallyEdited, summaryExists: c.summaryExists, overBudget,
      });
      continue;
    }

    diffs.push({
      key: c.key, displayName: c.displayName, kind: "changed",
      noteCount: c.noteCount, chars: c.chars, estimatedTokens,
      added, removed, modified, manuallyEdited, summaryExists: c.summaryExists, overBudget,
    });
  }

  // 作り直す必要があるものを先に、文字数の多い順に並べる
  const rank = (k: ChangeKind): number => (k === "new" ? 0 : k === "changed" ? 1 : k === "sourcesGone" ? 2 : 3);
  diffs.sort((a, b) => rank(a.kind) - rank(b.kind) || b.chars - a.chars);

  return { diffs, unchangedCount, isFirstRun: saved === null };
}

/**
 * 確認モーダルのグループ分け。純粋関数にして合成値でテストできるようにする。
 *
 * 「元ノートに変更があったチャンネル」しか作り直せないと、**まとめノートを前の版に戻した
 * チャンネルを作り直す手段が無くなる**（2026-10-03 実機で判明）。
 * 変更なしのチャンネルもチェックして作り直せるよう、3 グループに分けて全部出す。
 */
export interface SummaryUpdateGroups {
  /** 元ノートに追加・削除・変更があった、または新規。既定でチェックあり */
  needsRebuild: ChannelDiff[];
  /** 元ノートに変更は無いが、まとめノートのハッシュが記録と違う。既定でチェックなし */
  manuallyEdited: ChannelDiff[];
  /** 上のどちらでもない。既定でチェックなし（折りたたみで出す） */
  unchanged: ChannelDiff[];
  /** 元ノートが全部消えた。作り直せないので報告のみ（チェックできない） */
  sourcesGone: ChannelDiff[];
  /** 既定でチェックするキー */
  defaultSelected: string[];
  /** チェックできるチャンネル数（上限超過を除いた 3 グループの合計） */
  selectableCount: number;
}

export function groupSummaryUpdateTargets(plan: SummaryUpdatePlan): SummaryUpdateGroups {
  const needsRebuild: ChannelDiff[] = [];
  const manuallyEdited: ChannelDiff[] = [];
  const unchanged: ChannelDiff[] = [];
  const sourcesGone: ChannelDiff[] = [];

  for (const d of plan.diffs) {
    if (d.kind === "sourcesGone") { sourcesGone.push(d); continue; }
    if (d.kind === "new" || d.kind === "changed") { needsRebuild.push(d); continue; }
    // kind === "unchanged"。手動編集の疑いだけ別グループにする
    if (d.manuallyEdited) manuallyEdited.push(d);
    else unchanged.push(d);
  }

  // 既定でチェックするのは「作り直しが必要」のうち上限超過でないもの
  const defaultSelected = needsRebuild.filter((d) => !d.overBudget).map((d) => d.key);
  const selectableCount = needsRebuild.concat(manuallyEdited).concat(unchanged)
    .filter((d) => !d.overBudget).length;

  return { needsRebuild, manuallyEdited, unchanged, sourcesGone, defaultSelected, selectableCount };
}

/* =========================================================================
 * まとめノート更新の確認モーダル
 * ========================================================================= */

class SummaryUpdateModal extends Modal {
  private selected = new Set<string>();
  private groups: SummaryUpdateGroups;
  private summaryEl: HTMLElement | null = null;
  private runButtonEl: HTMLButtonElement | null = null;

  constructor(
    app: App,
    private plan: SummaryUpdatePlan,
    private budgetPerMin: number,
    private onRun: (selectedKeys: string[]) => Promise<void>,
  ) {
    super(app);
    this.groups = groupSummaryUpdateTargets(plan);
    for (const key of this.groups.defaultSelected) this.selected.add(key);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "🔄 まとめノートを更新" });

    const g = this.groups;
    this.summaryEl = contentEl.createEl("p", { cls: "vault-rag-desc" });
    this.updateSummary();

    // 1. 作り直しが必要（既定でチェックあり）
    this.renderGroup(contentEl, g.needsRebuild, {
      heading: `作り直しが必要（${g.needsRebuild.length}）`,
      empty: "なし。元ノートに追加・削除・変更があったチャンネルはありません",
      collapsed: false,
    });

    // 2. 手動編集の疑い（既定でチェックなし）
    this.renderGroup(contentEl, g.manuallyEdited, {
      heading: `⚠ 手動編集の疑い（${g.manuallyEdited.length}）`,
      note: "元ノートに変更はありませんが、まとめノートの内容が記録と違います。" +
        "作り直して上書きすると、この疑いは解消されます",
      empty: "なし",
      collapsed: false,
    });

    // 3. 変更なし（既定でチェックなし・折りたたんで閉じておく）
    this.renderGroup(contentEl, g.unchanged, {
      heading: `変更なし（${g.unchanged.length}）`,
      note: "作り直す必要はありませんが、選べば作り直せます",
      empty: "なし",
      collapsed: true,
    });

    if (g.sourcesGone.length > 0) {
      contentEl.createEl("h4", { text: `元ノートが無くなったチャンネル（${g.sourcesGone.length}）` });
      contentEl.createEl("p", {
        text: "報告のみ。作り直せないのでチェックできません。まとめノートは消しません",
        cls: "vault-rag-desc",
      });
      const ul = contentEl.createEl("ul");
      for (const d of g.sourcesGone) ul.createEl("li", { text: d.displayName });
    }

    new Setting(contentEl)
      .addButton((b) => b.setButtonText("キャンセル").onClick(() => this.close()))
      .addButton((b) => {
        this.runButtonEl = b.buttonEl;
        b.setButtonText("実行 ▶").setCta().onClick(() => {
          const keys = Array.from(this.selected);
          if (keys.length === 0) return;   // ボタンを無効化しているので通らない
          this.close();
          void this.onRun(keys);
        });
      });
    this.updateRunButton();
  }

  /** 上部の要約行。グループごとの件数とチェック中の件数を出す。 */
  private updateSummary(): void {
    if (!this.summaryEl) return;
    const g = this.groups;
    const notes = this.plan.diffs
      .filter((d) => this.selected.has(d.key))
      .reduce((a, d) => a + d.noteCount, 0);
    this.summaryEl.setText(
      `作り直しが必要: ${g.needsRebuild.length} ／ 手動編集の疑い: ${g.manuallyEdited.length} ／ ` +
      `変更なし: ${g.unchanged.length}` +
      (g.sourcesGone.length > 0 ? ` ／ 元ノートなし: ${g.sourcesGone.length}` : "") +
      `　→　チェック中: ${this.selected.size} チャンネル（元ノート 合計 ${notes.toLocaleString()} 本）`,
    );
  }

  /** 1 件もチェックされていなければ実行を押せないようにする。 */
  private updateRunButton(): void {
    if (this.runButtonEl) this.runButtonEl.disabled = this.selected.size === 0;
  }

  private renderGroup(
    parent: HTMLElement,
    diffs: ChannelDiff[],
    opt: { heading: string; note?: string; empty: string; collapsed: boolean },
  ): void {
    let body: HTMLElement;
    if (opt.collapsed) {
      const det = parent.createEl("details");
      det.createEl("summary", { text: opt.heading });
      body = det.createDiv();
    } else {
      parent.createEl("h4", { text: opt.heading });
      body = parent.createDiv();
    }
    if (opt.note) body.createEl("p", { text: opt.note, cls: "vault-rag-desc" });
    if (diffs.length === 0) { body.createEl("p", { text: opt.empty, cls: "vault-rag-desc" }); return; }
    for (const d of diffs) this.renderRow(body, d);
  }

  private renderRow(parent: HTMLElement, d: ChannelDiff): void {
    const row = parent.createDiv({ cls: "vault-rag-update-row" });
    const label = row.createEl("label");
    const cb = label.createEl("input", { type: "checkbox" });
    cb.checked = this.selected.has(d.key);
    cb.disabled = d.overBudget;
    cb.addEventListener("change", () => {
      if (cb.checked) this.selected.add(d.key); else this.selected.delete(d.key);
      this.updateSummary();
      this.updateRunButton();
    });
    label.createSpan({ text: ` ${d.displayName}` });

    const reasons: string[] = [];
    if (d.kind === "new") reasons.push("新規チャンネル");
    if (d.added.length > 0) reasons.push(`追加 ${d.added.length}本`);
    if (d.removed.length > 0) reasons.push(`削除 ${d.removed.length}本`);
    if (d.modified.length > 0) reasons.push(`変更 ${d.modified.length}本`);
    if (reasons.length === 0) reasons.push(d.manuallyEdited ? "まとめノートが記録と違う" : "元ノートに変更なし");

    row.createDiv({ cls: "vault-rag-desc" }).setText(
      `　${reasons.join(" / ")} ／ 全 ${d.noteCount} 本 ／ 推定入力 ${d.estimatedTokens.toLocaleString()} トークン`,
    );
    if (d.overBudget) {
      row.createDiv({ cls: "vault-rag-warn" }).setText(
        `　⛔ 上限超過のため作成不可（推定 ${d.estimatedTokens.toLocaleString()} > 上限 ${this.budgetPerMin.toLocaleString()}）`,
      );
    }
    // 「作り直しが必要」の中に手動編集の疑いがあるものは、従来どおり警告を併記する
    if (d.manuallyEdited && (d.kind === "new" || d.kind === "changed")) {
      row.createDiv({ cls: "vault-rag-warn" })
        .setText("　⚠ 手動で編集された可能性あり（上書きされます。バックアップは取ります）");
    }

    const changedPaths = d.added.concat(d.modified).concat(d.removed);
    if (changedPaths.length > 0) {
      const det = row.createEl("details");
      det.createEl("summary", { text: `　変更のあったノート ${changedPaths.length} 件を見る` });
      const ul = det.createEl("ul");
      for (const p of d.added) ul.createEl("li", { text: `追加: ${p}` });
      for (const p of d.modified) ul.createEl("li", { text: `変更: ${p}` });
      for (const p of d.removed) ul.createEl("li", { text: `削除: ${p}` });
    }
  }

  onClose(): void { this.contentEl.empty(); }
}

/* =========================================================================
 * プラグイン本体
 * ========================================================================= */

export default class VaultRagPlugin extends Plugin {
  settings: VaultRagSettings;
  index: VaultRagIndex | null = null;
  vectors: Float32Array | null = null;
  indexBlockedReason: string | null = null;
  loadTiming: IndexLoadTiming | null = null;
  private pendingChanges = new Set<string>();
  private reindexTimer: number | null = null;
  private activeRun: RunController | null = null;
  /** `data.json` の生の中身。既定値との差を見るために保持する（落とし穴#34）。 */
  private savedSettingsRaw: Record<string, unknown> | null = null;
  private driftNotified = false;

  async onload() {
    await this.loadSettings();
    this.reportSettingsDrift();

    this.addCommand({
      id: "count-target-notes",
      name: "対象ノートを数える",
      callback: () => { void this.runCount(); },
    });

    this.addCommand({
      id: "preview-chunks",
      name: "チャンク分割をプレビュー",
      callback: () => { void this.runPreview(); },
    });

    this.addCommand({
      id: "build-index",
      name: "インデックスを作成/再作成",
      callback: () => { void this.runBuildIndex(); },
    });

    this.addCommand({
      id: "build-channel-summary",
      name: "チャンネルまとめノートを作成（試作）",
      callback: () => { void this.runBuildChannelSummary(); },
    });

    this.addCommand({
      id: "update-channel-summaries",
      name: "まとめノートを更新",
      callback: () => { void this.runUpdateSummaries(); },
    });

    this.addCommand({
      id: "build-all-channel-summaries",
      name: "チャンネルまとめノートを全件作成",
      callback: () => { void this.runBuildAllChannelSummaries(); },
    });

    this.addCommand({
      id: "verify-channel-summary",
      name: "まとめノートを検証",
      callback: () => { void this.runVerifyChannelSummary(); },
    });

    this.registerView(ANSWER_VIEW_TYPE, (leaf) => new VaultRagAnswerView(leaf, this));

    this.addCommand({
      id: "ask",
      name: "質問する",
      callback: () => { void this.runAsk(); },
    });

    this.addCommand({
      id: "search-test",
      name: "検索をテスト",
      callback: () => { void this.runSearchTest(); },
    });

    this.addCommand({
      id: "repair-summary-citations",
      name: "まとめノートを整形し直す（API不使用）",
      callback: () => { void this.runRepairSummaryCitations(); },
    });

    this.addCommand({
      id: "verify-all-channel-summaries",
      name: "まとめノートを全件検証",
      callback: () => { void this.runVerifyAllChannelSummaries(); },
    });

    this.addSettingTab(new VaultRagSettingTab(this.app, this));

    // 起動時の読み込みは描画を妨げないよう遅らせる
    this.app.workspace.onLayoutReady(() => {
      void this.loadIndexFromDisk().then(() => { this.registerVaultWatchers(); });
    });
  }

  async loadSettings() {
    const loaded = (await this.loadData()) as Record<string, unknown> | null;
    this.savedSettingsRaw = loaded;   // 既定値との差を見るために生の中身を残す（落とし穴#34）
    const merged = Object.assign({}, DEFAULT_SETTINGS, loaded) as VaultRagSettings;
    if (!Array.isArray(merged.includeSourceTypes)) merged.includeSourceTypes = DEFAULT_SETTINGS.includeSourceTypes.slice();
    if (!Array.isArray(merged.excludeSubfolders)) merged.excludeSubfolders = DEFAULT_SETTINGS.excludeSubfolders.slice();
    if (!Array.isArray(merged.excludeSections)) merged.excludeSections = DEFAULT_SETTINGS.excludeSections.slice();
    merged.chunkSize = clampInt(merged.chunkSize, 100, 8000, DEFAULT_SETTINGS.chunkSize);
    merged.chunkOverlap = clampInt(merged.chunkOverlap, 0, Math.max(0, merged.chunkSize - 1), DEFAULT_SETTINGS.chunkOverlap);
    merged.vectorTopK = clampInt(merged.vectorTopK, 1, 200, DEFAULT_SETTINGS.vectorTopK);
    merged.keywordTopK = clampInt(merged.keywordTopK, 1, 200, DEFAULT_SETTINGS.keywordTopK);
    merged.finalTopK = clampInt(merged.finalTopK, 1, 50, DEFAULT_SETTINGS.finalTopK);
    merged.maxChunksPerNote = clampInt(merged.maxChunksPerNote, 1, 50, DEFAULT_SETTINGS.maxChunksPerNote);
    merged.embedBatchSize = clampInt(merged.embedBatchSize, 1, 100, DEFAULT_SETTINGS.embedBatchSize);
    merged.embeddingDimensions = clampInt(merged.embeddingDimensions, 128, 3072, DEFAULT_SETTINGS.embeddingDimensions);
    merged.embedIntervalMs = clampInt(merged.embedIntervalMs, 0, 60000, DEFAULT_SETTINGS.embedIntervalMs);
    merged.summaryMaxOutputTokens = clampInt(merged.summaryMaxOutputTokens, 1024, 200000, DEFAULT_SETTINGS.summaryMaxOutputTokens);
    merged.summaryIntervalMs = clampInt(merged.summaryIntervalMs, 0, 300000, DEFAULT_SETTINGS.summaryIntervalMs);
    merged.summaryTokenBudgetPerMin = clampInt(merged.summaryTokenBudgetPerMin, 10000, GEMINI_FREE_INPUT_TOKENS_PER_MIN, DEFAULT_SETTINGS.summaryTokenBudgetPerMin);
    merged.summaryMinSourceNotes = clampInt(merged.summaryMinSourceNotes, 0, 1000, DEFAULT_SETTINGS.summaryMinSourceNotes);
    merged.answerMaxTokens = clampInt(merged.answerMaxTokens, 256, 32000, DEFAULT_SETTINGS.answerMaxTokens);
    if (typeof merged.keywordSearchEnabled !== "boolean") merged.keywordSearchEnabled = DEFAULT_SETTINGS.keywordSearchEnabled;
    if (typeof merged.summaryChannel !== "string") merged.summaryChannel = DEFAULT_SETTINGS.summaryChannel;
    if (typeof merged.summaryFolder !== "string" || !merged.summaryFolder) merged.summaryFolder = DEFAULT_SETTINGS.summaryFolder;
    if (typeof merged.summaryModel !== "string" || !merged.summaryModel) merged.summaryModel = DEFAULT_SETTINGS.summaryModel;
    merged.testModeNoteLimit = clampInt(merged.testModeNoteLimit, 0, 10000, DEFAULT_SETTINGS.testModeNoteLimit);
    if (merged.embeddingProvider !== "openai" && merged.embeddingProvider !== "gemini") merged.embeddingProvider = "openai";
    if (!Array.isArray(merged.chatModelPriority)) merged.chatModelPriority = DEFAULT_SETTINGS.chatModelPriority.slice();
    if (merged.chatFallbackMode !== "auto" && merged.chatFallbackMode !== "manual") merged.chatFallbackMode = "auto";
    if (typeof merged.geminiFreeTier !== "boolean") merged.geminiFreeTier = DEFAULT_SETTINGS.geminiFreeTier;
    this.settings = merged;
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  /**
   * `DEFAULT_SETTINGS` にあって `data.json` に無い項目を知らせる（落とし穴#34）。
   * `Object.assign` は配列を丸ごと上書きするので、既定値に後から足した要素は
   * 既に保存値がある環境には入らない。エラーは出ないので起動時に 1 回だけ通知する。
   * **設定は自動で書き換えない。** 直すのは人の判断。
   */
  private reportSettingsDrift(): void {
    if (this.driftNotified) return;
    this.driftNotified = true;

    const drift = detectSettingsDrift(
      DEFAULT_SETTINGS as unknown as Record<string, unknown>,
      this.savedSettingsRaw,
    );
    if (drift.missingArrayItems.length === 0) return;

    console.warn("[Vault RAG] 既定値にあって data.json に無い配列の要素", drift);
    const lines: string[] = [];
    for (const a of drift.missingArrayItems) lines.push(`${a.key}: ${a.items.join(" / ")}`);
    new Notice(
      `⚠️ Vault RAG: 設定が既定値に追いついていません\n` +
      `${lines.join("\n")}\n` +
      `保存済みの設定が優先されます。自動では直しません。\n` +
      `詳細はコンソール（Ctrl+Shift+I）`,
      0,
    );
  }

  /* ---------- インデックスの読み書き ---------- */

  private indexPath(file: string): string {
    const dir = this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
    return normalizePath(`${dir}/${file}`);
  }

  /**
   * 2ファイルを読み、整合性とバージョンを検証する。
   * 問題があれば検索を無効化して再インデックスを促すだけにする（勝手に再生成しない）。
   */
  async loadIndexFromDisk(): Promise<void> {
    const adapter = this.app.vault.adapter;
    const jsonPath = this.indexPath(INDEX_JSON_FILE);
    const binPath = this.indexPath(INDEX_BIN_FILE);
    this.index = null;
    this.vectors = null;
    this.indexBlockedReason = null;

    try {
      if (!(await adapter.exists(jsonPath)) || !(await adapter.exists(binPath))) {
        this.indexBlockedReason = "インデックスがまだありません";
        return;
      }
      // 読み込みの内訳を測る。`.json` は 12MB あり、起動時のパースが効いてくる
      const tJsonStart = Date.now();
      const jsonText = await adapter.read(jsonPath);
      const tJsonRead = Date.now();
      const parsed = JSON.parse(jsonText) as VaultRagIndex;
      const tJsonParse = Date.now();
      const buf = await adapter.readBinary(binPath);
      const tBinRead = Date.now();

      this.loadTiming = {
        jsonBytes: jsonText.length,
        jsonReadMs: tJsonRead - tJsonStart,
        jsonParseMs: tJsonParse - tJsonRead,
        binBytes: buf.byteLength,
        binReadMs: tBinRead - tJsonParse,
        totalMs: tBinRead - tJsonStart,
      };

      const integrity = validateIndexIntegrity(parsed.meta, parsed.chunks.length, buf.byteLength);
      if (integrity) {
        this.indexBlockedReason = integrity;
        console.error("[Vault RAG] インデックスの整合性エラー:", integrity);
        new Notice(`Vault RAG: インデックスが壊れています\n${integrity}\n再インデックスが必要です`, 15000);
        return;
      }
      if (needsFullReindex(parsed.meta, currentIndexMeta(this.settings, parsed.meta.chunkCount))) {
        this.indexBlockedReason = "設定が変わったため再インデックスが必要です";
        console.warn("[Vault RAG] 設定変更を検出", parsed.meta, this.settings);
        new Notice("Vault RAG: 設定が変わったため再インデックスが必要です", 15000);
        return;
      }

      this.index = parsed;
      this.vectors = new Float32Array(buf);
      const t = this.loadTiming;
      console.log(
        `[Vault RAG] インデックス読み込み: ${parsed.chunks.length} チャンク / ${(buf.byteLength / 1024 / 1024).toFixed(1)} MB
` +
        `  .json 読込 ${t.jsonReadMs}ms + パース ${t.jsonParseMs}ms（${(t.jsonBytes / 1024 / 1024).toFixed(1)}MB）
` +
        `  .bin  読込 ${t.binReadMs}ms（${(t.binBytes / 1024 / 1024).toFixed(1)}MB）
` +
        `  合計 ${t.totalMs}ms`,
      );
    } catch (err) {
      this.indexBlockedReason = err instanceof Error ? err.message : String(err);
      console.error("[Vault RAG] インデックスの読み込みに失敗しました", err);
      new Notice(`Vault RAG: インデックスの読み込みに失敗しました\n${this.indexBlockedReason}`, 15000);
    }
  }

  /** メタ+本文を .json、ベクトルを .bin に書く。JSON に数値配列を入れない（落とし穴#4）。 */
  private async saveIndexToDisk(chunks: Chunk[], vectors: Float32Array, meta: IndexMeta): Promise<void> {
    const adapter = this.app.vault.adapter;
    const payload: VaultRagIndex = { meta, chunks };
    // .bin を先に書く。途中で落ちても .json が古いままなら整合性検証で弾ける
    await adapter.writeBinary(this.indexPath(INDEX_BIN_FILE), vectors.buffer as ArrayBuffer);
    await adapter.write(this.indexPath(INDEX_JSON_FILE), JSON.stringify(payload));
  }

  /* ---------- 対象ノートの収集 ---------- */

  /** フォルダ側の除外ルールを適用した候補ファイル。`source_type` の判定はまだしない。 */
  /**
   * RAG の候補ファイル。
   * `includeSourceTypes` に `channel_summary` が入っているときは、`summaryFolder` も対象に含める
   * （まとめノートは `targetFolder` の外に置いてあるため）。
   */
  collectCandidates(result?: CountResult): TFile[] {
    const s = this.settings;
    const folder = s.targetFolder.replace(/\/+$/, "");
    const summaryFolder = s.summaryFolder.replace(/\/+$/, "");
    const wantSummaries = s.includeSourceTypes.indexOf("channel_summary") >= 0 && summaryFolder.length > 0;

    const candidates: TFile[] = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      const inTarget = isUnderFolder(file.path, folder);
      const inSummary = wantSummaries && isUnderFolder(file.path, summaryFolder);
      if (!inTarget && !inSummary) continue;
      if (result) result.filesUnderTarget++;

      // `.ai` が Obsidian API 経由で返ってくるかの実測（除外を適用する前に数える）
      if (result && hasExcludedFolder(file.path, [".ai"])) result.filesFromApiUnderAiFolder++;

      if (hasExcludedFolder(file.path, s.excludeSubfolders)) { if (result) result.skippedByFolderRule++; continue; }
      // 直下ファイルの除外は元ノート側だけに効かせる。まとめノートは summaryFolder 直下に置くため
      if (inTarget && s.excludeRootFiles && isDirectChild(file.path, folder)) {
        if (result) result.skippedByRootRule++;
        continue;
      }
      candidates.push(file);
    }
    /**
     * `getMarkdownFiles()` の順序は保証がなく、Obsidian の起動や新規ファイルで入れ替わる。
     * まとめ生成のプロンプトはこの順で `[N1]`…`[Nn]` を振るため、順が変わると
     * 出力が変わっても「モデルのぶれ」と「順序の影響」を区別できない（落とし穴#33）。
     * `path` で並べ替えて固定する。チャンク ID は `path#i` なので索引には影響しない。
     */
    candidates.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    return candidates;
  }


  /** 除外ルールを適用して対象ノートを数える。外部 API は一切呼ばない。 */
  async countTargetNotes(): Promise<CountResult> {
    const started = Date.now();
    const s = this.settings;
    const result = emptyCountResult();
    const candidates = this.collectCandidates(result);

    for (const file of candidates) {
      let raw: string;
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (err) {
        // 1ファイルの読み取り失敗で全体を止めない（落とし穴#8）
        result.readErrors.push(file.path);
        console.error("[Vault RAG] 読み取り失敗:", file.path, err);
        continue;
      }
      tallyNote(result, raw, s, file.path);
    }

    result.elapsedMs = Date.now() - started;
    return result;
  }

  private async runCount(): Promise<void> {
    const counting = new Notice("Vault RAG: 集計中…", 0);
    try {
      const r = await this.countTargetNotes();
      counting.hide();
      console.log("[Vault RAG] 集計結果", r);
      if (r.readErrors.length > 0) console.warn("[Vault RAG] 読み取りに失敗したファイル", r.readErrors);

      const included: string[] = [];
      const excluded: string[] = [];
      const keys = Object.keys(r.bySourceType).sort((a, b) => r.bySourceType[b] - r.bySourceType[a]);
      for (const k of keys) {
        const line = `${k} ${r.bySourceType[k].toLocaleString()}`;
        if (this.settings.includeSourceTypes.indexOf(k) >= 0) included.push(line);
        else excluded.push(line);
      }

      const message =
        "📊 Vault RAG 対象ノート集計\n" +
        `対象: ${r.includedNotes.toLocaleString()} 本 / 本文 ${r.extractedChars.toLocaleString()} 文字\n` +
        `埋め込み送信量（チャンク重複込み・ヘッダ除く）: ${r.includedChars.toLocaleString()} 文字\n` +
        `想定チャンク数: ${r.includedChunks.toLocaleString()}（本文 ${r.bodyChunks.toLocaleString()} + サマリー ${r.summaryChunks.toLocaleString()}）\n` +
        `　貪欲パッキング ${this.settings.chunkSize}文字 / 重複${this.settings.chunkOverlap}文字\n` +
        `含める: ${included.join(" ・ ") || "なし"}\n` +
        `除外: ${excluded.join(" ・ ") || "なし"}\n` +
        `対象フォルダ内の .md（API 経由）: ${r.filesUnderTarget.toLocaleString()} 本\n` +
        `うち .ai 配下: ${r.filesFromApiUnderAiFolder.toLocaleString()} 本\n` +
        `直下ファイル除外: ${r.skippedByRootRule.toLocaleString()} 本 ／ フォルダ除外: ${r.skippedByFolderRule.toLocaleString()} 本\n` +
        `読み取り失敗: ${r.readErrors.length.toLocaleString()} 本\n` +
        `所要: ${(r.elapsedMs / 1000).toFixed(1)} 秒`;
      new Notice(message, 0);
    } catch (err) {
      counting.hide();
      console.error("[Vault RAG] 集計に失敗しました", err);
      new Notice(`Vault RAG: 集計に失敗しました\n${err instanceof Error ? err.message : String(err)}`, 10000);
    }
  }

  /* ---------- インデックス作成 ---------- */

  /**
   * 1バッチぶんを埋め込む。レート制限時は「同じモデルで」リトライする。
   * ⛔ 別モデルにフォールバックしてはいけない（落とし穴#19）。
   */
  private async embedBatchWithRetry(
    texts: string[],
    taskType: EmbeddingTaskType,
    controller: RunController,
    onRetry: (waitMs: number, attempt: number, message: string) => void,
  ): Promise<EmbeddingBatchResult> {
    const s = this.settings;
    const provider = getEmbeddingProvider(s.embeddingProvider);
    const apiKey = getEmbeddingApiKey(s);
    const options: EmbeddingOptions = { dimensions: s.embeddingDimensions, taskType };
    let lastError = "";

    for (let attempt = 0; attempt < EMBED_MAX_ATTEMPTS; attempt++) {
      controller.throwIfAborted();
      if (attempt > 0) {
        const waitMs = calcRetryDelayMs(attempt, isRateLimitMessage(lastError));
        onRetry(waitMs, attempt, lastError);
        await controller.sleep(waitMs);   // 中断されたら AbortedError で抜ける
      }
      try {
        return await provider.embed(texts, apiKey, s.embeddingModel, options);
      } catch (err) {
        if (isAbortedError(err)) throw err;
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[Vault RAG] 埋め込み失敗（${attempt + 1}/${EMBED_MAX_ATTEMPTS}）`, lastError);
        // 残高切れ・キー不正は待っても直らない。リトライで時間を無駄にしない
        if (isNonRetryableApiError(lastError)) throw new Error(lastError);
      }
    }
    throw new Error(`埋め込みに ${EMBED_MAX_ATTEMPTS} 回失敗しました: ${lastError}`);
  }

  private async runBuildIndex(): Promise<void> {
    if (this.activeRun) {
      new Notice("Vault RAG: 既に実行中です", 5000);
      return;
    }
    const s = this.settings;
    // 落とし穴#25: data.json に古い embeddingProvider が残っていると新しい既定値が効かない。
    // API を1回叩いて気づくのではなく、1件も送る前にここで止める。
    const providerLabel = s.embeddingProvider === "openai" ? "OpenAI" : "Gemini";
    const apiKey = getEmbeddingApiKey(s);
    if (!apiKey) {
      new Notice(
        `Vault RAG: ${providerLabel} の API キーが未設定です
` +
        `現在の埋め込みプロバイダ: ${s.embeddingProvider}
` +
        `設定でキーを入れるか、プロバイダを切り替えてください`,
        15000,
      );
      return;
    }

    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const onEsc = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        controller.abort();
        new Notice("Vault RAG: 中断します（送信済みのリクエストの完了を待ちます）", 5000);
      }
    };
    document.addEventListener("keydown", onEsc);

    const started = Date.now();
    const testLimit = s.testModeNoteLimit > 0 ? s.testModeNoteLimit : 0;
    const label = testLimit > 0 ? `テスト実行（先頭${testLimit}本）` : "全件";
    // 中断・失敗時に「どこまで進んだか」を出すため try の外で持つ
    let done = 0;
    let totalChunks = 0;

    try {
      // ---- 1. チャンクを組む（API は呼ばない）----
      progress.show(`Vault RAG: 対象ノートを読み込み中…（${label}）`);
      const candidates = this.collectCandidates();
      const chunks: Chunk[] = [];
      const readErrors: string[] = [];
      let notes = 0;
      let thinSkipped = 0;   // source_notes が少なくて RAG 対象から外したまとめノート

      for (const file of candidates) {
        if (testLimit > 0 && notes >= testLimit) break;
        controller.throwIfAborted();
        let raw: string;
        try {
          raw = await this.app.vault.cachedRead(file);
        } catch (err) {
          // 1ファイルの読み取り失敗で全体を止めない（落とし穴#8）
          readErrors.push(file.path);
          console.error("[Vault RAG] 読み取り失敗:", file.path, err);
          continue;
        }
        const note = extractNote(raw, s);
        if (s.includeSourceTypes.indexOf(note.sourceType) < 0) continue;
        if (isSummaryTooThin(note, s)) { thinSkipped++; continue; }
        notes++;
        for (const c of buildChunks(note, file.path, file.stat.mtime, s)) chunks.push(c);
      }

      if (chunks.length === 0) {
        progress.hide();
        new Notice("Vault RAG: 対象チャンクが 0 件でした", 10000);
        return;
      }

      // ---- 2. 埋め込み（バッチ送信）----
      const dimensions = s.embeddingDimensions;
      const vectors = new Float32Array(chunks.length * dimensions);
      const batchSize = Math.max(1, s.embedBatchSize);
      let embeddedTokens = 0;
      let embeddedChars = 0;
      totalChunks = chunks.length;

      for (let start = 0; start < chunks.length; start += batchSize) {
        controller.throwIfAborted();
        // 連続で投げると無料枠のレート上限に当たりやすい。初回の前と最後の後には入れない
        if (start > 0 && s.embedIntervalMs > 0) await controller.sleep(s.embedIntervalMs);
        const slice = chunks.slice(start, start + batchSize);
        progress.show(`Vault RAG: 埋め込み中 ${done.toLocaleString()} / ${chunks.length.toLocaleString()} チャンク（Escで中断）`);

        const result = await this.embedBatchWithRetry(
          slice.map((c) => c.text),
          "RETRIEVAL_DOCUMENT",          // ノート側。質問側は RETRIEVAL_QUERY
          controller,
          (waitMs, attempt, message) => {
            progress.show(`Vault RAG: ${Math.round(waitMs / 1000)}秒待って再試行（${attempt + 1}/${EMBED_MAX_ATTEMPTS}）\n${message}`);
          },
        );

        for (let i = 0; i < result.vectors.length; i++) {
          const v = result.vectors[i];
          if (v.length !== dimensions) {
            throw new Error(`次元数が想定と違います: ${v.length} （期待 ${dimensions}）。設定と埋め込みモデルを確認してください`);
          }
          // 保存時に L2 正規化しておくと、検索側は内積をそのままコサイン類似度として使える
          vectors.set(normalizeVector(v), (start + i) * dimensions);
        }
        embeddedTokens += result.tokens;
        for (const c of slice) embeddedChars += c.text.length;
        done += slice.length;
      }

      // ---- 3. 保存 ----
      progress.show("Vault RAG: インデックスを保存中…");
      const meta = currentIndexMeta(s, chunks.length);
      await this.saveIndexToDisk(chunks, vectors, meta);

      this.index = { meta, chunks };
      this.vectors = vectors;
      this.indexBlockedReason = null;

      // ---- 4. 費用の記録と表示 ----
      const costUsd = calcEmbeddingCostUsd(s.embeddingModel, embeddedTokens);
      s.totalEmbeddingTokens += embeddedTokens;
      s.totalCostUsd += costUsd;
      await this.saveSettings();

      progress.hide();
      const elapsedSec = (Date.now() - started) / 1000;
      const binMb = (vectors.byteLength / 1024 / 1024).toFixed(1);
      // Gemini の batchEmbedContents は usage を返さない。0 を「トークン0」と誤解させない
      const usageLine = embeddedTokens > 0
        ? `埋め込みトークン: ${embeddedTokens.toLocaleString()}`
        : `埋め込み文字数: ${embeddedChars.toLocaleString()}（${s.embeddingProvider} は usage を返さないためトークン数は不明）`;
      const costLine = embeddedTokens > 0
        ? `今回: ${formatUsdJpy(costUsd)}\n累計: ${formatUsdJpy(s.totalCostUsd)}`
        : `今回: 無料枠のため 0 円\n累計（課金分のみ）: ${formatUsdJpy(s.totalCostUsd)}`;
      const message =
        `✅ インデックス作成完了（${label}）\n` +
        `ノート ${notes.toLocaleString()} 本 → ${chunks.length.toLocaleString()} チャンク\n` +
        `${usageLine}\n` +
        `${costLine}\n` +
        `所要: ${elapsedSec.toFixed(1)} 秒\n` +
        `${INDEX_BIN_FILE}: ${binMb} MB（${dimensions}次元）\n` +
        `読み取り失敗: ${readErrors.length} 本` +
        (thinSkipped > 0 ? `
RAG 対象外にしたまとめノート: ${thinSkipped} 本（source_notes < ${s.summaryMinSourceNotes}）` : "");
      new Notice(message, 0);
      console.log("[Vault RAG] インデックス作成完了", { label, notes, chunks: chunks.length, embeddedTokens, embeddedChars, costUsd, elapsedSec, readErrors, thinSkipped });
    } catch (err) {
      progress.hide();
      // 5〜6分走ったあとに全部捨てるので、どこまで進んだかを必ず出す
      const failedSec = (Date.now() - started) / 1000;
      const progressLine = totalChunks > 0
        ? `\n完了: ${done.toLocaleString()} / ${totalChunks.toLocaleString()} チャンク（${Math.round(done / totalChunks * 100)}%）／ 経過 ${failedSec.toFixed(1)} 秒`
        : "";
      if (isAbortedError(err)) {
        new Notice(`Vault RAG: 中断しました。インデックスは保存していません${progressLine}`, 0);
      } else {
        console.error("[Vault RAG] インデックス作成に失敗しました", err);
        new Notice(`Vault RAG: インデックス作成に失敗しました\n${err instanceof Error ? err.message : String(err)}${progressLine}`, 0);
      }
      console.log("[Vault RAG] 中断/失敗時の進捗", { done, totalChunks, elapsedSec: failedSec });
    } finally {
      document.removeEventListener("keydown", onEsc);
      this.activeRun = null;
    }
  }


  /* ---------- チャンネルまとめノート（SUMMARY_NOTES.md / 試作） ---------- */

  /** 対象ノートを全部読み、チャンネル名つきで返す。 */
  private async collectNotesWithChannel(): Promise<{
    entries: Array<{ channel: string; note: SummarySourceNote }>;
    readErrors: string[];
    noChannel: number;
  }> {
    const s = this.settings;
    const entries: Array<{ channel: string; note: SummarySourceNote }> = [];
    const readErrors: string[] = [];
    let noChannel = 0;

    for (const file of this.collectCandidates()) {
      let raw: string;
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (err) {
        // 1ファイルの読み取り失敗で全体を止めない（落とし穴#8）
        readErrors.push(file.path);
        console.error("[Vault RAG] 読み取り失敗:", file.path, err);
        continue;
      }
      const note = extractNote(raw, s);
      if (s.includeSourceTypes.indexOf(note.sourceType) < 0) continue;
      // まとめノート自身を材料にすると自分を要約し直す形になる。必ず外す
      if (note.sourceType === "channel_summary") continue;
      if (note.main.length === 0) continue;

      const channel = note.frontmatter["channel"] || "";
      if (!channel) { noChannel++; continue; }   // knowledge_note / integration_note は channel を持たない

      const base = file.path.slice(file.path.lastIndexOf("/") + 1);
      entries.push({
        channel,
        note: { title: base.endsWith(".md") ? base.slice(0, -3) : base, path: file.path, body: note.main },
      });
    }
    return { entries, readErrors, noChannel };
  }

  /** 表記ゆれを吸収したチャンネル一覧。文字数の多い順。 */
  private async collectChannelGroups(): Promise<{ groups: ChannelGroup[]; readErrors: string[]; noChannel: number }> {
    const { entries, readErrors, noChannel } = await this.collectNotesWithChannel();
    return { groups: groupNotesByChannel(entries), readErrors, noChannel };
  }

  /** 設定のチャンネル名に対応するグループを1件返す（表記ゆれを吸収して突き合わせる）。 */
  private async findChannelGroup(channel: string): Promise<{ group: ChannelGroup | null; readErrors: string[] }> {
    const { groups, readErrors } = await this.collectChannelGroups();
    const key = normalizeChannelKey(channel);
    for (const g of groups) if (normalizeChannelKey(g.displayName) === key) return { group: g, readErrors };
    return { group: null, readErrors };
  }

  /** チャンネル名にはファイル名に使えない文字（`|` など）が混ざるので必ず通す。 */
  private summaryNotePath(channel: string): string {
    return normalizePath(`${this.settings.summaryFolder.replace(/\/+$/, "")}/${toSafeFileName(channel)}.md`);
  }

  /** 1チャンネル分を生成して保存する。呼び出し側が中断制御と進捗を持つ。 */
  private async buildOneChannelSummary(
    group: ChannelGroup,
    controller: RunController,
    progress: ProgressNotice,
    limiter?: TokenRateLimiter,
    /**
     * 書き込み方法の差し替え口。渡さなければ `adapter.write()`（既存コマンドの挙動）。
     * 「まとめノートを更新」は `vault.modify()` / `vault.create()` を渡して
     * `modify` / `create` イベントを確実に出し、差分更新で RAG に反映させる。
     * `info.truncated` を見て「書かない」と決めてもよい（書かなければ何もしない）。
     */
    writer?: (path: string, content: string, info: { truncated: boolean }) => Promise<void>,
    /** 進捗表示に足す試行の表示（例「2回目」）。やり直しのときだけ渡す。 */
    attemptLabel = "",
  ): Promise<SummaryBuildResult> {
    const s = this.settings;
    const channel = group.displayName;
    const notes = group.notes;
    const sourceChars = group.chars;
    const outPath = this.summaryNotePath(channel);

    // R4: 元ノートは読み取り専用。出力先が対象フォルダの中なら事故なので止める
    if (isUnderFolder(outPath, s.targetFolder.replace(/\/+$/, ""))) {
      throw new Error(`出力先が対象フォルダの中です: ${outPath}`);
    }

    const label = attemptLabel.length > 0 ? ` ${attemptLabel}` : "";

    const prompt = buildSummaryPrompt(notes);
    const estTokens = estimateTokensFromChars(prompt.length);
    console.log(`[Vault RAG] まとめ生成: ${channel} / ${notes.length}本 / 本文${sourceChars}文字 / プロンプト${prompt.length}文字 / 推定${estTokens}トークン`);

    // 分あたりの入力トークン上限（実測 250,000）に当たらないよう、送る前に待つ
    if (limiter) {
      const waitMs = limiter.waitMsFor(estTokens);
      if (waitMs > 0) {
        progress.show(`Vault RAG: 分あたりトークン上限のため ${Math.ceil(waitMs / 1000)} 秒待機中…（${channel}${label}）`);
        await controller.sleep(waitMs);
      }
      limiter.record(estTokens);
    }

    progress.show(`Vault RAG: ${channel}${label} を生成中…（${notes.length}本 / ${sourceChars.toLocaleString()}文字・Escで中断）`);

    let result: ChatCallResult | null = null;
    let lastError = "";
    for (let attempt = 0; attempt < EMBED_MAX_ATTEMPTS; attempt++) {
      controller.throwIfAborted();
      if (attempt > 0) {
        // サーバーが「Please retry in 14.88s」と待ち時間を返してきたらそれに従う
        const hinted = parseRetryAfterMs(lastError);
        const waitMs = hinted !== null ? hinted : calcRetryDelayMs(attempt, isRateLimitMessage(lastError));
        progress.show(`Vault RAG: ${Math.round(waitMs / 1000)}秒待って再試行（${attempt + 1}/${EMBED_MAX_ATTEMPTS}）\n${channel}${label}`);
        await controller.sleep(waitMs);
      }
      try {
        result = await callGeminiText(s.geminiApiKey, s.summaryModel, prompt, s.summaryMaxOutputTokens);
        break;
      } catch (err) {
        if (isAbortedError(err)) throw err;
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[Vault RAG] まとめ生成の失敗（${attempt + 1}/${EMBED_MAX_ATTEMPTS}）`, lastError);
        if (isNonRetryableApiError(lastError)) throw new Error(lastError);
      }
    }
    if (!result) throw new Error(`まとめ生成に ${EMBED_MAX_ATTEMPTS} 回失敗しました: ${lastError}`);

    // K4: まず ⟨出典: N3⟩ の番号を実在ファイル名へ機械置換する（落とし穴 S4）。
    // 番号ではなく名前を書いてきた分だけ、従来の近似マッチに回す。
    const titles = notes.map((n) => n.title);
    // ルール6 を守りきれずに出る「見出しだけの箇条書き」を ### 見出しに格上げする
    const promoted = promoteBoldOnlyBullets(result.text.trim());
    const numbered = resolveCitationNumbers(promoted.text, notes);
    const corrected = fixCitationsInText(numbered.text, titles);
    const repaired = corrected.fixes.filter((f) => f.after !== null);
    const unresolved = corrected.fixes.filter((f) => f.after === null);
    console.log(`[Vault RAG] K4 出典: ${channel}`, {
      boldBulletsPromoted: promoted.promoted,
      numberResolved: numbered.resolved, numberUnknown: numbered.unknown,
      unknownTokens: numbered.unknownTokens.slice(0, 10),
      nonNumeric: numbered.nonNumeric.length, nonNumericSamples: numbered.nonNumeric.slice(0, 5),
      approxRepaired: repaired.length, approxUnresolved: unresolved.length,
    });

    const adapter = this.app.vault.adapter;
    const folder = normalizePath(s.summaryFolder.replace(/\/+$/, ""));
    if (!(await adapter.exists(folder))) await adapter.mkdir(folder);
    // generated は実行日、source_notes / source_chars は現在の値になる
    const frontmatter = buildSummaryFrontmatter(channel, notes.length, sourceChars, s.summaryModel);
    const existed = await adapter.exists(outPath);
    const content = `${frontmatter}\n\n${corrected.text}\n`;
    if (writer) await writer(outPath, content, { truncated: result.truncated });
    else await adapter.write(outPath, content);

    return {
      channel, variants: group.variants, notes: notes.length, sourceChars,
      outChars: corrected.text.length, ratio: (corrected.text.length / sourceChars) * 100,
      inputTokens: result.inputTokens, outputTokens: result.outputTokens,
      truncated: result.truncated, citationsRepaired: repaired.length,
      citationsUnresolved: unresolved.length + numbered.unknown,
      numberResolved: numbered.resolved, numberUnknown: numbered.unknown,
      nonNumeric: numbered.nonNumeric.length,
      outPath, existed,
    };
  }

  private async runBuildChannelSummary(): Promise<void> {
    if (this.activeRun) { new Notice("Vault RAG: 既に実行中です", 5000); return; }
    const s = this.settings;
    const channel = s.summaryChannel.trim();
    if (!channel) { new Notice("Vault RAG: まとめ対象のチャンネル名が未設定です", 10000); return; }
    // 埋め込みと同じくフェイルファスト（落とし穴#25）。1リクエストも投げる前に止める
    if (!s.geminiApiKey) {
      new Notice("Vault RAG: Gemini の API キーが未設定です\n設定でキーを入れてください", 15000);
      return;
    }

    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const onEsc = this.makeEscHandler(controller);
    document.addEventListener("keydown", onEsc);
    const started = Date.now();

    try {
      progress.show(`Vault RAG: ${channel} のノートを読み込み中…`);
      const { group, readErrors } = await this.findChannelGroup(channel);
      if (!group) {
        progress.hide();
        new Notice(`Vault RAG: チャンネル「${channel}」の対象ノートが見つかりません`, 10000);
        return;
      }
      const r = await this.buildOneChannelSummary(group, controller, progress);
      progress.hide();

      const elapsedSec = (Date.now() - started) / 1000;
      new Notice(
        `✅ まとめノート作成完了\n` +
        `${r.channel}: ${r.notes} 本 / ${r.sourceChars.toLocaleString()} 文字\n` +
        `→ ${r.outChars.toLocaleString()} 文字（圧縮率 ${r.ratio.toFixed(1)}%）\n` +
        `出典の補正: ${r.citationsRepaired} 件 ／ 直せず不明にした: ${r.citationsUnresolved} 件\n` +
        `トークン: 入力 ${r.inputTokens.toLocaleString()} / 出力 ${r.outputTokens.toLocaleString()}\n` +
        `費用: 無料枠のため 0 円\n` +
        `所要: ${elapsedSec.toFixed(1)} 秒\n` +
        `保存先: ${r.outPath}${r.existed ? "（上書き）" : ""}\n` +
        `読み取り失敗: ${readErrors.length} 本` +
        (r.truncated ? "\n⚠️ 出力が maxOutputTokens で打ち切られています" : ""),
        0,
      );
      console.log("[Vault RAG] まとめノート作成完了", { ...r, elapsedSec, readErrors });
    } catch (err) {
      progress.hide();
      if (isAbortedError(err)) {
        new Notice("Vault RAG: 中断しました。まとめノートは保存していません", 10000);
      } else {
        console.error("[Vault RAG] まとめノートの作成に失敗しました", err);
        new Notice(`Vault RAG: まとめノートの作成に失敗しました\n${err instanceof Error ? err.message : String(err)}`, 0);
      }
    } finally {
      document.removeEventListener("keydown", onEsc);
      this.activeRun = null;
    }
  }

  /** 全チャンネル分をまとめて生成する。1本の失敗で全体を止めない。 */
  private async runBuildAllChannelSummaries(): Promise<void> {
    if (this.activeRun) { new Notice("Vault RAG: 既に実行中です", 5000); return; }
    const s = this.settings;
    if (!s.geminiApiKey) {
      new Notice("Vault RAG: Gemini の API キーが未設定です\n設定でキーを入れてください", 15000);
      return;
    }

    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const onEsc = this.makeEscHandler(controller);
    document.addEventListener("keydown", onEsc);
    const started = Date.now();
    const done: SummaryBuildResult[] = [];
    const failed: Array<{ channel: string; error: string }> = [];

    try {
      progress.show("Vault RAG: 対象ノートを読み込み中…");
      const { groups, readErrors, noChannel } = await this.collectChannelGroups();
      if (groups.length === 0) {
        progress.hide();
        new Notice("Vault RAG: チャンネルが見つかりません", 10000);
        return;
      }
      const merged = groups.filter((g) => g.variants.length > 1);
      console.log(`[Vault RAG] 全チャンネル生成: ${groups.length} チャンネル / channel 空のノート ${noChannel} 本`);
      if (merged.length > 0) console.log("[Vault RAG] 表記ゆれを統合したチャンネル", merged.map((g) => ({ displayName: g.displayName, variants: g.variants, notes: g.notes.length })));

      const limiter = new TokenRateLimiter(s.summaryTokenBudgetPerMin);
      for (let i = 0; i < groups.length; i++) {
        controller.throwIfAborted();
        if (i > 0 && s.summaryIntervalMs > 0) await controller.sleep(s.summaryIntervalMs);

        const g = groups[i];
        progress.show(`Vault RAG: まとめ生成 ${i + 1} / ${groups.length}（${g.displayName}）Escで中断`);
        try {
          done.push(await this.buildOneChannelSummary(g, controller, progress, limiter));
        } catch (err) {
          if (isAbortedError(err)) throw err;
          const message = err instanceof Error ? err.message : String(err);
          failed.push({ channel: g.displayName, error: message });
          console.error(`[Vault RAG] ${g.displayName} の生成に失敗`, message);
          if (isNonRetryableApiError(message)) throw new Error(`回復しないエラーのため中断しました: ${message}`);
        }
      }

      progress.hide();
      this.reportAllSummaries(done, failed, groups.length, started, readErrors.length, noChannel);
    } catch (err) {
      progress.hide();
      const elapsedSec = (Date.now() - started) / 1000;
      const line = `\n完了: ${done.length} / ${done.length + failed.length} チャンネル ／ 経過 ${elapsedSec.toFixed(1)} 秒`;
      if (isAbortedError(err)) {
        new Notice(`Vault RAG: 中断しました。生成済みのまとめノートは残しています${line}`, 0);
      } else {
        console.error("[Vault RAG] 全チャンネル生成に失敗しました", err);
        new Notice(`Vault RAG: 全チャンネル生成に失敗しました\n${err instanceof Error ? err.message : String(err)}${line}`, 0);
      }
      console.log("[Vault RAG] 中断/失敗時の内訳", { done: done.map((d) => d.channel), failed });
    } finally {
      document.removeEventListener("keydown", onEsc);
      this.activeRun = null;
    }
  }

  private reportAllSummaries(
    done: SummaryBuildResult[],
    failed: Array<{ channel: string; error: string }>,
    total: number,
    started: number,
    readErrors: number,
    noChannel: number,
  ): void {
    let srcChars = 0, outChars = 0, inTok = 0, outTok = 0, repaired = 0, unresolved = 0, truncated = 0;
    for (const d of done) {
      srcChars += d.sourceChars; outChars += d.outChars;
      inTok += d.inputTokens; outTok += d.outputTokens;
      repaired += d.citationsRepaired; unresolved += d.citationsUnresolved;
      if (d.truncated) truncated++;
    }
    const elapsedSec = (Date.now() - started) / 1000;
    const ratio = srcChars > 0 ? (outChars / srcChars) * 100 : 0;

    console.log("[Vault RAG] 全チャンネル生成の結果", {
      total, done: done.length, failed: failed.length, srcChars, outChars, ratio,
      inTok, outTok, repaired, unresolved, truncated, elapsedSec, readErrors, noChannel,
    });
    console.table(done.map((d) => ({
      channel: d.channel, notes: d.notes, src: d.sourceChars, out: d.outChars,
      ratio: `${d.ratio.toFixed(1)}%`, fixed: d.citationsRepaired, unknown: d.citationsUnresolved,
      truncated: d.truncated,
    })));
    if (failed.length > 0) console.error("[Vault RAG] 生成に失敗したチャンネル", failed);

    new Notice(
      `✅ 全チャンネルのまとめノート作成完了\n` +
      `${done.length} / ${total} チャンネル${failed.length > 0 ? `（失敗 ${failed.length}）` : ""}\n` +
      `${srcChars.toLocaleString()} → ${outChars.toLocaleString()} 文字（圧縮率 ${ratio.toFixed(1)}%）\n` +
      `トークン: 入力 ${inTok.toLocaleString()} / 出力 ${outTok.toLocaleString()}\n` +
      `費用: 無料枠のため 0 円\n` +
      `出典の補正: ${repaired} 件 ／ 不明にした: ${unresolved} 件\n` +
      `所要: ${(elapsedSec / 60).toFixed(1)} 分\n` +
      (truncated > 0 ? `⚠️ 出力が打ち切られたチャンネル: ${truncated} 件\n` : "") +
      `詳細はコンソール（Ctrl+Shift+I）`,
      0,
    );
  }

  private makeEscHandler(controller: RunController): (ev: KeyboardEvent) => void {
    return (ev: KeyboardEvent) => {
      if (ev.key === "Escape") {
        controller.abort();
        new Notice("Vault RAG: 中断します（送信済みのリクエストの完了を待ちます）", 5000);
      }
    };
  }

  /**
   * 1チャンネル分の検証（K1b / K3 / K4 / K5）。
   * K1a（数値の全数保全）は 2026-09-25 に検証項目から外した。
   * 圧縮率 5% と数値の全数保全は両立せず、まとめノートは「読み物」に用途を切り分けたため。
   * 数値を確認したいときは出典から元ノートを辿る。
   */
  private async verifyOneChannel(group: ChannelGroup): Promise<SummaryVerifyResult | null> {
    const adapter = this.app.vault.adapter;
    const outPath = this.summaryNotePath(group.displayName);
    if (!(await adapter.exists(outPath))) return null;

    const summaryBody = splitFrontmatter(await adapter.read(outPath)).body;
    const notes = group.notes;
    const sourceChars = group.chars;

    // --- K1b: 匿名個人の自己申告値が「△△ 〜 □□（n=件数）」で集約されているか ---
    const aggregates = checkAggregateLines(summaryBody);
    const malformed = aggregates.filter((a) => !a.hasRange || !a.hasCount);

    // --- K3: 出典のない箇条書き（導入行は子に出典があれば免除） ---
    const bulletsWithoutCitation = findBulletsWithoutCitation(summaryBody);

    // --- K4: 出典のノート名が実在するか（生成時に補正済みなので残りは「不明」だけのはず） ---
    const knownTitles = new Set(notes.map((n) => n.title));
    const citations = extractCitations(summaryBody);
    const citationCounts = new Map<string, number>();
    for (const c of citations) citationCounts.set(c, (citationCounts.get(c) || 0) + 1);
    const unresolvedNames: string[] = [];
    let unknownLabels = 0;
    citationCounts.forEach((count, name) => {
      if (name === "同上") return;   // 直前と同じ出典を指す表記
      if (name === "不明") { unknownLabels += count; return; }
      if (!knownTitles.has(name)) unresolvedNames.push(name);
    });

    return {
      channel: group.displayName,
      notes: notes.length,
      sourceChars,
      summaryChars: summaryBody.length,
      ratio: sourceChars > 0 ? (summaryBody.length / sourceChars) * 100 : 0,
      aggregateLines: aggregates.length,
      malformedAggregates: malformed.length,
      malformedSamples: malformed.map((a) => a.line),
      bulletsWithoutCitation: bulletsWithoutCitation.length,
      bulletSamples: bulletsWithoutCitation.slice(0, 5),
      citations: citations.length,
      distinctCitations: citationCounts.size,
      unresolvedNames,
      unknownLabels,
    };
  }

  private async runVerifyChannelSummary(): Promise<void> {
    const s = this.settings;
    const channel = s.summaryChannel.trim();
    try {
      const { group } = await this.findChannelGroup(channel);
      if (!group) {
        new Notice(`Vault RAG: チャンネル「${channel}」の元ノートが見つかりません`, 10000);
        return;
      }
      const r = await this.verifyOneChannel(group);
      if (!r) {
        new Notice(`Vault RAG: まとめノートがありません\n${this.summaryNotePath(group.displayName)}`, 10000);
        return;
      }
      console.log("[Vault RAG] まとめノート検証", r);
      new Notice(
        `🔍 まとめノート検証: ${r.channel}\n` +
        `K1b 集約行 ${r.aggregateLines} 件 / 形式違反 ${r.malformedAggregates} 件\n` +
        `K3 出典なしの箇条書き: ${r.bulletsWithoutCitation} 件\n` +
        `K4 実在しない出典名: ${r.unresolvedNames.length} 件 / ⟨出典: 不明⟩ ${r.unknownLabels} 件\n` +
        `K5 文字数: ${r.summaryChars.toLocaleString()} / ${r.sourceChars.toLocaleString()}（圧縮率 ${r.ratio.toFixed(1)}%）\n` +
        `詳細はコンソール（Ctrl+Shift+I）`,
        0,
      );
    } catch (err) {
      console.error("[Vault RAG] 検証に失敗しました", err);
      new Notice(`Vault RAG: 検証に失敗しました\n${err instanceof Error ? err.message : String(err)}`, 15000);
    }
  }

  /** 全チャンネル分のまとめノートを検証する。 */
  private async runVerifyAllChannelSummaries(): Promise<void> {
    try {
      const { groups } = await this.collectChannelGroups();
      const results: SummaryVerifyResult[] = [];
      const missing: string[] = [];
      for (const g of groups) {
        const r = await this.verifyOneChannel(g);
        if (r) results.push(r); else missing.push(g.displayName);
      }
      if (results.length === 0) {
        new Notice("Vault RAG: 検証できるまとめノートがありません", 10000);
        return;
      }

      let srcChars = 0, sumChars = 0, agg = 0, badAgg = 0, bullets = 0, unresolved = 0, unknown = 0;
      for (const r of results) {
        srcChars += r.sourceChars; sumChars += r.summaryChars;
        agg += r.aggregateLines; badAgg += r.malformedAggregates;
        bullets += r.bulletsWithoutCitation;
        unresolved += r.unresolvedNames.length; unknown += r.unknownLabels;
      }
      const ratio = srcChars > 0 ? (sumChars / srcChars) * 100 : 0;

      console.log("[Vault RAG] 全チャンネル検証", {
        channels: results.length, missing, srcChars, sumChars, ratio,
        aggregateLines: agg, malformed: badAgg, bulletsWithoutCitation: bullets,
        unresolvedNames: unresolved, unknownLabels: unknown,
      });
      console.table(results.map((r) => ({
        channel: r.channel, notes: r.notes, src: r.sourceChars, out: r.summaryChars,
        ratio: `${r.ratio.toFixed(1)}%`, K1b: `${r.aggregateLines}/${r.malformedAggregates}`,
        K3: r.bulletsWithoutCitation, K4: `${r.unresolvedNames.length}/${r.unknownLabels}`,
      })));
      const offenders = results.filter((r) => r.bulletsWithoutCitation > 0 || r.malformedAggregates > 0 || r.unresolvedNames.length > 0);
      if (offenders.length > 0) console.warn("[Vault RAG] 要確認のチャンネル", offenders);

      new Notice(
        `🔍 全チャンネル検証: ${results.length} 本` +
        (missing.length > 0 ? `（未生成 ${missing.length}）` : "") + "\n" +
        `K1b 集約行 ${agg} 件 / 形式違反 ${badAgg} 件\n` +
        `K3 出典なしの箇条書き: ${bullets} 件\n` +
        `K4 実在しない出典名: ${unresolved} 件 / ⟨出典: 不明⟩ ${unknown} 件\n` +
        `K5 ${sumChars.toLocaleString()} / ${srcChars.toLocaleString()} 文字（圧縮率 ${ratio.toFixed(1)}%）\n` +
        `詳細はコンソール（Ctrl+Shift+I）`,
        0,
      );
    } catch (err) {
      console.error("[Vault RAG] 全チャンネル検証に失敗しました", err);
      new Notice(`Vault RAG: 全チャンネル検証に失敗しました\n${err instanceof Error ? err.message : String(err)}`, 15000);
    }
  }

  /**
   * 既存のまとめノートの出典表記だけを直す。API は呼ばない。
   * `⟨ノート名⟩` に `出典:` を足し、名前の表記ゆれを実在ファイル名に寄せる。
   */
  private async runRepairSummaryCitations(): Promise<void> {
    const adapter = this.app.vault.adapter;
    try {
      const { groups } = await this.collectChannelGroups();
      let changed = 0, labels = 0, repaired = 0, unresolved = 0, skipped = 0, promotedTotal = 0;
      const perChannel: Array<{ channel: string; promoted: number; labelsAdded: number; repaired: number; unresolved: number }> = [];

      for (const g of groups) {
        const outPath = this.summaryNotePath(g.displayName);
        if (!(await adapter.exists(outPath))) { skipped++; continue; }
        const raw = await adapter.read(outPath);
        const split = splitFrontmatter(raw);
        const promotedResult = promoteBoldOnlyBullets(split.body.trim());
        const fixedResult = fixCitationsInText(promotedResult.text, g.notes.map((n) => n.title));
        const fixedRepaired = fixedResult.fixes.filter((f) => f.after !== null).length;
        const fixedUnresolved = fixedResult.fixes.filter((f) => f.after === null).length;

        labels += fixedResult.labelsAdded;
        repaired += fixedRepaired;
        unresolved += fixedUnresolved;
        promotedTotal += promotedResult.promoted;
        if (fixedResult.labelsAdded > 0 || fixedRepaired > 0 || promotedResult.promoted > 0) {
          perChannel.push({
            channel: g.displayName, promoted: promotedResult.promoted,
            labelsAdded: fixedResult.labelsAdded, repaired: fixedRepaired, unresolved: fixedUnresolved,
          });
        }

        const next = `---
${split.frontmatter}
---

${fixedResult.text}
`;
        if (next !== raw) { await adapter.write(outPath, next); changed++; }
      }

      console.log("[Vault RAG] まとめノートの整形", { changed, boldBulletsPromoted: promotedTotal, labelsAdded: labels, repaired, unresolved, skipped });
      if (perChannel.length > 0) console.table(perChannel);
      new Notice(
        `🔧 まとめノートの整形が完了しました
` +
        `書き換えたノート: ${changed} 本${skipped > 0 ? `（未生成 ${skipped}）` : ""}
` +
        `見出しに格上げした箇条書き: ${promotedTotal}
` +
        `「出典:」を補った箇所: ${labels}
` +
        `ノート名を直した箇所: ${repaired}
` +
        `直せず不明のままの箇所: ${unresolved}
` +
        `API 呼び出しなし / 費用 0 円`,
        0,
      );
    } catch (err) {
      console.error("[Vault RAG] 出典の再補正に失敗しました", err);
      new Notice(`Vault RAG: 出典の再補正に失敗しました
${err instanceof Error ? err.message : String(err)}`, 15000);
    }
  }

  /* ---------- ハイブリッド検索 ---------- */

  /** 質問文を埋め込む。ノート側と違い taskType は RETRIEVAL_QUERY（落とし穴#22）。 */
  private async embedQuery(query: string, controller: RunController): Promise<Float32Array> {
    const s = this.settings;
    const result = await this.embedBatchWithRetry([query], "RETRIEVAL_QUERY", controller, (waitMs, attempt, message) => {
      console.warn(`[Vault RAG] 質問の埋め込みを再試行（${attempt + 1}）: ${Math.round(waitMs / 1000)}秒待機 / ${message}`);
    });
    const v = result.vectors[0];
    if (!v || v.length !== s.embeddingDimensions) {
      throw new Error(`質問ベクトルの次元が想定と違います: ${v ? v.length : 0}（期待 ${s.embeddingDimensions}）`);
    }
    // 保存側と同じく L2 正規化する。こうすると内積だけでコサイン類似度になる
    return new Float32Array(normalizeVector(v));
  }

  /**
   * ハイブリッド検索。ベクトル検索とキーワード検索を独立に行い、RRF で統合する。
   * 類似度の絶対値でのしきい値は入れない（落とし穴#24）。
   */
  async hybridSearch(query: string, controller: RunController): Promise<SearchResult> {
    const s = this.settings;
    if (!this.index || !this.vectors) {
      throw new Error(this.indexBlockedReason || "インデックスが読み込まれていません");
    }
    const chunks = this.index.chunks;
    const dim = this.index.meta.dimensions;
    const t0 = Date.now();

    // --- 1. 質問の埋め込み ---
    const queryVec = await this.embedQuery(query, controller);
    const t1 = Date.now();

    // --- 2. ベクトル検索（全チャンク総当たり）---
    const cosines = new Float64Array(chunks.length);
    for (let i = 0; i < chunks.length; i++) cosines[i] = dotProduct(this.vectors, i * dim, queryVec, dim);
    const byVector = Array.from({ length: chunks.length }, (_v, i) => i)
      .sort((a, b) => cosines[b] - cosines[a])
      .slice(0, s.vectorTopK);
    const vectorRank = new Map<number, number>();
    byVector.forEach((idx, i) => vectorRank.set(idx, i + 1));
    const t2 = Date.now();

    // --- 3. キーワード検索（既定では通らない。落とし穴#30）---
    // 通すときは、語ごとに Obsidian のスコアラーを回して OR で集める。
    // 全語を1回の prepareSimpleSearch に渡す（AND）方式は使わない。長い質問ほど0件になる
    const terms = s.keywordSearchEnabled ? tokenizeQuery(query) : [];
    const matchedTerms = new Map<number, number>();
    const scoreSum = new Map<number, number>();
    for (const term of terms) {
      const scorer = prepareSimpleSearch(term);
      for (let i = 0; i < chunks.length; i++) {
        const r = scorer(chunks[i].text);
        if (!r) continue;
        matchedTerms.set(i, (matchedTerms.get(i) || 0) + 1);
        scoreSum.set(i, (scoreSum.get(i) || 0) + r.score);
      }
    }
    // 一致した語の数が多い順。同数なら Obsidian スコアの合計が高い順
    const keywordScores = Array.from(matchedTerms.keys())
      .map((index) => ({ index, terms: matchedTerms.get(index) as number, score: scoreSum.get(index) as number }))
      .sort((a, b) => b.terms - a.terms || b.score - a.score);
    const byKeyword = keywordScores.slice(0, s.keywordTopK);
    const keywordRank = new Map<number, number>();
    const keywordScore = new Map<number, number>();
    const keywordTermCount = new Map<number, number>();
    byKeyword.forEach((e, i) => {
      keywordRank.set(e.index, i + 1);
      keywordScore.set(e.index, e.score);
      keywordTermCount.set(e.index, e.terms);
    });
    const t3 = Date.now();

    // --- 4. RRF 統合 ---
    const union = new Set<number>([...byVector, ...byKeyword.map((e) => e.index)]);
    const build = (index: number): SearchCandidate => {
      const vr = vectorRank.has(index) ? (vectorRank.get(index) as number) : null;
      const kr = keywordRank.has(index) ? (keywordRank.get(index) as number) : null;
      return {
        chunkIndex: index,
        cosine: cosines[index],
        vectorRank: vr,
        keywordScore: keywordScore.has(index) ? (keywordScore.get(index) as number) : null,
        keywordTerms: keywordTermCount.has(index) ? (keywordTermCount.get(index) as number) : null,
        keywordRank: kr,
        rrf: rrfScore([vr, kr], s.rrfK),
      };
    };
    const fused = Array.from(union).map(build).sort((a, b) => b.rrf - a.rrf || b.cosine - a.cosine);
    const vectorOnly = byVector.map(build);
    // 既定（keywordSearchEnabled=false）ではベクトルの並びをそのまま使う。
    // maxChunksPerNote はどちらの経路でも適用する
    const ordered = s.keywordSearchEnabled ? fused : vectorOnly;
    const capped = capPerNote(ordered, chunks, s.maxChunksPerNote, s.finalTopK);
    const t4 = Date.now();

    return {
      query,
      terms,
      vectorOnly,
      fused,
      capped,
      keywordHits: keywordScores.length,
      timing: { embedMs: t1 - t0, vectorMs: t2 - t1, keywordMs: t3 - t2, rrfMs: t4 - t3, totalMs: t4 - t0 },
    };
  }

  /** 検索結果を 1 行にする（コンソール出力用）。 */
  private formatHit(rank: number, c: SearchCandidate): string {
    const chunk = (this.index as VaultRagIndex).chunks[c.chunkIndex];
    const head = chunk.text.replace(/\s+/g, " ").slice(0, 100);
    return (
      `${String(rank).padStart(2)}. rrf=${c.rrf.toFixed(5)} ` +
      `vec=${c.vectorRank === null ? "-" : String(c.vectorRank).padStart(2)} ` +
      `kw=${c.keywordRank === null ? "-" : String(c.keywordRank).padStart(2)}` +
      `${c.keywordTerms === null ? "" : `(${c.keywordTerms}語)`} ` +
      `cos=${c.cosine.toFixed(4)}\n` +
      `    ${chunk.title.slice(0, 48)}\n` +
      `    ${chunk.sourceType} / ${chunk.kind} / headings=[${chunk.headings.join(" / ").slice(0, 70)}]\n` +
      `    ${head}`
    );
  }

  private async runSearchTest(): Promise<void> {
    if (!this.index || !this.vectors) {
      new Notice(`Vault RAG: 検索できません\n${this.indexBlockedReason || "インデックスが読み込まれていません"}`, 15000);
      return;
    }
    const s = this.settings;
    const apiKey = getEmbeddingApiKey(s);
    if (!apiKey) {
      new Notice(`Vault RAG: ${s.embeddingProvider === "openai" ? "OpenAI" : "Gemini"} の API キーが未設定です`, 15000);
      return;
    }

    new SearchTestModal(this.app, async (query: string) => {
      const controller = new RunController();
      this.activeRun = controller;
      const progress = new ProgressNotice();
      progress.show(`Vault RAG: 検索中…「${query}」`);
      try {
        const r = await this.hybridSearch(query, controller);
        progress.hide();

        console.log(`\n========== 検索: ${r.query}`);
        console.log(`語分割: [${r.terms.join(" | ")}]（${r.terms.length} 語）`);
        console.log(`キーワード検索でスコアが付いたチャンク: ${r.keywordHits} / ${(this.index as VaultRagIndex).chunks.length}`);
        console.log(`時間: 埋め込み ${r.timing.embedMs}ms / ベクトル ${r.timing.vectorMs}ms / キーワード ${r.timing.keywordMs}ms / RRF ${r.timing.rrfMs}ms / 合計 ${r.timing.totalMs}ms`);

        console.log(`\n--- ベクトル検索のみ 上位${s.finalTopK} ---`);
        r.vectorOnly.slice(0, s.finalTopK).forEach((c, i) => console.log(this.formatHit(i + 1, c)));
        console.log(`\n--- RRF統合後 上位${s.finalTopK}（maxChunksPerNote なし）---`);
        r.fused.slice(0, s.finalTopK).forEach((c, i) => console.log(this.formatHit(i + 1, c)));
        console.log(`\n--- RRF統合後 上位${s.finalTopK}（maxChunksPerNote=${s.maxChunksPerNote} 適用）---`);
        r.capped.forEach((c, i) => console.log(this.formatHit(i + 1, c)));

        const chunks = (this.index as VaultRagIndex).chunks;
        const summaries = r.capped.filter((c) => chunks[c.chunkIndex].sourceType === "channel_summary").length;
        new Notice(
          `🔍 検索完了: ${query}\n` +
          `キーワードヒット ${r.keywordHits} 件 / まとめノート ${summaries} 件\n` +
          `1位 cos=${r.capped.length > 0 ? r.capped[0].cosine.toFixed(4) : "-"}\n` +
          `時間 ${r.timing.totalMs}ms（埋め込み ${r.timing.embedMs}ms）\n` +
          `詳細はコンソール（Ctrl+Shift+I）`,
          0,
        );
      } catch (err) {
        progress.hide();
        if (isAbortedError(err)) new Notice("Vault RAG: 中断しました", 5000);
        else {
          console.error("[Vault RAG] 検索に失敗しました", err);
          new Notice(`Vault RAG: 検索に失敗しました\n${err instanceof Error ? err.message : String(err)}`, 15000);
        }
      } finally {
        this.activeRun = null;
      }
    }).open();
  }

  /* ---------- 差分更新 ---------- */

  /** そのパスが RAG の対象フォルダ（元ノート or まとめノート）の中か。 */
  private isWatchedPath(path: string): boolean {
    if (!path.endsWith(".md")) return false;
    const s = this.settings;
    const target = s.targetFolder.replace(/\/+$/, "");
    const summary = s.summaryFolder.replace(/\/+$/, "");
    const wantSummaries = s.includeSourceTypes.indexOf("channel_summary") >= 0;
    if (isUnderFolder(path, target)) {
      if (hasExcludedFolder(path, s.excludeSubfolders)) return false;
      if (s.excludeRootFiles && isDirectChild(path, target)) return false;
      return true;
    }
    if (wantSummaries && summary.length > 0 && isUnderFolder(path, summary)) return true;
    return false;
  }

  /** Vault の変更を監視する。イベントごとに API を叩かず、デバウンスしてまとめる（落とし穴#7）。 */
  private registerVaultWatchers(): void {
    const enqueue = (path: string, oldPath?: string) => {
      if (oldPath && this.isWatchedPath(oldPath)) this.pendingChanges.add(oldPath);
      if (this.isWatchedPath(path)) this.pendingChanges.add(path);
      if (this.pendingChanges.size === 0) return;
      this.scheduleIncrementalUpdate();
    };

    this.registerEvent(this.app.vault.on("modify", (file) => { if (file instanceof TFile) enqueue(file.path); }));
    this.registerEvent(this.app.vault.on("create", (file) => { if (file instanceof TFile) enqueue(file.path); }));
    this.registerEvent(this.app.vault.on("delete", (file) => { if (file instanceof TFile) enqueue(file.path); }));
    // rename はパスの付け替えだけで済ませず再埋め込みする（コンテキストヘッダにタイトルが入るため）
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof TFile) enqueue(file.path, oldPath);
    }));
  }

  private scheduleIncrementalUpdate(): void {
    if (this.reindexTimer !== null) window.clearTimeout(this.reindexTimer);
    this.reindexTimer = window.setTimeout(() => {
      this.reindexTimer = null;
      void this.runIncrementalUpdate();
    }, this.settings.reindexDebounceMs);
  }

  /**
   * 溜まった変更をまとめて処理する。
   * 変更されたファイルのチャンクだけ作り直し、`.bin` を組み直して整合性検証を通す。
   */
  private async runIncrementalUpdate(): Promise<void> {
    if (this.activeRun) {
      // 全件処理中なら、終わったあとにもう一度試す
      this.scheduleIncrementalUpdate();
      return;
    }
    if (!this.index || !this.vectors) return;      // インデックス未作成なら何もしない
    if (this.pendingChanges.size === 0) return;

    const s = this.settings;
    const apiKey = getEmbeddingApiKey(s);
    if (!apiKey) {
      console.warn("[Vault RAG] 差分更新を飛ばしました: API キーが未設定");
      this.pendingChanges.clear();
      return;
    }

    const paths = Array.from(this.pendingChanges);
    this.pendingChanges.clear();

    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const started = Date.now();

    try {
      progress.show(`Vault RAG: 差分更新中…（${paths.length} 本）`);
      const dim = this.index.meta.dimensions;
      const oldChunks = this.index.chunks;
      const oldVectors = this.vectors;

      // 1. 変更・削除されたパスのチャンクを外し、残りはベクトルごと持ち越す
      const changed = new Set(paths);
      const keptChunks: Chunk[] = [];
      const keptVectorSources: number[] = [];
      for (let i = 0; i < oldChunks.length; i++) {
        if (changed.has(oldChunks[i].path)) continue;
        keptChunks.push(oldChunks[i]);
        keptVectorSources.push(i);
      }
      const removed = oldChunks.length - keptChunks.length;

      // 2. 現存するファイルからチャンクを作り直す
      const newChunks: Chunk[] = [];
      let notesUpdated = 0;
      const readErrors: string[] = [];
      for (const path of paths) {
        controller.throwIfAborted();
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile)) continue;        // 削除・リネーム前のパスはここで落ちる
        if (!this.isWatchedPath(path)) continue;
        let raw: string;
        try {
          raw = await this.app.vault.cachedRead(file);
        } catch (err) {
          readErrors.push(path);
          console.error("[Vault RAG] 読み取り失敗:", path, err);
          continue;
        }
        const note = extractNote(raw, s);
        if (s.includeSourceTypes.indexOf(note.sourceType) < 0) continue;
        if (isSummaryTooThin(note, s)) continue;
        const built = buildChunks(note, path, file.stat.mtime, s);
        if (built.length === 0) continue;
        notesUpdated++;
        for (const c of built) newChunks.push(c);
      }

      // 3. 追加分だけ埋め込む（既存のバッチ処理をそのまま使う）
      const newVectors = new Float32Array(newChunks.length * dim);
      let embeddedTokens = 0;
      let embeddedChars = 0;
      const batchSize = Math.max(1, s.embedBatchSize);
      for (let start = 0; start < newChunks.length; start += batchSize) {
        controller.throwIfAborted();
        if (start > 0 && s.embedIntervalMs > 0) await controller.sleep(s.embedIntervalMs);
        const slice = newChunks.slice(start, start + batchSize);
        progress.show(`Vault RAG: 差分の埋め込み中 ${start} / ${newChunks.length} チャンク`);
        const result = await this.embedBatchWithRetry(
          slice.map((c) => c.text),
          "RETRIEVAL_DOCUMENT",
          controller,
          (waitMs, attempt, message) => {
            progress.show(`Vault RAG: ${Math.round(waitMs / 1000)}秒待って再試行（${attempt + 1}）\n${message}`);
          },
        );
        for (let i = 0; i < result.vectors.length; i++) {
          const v = result.vectors[i];
          if (v.length !== dim) throw new Error(`次元数が想定と違います: ${v.length}（期待 ${dim}）`);
          newVectors.set(normalizeVector(v), (start + i) * dim);
        }
        embeddedTokens += result.tokens;
        for (const c of slice) embeddedChars += c.text.length;
      }

      // 4. 持ち越し分 + 追加分で .bin を組み直す
      const merged = keptChunks.concat(newChunks);
      const mergedVectors = new Float32Array(merged.length * dim);
      for (let i = 0; i < keptVectorSources.length; i++) {
        mergedVectors.set(oldVectors.subarray(keptVectorSources[i] * dim, (keptVectorSources[i] + 1) * dim), i * dim);
      }
      mergedVectors.set(newVectors, keptChunks.length * dim);

      // 5. 整合性検証を通してから保存する
      const meta = currentIndexMeta(s, merged.length);
      meta.builtAt = this.index.meta.builtAt;         // 全件作成日時は保持する
      const integrity = validateIndexIntegrity(meta, merged.length, mergedVectors.byteLength);
      if (integrity) throw new Error(`差分更新後の整合性検証に失敗: ${integrity}`);

      await this.saveIndexToDisk(merged, mergedVectors, meta);
      this.index = { meta, chunks: merged };
      this.vectors = mergedVectors;

      const costUsd = calcEmbeddingCostUsd(s.embeddingModel, embeddedTokens);
      s.totalEmbeddingTokens += embeddedTokens;
      s.totalCostUsd += costUsd;
      await this.saveSettings();

      progress.hide();
      const elapsedSec = (Date.now() - started) / 1000;
      const usage = embeddedTokens > 0
        ? `埋め込みトークン: ${embeddedTokens.toLocaleString()} ／ ${formatUsdJpy(costUsd)}`
        : `埋め込み文字数: ${embeddedChars.toLocaleString()}（usage なし）／ 無料枠`;
      new Notice(
        `🔄 差分更新完了\n` +
        `対象 ${paths.length} 本（更新できたノート ${notesUpdated} 本）\n` +
        `チャンク: -${removed} / +${newChunks.length} → 合計 ${merged.length}\n` +
        `${usage}\n` +
        `所要: ${elapsedSec.toFixed(1)} 秒 ／ 整合性検証: OK` +
        (readErrors.length > 0 ? `\n読み取り失敗: ${readErrors.length} 本` : ""),
        10000,
      );
      console.log("[Vault RAG] 差分更新完了", {
        paths, notesUpdated, removed, added: newChunks.length, total: merged.length,
        embeddedTokens, embeddedChars, costUsd, elapsedSec, readErrors,
      });
    } catch (err) {
      progress.hide();
      // 失敗したパスは次の機会に再試行できるよう戻す
      for (const p of paths) this.pendingChanges.add(p);
      if (isAbortedError(err)) {
        new Notice("Vault RAG: 差分更新を中断しました。インデックスは変更していません", 8000);
      } else {
        console.error("[Vault RAG] 差分更新に失敗しました", err);
        new Notice(`Vault RAG: 差分更新に失敗しました\n${err instanceof Error ? err.message : String(err)}`, 15000);
      }
    } finally {
      this.activeRun = null;
    }
  }

  /* ---------- まとめノートの更新（2026-10-03） ---------- */

  private summaryStatePath(): string {
    return this.indexPath(SUMMARY_STATE_FILE);
  }

  async loadSummaryState(): Promise<SummaryState | null> {
    const adapter = this.app.vault.adapter;
    const p = this.summaryStatePath();
    try {
      if (!(await adapter.exists(p))) return null;
      const parsed = JSON.parse(await adapter.read(p)) as SummaryState;
      if (!parsed || typeof parsed !== "object" || !parsed.channels) return null;
      return parsed;
    } catch (err) {
      console.error("[Vault RAG] summary-state.json の読み込みに失敗", err);
      return null;
    }
  }

  /** チャンネル1件ぶんだけを保存する。中断しても完了済みの記録が残るようにするため。 */
  private async saveSummaryChannelState(key: string, state: SummaryChannelState): Promise<void> {
    const current = (await this.loadSummaryState()) || {
      version: SUMMARY_STATE_VERSION, updatedAt: "", channels: {},
    };
    current.version = SUMMARY_STATE_VERSION;
    current.channels[key] = state;
    current.updatedAt = new Date().toISOString();
    await this.app.vault.adapter.write(this.summaryStatePath(), JSON.stringify(current, null, 2));
  }

  private async saveSummaryStateAll(state: SummaryState): Promise<void> {
    state.version = SUMMARY_STATE_VERSION;
    state.updatedAt = new Date().toISOString();
    await this.app.vault.adapter.write(this.summaryStatePath(), JSON.stringify(state, null, 2));
  }

  /** いまの各チャンネルの状態を測る。`cutoffByMtime` を渡すと、その時刻以前の元ノートだけを一覧に入れる。 */
  private async measureChannels(groups: ChannelGroup[], cutoffByMtime: boolean): Promise<{
    measured: Array<{
      key: string; displayName: string; noteCount: number; chars: number;
      sources: SummarySourceRecord[]; summaryExists: boolean; summaryHash: string;
      summarySize: number; skippedNewer: number; group: ChannelGroup;
    }>;
    totalSkippedNewer: number;
  }> {
    const adapter = this.app.vault.adapter;
    const measured = [];
    let totalSkippedNewer = 0;

    for (const g of groups) {
      const outPath = this.summaryNotePath(g.displayName);
      const summaryExists = await adapter.exists(outPath);
      let summaryHash = "";
      let summarySize = 0;
      let summaryMtime = 0;
      if (summaryExists) {
        const raw = await adapter.read(outPath);
        summaryHash = await sha256Hex(raw);
        summarySize = raw.length;
        const f = this.app.vault.getAbstractFileByPath(outPath);
        if (f instanceof TFile) summaryMtime = f.stat.mtime;
      }

      const sources: SummarySourceRecord[] = [];
      let skippedNewer = 0;
      for (const n of g.notes) {
        const file = this.app.vault.getAbstractFileByPath(n.path);
        const mtime = file instanceof TFile ? file.stat.mtime : 0;
        // 初回のみ: まとめノートより新しい元ノートは一覧に入れない（次回「追加」として出る）
        if (cutoffByMtime && summaryExists && summaryMtime > 0 && mtime > summaryMtime) {
          skippedNewer++;
          totalSkippedNewer++;
          continue;
        }
        let raw = "";
        try {
          raw = file instanceof TFile ? await this.app.vault.cachedRead(file) : "";
        } catch (err) {
          console.error("[Vault RAG] 読み取り失敗:", n.path, err);
          continue;
        }
        sources.push({ path: n.path, size: raw.length, hash: await sha256Hex(raw) });
      }

      measured.push({
        key: normalizeChannelKey(g.displayName), displayName: g.displayName,
        noteCount: g.notes.length, chars: g.chars,
        sources, summaryExists, summaryHash, summarySize, skippedNewer, group: g,
      });
    }
    return { measured, totalSkippedNewer };
  }

  /**
   * まとめノートを `summary-backup/{YYYY-MM-DD}/` へ退避する。同名があれば連番を付ける。
   * `content` を渡すとその内容を書く（上書きしなかった新しい版を `_候補` として残す用途）。
   * 渡さなければ `outPath` の現在の内容をコピーする（上書き前の退避）。
   * バックアップは自動削除しない。
   */
  private async backupSummaryNote(outPath: string, suffix = "", content?: string): Promise<string | null> {
    const adapter = this.app.vault.adapter;
    if (content === undefined && !(await adapter.exists(outPath))) return null;
    const dir = this.indexPath(`${SUMMARY_BACKUP_DIR}/${new Date().toISOString().slice(0, 10)}`);
    if (!(await adapter.exists(dir))) await adapter.mkdir(dir);

    const base = outPath.slice(outPath.lastIndexOf("/") + 1).replace(/\.md$/, "") + suffix;
    let dest = normalizePath(`${dir}/${base}.md`);
    let n = 2;
    while (await adapter.exists(dest)) {
      dest = normalizePath(`${dir}/${base}_${n}.md`);
      n++;
      if (n > 999) break;
    }
    await adapter.write(dest, content !== undefined ? content : await adapter.read(outPath));
    return dest;
  }

  /**
   * まとめノートを書く。`adapter.write()` ではなく Vault API を使う。
   * `vault.modify()` / `vault.create()` なら `modify` / `create` イベントが確実に出て、
   * 既存の差分更新（`vault.on`）が RAG インデックスに反映してくれる。
   */
  private async writeSummaryNote(outPath: string, content: string): Promise<void> {
    const existing = this.app.vault.getAbstractFileByPath(outPath);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
      return;
    }
    const folder = normalizePath(this.settings.summaryFolder.replace(/\/+$/, ""));
    if (!(await this.app.vault.adapter.exists(folder))) await this.app.vault.createFolder(folder);
    await this.app.vault.create(outPath, content);
  }

  private async runUpdateSummaries(): Promise<void> {
    if (this.activeRun) { new Notice("Vault RAG: 既に実行中です", 5000); return; }
    const s = this.settings;
    if (!s.geminiApiKey) {
      new Notice("Vault RAG: Gemini の API キーが未設定です\n設定でキーを入れてください", 15000);
      return;
    }

    const progress = new ProgressNotice();
    try {
      progress.show("Vault RAG: 元ノートを読み込み中…");
      const { groups } = await this.collectChannelGroups();
      if (groups.length === 0) {
        progress.hide();
        new Notice("Vault RAG: チャンネルが見つかりません", 10000);
        return;
      }
      const saved = await this.loadSummaryState();
      const isFirstRun = saved === null;

      progress.show(`Vault RAG: 変更を確認中…（${groups.length} チャンネル）`);
      const { measured, totalSkippedNewer } = await this.measureChannels(groups, isFirstRun);
      progress.hide();

      // --- 初回: 一覧だけ作って終了 ---
      if (isFirstRun) {
        const state: SummaryState = { version: SUMMARY_STATE_VERSION, updatedAt: "", channels: {} };
        for (const c of measured) {
          state.channels[c.key] = {
            summaryPath: this.summaryNotePath(c.displayName),
            summarySize: c.summarySize,
            summaryHash: c.summaryHash,
            generatedAt: new Date().toISOString(),
            sources: c.sources,
          };
        }
        await this.saveSummaryStateAll(state);
        console.log("[Vault RAG] 初回の一覧を作成", {
          channels: measured.length, skippedNewer: totalSkippedNewer,
          perChannel: measured.filter((c) => c.skippedNewer > 0).map((c) => ({ ch: c.displayName, newer: c.skippedNewer })),
        });
        new Notice(
          `📋 初回の一覧を作成しました\n` +
          `${measured.length} チャンネル / 元ノート ${measured.reduce((a, c) => a + c.sources.length, 0)} 本を記録\n` +
          `まとめノート生成後に更新された元ノート ${totalSkippedNewer} 本は、次回の実行で確認できます`,
          0,
        );
        return;
      }

      // --- 2回目以降: 差分を出して確認モーダル ---
      // 作り直しが必要なチャンネルが 0 件でも必ずモーダルを開く。
      // 「変更なし」で終わらせると、まとめノートを前の版に戻したチャンネルを
      // 作り直す手段が無くなる（2026-10-03 実機で判明）。
      const plan = diffSummaryState(measured, saved, s.summaryTokenBudgetPerMin);
      const grouped = groupSummaryUpdateTargets(plan);
      console.log("[Vault RAG] グループ分け", {
        needsRebuild: grouped.needsRebuild.map((d) => d.displayName),
        manuallyEdited: grouped.manuallyEdited.map((d) => d.displayName),
        unchanged: grouped.unchanged.length,
        sourcesGone: grouped.sourcesGone.map((d) => d.displayName),
        selectable: grouped.selectableCount,
      });

      new SummaryUpdateModal(this.app, plan, s.summaryTokenBudgetPerMin, async (selectedKeys: string[]) => {
        await this.executeSummaryUpdate(selectedKeys, measured, plan);
      }).open();
    } catch (err) {
      progress.hide();
      console.error("[Vault RAG] まとめノートの更新準備に失敗しました", err);
      new Notice(`Vault RAG: まとめノートの更新準備に失敗しました\n${err instanceof Error ? err.message : String(err)}`, 15000);
    }
  }

  private async executeSummaryUpdate(
    selectedKeys: string[],
    measured: Array<{
      key: string; displayName: string; group: ChannelGroup; sources: SummarySourceRecord[];
      // 長さの歯止め（落とし穴#33）で前の版の文字数が必要
      summaryExists: boolean; summarySize: number;
    }>,
    plan: SummaryUpdatePlan,
  ): Promise<void> {
    if (this.activeRun) { new Notice("Vault RAG: 既に実行中です", 5000); return; }
    const s = this.settings;
    const chosen = measured.filter((c) => selectedKeys.indexOf(c.key) >= 0);
    if (chosen.length === 0) { new Notice("Vault RAG: 対象が選ばれていません", 5000); return; }

    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const onEsc = this.makeEscHandler(controller);
    document.addEventListener("keydown", onEsc);
    const started = Date.now();

    const done: SummaryBuildResult[] = [];
    const failed: Array<{ channel: string; error: string }> = [];
    const verified: SummaryVerifyResult[] = [];
    const backups: string[] = [];
    const logs: SummaryAttemptLog[] = [];

    try {
      const limiter = new TokenRateLimiter(s.summaryTokenBudgetPerMin);
      for (let i = 0; i < chosen.length; i++) {
        controller.throwIfAborted();
        if (i > 0 && s.summaryIntervalMs > 0) await controller.sleep(s.summaryIntervalMs);

        const c = chosen[i];
        progress.show(`Vault RAG: まとめノートを更新 ${i + 1} / ${chosen.length}（${c.displayName}）Escで中断`);
        const outPath = this.summaryNotePath(c.displayName);

        const prevChars = c.summaryExists ? c.summarySize : 0;
        const log: SummaryAttemptLog = { channel: c.displayName, prevChars, attempts: [], accepted: false, candidatePath: "" };
        logs.push(log);

        try {
          // 1. 生成。同じ入力でも出力長が振れるので、不合格なら同じ実行の中でやり直す
          //    （落とし穴#33 / 最大 SUMMARY_MAX_ATTEMPTS 回）。
          //    試行と試行の間の待ちは TokenRateLimiter が持つ（Esc はその待ちの中でも効く）。
          let accepted: SummaryBuildResult | null = null;
          let longest: { content: string; chars: number } = { content: "", chars: -1 };

          for (let n = 1; n <= SUMMARY_MAX_ATTEMPTS; n++) {
            controller.throwIfAborted();
            const label = SUMMARY_MAX_ATTEMPTS > 1 ? `${n}回目` : "";
            progress.show(
              `Vault RAG: まとめノートを更新 ${i + 1} / ${chosen.length} — ${c.displayName} ${label}（Escで中断）`,
            );

            const got = { content: "", truncated: false, tooShort: false, ok: false };
            const built = await this.buildOneChannelSummary(
              c.group, controller, progress, limiter,
              async (path: string, content: string, info: { truncated: boolean }) => {
                got.content = content;
                got.truncated = info.truncated;
                // 比較はファイル全体の文字数（frontmatter を含む）。`c.summarySize` も adapter.read の長さ
                got.tooShort = judgeSummaryLength(prevChars, content.length).skipped;
                // 打ち切られた版は末尾が欠けているので、長さに関係なく上書きしない
                if (info.truncated || got.tooShort) return;
                // 上書きが決まってから退避する（上書きしない場合にバックアップを増やさない）
                const backup = await this.backupSummaryNote(path);
                if (backup) backups.push(backup);
                await this.writeSummaryNote(path, content);
                got.ok = true;
              },
              label,
            );

            // 上書きしなかった試行も使用量に数える
            log.attempts.push({
              attempt: n, chars: got.content.length,
              inputTokens: built.inputTokens, outputTokens: built.outputTokens,
              truncated: got.truncated, tooShort: got.tooShort, accepted: got.ok,
            });
            console.log(
              `[Vault RAG] 試行 ${n}/${SUMMARY_MAX_ATTEMPTS}: ${c.displayName} ` +
              `${got.content.length} 文字（前 ${prevChars}）` +
              ` / 入力 ${built.inputTokens} 出力 ${built.outputTokens}` +
              ` / ${got.ok ? "合格" : got.truncated ? "打ち切り" : "短すぎる"}`,
            );

            if (got.ok) { accepted = built; break; }
            if (got.content.length > longest.chars) longest = { content: got.content, chars: got.content.length };
          }

          if (!accepted) {
            // 候補は 3 回の中でいちばん長いもの 1 つだけ残す。記録は更新しない
            log.candidatePath = (await this.backupSummaryNote(outPath, "_候補", longest.content)) || "";
            console.warn(`[Vault RAG] ${SUMMARY_MAX_ATTEMPTS} 回とも不合格: ${describeAttempts(log)} ／ 候補: ${log.candidatePath}`);
            continue;   // 検証も記録更新もしない
          }

          log.accepted = true;
          done.push(accepted);

          // 3. 検証（K1b / K3 / K4 / K5）
          const v = await this.verifyOneChannel(c.group);
          if (v) verified.push(v);

          // 4. このチャンネルの記録だけを即保存（中断しても残る）
          const raw = await this.app.vault.adapter.read(outPath);
          await this.saveSummaryChannelState(c.key, {
            summaryPath: outPath,
            summarySize: raw.length,
            summaryHash: await sha256Hex(raw),
            generatedAt: new Date().toISOString(),
            sources: c.sources,
          });
        } catch (err) {
          if (isAbortedError(err)) throw err;
          const message = err instanceof Error ? err.message : String(err);
          failed.push({ channel: c.displayName, error: message });
          console.error(`[Vault RAG] ${c.displayName} の更新に失敗（上書きせず次へ）`, message);
          if (isNonRetryableApiError(message)) throw new Error(`回復しないエラーのため中断しました: ${message}`);
        }
      }

      progress.hide();
      await this.reportSummaryUpdate(done, failed, verified, backups, logs, chosen.length, started, plan);
    } catch (err) {
      progress.hide();
      const elapsedSec = (Date.now() - started) / 1000;
      const line = `\n完了: ${done.length} / ${chosen.length} チャンネル（記録は保存済み）／ 経過 ${elapsedSec.toFixed(1)} 秒`;
      if (isAbortedError(err)) {
        new Notice(`Vault RAG: 中断しました${line}`, 0);
      } else {
        console.error("[Vault RAG] まとめノートの更新に失敗しました", err);
        new Notice(`Vault RAG: まとめノートの更新に失敗しました\n${err instanceof Error ? err.message : String(err)}${line}`, 0);
      }
      console.log("[Vault RAG] 中断/失敗時の内訳", { done: done.map((d) => d.channel), failed, backups, logs });
    } finally {
      document.removeEventListener("keydown", onEsc);
      this.activeRun = null;
      // 完了・中断・失敗のどれでも、使った分は必ず 1 回だけ累計に入れる
      await this.addSummaryUsage(logs);
    }
  }

  /**
   * 全試行の使用量を設定の累計に足す。上書きしなかった試行も約 20 万トークン使っている。
   * 中断・失敗のときも呼ぶので、1 回の実行で 1 回だけ呼ぶこと。
   */
  private async addSummaryUsage(logs: SummaryAttemptLog[]): Promise<void> {
    let inTok = 0, outTok = 0;
    for (const l of logs) for (const a of l.attempts) { inTok += a.inputTokens; outTok += a.outputTokens; }
    if (inTok === 0 && outTok === 0) return;
    const s = this.settings;
    // トークン数はスイッチに関係なく常に数える
    s.totalInputTokens += inTok;
    s.totalOutputTokens += outTok;
    // 金額は `geminiFreeTier` が off のときだけ加える。
    // `totalCostUsd` は「実際に払った金額」の累計にする（埋め込みの無料枠と同じ扱い）
    s.totalCostUsd += chargeableChatCostUsd(s, s.summaryModel, inTok, outTok);
    await this.saveSettings();
  }

  private async reportSummaryUpdate(
    done: SummaryBuildResult[],
    failed: Array<{ channel: string; error: string }>,
    verified: SummaryVerifyResult[],
    backups: string[],
    logs: SummaryAttemptLog[],
    total: number,
    started: number,
    plan: SummaryUpdatePlan,
  ): Promise<void> {
    let srcChars = 0, outChars = 0;
    for (const d of done) { srcChars += d.sourceChars; outChars += d.outChars; }
    // トークンは上書きしなかった試行も含めて全部数える
    let inTok = 0, outTok = 0, attemptCount = 0;
    for (const l of logs) for (const a of l.attempts) { inTok += a.inputTokens; outTok += a.outputTokens; attemptCount++; }
    const costUsd = calcChatCostUsd(this.settings.summaryModel, inTok, outTok);

    let bullets = 0, unresolved = 0, unknown = 0, malformed = 0;
    for (const v of verified) {
      bullets += v.bulletsWithoutCitation;
      unresolved += v.unresolvedNames.length;
      unknown += v.unknownLabels;
      malformed += v.malformedAggregates;
    }
    const elapsedSec = (Date.now() - started) / 1000;
    const notAccepted = logs.filter((l) => !l.accepted && l.attempts.length > 0);
    const retried = logs.filter((l) => l.attempts.length > 1);
    const planGroups = groupSummaryUpdateTargets(plan);

    console.log("[Vault RAG] まとめノートの更新結果", {
      total, done: done.length, failed: failed.length, notAccepted: notAccepted.length,
      attempts: attemptCount, srcChars, outChars, inTok, outTok, costUsd, elapsedSec, backups,
    });
    if (logs.length > 0) {
      console.table(logs.map((l) => ({
        channel: l.channel, prev: l.prevChars, attempts: l.attempts.length,
        sizes: l.attempts.map((a) => a.chars).join(" / "),
        accepted: l.accepted, candidate: l.candidatePath,
      })));
    }
    if (notAccepted.length > 0) console.warn("[Vault RAG] 上書きしなかったチャンネル", notAccepted);
    if (done.length > 0) console.table(done.map((d) => ({ channel: d.channel, notes: d.notes, src: d.sourceChars, out: d.outChars, ratio: `${d.ratio.toFixed(1)}%` })));
    if (verified.length > 0) console.table(verified.map((v) => ({ channel: v.channel, K1b: `${v.aggregateLines}/${v.malformedAggregates}`, K3: v.bulletsWithoutCitation, K4: `${v.unresolvedNames.length}/${v.unknownLabels}` })));
    if (failed.length > 0) console.error("[Vault RAG] 更新に失敗したチャンネル", failed);

    new Notice(
      `✅ まとめノートの更新が完了しました\n` +
      `作り直し: ${done.length} / ${total} チャンネル${failed.length > 0 ? `（失敗 ${failed.length}）` : ""}\n` +
      `作り直さなかったチャンネル: 変更なし ${planGroups.unchanged.length}` +
      ` ／ 手動編集の疑い ${planGroups.manuallyEdited.length}\n` +
      // 上書きが 0 件なら「0 → 0 文字」は出さない
      (done.length > 0 ? `${srcChars.toLocaleString()} → ${outChars.toLocaleString()} 文字\n` : "") +
      `生成した回数: ${attemptCount} 回` +
      (retried.length > 0 ? `（やり直し ${retried.length} チャンネル）` : "") + `\n` +
      `トークン: 入力 ${inTok.toLocaleString()} / 出力 ${outTok.toLocaleString()}（全試行の合計）\n` +
      `費用: 無料枠のため 0 円（有料ティア換算 ${formatUsdJpy(costUsd)}）\n` +
      `検証: K1b 形式違反 ${malformed} / K3 出典なし ${bullets} / K4 不明 ${unknown}\n` +
      logs.map((l) => `${l.accepted ? "" : "⚠ "}${describeAttempts(l)}\n`).join("") +
      `バックアップ: ${backups.length} 本\n` +
      `所要: ${(elapsedSec / 60).toFixed(1)} 分\n` +
      `詳細はコンソール（Ctrl+Shift+I）`,
      0,
    );
  }

  /* ---------- 回答生成（ステップ5） ---------- */

  /**
   * 検索 → 回答生成。出典ブロックはモデルに書かせず、コード側で組み立てる（R2 の保証）。
   * chatModelPriority の順に試し、失敗したら次のモデルへ（chatFallbackMode: auto）。
   */
  async answerQuestion(query: string, controller: RunController): Promise<AnswerResult> {
    const s = this.settings;
    if (!this.index || !this.vectors) {
      throw new Error(this.indexBlockedReason || "インデックスが読み込まれていません");
    }
    const started = Date.now();
    const search = await this.hybridSearch(query, controller);
    const hits = search.capped;
    const chunks = this.index.chunks;

    const userPrompt = buildAnswerUserPrompt(query, hits, chunks);
    const models = getCallableChatModelIds(s);
    if (models.length === 0) {
      throw new Error(
        `回答生成に使える API キーがありません\n` +
        `chatModelPriority: ${s.chatModelPriority.join(", ")}\n` +
        `設定で該当プロバイダの API キーを入れてください`,
      );
    }

    const attempts: Array<{ model: string; error: string }> = [];
    let result: ChatCallResult | null = null;
    let modelUsed = "";

    for (const modelId of models) {
      controller.throwIfAborted();
      try {
        result = await callChatModel(s, modelId, ANSWER_SYSTEM_PROMPT, userPrompt);
        modelUsed = modelId;
        break;
      } catch (err) {
        if (isAbortedError(err)) throw err;
        const message = err instanceof Error ? err.message : String(err);
        attempts.push({ model: modelId, error: message });
        console.error(`[Vault RAG] ${getChatModelLabel(modelId)} で失敗、次のモデルへ`, message);
      }
    }
    if (!result) {
      throw new Error(`すべてのモデルで失敗しました:\n${attempts.map((a) => `${getChatModelLabel(a.model)}: ${a.error}`).join("\n")}`);
    }

    // トークン数はスイッチに関係なく常に数える。
    // 金額は無料枠（geminiFreeTier が on で Gemini を使ったとき）だけ加えない
    const costUsd = calcChatCostUsd(modelUsed, result.inputTokens, result.outputTokens);
    const freeTier = isFreeTierChatUsage(s, modelUsed);
    const chargedUsd = chargeableChatCostUsd(s, modelUsed, result.inputTokens, result.outputTokens);
    s.totalInputTokens += result.inputTokens;
    s.totalOutputTokens += result.outputTokens;
    s.totalCostUsd += chargedUsd;
    await this.saveSettings();

    const normalized = normalizeCitationRefs(result.text.trim());
    if (normalized.fixed > 0) console.log(`[Vault RAG] 出典番号の記法を正規化: ${normalized.fixed} 箇所`);
    // 「見つかりませんでした」の段落に付いた [N] を外す。表示と出典ブロックの両方にこの本文を使う
    const notFound = stripNotFoundCitations(normalized.text);
    if (notFound.stripped > 0) console.log(`[Vault RAG] 「見つかりませんでした」の段落から出典番号を除去: ${notFound.stripped} 箇所`);

    return {
      query,
      answer: notFound.text,
      // 参照判定は正規化・除去後の本文で行う（[1, 2] が [1][2] になった状態）
      citations: buildCitationBlock(hits, chunks, notFound.text),
      citationRefsFixed: normalized.fixed,
      modelUsed,
      attempts,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      costUsd,
      chargedUsd,
      freeTier,
      hits,
      elapsedMs: Date.now() - started,
    };
  }

  /** 回答パネルに出す Markdown を組み立てる。 */
  buildAnswerMarkdown(r: AnswerResult): string {
    const usdJpy = (usd: number) => `$${usd.toFixed(4)}（約${(usd * USD_TO_JPY).toFixed(1)}円）`;
    const parts = [
      `## ${r.query}`,
      "",
      r.answer,
      r.citations,
      "",
      "---",
      `使用モデル: **${getChatModelLabel(r.modelUsed)}**` +
        (r.attempts.length > 0 ? `（${r.attempts.map((a) => getChatModelLabel(a.model)).join(" → ")} で失敗後）` : ""),
      "",
      `今回: ${r.inputTokens.toLocaleString()}in + ${r.outputTokens.toLocaleString()}out tokens`,
      r.freeTier
        ? `今回: 無料枠のため 0 円（有料換算 ${usdJpy(r.costUsd)}）`
        : `今回: ${usdJpy(r.costUsd)}`,
      `累計（実際に払った分）: ${usdJpy(this.settings.totalCostUsd)}`,
      `所要: ${(r.elapsedMs / 1000).toFixed(1)} 秒`,
    ];
    return parts.join("\n");
  }

  private async showAnswerView(markdown: string, answerBody = ""): Promise<VaultRagAnswerView> {
    const existing = this.app.workspace.getLeavesOfType(ANSWER_VIEW_TYPE);
    let leaf = existing.length > 0 ? existing[0] : null;
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      if (leaf) await leaf.setViewState({ type: ANSWER_VIEW_TYPE, active: true });
    }
    if (!leaf) throw new Error("右サイドパネルを開けませんでした");
    this.app.workspace.revealLeaf(leaf);
    const view = leaf.view as VaultRagAnswerView;
    await view.render(markdown, answerBody);
    return view;
  }

  private async runAsk(): Promise<void> {
    if (!this.index || !this.vectors) {
      new Notice(`Vault RAG: まず インデックスを作成してください\n${this.indexBlockedReason || ""}`, 15000);
      return;
    }
    if (getCallableChatModelIds(this.settings).length === 0) {
      new Notice(
        `Vault RAG: 回答生成に使える API キーがありません\n` +
        `chatModelPriority: ${this.settings.chatModelPriority.join(", ")}`,
        15000,
      );
      return;
    }

    new AskModal(this.app, async (query: string) => {
      if (this.activeRun) { new Notice("Vault RAG: 既に実行中です", 5000); return; }
      const controller = new RunController();
      this.activeRun = controller;
      const progress = new ProgressNotice();
      const onEsc = this.makeEscHandler(controller);
      document.addEventListener("keydown", onEsc);

      try {
        progress.show(`Vault RAG: 検索中…「${query}」（Escで中断）`);
        const r = await this.answerQuestion(query, controller);
        progress.hide();

        await this.showAnswerView(this.buildAnswerMarkdown(r), r.answer);
        console.log("[Vault RAG] 回答生成", {
          query, model: r.modelUsed, attempts: r.attempts,
          inputTokens: r.inputTokens, outputTokens: r.outputTokens,
          costUsd: r.costUsd, elapsedMs: r.elapsedMs,
          sources: r.hits.map((h, i) => `[${i + 1}] ${(this.index as VaultRagIndex).chunks[h.chunkIndex].title}`),
        });

        new Notice(
          `✅ 回答完了（${getChatModelLabel(r.modelUsed)}）\n` +
          `今回: ${r.inputTokens.toLocaleString()}in + ${r.outputTokens.toLocaleString()}out tokens\n` +
          (r.freeTier
            ? `今回: 無料枠のため 0 円（有料換算 ${formatUsdJpy(r.costUsd)}）\n`
            : `今回: ${formatUsdJpy(r.costUsd)}\n`) +
          `累計（実際に払った分）: ${formatUsdJpy(this.settings.totalCostUsd)}`,
          0,
        );
      } catch (err) {
        progress.hide();
        if (isAbortedError(err)) new Notice("Vault RAG: 中断しました", 5000);
        else {
          console.error("[Vault RAG] 回答生成に失敗しました", err);
          new Notice(`Vault RAG: 回答生成に失敗しました\n${err instanceof Error ? err.message : String(err)}`, 0);
        }
      } finally {
        document.removeEventListener("keydown", onEsc);
        this.activeRun = null;
      }
    }).open();
  }

  /** 先頭3ノート分のチャンクをコンソールに出す。ノートは作らない（R4）。 */
  private async runPreview(): Promise<void> {
    const s = this.settings;
    const candidates = this.collectCandidates();
    let shown = 0;

    console.log(`[Vault RAG] チャンク分割プレビュー（chunkSize=${s.chunkSize} / chunkOverlap=${s.chunkOverlap}）`);
    for (const file of candidates) {
      if (shown >= 3) break;
      let raw: string;
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (err) {
        console.error("[Vault RAG] 読み取り失敗:", file.path, err);
        continue;
      }
      const note = extractNote(raw, s);
      if (s.includeSourceTypes.indexOf(note.sourceType) < 0) continue;
      if (isSummaryTooThin(note, s)) continue;

      const chunks = buildChunks(note, file.path, file.stat.mtime, s);
      shown++;
      console.log(
        `\n========== [${shown}] ${file.path}\n` +
        `source_type=${note.sourceType} / 本文 ${note.main.length}文字 / サマリー ${note.summary.length}文字 / ` +
        `自分のメモ ${note.memo.length}文字 → ${chunks.length} チャンク`
      );
      for (const c of chunks) {
        console.log(
          `--- ${c.id}  kind=${c.kind}  ${c.text.length}文字  headings=[${c.headings.join(" / ")}]\n` + c.text
        );
      }
    }

    if (shown === 0) {
      new Notice("Vault RAG: 対象ノートが見つかりませんでした", 8000);
      return;
    }
    new Notice(`Vault RAG: ${shown} 本ぶんのチャンクをコンソールに出力しました\n（Ctrl+Shift+I で開発者ツール）`, 8000);
  }
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? Math.floor(value) : NaN;
  if (!isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/* =========================================================================
 * 設定タブ
 * ========================================================================= */

class VaultRagSettingTab extends PluginSettingTab {
  plugin: VaultRagPlugin;

  constructor(app: App, plugin: VaultRagPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "My Vault RAG 設定" });

    new Setting(containerEl)
      .setName("OpenAI API キー")
      .setDesc("埋め込みプロバイダを OpenAI にしたときだけ使う。https://platform.openai.com/api-keys で取得")
      .addText((text) =>
        text.setPlaceholder("sk-...").setValue(this.plugin.settings.openaiApiKey).onChange(async (value) => {
          this.plugin.settings.openaiApiKey = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Claude API キー")
      .setDesc("回答生成で Claude のモデルを使うときに使う（既定ではモデル 2 の claude-haiku-4-5。auto のとき、上位のモデルが失敗したら使われる）。Anthropic Console で取得")
      .addText((text) =>
        text.setPlaceholder("sk-ant-api03-...").setValue(this.plugin.settings.claudeApiKey).onChange(async (value) => {
          this.plugin.settings.claudeApiKey = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Gemini API キー")
      .setDesc("回答生成（既定ではモデル 1 の gemini-3.5-flash-lite）と、まとめノートの生成に使う。埋め込みプロバイダを Gemini にしたときは、埋め込み（gemini-embedding-001）にも使う")
      .addText((text) =>
        text.setPlaceholder("AIza...").setValue(this.plugin.settings.geminiApiKey).onChange(async (value) => {
          this.plugin.settings.geminiApiKey = value.trim();
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("対象フォルダ")
      .setDesc("RAG の対象にする Vault 内のフォルダパス")
      .addText((text) =>
        text.setPlaceholder(DEFAULT_SETTINGS.targetFolder).setValue(this.plugin.settings.targetFolder).onChange(async (value) => {
          this.plugin.settings.targetFolder = value.trim().replace(/\/+$/, "");
          await this.plugin.saveSettings();
        }),
      );

    containerEl.createEl("h3", { text: "埋め込み" });
    containerEl.createEl("p", {
      text: "フォールバックはしません。プロバイダやモデルを変えると既存のベクトルが全て無効になるため、変更後は全件の再インデックスが必要です。",
      cls: "vault-rag-desc",
    });
    new Setting(containerEl)
      .setName("埋め込みプロバイダ")
      .setDesc("Gemini は無料枠で使える。OpenAI は最低 $5 のクレジット購入が必要")
      .addDropdown((dd) => {
        dd.addOption("gemini", "Gemini（gemini-embedding-001）");
        dd.addOption("openai", "OpenAI（text-embedding-3-small）");
        dd.setValue(this.plugin.settings.embeddingProvider);
        dd.onChange(async (value) => {
          this.plugin.settings.embeddingProvider = value;
          this.plugin.settings.embeddingModel = value === "openai" ? "text-embedding-3-small" : "gemini-embedding-001";
          await this.plugin.saveSettings();
          this.display();
          new Notice("Vault RAG: 埋め込みプロバイダを変更しました。全件の再インデックスが必要です", 10000);
        });
      });

    new Setting(containerEl)
      .setName("埋め込みモデル")
      .setDesc("変更したら全件の再インデックスが必要")
      .addText((text) =>
        text.setValue(this.plugin.settings.embeddingModel).onChange(async (value) => {
          const v = value.trim();
          if (!v) return;
          this.plugin.settings.embeddingModel = v;
          await this.plugin.saveSettings();
        }),
      );

    this.addNumberSetting(containerEl, "embeddingDimensions", "ベクトルの次元数（デフォルト 1536。Gemini の既定 3072 だと .bin が倍になる）", "embeddingDimensions", 128, 3072);
    this.addNumberSetting(containerEl, "embedBatchSize", "1リクエストで送るチャンク数（デフォルト 100）", "embedBatchSize", 1, 100);
    this.addNumberSetting(containerEl, "embedIntervalMs", "バッチ間のウェイト（ミリ秒。デフォルト 1000）。連続で投げると無料枠の上限に当たりやすい", "embedIntervalMs", 0, 60000);

    containerEl.createEl("h3", { text: "テスト実行" });
    containerEl.createEl("p", {
      text: "0 で無効。N>0 にすると、インデックス作成で先頭 N 本のノートだけを処理します。全件に課金する前の動作確認用です。",
      cls: "vault-rag-desc",
    });
    this.addNumberSetting(containerEl, "testModeNoteLimit", "処理するノート数の上限（0 = 全件）", "testModeNoteLimit", 0, 10000);

    containerEl.createEl("h3", { text: "チャンク分割" });
    containerEl.createEl("p", {
      text: "変更すると既存のベクトルが無効になります。変更後は全件の再インデックスが必要です。",
      cls: "vault-rag-desc",
    });
    this.addNumberSetting(containerEl, "chunkSize", "1チャンクの最大文字数（デフォルト 800）", "chunkSize", 100, 8000);
    this.addNumberSetting(containerEl, "chunkOverlap", "チャンク間の重複文字数（デフォルト 160）", "chunkOverlap", 0, 4000);

    containerEl.createEl("h3", { text: "回答生成" });
    containerEl.createEl("p", {
      text: "上から順に試し、失敗したら次のモデルへ切り替えます（フォールバック）。API キーが未設定のモデルは自動で飛ばします。",
      cls: "vault-rag-desc",
    });
    for (let i = 0; i < 3; i++) {
      new Setting(containerEl)
        .setName(`モデル ${i + 1}${i === 0 ? "（最優先）" : ""}`)
        .setDesc(i === 0 ? "既定は Gemini 3.5 Flash-Lite（有料枠の単価は入力 $0.30・出力 $2.50 / 100万トークン。無料枠なら 0 円）" : "")
        .addDropdown((dd) => {
          dd.addOption("", "（使わない）");
          for (const m of CHAT_MODEL_REGISTRY) dd.addOption(m.id, m.label);
          dd.setValue(this.plugin.settings.chatModelPriority[i] || "");
          dd.onChange(async (value) => {
            const list = this.plugin.settings.chatModelPriority.slice();
            while (list.length < 3) list.push("");
            list[i] = value;
            this.plugin.settings.chatModelPriority = list.filter((v) => v.length > 0);
            await this.plugin.saveSettings();
          });
        });
    }
    new Setting(containerEl)
      .setName("フォールバック")
      .setDesc("auto = 上から順に試す / manual = 最優先のモデルだけ使う")
      .addDropdown((dd) => {
        dd.addOption("auto", "auto（順に試す）");
        dd.addOption("manual", "manual（先頭のみ）");
        dd.setValue(this.plugin.settings.chatFallbackMode);
        dd.onChange(async (value) => {
          this.plugin.settings.chatFallbackMode = value;
          await this.plugin.saveSettings();
        });
      });

    // 無料枠かどうかはモデルではなく API キーの契約状態で決まるので、スイッチ 1 つで管理する
    new Setting(containerEl)
      .setName("Gemini は無料枠で使っている")
      .setDesc("オンの間、Gemini の費用は累計費用（totalCostUsd）に加えません。Google の課金を有効にしたらオフにしてください")
      .addToggle((tg) => {
        tg.setValue(this.plugin.settings.geminiFreeTier);
        tg.onChange(async (value) => {
          this.plugin.settings.geminiFreeTier = value;
          await this.plugin.saveSettings();
        });
      });

    containerEl.createEl("h3", { text: "検索" });
    this.addNumberSetting(containerEl, "vectorTopK", "ベクトル検索で取る件数（デフォルト 30）", "vectorTopK", 1, 200);
    this.addNumberSetting(containerEl, "keywordTopK", "キーワード検索で取る件数（デフォルト 30）", "keywordTopK", 1, 200);
    this.addNumberSetting(containerEl, "finalTopK", "RRF 統合後、回答生成に渡す件数（デフォルト 8）", "finalTopK", 1, 50);
  }

  private addNumberSetting(
    containerEl: HTMLElement,
    name: string,
    desc: string,
    key: "chunkSize" | "chunkOverlap" | "vectorTopK" | "keywordTopK" | "finalTopK" | "embedBatchSize" | "testModeNoteLimit" | "embeddingDimensions" | "embedIntervalMs",
    min: number,
    max: number,
  ): void {
    new Setting(containerEl)
      .setName(name)
      .setDesc(desc)
      .addText((text) =>
        text
          .setPlaceholder(String(DEFAULT_SETTINGS[key]))
          .setValue(String(this.plugin.settings[key]))
          .onChange(async (value) => {
            const n = parseInt(value, 10);
            if (!Number.isFinite(n) || n < min || n > max) return;   // 不正値は保存しない
            this.plugin.settings[key] = n;
            await this.plugin.saveSettings();
          }),
      );
  }
}

/* =========================================================================
 * 検索テスト用モーダル
 * ========================================================================= */

class SearchTestModal extends Modal {
  private query = "";

  constructor(app: App, private onSubmit: (query: string) => Promise<void>) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "🔍 検索をテスト" });

    const input = contentEl.createEl("textarea", { cls: "vault-rag-query" });
    input.rows = 3;
    input.style.width = "100%";
    input.placeholder = "例: NotebookLMのソース数の上限は？";
    input.addEventListener("input", () => { this.query = input.value; });
    // Ctrl+Enter で送信
    input.addEventListener("keydown", (ev: KeyboardEvent) => {
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        this.submit();
      }
    });

    contentEl.createEl("p", {
      text: "結果はコンソール（Ctrl+Shift+I）に出ます。Ctrl+Enter でも送信できます。",
      cls: "vault-rag-desc",
    });

    new Setting(contentEl).addButton((b) =>
      b.setButtonText("検索 ▶").setCta().onClick(() => { this.submit(); }),
    );
    input.focus();
  }

  private submit(): void {
    const q = this.query.trim();
    if (q.length === 0) {
      new Notice("Vault RAG: 質問を入力してください", 5000);
      return;
    }
    this.close();
    void this.onSubmit(q);
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
