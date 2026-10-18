var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  DEFAULT_SETTINGS: () => DEFAULT_SETTINGS,
  GEMINI_FREE_INPUT_TOKENS_PER_MIN: () => GEMINI_FREE_INPUT_TOKENS_PER_MIN,
  INDEX_VERSION: () => INDEX_VERSION,
  SUMMARY_MAX_ATTEMPTS: () => SUMMARY_MAX_ATTEMPTS,
  SUMMARY_MIN_RATIO_VS_PREVIOUS: () => SUMMARY_MIN_RATIO_VS_PREVIOUS,
  SUMMARY_STATE_VERSION: () => SUMMARY_STATE_VERSION,
  TOKENS_PER_CHAR: () => TOKENS_PER_CHAR,
  TokenRateLimiter: () => TokenRateLimiter,
  buildAnswerUserPrompt: () => buildAnswerUserPrompt,
  buildChunkPlans: () => buildChunkPlans,
  buildChunkText: () => buildChunkText,
  buildChunks: () => buildChunks,
  buildCitationBlock: () => buildCitationBlock,
  buildContextHeader: () => buildContextHeader,
  buildSummaryFrontmatter: () => buildSummaryFrontmatter,
  buildSummaryPrompt: () => buildSummaryPrompt,
  calcChatCostUsd: () => calcChatCostUsd,
  callChatModel: () => callChatModel,
  capPerNote: () => capPerNote,
  chargeableChatCostUsd: () => chargeableChatCostUsd,
  checkAggregateLines: () => checkAggregateLines,
  collectNumbersByClass: () => collectNumbersByClass,
  currentIndexMeta: () => currentIndexMeta,
  default: () => VaultRagPlugin,
  describeAttempts: () => describeAttempts,
  detectSettingsDrift: () => detectSettingsDrift,
  diffSummaryState: () => diffSummaryState,
  dotProduct: () => dotProduct,
  emptyCountResult: () => emptyCountResult,
  estimateInputTokens: () => estimateInputTokens,
  estimateTokensFromChars: () => estimateTokensFromChars,
  extractCitations: () => extractCitations,
  extractMainBody: () => extractMainBody,
  extractNote: () => extractNote,
  extractNumberTokens: () => extractNumberTokens,
  extractProperNouns: () => extractProperNouns,
  extractReferencedNumbers: () => extractReferencedNumbers,
  extractSectionBody: () => extractSectionBody,
  findBulletsWithoutCitation: () => findBulletsWithoutCitation,
  fixCitationsInText: () => fixCitationsInText,
  getApiKeyForChatModel: () => getApiKeyForChatModel,
  getCallableChatModelIds: () => getCallableChatModelIds,
  getChatModelInfo: () => getChatModelInfo,
  getChatModelLabel: () => getChatModelLabel,
  groupCitationsByNote: () => groupCitationsByNote,
  groupNotesByChannel: () => groupNotesByChannel,
  groupSummaryUpdateTargets: () => groupSummaryUpdateTargets,
  hasExcludedFolder: () => hasExcludedFolder,
  isDirectChild: () => isDirectChild,
  isEffectivelyEmpty: () => isEffectivelyEmpty,
  isFreeTierChatUsage: () => isFreeTierChatUsage,
  isK1aLine: () => isK1aLine,
  isSummaryTooThin: () => isSummaryTooThin,
  isUnderFolder: () => isUnderFolder,
  judgeSummaryLength: () => judgeSummaryLength,
  matchCitationToTitle: () => matchCitationToTitle,
  needsFullReindex: () => needsFullReindex,
  normalizeChannelKey: () => normalizeChannelKey,
  normalizeCitationLabels: () => normalizeCitationLabels,
  normalizeCitationRefs: () => normalizeCitationRefs,
  normalizeVector: () => normalizeVector,
  packSections: () => packSections,
  parseFrontmatter: () => parseFrontmatter,
  promoteBoldOnlyBullets: () => promoteBoldOnlyBullets,
  resolveCitationNumbers: () => resolveCitationNumbers,
  rrfScore: () => rrfScore,
  sha256Hex: () => sha256Hex,
  splitByHeadings: () => splitByHeadings,
  splitBySize: () => splitBySize,
  splitFrontmatter: () => splitFrontmatter,
  stripExcludedSections: () => stripExcludedSections,
  stripNotFoundCitations: () => stripNotFoundCitations,
  tallyNote: () => tallyNote,
  toSafeFileName: () => toSafeFileName,
  tokenizeQuery: () => tokenizeQuery,
  validateIndexIntegrity: () => validateIndexIntegrity
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  openaiApiKey: "",
  claudeApiKey: "",
  targetFolder: "Source/Obsidian/Youtube\u6E05\u66F8",
  includeSourceTypes: ["youtube", "knowledge_note", "integration_note", "channel_summary"],
  excludeSubfolders: [".ai"],
  // 任意の階層でフォルダ名が一致したら除外
  excludeRootFiles: true,
  // 対象フォルダ直下の .md を除外
  excludeSections: [
    "YouTube\u6E05\u66F8\u304B\u3089\u6D3B\u304B\u305B\u308B\u3053\u3068",
    "\u95A2\u9023\u30EA\u30F3\u30AF",
    "\u95A2\u9023\u30C6\u30FC\u30DE",
    "\u95A2\u9023MOC",
    "\u6982\u8981\u6B04",
    "\u95A2\u9023\u3059\u308B\u6E05\u66F8",
    // knowledge_note のリンク集
    "\u4EE3\u8868\u30CE\u30FC\u30C8",
    // integration_note のリンク集
    "\u4F7F\u3044\u3069\u3053\u308D",
    // knowledge_note 16本で同一文面
    "\u4F7F\u3044\u65B9",
    // integration_note 8本で同一文面
    "\u76EE\u6B21"
    // channel_summary のトピック名の羅列。関連リンクと同じ性質
  ],
  // 埋め込み（フォールバック無し。切り替えたら全件再インデックス）
  embeddingProvider: "openai",
  // "openai" | "gemini"（Gemini無料枠では全件完了不可）
  embeddingModel: "text-embedding-3-small",
  embeddingDimensions: 1536,
  // Gemini の既定は3072。1536にしてOpenAI経路と揃える
  // 回答生成（こちらはフォールバックあり。ステップ5で使う）
  // 判断軸は金銭のみ。Gemini は5問すべて合格（単価は CHAT_PRICING を参照）、Haiku は約1.7円（見積もり）
  chatModelPriority: ["gemini-3.5-flash-lite", "claude-haiku-4-5", "gpt-5.6-luna"],
  chatFallbackMode: "auto",
  // "auto" = 上から順に試す / "manual" = 先頭のみ
  geminiApiKey: "",
  // 無料枠かどうかは「モデル」ではなく「API キーの契約状態」で決まる。
  // 実測: 9/30 のまとめ生成のエラーに generate_content_free_tier_input_token_count が出ており、
  // まとめ生成と回答生成は同じ geminiApiKey を使う。だからスイッチ 1 つで管理する
  geminiFreeTier: true,
  chunkSize: 800,
  chunkOverlap: 160,
  embedBatchSize: 100,
  embedIntervalMs: 1e3,
  // バッチ間のウェイト。全件54リクエストを連続で投げると無料枠の上限に当たる
  testModeNoteLimit: 0,
  // 0 = 無効。N>0 なら先頭N件のノートだけ処理する
  // チャンネルまとめノート（SUMMARY_NOTES.md / 試作フェーズ）
  summaryChannel: "2ch\u304A\u91D1\u30B9\u30EC",
  summaryFolder: "Source/Obsidian/\u30C1\u30E3\u30F3\u30CD\u30EB\u307E\u3068\u3081",
  // Youtube清書の外に置く
  summaryModel: "gemini-3.5-flash-lite",
  summaryMaxOutputTokens: 65536,
  summaryIntervalMs: 3e3,
  // チャンネル間の最小ウェイト
  summaryTokenBudgetPerMin: 24e4,
  // 実測上限 250,000 に対する余裕込みの予算
  summaryMinSourceNotes: 3,
  // source_notes がこれ未満のまとめノートは RAG 対象外（ファイルは残す）
  answerMaxTokens: 4096,
  // 回答の最大トークン数
  vectorTopK: 30,
  keywordTopK: 30,
  finalTopK: 8,
  rrfK: 60,
  // 既定はベクトル単独。日本語のキーワード検索は5問すべてでベクトル単独に負けた（落とし穴#30）
  keywordSearchEnabled: false,
  maxChunksPerNote: 3,
  // 1つのノートから最終結果に入れるチャンクの上限（ステップ4で使う）
  reindexDebounceMs: 5e3,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalEmbeddingTokens: 0,
  totalCostUsd: 0
};
var BODY_START_HEADING = "\u6E05\u66F8";
var MEMO_HEADING = "\u81EA\u5206\u306E\u30E1\u30E2";
var SUMMARY_HEADINGS = ["1\u884C\u8981\u7D04", "\u8981\u70B9"];
var SUMMARY_CHUNK_HEADING = "1\u884C\u8981\u7D04\u30FB\u8981\u70B9";
var H2_RE = /^##[ \t]+(.+?)[ \t]*$/;
var SECTION_HEADING_RE = /^(#{2,3})[ \t]+(.+?)[ \t]*$/;
var BODY_END_RE = /^#{0,6}\s*概要欄\s*$/;
var HORIZONTAL_RULE_RE = /^[ \t]*(-{3,}|\*{3,}|_{3,})[ \t]*$/;
function h2Name(line) {
  const m = H2_RE.exec(line);
  return m ? m[1] : null;
}
function isH2(line, name) {
  return h2Name(line) === name;
}
function splitFrontmatter(raw) {
  const text = raw.charCodeAt(0) === 65279 ? raw.slice(1) : raw;
  const m = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text);
  if (!m) return { frontmatter: "", body: text };
  return { frontmatter: m[1], body: text.slice(m[0].length) };
}
function unquote(value) {
  const v = value.trim();
  const first = v.charAt(0);
  const last = v.charAt(v.length - 1);
  if (v.length >= 2 && first === last && (first === '"' || first === "'")) {
    return v.slice(1, -1);
  }
  return v;
}
function parseFrontmatter(fm) {
  const out = {};
  for (const line of fm.split(/\r?\n/)) {
    if (line.length === 0 || /^[ \t]/.test(line)) continue;
    const m = /^([A-Za-z0-9_-]+):[ \t]*(.*)$/.exec(line);
    if (!m) continue;
    out[m[1]] = unquote(m[2]);
  }
  return out;
}
function extractSectionBody(body, name) {
  const lines = body.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isH2(lines[i], name)) {
      start = i;
      break;
    }
  }
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (h2Name(lines[i]) !== null) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}
function trimTrailingRules(lines) {
  let end = lines.length;
  let changed = true;
  while (changed) {
    changed = false;
    while (end > 0 && lines[end - 1].trim().length === 0) {
      end--;
      changed = true;
    }
    if (end > 0 && HORIZONTAL_RULE_RE.test(lines[end - 1])) {
      end--;
      changed = true;
    }
  }
  return lines.slice(0, end);
}
function extractMainBody(body) {
  const lines = body.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (isH2(lines[i], BODY_START_HEADING)) {
      start = i;
      break;
    }
  }
  if (start < 0) {
    return trimTrailingRules(lines.filter((l) => !/^#[ \t]/.test(l))).join("\n").trim();
  }
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (BODY_END_RE.test(lines[i])) {
      end = i;
      break;
    }
  }
  return trimTrailingRules(lines.slice(start + 1, end)).join("\n").trim();
}
function stripExcludedSections(text, excludeSections) {
  const excluded = new Set(excludeSections);
  const lines = text.split(/\r?\n/);
  const kept = [];
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
function isEffectivelyEmpty(text) {
  return text.replace(/^[ \t]*[-*+][ \t]*$/gm, "").replace(/\s+/g, "").length === 0;
}
function extractNote(raw, settings) {
  const split = splitFrontmatter(raw);
  const frontmatter = parseFrontmatter(split.frontmatter);
  const sourceType = frontmatter["source_type"] || "";
  const main = stripExcludedSections(extractMainBody(split.body), settings.excludeSections);
  let summary = "";
  if (sourceType === "youtube") {
    const parts = [];
    for (const name of SUMMARY_HEADINGS) {
      const text = extractSectionBody(split.body, name);
      if (text.length > 0 && !isEffectivelyEmpty(text)) parts.push(text);
    }
    summary = parts.join("\n\n").trim();
  }
  const memoRaw = extractSectionBody(split.body, MEMO_HEADING);
  const memo = isEffectivelyEmpty(memoRaw) ? "" : memoRaw;
  return { frontmatter, sourceType, summary, main, memo };
}
function splitByHeadings(body) {
  const lines = body.split(/\r?\n/);
  const out = [];
  let heading = "";
  let level = 0;
  let buf = [];
  const flush = () => {
    const text = buf.join("\n").trim();
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
function splitBySize(text, chunkSize, chunkOverlap) {
  if (text.length <= chunkSize) return [text];
  const step = Math.max(1, chunkSize - chunkOverlap);
  const out = [];
  for (let i = 0; i < text.length; i += step) {
    out.push(text.slice(i, i + chunkSize));
    if (i + chunkSize >= text.length) break;
  }
  return out;
}
var SECTION_SEPARATOR = "\n\n";
function renderSection(sec) {
  if (sec.heading.length === 0) return sec.text;
  const marker = "#".repeat(Math.max(2, sec.level)) + " ";
  return sec.text.length > 0 ? marker + sec.heading + "\n" + sec.text : marker + sec.heading;
}
function packSections(sections, chunkSize, chunkOverlap) {
  const out = [];
  let buf = [];
  let bufLen = 0;
  const flush = () => {
    if (buf.length === 0) return;
    const headings = [];
    for (const s of buf) if (s.heading.length > 0) headings.push(s.heading);
    out.push({ kind: "body", headings, text: buf.map(renderSection).join(SECTION_SEPARATOR) });
    buf = [];
    bufLen = 0;
  };
  for (const sec of sections) {
    const secLen = renderSection(sec).length;
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
function buildChunkPlans(note, chunkSize, chunkOverlap) {
  const out = [];
  if (note.summary.length > 0) {
    const sec = { heading: SUMMARY_CHUNK_HEADING, level: 2, text: note.summary };
    for (const piece of splitBySize(renderSection(sec), chunkSize, chunkOverlap)) {
      out.push({ kind: "summary", headings: [SUMMARY_CHUNK_HEADING], text: piece });
    }
  }
  for (const plan of packSections(splitByHeadings(note.main), chunkSize, chunkOverlap)) out.push(plan);
  if (note.memo.length > 0) {
    const sec = { heading: MEMO_HEADING, level: 2, text: note.memo };
    for (const piece of splitBySize(renderSection(sec), chunkSize, chunkOverlap)) {
      out.push({ kind: "body", headings: [MEMO_HEADING], text: piece });
    }
  }
  return out;
}
function buildContextHeader(title, channel, date) {
  const parts = [];
  for (const v of [title, channel, date]) {
    const t = (v || "").trim();
    if (t.length > 0) parts.push(t);
  }
  return "[" + parts.join("\uFF5C") + "]";
}
function buildChunkText(plan, title, channel, date) {
  return buildContextHeader(title, channel, date) + "\n" + plan.text;
}
function buildChunks(note, path, mtime, settings) {
  const fm = note.frontmatter;
  const base = path.slice(path.lastIndexOf("/") + 1);
  const title = base.endsWith(".md") ? base.slice(0, -3) : base;
  const channel = fm["channel"] || "";
  const date = fm["date"] || "";
  const plans = buildChunkPlans(note, settings.chunkSize, settings.chunkOverlap);
  const out = [];
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
      mtime
    });
  }
  return out;
}
function isUnderFolder(path, folder) {
  if (folder.length === 0) return true;
  const prefix = folder.endsWith("/") ? folder : folder + "/";
  return path.startsWith(prefix);
}
function isDirectChild(path, folder) {
  const prefix = folder.endsWith("/") ? folder : folder + "/";
  return path.startsWith(prefix) && path.slice(prefix.length).indexOf("/") < 0;
}
function hasExcludedFolder(path, excludeSubfolders) {
  if (excludeSubfolders.length === 0) return false;
  const segments = path.split("/");
  for (let i = 0; i < segments.length - 1; i++) {
    if (excludeSubfolders.indexOf(segments[i]) >= 0) return true;
  }
  return false;
}
function emptyCountResult() {
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
    elapsedMs: 0
  };
}
function isSummaryTooThin(note, settings) {
  if (note.sourceType !== "channel_summary") return false;
  const raw = note.frontmatter["source_notes"];
  const n = raw ? parseInt(raw, 10) : NaN;
  if (!isFinite(n)) return false;
  return n < settings.summaryMinSourceNotes;
}
function tallyNote(result, raw, settings, path) {
  const note = extractNote(raw, settings);
  const key = note.sourceType.length > 0 ? note.sourceType : "(\u5224\u5B9A\u4E0D\u80FD)";
  result.bySourceType[key] = (result.bySourceType[key] || 0) + 1;
  if (note.sourceType.length === 0) {
    console.warn("[Vault RAG] source_type \u304C\u8AAD\u3081\u306A\u3044\u305F\u3081\u9664\u5916:", path);
    return;
  }
  if (settings.includeSourceTypes.indexOf(note.sourceType) < 0) return;
  if (isSummaryTooThin(note, settings)) {
    result.thinSummariesSkipped++;
    return;
  }
  const chunks = buildChunkPlans(note, settings.chunkSize, settings.chunkOverlap);
  let chars = 0;
  for (const c of chunks) {
    chars += c.text.length;
    if (c.kind === "summary") result.summaryChunks++;
    else result.bodyChunks++;
  }
  result.includedNotes++;
  result.extractedChars += note.summary.length + note.main.length + note.memo.length;
  result.includedChars += chars;
  result.includedChunks += chunks.length;
  result.charsBySourceType[note.sourceType] = (result.charsBySourceType[note.sourceType] || 0) + chars;
  result.chunksBySourceType[note.sourceType] = (result.chunksBySourceType[note.sourceType] || 0) + chunks.length;
}
var AbortedError = class extends Error {
  constructor(message = "\u51E6\u7406\u3092\u505C\u6B62\u3057\u307E\u3057\u305F") {
    super(message);
    this.name = "AbortedError";
  }
};
function isAbortedError(err) {
  return err instanceof AbortedError;
}
var RunController = class {
  constructor() {
    __publicField(this, "aborted", false);
    __publicField(this, "wakeups", /* @__PURE__ */ new Set());
  }
  get isAborted() {
    return this.aborted;
  }
  abort() {
    if (this.aborted) return;
    this.aborted = true;
    for (const wake of Array.from(this.wakeups)) wake();
    this.wakeups.clear();
  }
  throwIfAborted() {
    if (this.aborted) throw new AbortedError();
  }
  /** リトライ待機用。停止されたら待たずに AbortedError で抜ける。 */
  sleep(ms) {
    this.throwIfAborted();
    return new Promise((resolve, reject) => {
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
};
var ProgressNotice = class {
  constructor() {
    __publicField(this, "current", null);
  }
  show(message) {
    this.hide();
    this.current = new import_obsidian.Notice(message, 0);
  }
  hide() {
    var _a;
    (_a = this.current) == null ? void 0 : _a.hide();
    this.current = null;
  }
};
var RETRY_BASE_DELAY_MS = 2e3;
var RETRY_RATE_LIMIT_BASE_DELAY_MS = 15e3;
var RETRY_MAX_DELAY_MS = 6e4;
var EMBED_MAX_ATTEMPTS = 3;
function isRateLimitMessage(message) {
  return /rate limit|rate_limit|RESOURCE_EXHAUSTED|429|tokens per minute|レート制限/i.test(message || "");
}
function isNonRetryableApiError(message) {
  const text = message || "";
  if (/RESOURCE_EXHAUSTED|please retry in|rate limit|rate_limit|tokens per minute/i.test(text)) return false;
  return /insufficient_quota|credit_balance_exhausted|invalid_api_key|API_KEY_INVALID|PERMISSION_DENIED|account_deactivated|billing|HTTP 401|HTTP 403/i.test(text);
}
function parseRetryAfterMs(message) {
  const m = /please retry in\s*([\d.]+)\s*s/i.exec(message || "");
  if (!m) return null;
  const sec = parseFloat(m[1]);
  if (!isFinite(sec) || sec <= 0) return null;
  return Math.min(Math.ceil(sec * 1e3) + 1e3, RETRY_MAX_DELAY_MS);
}
function calcRetryDelayMs(attempt, rateLimited) {
  const base = rateLimited ? RETRY_RATE_LIMIT_BASE_DELAY_MS : RETRY_BASE_DELAY_MS;
  const backoff = Math.min(base * Math.pow(2, Math.max(0, attempt - 1)), RETRY_MAX_DELAY_MS);
  return Math.round(backoff * (0.75 + Math.random() * 0.5));
}
var USD_TO_JPY = 150;
var EMBEDDING_PRICING = {
  "text-embedding-3-small": 0.02,
  // per 1M tokens
  "text-embedding-3-large": 0.13
};
function calcEmbeddingCostUsd(model, tokens) {
  const unit = EMBEDDING_PRICING[model];
  return tokens / 1e6 * (typeof unit === "number" ? unit : EMBEDDING_PRICING["text-embedding-3-small"]);
}
function formatUsdJpy(usd) {
  return `$${usd.toFixed(4)}\uFF08\u7D04${(usd * USD_TO_JPY).toFixed(1)}\u5186\uFF09`;
}
var openaiEmbeddingProvider = {
  /** OpenAI は input に配列を渡すと個別のベクトルが返る（Gemini とは挙動が違う。落とし穴#20）。 */
  async embed(texts, apiKey, model, options) {
    const res = await (0, import_obsidian.requestUrl)({
      url: "https://api.openai.com/v1/embeddings",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      // OpenAI に taskType は無い。次元数の指定は dimensions（v3 系のみ）
      body: JSON.stringify({ model, input: texts, dimensions: options.dimensions }),
      throw: false
    });
    const data = res.json;
    if (!data || data.error) {
      const err = data && data.error ? data.error : null;
      const message = err ? err.message : `HTTP ${res.status}`;
      const detail = err && (err.type || err.code) ? ` [${err.type || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
      throw new Error(`OpenAI embeddings \u30A8\u30E9\u30FC: ${message}${detail}`);
    }
    if (!Array.isArray(data.data) || data.data.length !== texts.length) {
      throw new Error(`OpenAI embeddings: \u8981\u6C42 ${texts.length} \u4EF6\u306B\u5BFE\u3057 ${Array.isArray(data.data) ? data.data.length : 0} \u4EF6\u3057\u304B\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F`);
    }
    const sorted = data.data.slice().sort((a, b) => a.index - b.index);
    const vectors = [];
    for (let i = 0; i < sorted.length; i++) {
      const v = sorted[i].embedding;
      if (!Array.isArray(v)) throw new Error("OpenAI embeddings: embedding \u304C\u914D\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
      vectors.push(v);
    }
    const usage = data.usage || {};
    const tokens = typeof usage.total_tokens === "number" ? usage.total_tokens : typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : 0;
    return { vectors, tokens };
  }
};
var geminiEmbeddingProvider = {
  /**
   * 間違えてもエラーが出ない箇所が3つある（落とし穴#20 / #22 / #23）。
   * 1. batchEmbedContents の requests[] に 1テキスト 1リクエストで入れる。
   *    embedContent の content に複数 parts を並べると「全入力を集約した1ベクトル」が返る
   * 2. taskType を指定する。ノート側は RETRIEVAL_DOCUMENT、質問側は RETRIEVAL_QUERY
   * 3. outputDimensionality を指定する。既定は 3072 で .bin が倍になる
   */
  async embed(texts, apiKey, model, options) {
    const modelPath = model.startsWith("models/") ? model : `models/${model}`;
    const requests = texts.map((text) => ({
      model: modelPath,
      content: { parts: [{ text }] },
      // 1テキスト = 1リクエスト。複数を1つに並べない
      taskType: options.taskType,
      outputDimensionality: options.dimensions
    }));
    const res = await (0, import_obsidian.requestUrl)({
      url: `https://generativelanguage.googleapis.com/v1beta/${modelPath}:batchEmbedContents`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({ requests }),
      throw: false
    });
    const data = res.json;
    if (!data || data.error) {
      const err = data && data.error ? data.error : null;
      const message = err ? err.message : `HTTP ${res.status}`;
      const detail = err && (err.status || err.code) ? ` [${err.status || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
      throw new Error(`Gemini embeddings \u30A8\u30E9\u30FC: ${message}${detail}`);
    }
    if (!Array.isArray(data.embeddings)) {
      throw new Error("Gemini embeddings: embeddings \u304C\u914D\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
    }
    if (data.embeddings.length !== texts.length) {
      throw new Error(`Gemini embeddings: \u8981\u6C42 ${texts.length} \u4EF6\u306B\u5BFE\u3057 ${data.embeddings.length} \u4EF6\u3057\u304B\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F\uFF08\u96C6\u7D04\u3055\u308C\u305F\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\uFF09`);
    }
    const vectors = [];
    for (const e of data.embeddings) {
      const v = e && e.values;
      if (!Array.isArray(v)) throw new Error("Gemini embeddings: values \u304C\u914D\u5217\u3067\u306F\u3042\u308A\u307E\u305B\u3093");
      vectors.push(v);
    }
    return { vectors, tokens: 0 };
  }
};
function getEmbeddingProvider(name) {
  return name === "openai" ? openaiEmbeddingProvider : geminiEmbeddingProvider;
}
function getEmbeddingApiKey(settings) {
  return settings.embeddingProvider === "openai" ? settings.openaiApiKey : settings.geminiApiKey;
}
function normalizeVector(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  const norm = Math.sqrt(sum);
  if (norm === 0 || !isFinite(norm)) return v;
  const out = new Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}
var INDEX_VERSION = 3;
var INDEX_JSON_FILE = "vault-rag-index.json";
var INDEX_BIN_FILE = "vault-rag-vectors.bin";
function currentIndexMeta(settings, chunkCount) {
  return {
    embeddingProvider: settings.embeddingProvider,
    embeddingModel: settings.embeddingModel,
    dimensions: settings.embeddingDimensions,
    chunkSize: settings.chunkSize,
    chunkOverlap: settings.chunkOverlap,
    indexVersion: INDEX_VERSION,
    targetFolder: settings.targetFolder,
    chunkCount,
    builtAt: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function needsFullReindex(saved, current) {
  return saved.embeddingProvider !== current.embeddingProvider || saved.embeddingModel !== current.embeddingModel || saved.dimensions !== current.dimensions || saved.chunkSize !== current.chunkSize || saved.chunkOverlap !== current.chunkOverlap || saved.indexVersion !== current.indexVersion || saved.targetFolder !== current.targetFolder;
}
function validateIndexIntegrity(meta, chunkLength, binByteLength) {
  if (meta.chunkCount !== chunkLength) {
    return `chunkCount(${meta.chunkCount}) \u3068 chunks.length(${chunkLength}) \u304C\u4E00\u81F4\u3057\u307E\u305B\u3093`;
  }
  const expected = meta.chunkCount * meta.dimensions * 4;
  if (binByteLength !== expected) {
    return `${INDEX_BIN_FILE} \u306E\u30D0\u30A4\u30C8\u9577(${binByteLength}) \u304C\u671F\u5F85\u5024(${expected}) \u3068\u4E00\u81F4\u3057\u307E\u305B\u3093`;
  }
  return null;
}
var SUMMARY_PROMPT_RULES = `\u3042\u306A\u305F\u306F\u3001\u3042\u308BYouTube\u30C1\u30E3\u30F3\u30CD\u30EB\u306E\u52D5\u753B\u8981\u7D04\u30CE\u30FC\u30C8\u7FA4\u3092\u30011\u672C\u306E\u307E\u3068\u3081\u30CE\u30FC\u30C8\u306B\u96C6\u7D04\u3057\u307E\u3059\u3002

## \u7D76\u5BFE\u30EB\u30FC\u30EB

1. \u4E0E\u3048\u3089\u308C\u305F\u30CE\u30FC\u30C8\u306B\u66F8\u304B\u308C\u3066\u3044\u308B\u60C5\u5831\u3060\u3051\u3092\u4F7F\u3046\u3053\u3068\u3002
   \u3042\u306A\u305F\u304C\u5B66\u7FD2\u3067\u5F97\u305F\u77E5\u8B58\u3067\u88DC\u5B8C\u3057\u3066\u306F\u306A\u3089\u306A\u3044\u3002

2. \u4EE5\u4E0B\u306F\u5FC5\u305A\u6B8B\u3059\u3053\u3068\u30021\u3064\u3067\u3082\u843D\u3068\u3057\u305F\u3089\u5931\u6557\u3068\u307F\u306A\u3059\u3002
   - \u3059\u3079\u3066\u306E\u6570\u5024\uFF08\u91D1\u984D\u30FB\u30D1\u30FC\u30BB\u30F3\u30C8\u30FB\u5E74\u53F7\u30FB\u4EF6\u6570\u30FB\u500D\u7387\u30FB\u671F\u9593\uFF09\u3068\u3001\u305D\u306E\u6761\u4EF6
     \u4F8B:\u300C\u67083\u4E07\u5186\u3092\u5E74\u52295%\u3067\u904B\u7528\u3057\u305F\u5834\u5408\u300D\u306F\u3001\u67083\u4E07\u5186\u3082\u5E74\u52295%\u3082\u6761\u4EF6\u3082\u5168\u90E8\u6B8B\u3059
   - \u3059\u3079\u3066\u306E\u56FA\u6709\u540D\u8A5E\uFF08\u88FD\u54C1\u540D\u30FB\u6307\u6570\u540D\u30FB\u4F01\u696D\u540D\u30FB\u4EBA\u540D\u30FB\u30B5\u30FC\u30D3\u30B9\u540D\uFF09
   - \u4E3B\u5F35\u3068\u3001\u305D\u306E\u6839\u62E0

3. \u4EE5\u4E0B\u306F\u524A\u3063\u3066\u3088\u3044\u3002
   - \u8A71\u8005\u306E\u96D1\u8AC7\u30FB\u6328\u62F6\u30FB\u30C1\u30E3\u30F3\u30CD\u30EB\u5BA3\u4F1D
   - \u540C\u3058\u4E3B\u5F35\u306E\u8A00\u3044\u63DB\u3048\u30FB\u7E70\u308A\u8FD4\u3057
   - \u7D14\u7C8B\u306A\u6BD4\u55A9\uFF08\u300C\u301C\u306F\u535A\u7269\u9928\u306E\u3088\u3046\u306A\u3082\u306E\u300D\u300C\u6CE2\u306E\u3088\u3046\u306A\u30D1\u30BF\u30FC\u30F3\u300D\u306A\u3069\u3001
     \u7406\u89E3\u3092\u52A9\u3051\u308B\u305F\u3081\u3060\u3051\u306E\u4F8B\u3048\uFF09
   - \u5197\u9577\u306A\u524D\u7F6E\u304D

   \u305F\u3060\u3057\u300CS&P500\u306E\u3088\u3046\u306A\u5206\u6563\u6307\u6570\u300D\u300CCursor\u306E\u3088\u3046\u306A\u30B5\u30FC\u30D3\u30B9\u300D\u306E\u3088\u3046\u306A
   \u56FA\u6709\u540D\u8A5E\u3092\u542B\u3080\u4F8B\u793A\u306F\u6BD4\u55A9\u3067\u306F\u306A\u3044\u3002\u6B8B\u3059\u3053\u3068\u3002

4. \u91CD\u8907\u306E\u6271\u3044
   - \u8907\u6570\u306E\u52D5\u753B\u304C\u540C\u3058\u4E3B\u5F35\u3092\u3057\u3066\u3044\u308B\u5834\u5408\u3001\u4E3B\u5F35\u306F1\u56DE\u306B\u307E\u3068\u3081\u3001
     \u51FA\u5178\u3092\u5168\u90E8\u4E26\u3079\u308B
   - \u4E3B\u5F35\u304C\u540C\u3058\u3067\u3082\u6839\u62E0\u306E\u6570\u5024\u3084\u4E8B\u4F8B\u304C\u9055\u3046\u5834\u5408\u306F\u3001\u5168\u90E8\u6B8B\u3059
   - \u610F\u898B\u304C\u5206\u304B\u308C\u3066\u3044\u308B\u5834\u5408\u306F\u3001\u3069\u3061\u3089\u304C\u6B63\u3057\u3044\u304B\u5224\u65AD\u305B\u305A\u4E21\u8AD6\u3092\u6B8B\u3059

   \u3010\u96C6\u7D04\u3057\u3066\u3088\u3044\u552F\u4E00\u306E\u4F8B\u5916\u3011
   \u533F\u540D\u306E\u500B\u4EBA\u304C\u81EA\u5DF1\u7533\u544A\u3057\u305F\u6570\u5024\uFF08\u53E3\u5EA7\u6B8B\u9AD8\u30FB\u5E74\u53CE\u30FB\u8CAF\u91D1\u984D\u30FB\u5E74\u9F62\u306A\u3069\uFF09\u304C
   \u7F85\u5217\u3055\u308C\u3066\u3044\u308B\u5834\u5408\u306B\u9650\u308A\u3001\u96C6\u7D04\u3057\u3066\u3088\u3044\u3002
   \u305F\u3060\u3057\u6B21\u306E\u5F62\u5F0F\u3092\u5FC5\u305A\u5B88\u308B\u3053\u3068\u3002

     \u300C\u25EF\u25EF\u306E\u5831\u544A\u5024\u306F \u25B3\u25B3 \u301C \u25A1\u25A1\uFF08n=\u4EF6\u6570\uFF09\u300D

   \u4F8B:\u300C30\u4EE3\u524D\u534A\u306E\u53E3\u5EA7\u6B8B\u9AD8\u306E\u5831\u544A\u5024\u306F 149,176\u5186 \u301C 468\u4E07744\u5186\uFF08n=12\uFF09\u300D

   \u4E0B\u9650\u30FB\u4E0A\u9650\u30FB\u4EF6\u6570\u3092\u5FC5\u305A\u66F8\u304F\u3053\u3068\u3002\u300C\u3070\u3089\u3064\u304D\u304C\u5927\u304D\u3044\u300D\u306E\u3088\u3046\u306A
   \u5B9A\u6027\u7684\u306A\u8868\u73FE\u3060\u3051\u306B\u3057\u3066\u306F\u306A\u3089\u306A\u3044\u3002

   \u3053\u308C\u4EE5\u5916\u306E\u6570\u5024 \u2015\u2015 \u5236\u5EA6\u30FB\u7D71\u8A08\u30FB\u8ABF\u67FB\u7D50\u679C\u30FB\u5546\u54C1\u4ED5\u69D8\u30FB\u6599\u91D1\u30FB
   \u30EA\u30BF\u30FC\u30F3\u7387\u30FB\u65E5\u4ED8 \u2015\u2015 \u306F1\u3064\u3082\u843D\u3068\u3057\u3066\u306F\u306A\u3089\u306A\u3044\u3002\u96C6\u7D04\u3082\u3057\u3066\u306F\u306A\u3089\u306A\u3044\u3002
   \u30EB\u30FC\u30EB2\u3068\u30EB\u30FC\u30EB3\u304C\u7AF6\u5408\u3057\u305F\u3068\u304D\u306F\u3001\u5E38\u306B\u30EB\u30FC\u30EB2\uFF08\u6B8B\u3059\uFF09\u304C\u512A\u5148\u3059\u308B\u3002

5. \u51FA\u5178
   - \u53C2\u8003\u30CE\u30FC\u30C8\u306B\u306F [N1] [N2] \u2026 \u306E\u756A\u53F7\u304C\u4ED8\u3044\u3066\u3044\u308B\u3002
     \u3059\u3079\u3066\u306E\u7B87\u6761\u66F8\u304D\u306E\u672B\u5C3E\u306B\u3001\u305D\u306E\u756A\u53F7\u3060\u3051\u3092 \u27E8\u51FA\u5178: N3\u27E9 \u306E\u5F62\u3067\u4ED8\u3051\u308B\u3053\u3068
   - \u8907\u6570\u306E\u30CE\u30FC\u30C8\u304C\u6839\u62E0\u306A\u3089 \u27E8\u51FA\u5178: N3 / N17 / N42\u27E9 \u3068\u756A\u53F7\u3092\u4E26\u3079\u308B
   - **\u30CE\u30FC\u30C8\u306E\u30D5\u30A1\u30A4\u30EB\u540D\u3092\u66F8\u3044\u3066\u306F\u306A\u3089\u306A\u3044\u3002\u756A\u53F7\u3060\u3051\u3092\u66F8\u304F\u3053\u3068\u3002**
     \u30D5\u30A1\u30A4\u30EB\u540D\u306F\u9577\u304F\u3001\u66F8\u304D\u5199\u3059\u3068\u5FC5\u305A\u5D29\u308C\u308B\u3002\u756A\u53F7\u306F\u5F8C\u304B\u3089\u6A5F\u68B0\u7684\u306B\u7F6E\u304D\u63DB\u3048\u308B
   - \u51FA\u5178\u306E\u306A\u3044\u8A18\u8FF0\u3092\u66F8\u3044\u3066\u306F\u306A\u3089\u306A\u3044

6. \u69CB\u9020
   - \u5192\u982D\u306B\u300C## \u3053\u306E\u30C1\u30E3\u30F3\u30CD\u30EB\u306E\u8EF8\u300D\u3092\u7F6E\u304D\u30011\u301C3\u884C\u3067\u3053\u306E\u30C1\u30E3\u30F3\u30CD\u30EB\u304C
     \u4F55\u3092\u4F1D\u3048\u3066\u3044\u308B\u304B\u3092\u66F8\u304F
   - \u6B21\u306B\u300C## \u76EE\u6B21\u300D\u3067\u30C8\u30D4\u30C3\u30AF\u540D\u3092\u5217\u6319\u3059\u308B
   - \u4EE5\u964D\u3001\u30C8\u30D4\u30C3\u30AF\u3054\u3068\u306B\u300C## \u30C8\u30D4\u30C3\u30AF\u540D\u300D\u306E\u30BB\u30AF\u30B7\u30E7\u30F3\u3092\u4F5C\u308B
   - \u30C8\u30D4\u30C3\u30AF\u306E\u5206\u3051\u65B9\u306F\u30C1\u30E3\u30F3\u30CD\u30EB\u306E\u5185\u5BB9\u304B\u3089\u6C7A\u3081\u3066\u3088\u3044
   - **\u5C0F\u898B\u51FA\u3057\u3092\u7B87\u6761\u66F8\u304D\u306B\u3057\u3066\u306F\u306A\u3089\u306A\u3044\u3002**
     \u300C- Gemini 3.5\u306E\u767B\u5834\u300D\u300C- **\u30E2\u30C7\u30EB\u306E\u6BD4\u8F03**\u300D\u306E\u3088\u3046\u306A\u898B\u51FA\u3057\u3060\u3051\u306E\u7B87\u6761\u66F8\u304D\u3092\u4F5C\u3089\u305A\u3001
     \u300C### Gemini 3.5\u306E\u767B\u5834\u300D\u306E\u3088\u3046\u306B ### \u898B\u51FA\u3057\u306B\u3059\u308B\u3053\u3068
   - **\u7B87\u6761\u66F8\u304D\u306F\u5FC5\u305A\u4E3B\u5F35\u304B\u4E8B\u5B9F\u3092\u542B\u307F\u3001\u672B\u5C3E\u306B\u51FA\u5178\u3092\u4ED8\u3051\u308B\u3053\u3068\u3002**
     \u5185\u5BB9\u3092\u6301\u305F\u306A\u3044\u7B87\u6761\u66F8\u304D\uFF08\u6B21\u306E\u9805\u76EE\u3092\u5C0E\u5165\u3059\u308B\u3060\u3051\u306E\u884C\uFF09\u3092\u4F5C\u3063\u3066\u306F\u306A\u3089\u306A\u3044

## \u53C2\u8003\u30CE\u30FC\u30C8`;
function buildSummaryPrompt(notes) {
  const parts = [SUMMARY_PROMPT_RULES];
  for (let i = 0; i < notes.length; i++) parts.push(`[N${i + 1}] ${notes[i].title}
${notes[i].body}`);
  return parts.join("\n\n");
}
function resolveCitationNumbers(text, notes) {
  let resolved = 0;
  let unknown = 0;
  const unknownTokens = [];
  const nonNumeric = [];
  const fixed = normalizeCitationLabels(text).text.replace(/⟨出典:\s*([^⟩]*)⟩/g, (_whole, inner) => {
    const out = [];
    let sawUnknown = false;
    for (const rawPart of inner.split("/")) {
      const part = rawPart.trim().replace(/^\[+/, "").replace(/\]+$/, "").trim();
      if (part.length === 0) continue;
      if (part === "\u540C\u4E0A" || part === "\u4E0D\u660E") {
        out.push(part);
        continue;
      }
      const m = /^N\s*(\d+)$/i.exec(part);
      if (!m) {
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
    if (out.length === 0) return "\u27E8\u51FA\u5178: \u4E0D\u660E\u27E9";
    return `\u27E8\u51FA\u5178: ${out.join(" / ")}${sawUnknown ? " / \u4E0D\u660E" : ""}\u27E9`;
  });
  return { text: fixed, resolved, unknown, unknownTokens, nonNumeric };
}
function buildSummaryFrontmatter(channel, sourceNotes, sourceChars, model) {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return [
    "---",
    "source_type: channel_summary",
    `channel: "${channel}"`,
    `source_notes: ${sourceNotes}`,
    `source_chars: ${sourceChars}`,
    `generated: ${today}`,
    `model: ${model}`,
    "status: \u8A66\u4F5C",
    "---"
  ].join("\n");
}
async function callGeminiText(apiKey, model, prompt, maxOutputTokens) {
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;
  const res = await (0, import_obsidian.requestUrl)({
    url: `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`,
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens }
    }),
    throw: false
  });
  const data = res.json;
  if (!data || data.error) {
    const err = data && data.error ? data.error : null;
    const message = err ? err.message : `HTTP ${res.status}`;
    const detail = err && (err.status || err.code) ? ` [${err.status || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
    throw new Error(`Gemini generateContent \u30A8\u30E9\u30FC: ${message}${detail}`);
  }
  const candidate = Array.isArray(data.candidates) ? data.candidates[0] : null;
  if (!candidate) {
    const blocked = data.promptFeedback && data.promptFeedback.blockReason;
    throw new Error(`Gemini generateContent: candidates \u304C\u7A7A\u3067\u3059${blocked ? `\uFF08blockReason: ${blocked}\uFF09` : ""}`);
  }
  const parts = candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts : [];
  const text = parts.map((p) => typeof p.text === "string" ? p.text : "").join("");
  if (text.length === 0) throw new Error("Gemini generateContent: \u672C\u6587\u304C\u7A7A\u3067\u3059");
  const usage = data.usageMetadata || {};
  return {
    text,
    inputTokens: typeof usage.promptTokenCount === "number" ? usage.promptTokenCount : 0,
    outputTokens: typeof usage.candidatesTokenCount === "number" ? usage.candidatesTokenCount : 0,
    // 出力上限で打ち切られると末尾が欠ける。黙って短いまとめになるのを防ぐ
    truncated: candidate.finishReason === "MAX_TOKENS"
  };
}
var TIMESTAMP_RE = /\d{1,2}:\d{2}(?::\d{2})?/g;
var NUMBER_TOKEN_RE = /\d[\d,]*(?:\.\d+)?[ \t]*(?:兆|億|万|千|%|％|倍|円|ドル|ヶ月|か月|カ月|年|月|日|歳|人|件|回|本|社|位|時間|分|秒)?/g;
function extractNumberTokens(text) {
  const cleaned = text.replace(TIMESTAMP_RE, " ");
  const out = [];
  const matches = cleaned.match(NUMBER_TOKEN_RE);
  if (!matches) return out;
  for (const m of matches) {
    const t = m.replace(/[,\s]/g, "").replace(/％/g, "%");
    if (t.length > 0) out.push(t);
  }
  return out;
}
var PROPER_NOUN_RE = /[ァ-ヶー]+[A-Za-z0-9][A-Za-z0-9ァ-ヶー]*|[A-Za-z0-9]+[ァ-ヶー]{2,}|[A-Za-z][A-Za-z0-9.&+-]*[A-Z][A-Za-z0-9.&+-]*/g;
function extractProperNouns(text) {
  const matches = text.match(PROPER_NOUN_RE);
  return matches ? matches.map((m) => m.toLowerCase()) : [];
}
function extractCitations(text) {
  const out = [];
  const re = /⟨出典:\s*([^⟩]*)⟩/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    for (const name of m[1].split("/")) {
      const t = name.trim().replace(/^\[+/, "").replace(/\]+$/, "").trim();
      if (t.length > 0) out.push(t);
    }
  }
  return out;
}
function findBulletsWithoutCitation(text) {
  const lines = text.split(/\r?\n/);
  const indentOf = (line) => (/^(\s*)/.exec(line) || ["", ""])[1].length;
  const hasCitedChild = (index) => {
    const base = indentOf(lines[index]);
    for (let j = index + 1; j < lines.length; j++) {
      const line = lines[j];
      if (line.trim().length === 0) continue;
      if (/^#{1,6}[ \t]/.test(line)) break;
      const isBullet = /^\s*[-*+]\s+\S/.test(line);
      if (isBullet && indentOf(line) <= base) break;
      if (isBullet && line.indexOf("\u27E8\u51FA\u5178:") >= 0) return true;
    }
    return false;
  };
  const out = [];
  let inToc = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const heading = /^#{2,3}[ \t]+(.+?)[ \t]*$/.exec(line);
    if (heading) {
      inToc = heading[1].trim() === "\u76EE\u6B21";
      continue;
    }
    if (inToc) continue;
    if (!/^\s*[-*+]\s+\S/.test(line)) continue;
    if (line.indexOf("\u27E8\u51FA\u5178:") >= 0) continue;
    const isLeadIn = /[：:]\s*$/.test(line) && extractNumberTokens(line).length === 0;
    if (isLeadIn && hasCitedChild(i)) continue;
    out.push(line.trim());
  }
  return out;
}
var GEMINI_FREE_INPUT_TOKENS_PER_MIN = 25e4;
function estimateTokensFromChars(chars) {
  return Math.ceil(chars * 0.7);
}
var TokenRateLimiter = class {
  constructor(budgetPerMin, windowMs = 6e4) {
    __publicField(this, "budgetPerMin", budgetPerMin);
    __publicField(this, "windowMs", windowMs);
    __publicField(this, "events", []);
  }
  /** いま `tokens` を送るために待つべきミリ秒。0 なら待たなくてよい。 */
  waitMsFor(tokens, now = Date.now()) {
    this.prune(now);
    let used = 0;
    for (const e of this.events) used += e.tokens;
    if (used + tokens <= this.budgetPerMin) return 0;
    let remaining = used + tokens - this.budgetPerMin;
    for (const e of this.events) {
      remaining -= e.tokens;
      if (remaining <= 0) return Math.max(0, e.at + this.windowMs - now);
    }
    const oldest = this.events.length > 0 ? this.events[0].at : now;
    return Math.max(0, oldest + this.windowMs - now);
  }
  record(tokens, now = Date.now()) {
    this.events.push({ at: now, tokens });
    this.prune(now);
  }
  prune(now) {
    const cutoff = now - this.windowMs;
    while (this.events.length > 0 && this.events[0].at < cutoff) this.events.shift();
  }
};
function normalizeChannelKey(channel) {
  return channel.replace(/[｜|]/g, "").replace(/[【】\[\]（）()]/g, "").replace(/[\s　]/g, "").replace(/[-－ー–—]/g, "").toLowerCase();
}
function toSafeFileName(name, maxLength = 80) {
  const cleaned = name.replace(/[\\/:*?"<>|]/g, "").replace(/[\s　]+/g, " ").replace(/^\.+/, "").trim();
  return (cleaned.length > maxLength ? cleaned.slice(0, maxLength).trim() : cleaned) || "untitled";
}
function groupNotesByChannel(entries) {
  const buckets = /* @__PURE__ */ new Map();
  for (const e of entries) {
    if (!e.channel) continue;
    const key = normalizeChannelKey(e.channel);
    if (key.length === 0) continue;
    let b = buckets.get(key);
    if (!b) {
      b = { counts: /* @__PURE__ */ new Map(), notes: [], chars: 0 };
      buckets.set(key, b);
    }
    b.counts.set(e.channel, (b.counts.get(e.channel) || 0) + 1);
    b.notes.push(e.note);
    b.chars += e.note.body.length;
  }
  const out = [];
  buckets.forEach((b) => {
    let displayName = "";
    let best = -1;
    const variants = [];
    b.counts.forEach((count, name) => {
      variants.push(name);
      if (count > best) {
        best = count;
        displayName = name;
      }
    });
    out.push({ displayName, variants, notes: b.notes, chars: b.chars });
  });
  out.sort((a, b) => b.chars - a.chars);
  return out;
}
var K1A_MARKERS = [
  // 制度
  "NISA",
  "iDeCo",
  "\u78BA\u5B9A\u62E0\u51FA\u5E74\u91D1",
  "\u5E74\u91D1",
  "\u7A0E\u5236",
  "\u63A7\u9664",
  "\u975E\u8AB2\u7A0E",
  "\u8AB2\u7A0E",
  "\u7279\u5B9A\u53E3\u5EA7",
  "\u3075\u308B\u3055\u3068\u7D0D\u7A0E",
  "\u793E\u4F1A\u4FDD\u967A",
  "\u5065\u5EB7\u4FDD\u967A",
  "\u4F4F\u6C11\u7A0E",
  "\u6240\u5F97\u7A0E",
  "\u7D66\u4ED8",
  "\u88DC\u52A9",
  // 調査・統計
  "\u8ABF\u67FB",
  "\u7D71\u8A08",
  "\u5E73\u5747",
  "\u4E2D\u592E\u5024",
  "\u4E16\u5E2F",
  "\u5272\u5408",
  "\u5206\u5E03",
  "\u4E0A\u4F4D",
  "committee",
  "\u91D1\u878D\u5E83\u5831",
  "\u91CE\u6751\u7DCF\u7814",
  "\u7DCF\u52D9\u7701",
  "\u539A\u751F\u52B4\u50CD",
  "\u56FD\u7A0E\u5E81",
  "GPIF",
  "\u6A5F\u69CB",
  "\u59D4\u54E1\u4F1A",
  "\u767D\u66F8",
  // 商品・サービス
  "\u30AB\u30FC\u30C9",
  "\u30AF\u30EC\u30AB",
  "Pay",
  "\u30DA\u30A4",
  "ETF",
  "\u30D5\u30A1\u30F3\u30C9",
  "\u6295\u8CC7\u4FE1\u8A17",
  "\u6295\u4FE1",
  "\u6307\u6570",
  "S&P",
  "\u30AA\u30EB\u30AB\u30F3",
  "\u30A2\u30D7\u30EA",
  "\u30D7\u30E9\u30F3",
  "\u8A3C\u5238",
  "\u9280\u884C",
  "\u4FDD\u967A",
  "\u30ED\u30FC\u30F3",
  "\u53E3\u5EA7\u9023\u643A",
  // 料金・率
  "\u5E74\u4F1A\u8CBB",
  "\u6708\u984D",
  "\u624B\u6570\u6599",
  "\u6599\u91D1",
  "\u9084\u5143",
  "\u5229\u56DE\u308A",
  "\u5E74\u5229",
  "\u30EA\u30BF\u30FC\u30F3",
  "\u91D1\u5229",
  "\u914D\u5F53",
  "\u5229\u7387",
  "\u4E0A\u9650",
  "\u9650\u5EA6",
  "\u7121\u6599",
  "\u6709\u6599",
  "\u4FA1\u683C",
  "\u5B9A\u4FA1"
];
var YEAR_RE = /(19|20)\d{2}\s*年/;
function isK1aLine(line) {
  if (YEAR_RE.test(line)) return true;
  for (const marker of K1A_MARKERS) {
    if (line.indexOf(marker) >= 0) return true;
  }
  return false;
}
function collectNumbersByClass(text) {
  const k1a = /* @__PURE__ */ new Map();
  const k1b = /* @__PURE__ */ new Map();
  for (const line of text.split(/\r?\n/)) {
    const tokens = extractNumberTokens(line);
    if (tokens.length === 0) continue;
    const target = isK1aLine(line) ? k1a : k1b;
    const context = line.trim().slice(0, 120);
    for (const t of tokens) if (!target.has(t)) target.set(t, context);
  }
  return { k1a, k1b };
}
var AGGREGATE_RE = /（\s*n\s*=\s*\d+\s*[^）]*）|\(\s*n\s*=\s*\d+\s*[^)]*\)/;
var RANGE_RE = /[〜~～]/;
function checkAggregateLines(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    if (line.indexOf("\u5831\u544A\u5024") < 0) continue;
    out.push({ line: line.trim(), hasRange: RANGE_RE.test(line), hasCount: AGGREGATE_RE.test(line) });
  }
  return out;
}
function normalizeTitleForMatch(title) {
  return title.replace(/[\[\]【】（）()「」『』]/g, "").replace(/[ｗWwＷ]/g, "").replace(/[\s　]/g, "").replace(/[！!？?。、,.／/・]/g, "").toLowerCase();
}
function lcsLength(a, b) {
  if (a.length === 0 || b.length === 0) return 0;
  let prev = new Array(b.length + 1).fill(0);
  let cur = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
    }
    const tmp = prev;
    prev = cur;
    cur = tmp;
    cur.fill(0);
  }
  return prev[b.length];
}
function matchCitationToTitle(name, titles, threshold = 0.85) {
  const target = normalizeTitleForMatch(name);
  let best = null;
  let bestScore = 0;
  for (const t of titles) {
    const cand = normalizeTitleForMatch(t);
    const len = lcsLength(target, cand);
    const score = len / Math.max(target.length, cand.length);
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return { before: name, after: bestScore >= threshold ? best : null, similarity: Number(bestScore.toFixed(3)) };
}
var BOLD_ONLY_BULLET_RE = /^[-*+][ \t]+\*\*(.+?)\*\*[ \t]*[:：]?[ \t]*$/;
function promoteBoldOnlyBullets(text) {
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
function normalizeCitationLabels(text) {
  let added = 0;
  const fixed = text.replace(/⟨\s*([^⟩]*)⟩/g, (whole, inner) => {
    const body = inner.trim();
    if (body.length === 0) return whole;
    if (/^出典\s*[:：]/.test(body)) return whole;
    added++;
    return `\u27E8\u51FA\u5178: ${body}\u27E9`;
  });
  return { text: fixed, added };
}
function fixCitationsInText(text, titles) {
  const fixes = [];
  const known = new Set(titles);
  const cache = /* @__PURE__ */ new Map();
  const normalized = normalizeCitationLabels(text);
  const fixed = normalized.text.replace(/⟨出典:\s*([^⟩]*)⟩/g, (_whole, inner) => {
    const names = inner.split("/").map((x) => x.trim()).filter((x) => x.length > 0);
    const resolved = [];
    let anyUnknown = false;
    for (const raw of names) {
      const name = raw.replace(/^\[+/, "").replace(/\]+$/, "").trim();
      if (name.length === 0) continue;
      if (name === "\u540C\u4E0A" || name === "\u4E0D\u660E" || known.has(name)) {
        resolved.push(name);
        continue;
      }
      let fix = cache.get(name);
      if (!fix) {
        fix = matchCitationToTitle(name, titles);
        cache.set(name, fix);
        fixes.push(fix);
      }
      if (fix.after) resolved.push(fix.after);
      else anyUnknown = true;
    }
    if (resolved.length === 0) return "\u27E8\u51FA\u5178: \u4E0D\u660E\u27E9";
    return `\u27E8\u51FA\u5178: ${resolved.join(" / ")}${anyUnknown ? " / \u4E0D\u660E" : ""}\u27E9`;
  });
  return { text: fixed, fixes, labelsAdded: normalized.added };
}
var QUERY_DELIMITERS = /(?:から|まで|より|って|[のはがをにでともへや、。・？?！!\s　])+/g;
function tokenizeQuery(query) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const part of query.split(QUERY_DELIMITERS)) {
    const t = part.trim();
    if (t.length < 2) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}
function dotProduct(a, aOffset, b, dimensions) {
  let sum = 0;
  for (let i = 0; i < dimensions; i++) sum += a[aOffset + i] * b[i];
  return sum;
}
function rrfScore(ranks, rrfK) {
  let score = 0;
  for (const rank of ranks) if (rank !== null) score += 1 / (rrfK + rank);
  return score;
}
function capPerNote(candidates, chunks, maxPerNote, limit) {
  const used = /* @__PURE__ */ new Map();
  const out = [];
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
var CHAT_MODEL_REGISTRY = [
  { id: "claude-haiku-4-5", provider: "anthropic", label: "Claude Haiku 4.5" },
  { id: "claude-sonnet-5", provider: "anthropic", label: "Claude Sonnet 5" },
  { id: "claude-opus-5", provider: "anthropic", label: "Claude Opus 5" },
  { id: "gemini-3.5-flash-lite", provider: "gemini", label: "Gemini 3.5 Flash-Lite" },
  { id: "gemini-3.5-flash", provider: "gemini", label: "Gemini 3.5 Flash" },
  { id: "gpt-5.6-luna", provider: "openai", label: "GPT-5.6 Luna" },
  { id: "gpt-5.6-terra", provider: "openai", label: "GPT-5.6 Terra" }
];
function getChatModelInfo(modelId) {
  for (const m of CHAT_MODEL_REGISTRY) if (m.id === modelId) return m;
  return { id: modelId, provider: "anthropic", label: modelId };
}
function getChatModelLabel(modelId) {
  return modelId ? getChatModelInfo(modelId).label : "\u672A\u4F7F\u7528";
}
function getApiKeyForChatModel(settings, modelId) {
  const provider = getChatModelInfo(modelId).provider;
  if (provider === "gemini") return settings.geminiApiKey;
  if (provider === "openai") return settings.openaiApiKey;
  return settings.claudeApiKey;
}
function getCallableChatModelIds(settings) {
  const candidates = settings.chatFallbackMode === "manual" ? settings.chatModelPriority.slice(0, 1) : settings.chatModelPriority;
  return candidates.filter((id) => getApiKeyForChatModel(settings, id).length > 0);
}
var CHAT_PRICING = {
  "claude-haiku-4-5": { input: 1, output: 5 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-opus-5": { input: 5, output: 25 },
  "gemini-3.5-flash-lite": { input: 0.3, output: 2.5 },
  "gemini-3.5-flash": { input: 1.5, output: 9 },
  "gpt-5.6-luna": { input: 0.2, output: 1.2 },
  "gpt-5.6-terra": { input: 2, output: 12 }
};
function calcChatCostUsd(model, inputTokens, outputTokens) {
  const p = CHAT_PRICING[model] || CHAT_PRICING["claude-haiku-4-5"];
  return inputTokens / 1e6 * p.input + outputTokens / 1e6 * p.output;
}
function isFreeTierChatUsage(settings, modelId) {
  return settings.geminiFreeTier === true && getChatModelInfo(modelId).provider === "gemini";
}
function chargeableChatCostUsd(settings, modelId, inputTokens, outputTokens) {
  if (isFreeTierChatUsage(settings, modelId)) return 0;
  return calcChatCostUsd(modelId, inputTokens, outputTokens);
}
function buildAnswerUserPrompt(query, hits, chunks) {
  const parts = ["## \u53C2\u8003\u30CE\u30FC\u30C8", ""];
  for (let i = 0; i < hits.length; i++) {
    const c = chunks[hits[i].chunkIndex];
    const head = [c.title, c.channel, c.date].filter((v) => v && v.length > 0).join("\uFF5C");
    parts.push(`[${i + 1}] ${head}`);
    parts.push(c.text);
    parts.push("");
  }
  parts.push("## \u8CEA\u554F");
  parts.push(query);
  return parts.join("\n");
}
function extractReferencedNumbers(answerBody) {
  const out = /* @__PURE__ */ new Set();
  for (const m of answerBody.matchAll(/\[(\d+)\]/g)) {
    const n = parseInt(m[1], 10);
    if (isFinite(n)) out.add(n);
  }
  return out;
}
function groupCitationsByNote(hits, chunks, referenced) {
  const byPath = /* @__PURE__ */ new Map();
  for (let i = 0; i < hits.length; i++) {
    const c = chunks[hits[i].chunkIndex];
    const num = i + 1;
    let g = byPath.get(c.path);
    if (!g) {
      g = { path: c.path, numbers: [], chunk: c, referenced: false };
      byPath.set(c.path, g);
    }
    g.numbers.push(num);
    if (referenced.has(num)) g.referenced = true;
  }
  const groups = Array.from(byPath.values());
  for (const g of groups) g.numbers.sort((a, b) => a - b);
  groups.sort((a, b) => a.numbers[0] - b.numbers[0]);
  return groups;
}
function formatCitationLine(g) {
  const c = g.chunk;
  const meta = [c.channel, c.date].filter((v) => v && v.length > 0).join("\u30FB");
  const linkPath = c.path.endsWith(".md") ? c.path.slice(0, -3) : c.path;
  let line = `${g.numbers.map((n) => `[${n}]`).join("")} [[${linkPath}|${c.title}]]`;
  if (meta.length > 0) line += `\uFF08${meta}\uFF09`;
  if (c.url && c.url.length > 0) line += ` \u2014 [\u52D5\u753B](${c.url})`;
  return line;
}
var CITATION_HEADING = "### \u51FA\u5178";
var UNREFERENCED_HEADING = "### \u691C\u7D22\u3067\u898B\u3064\u304B\u3063\u305F\u4ED6\u306E\u30CE\u30FC\u30C8\uFF08\u672C\u6587\u3067\u306F\u672A\u53C2\u7167\uFF09";
function buildCitationBlock(hits, chunks, answerBody = "") {
  const referenced = extractReferencedNumbers(answerBody);
  const groups = groupCitationsByNote(hits, chunks, referenced);
  const cited = groups.filter((g) => g.referenced);
  const uncited = groups.filter((g) => !g.referenced);
  const lines = ["", "---"];
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
function normalizeCitationRefs(text) {
  let fixed = 0;
  const out = text.replace(/\[\s*(\d+(?:\s*[,、，・]\s*\d+)+)\s*\]/g, (_whole, inner) => {
    const nums = inner.split(/[,、，・]/).map((x) => x.trim()).filter((x) => x.length > 0);
    if (nums.length < 2) return _whole;
    fixed++;
    return nums.map((n) => `[${n}]`).join("");
  });
  return { text: out, fixed };
}
var NOT_FOUND_ANSWER = "\u8A72\u5F53\u3059\u308B\u60C5\u5831\u304C\u30CE\u30FC\u30C8\u5185\u306B\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F";
function stripNotFoundCitations(text) {
  const lines = text.split("\n");
  let end = lines.findIndex((l) => l.trim().length === 0);
  if (end < 0) end = lines.length;
  const rest = lines.slice(0, end).join("\n").replace(/\[\d+\]/g, "").trim().replace(/。$/, "").trim();
  if (rest !== NOT_FOUND_ANSWER) return { text, stripped: 0 };
  let stripped = 0;
  for (let i = 0; i < end; i++) {
    lines[i] = lines[i].replace(/[ 　]*\[\d+\]/g, () => {
      stripped++;
      return "";
    });
  }
  return { text: lines.join("\n"), stripped };
}
async function callClaudeText(apiKey, model, systemPrompt, userPrompt, maxTokens) {
  const res = await (0, import_obsidian.requestUrl)({
    url: "https://api.anthropic.com/v1/messages",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }]
    }),
    throw: false
  });
  const data = res.json;
  if (!data || data.error) {
    const err = data && data.error ? data.error : null;
    const message = err ? err.message : `HTTP ${res.status}`;
    const detail = err && err.type ? ` [${err.type}]` : ` [HTTP ${res.status}]`;
    throw new Error(`Claude API \u30A8\u30E9\u30FC: ${message}${detail}`);
  }
  const blocks = Array.isArray(data.content) ? data.content : [];
  const text = blocks.map((b) => b && b.type === "text" && typeof b.text === "string" ? b.text : "").join("");
  if (text.length === 0) throw new Error("Claude API \u304B\u3089\u672C\u6587\u304C\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
  const usage = data.usage || {};
  return {
    text,
    inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : 0,
    outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : 0,
    truncated: data.stop_reason === "max_tokens"
  };
}
async function callOpenAiText(apiKey, model, systemPrompt, userPrompt, maxTokens) {
  const res = await (0, import_obsidian.requestUrl)({
    url: "https://api.openai.com/v1/responses",
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      instructions: systemPrompt,
      input: [{ type: "message", role: "user", content: [{ type: "input_text", text: userPrompt }] }],
      max_output_tokens: maxTokens
    }),
    throw: false
  });
  const data = res.json;
  if (!data || data.error) {
    const err = data && data.error ? data.error : null;
    const message = err ? err.message : `HTTP ${res.status}`;
    const detail = err && (err.type || err.code) ? ` [${err.type || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
    throw new Error(`OpenAI API \u30A8\u30E9\u30FC: ${message}${detail}`);
  }
  const output = Array.isArray(data.output) ? data.output : [];
  let text = "";
  for (const item of output) {
    const content = item && Array.isArray(item.content) ? item.content : [];
    for (const c of content) if (c && c.type === "output_text" && typeof c.text === "string") text += c.text;
  }
  if (text.length === 0) throw new Error("OpenAI API \u304B\u3089\u672C\u6587\u304C\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
  const usage = data.usage || {};
  return {
    text,
    inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : 0,
    outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : 0,
    truncated: data.status === "incomplete"
  };
}
async function callGeminiChat(apiKey, model, systemPrompt, userPrompt, maxTokens) {
  const modelPath = model.startsWith("models/") ? model : `models/${model}`;
  const res = await (0, import_obsidian.requestUrl)({
    url: `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent`,
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: maxTokens }
    }),
    throw: false
  });
  const data = res.json;
  if (!data || data.error) {
    const err = data && data.error ? data.error : null;
    const message = err ? err.message : `HTTP ${res.status}`;
    const detail = err && (err.status || err.code) ? ` [${err.status || ""}${err.code ? "/" + err.code : ""}]` : ` [HTTP ${res.status}]`;
    throw new Error(`Gemini API \u30A8\u30E9\u30FC: ${message}${detail}`);
  }
  const candidate = Array.isArray(data.candidates) ? data.candidates[0] : null;
  if (!candidate) throw new Error("Gemini API \u304B\u3089 candidates \u304C\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
  const parts = candidate.content && Array.isArray(candidate.content.parts) ? candidate.content.parts : [];
  const text = parts.map((p) => typeof p.text === "string" ? p.text : "").join("");
  if (text.length === 0) throw new Error("Gemini API \u304B\u3089\u672C\u6587\u304C\u8FD4\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
  const usage = data.usageMetadata || {};
  return {
    text,
    inputTokens: typeof usage.promptTokenCount === "number" ? usage.promptTokenCount : 0,
    outputTokens: typeof usage.candidatesTokenCount === "number" ? usage.candidatesTokenCount : 0,
    truncated: candidate.finishReason === "MAX_TOKENS"
  };
}
async function callChatModel(settings, modelId, systemPrompt, userPrompt) {
  const apiKey = getApiKeyForChatModel(settings, modelId);
  const provider = getChatModelInfo(modelId).provider;
  const maxTokens = settings.answerMaxTokens;
  if (provider === "gemini") return callGeminiChat(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
  if (provider === "openai") return callOpenAiText(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
  return callClaudeText(apiKey, modelId, systemPrompt, userPrompt, maxTokens);
}
var ANSWER_SYSTEM_PROMPT = `\u3042\u306A\u305F\u306F\u30E6\u30FC\u30B6\u30FC\u306EObsidian\u30CE\u30FC\u30C8\u306B\u5BFE\u3059\u308B\u8CEA\u554F\u5FDC\u7B54\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002

## \u7D76\u5BFE\u30EB\u30FC\u30EB
1. \u4EE5\u4E0B\u306B\u4E0E\u3048\u3089\u308C\u305F\u300C\u53C2\u8003\u30CE\u30FC\u30C8\u300D\u306B\u66F8\u304B\u308C\u3066\u3044\u308B\u60C5\u5831\u3060\u3051\u3092\u4F7F\u3063\u3066\u56DE\u7B54\u3059\u308B\u3053\u3068\u3002
2. \u3042\u306A\u305F\u304C\u5B66\u7FD2\u3067\u5F97\u305F\u77E5\u8B58\u3092\u4F7F\u3063\u3066\u88DC\u5B8C\u3057\u3066\u306F\u306A\u3089\u306A\u3044\u3002\u53C2\u8003\u30CE\u30FC\u30C8\u306B\u66F8\u304B\u308C\u3066\u3044\u306A\u3044
   \u3053\u3068\u306F\u3001\u305F\u3068\u3048\u4E00\u822C\u5E38\u8B58\u3067\u3042\u3063\u3066\u3082\u66F8\u3044\u3066\u306F\u306A\u3089\u306A\u3044\u3002
3. \u53C2\u8003\u30CE\u30FC\u30C8\u306B\u7B54\u3048\u304C\u898B\u3064\u304B\u3089\u306A\u3044\u5834\u5408\u306F\u3001\u63A8\u6E2C\u305B\u305A
   \u300C\u8A72\u5F53\u3059\u308B\u60C5\u5831\u304C\u30CE\u30FC\u30C8\u5185\u306B\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u300D\u3068\u3060\u3051\u7B54\u3048\u308B\u3053\u3068\u3002
   \u305D\u306E\u4E0A\u3067\u3001\u3069\u3046\u3044\u3046\u8A9E\u3067\u691C\u7D22\u3057\u76F4\u3059\u3068\u898B\u3064\u304B\u308A\u305D\u3046\u304B\u3092\u63D0\u6848\u3057\u3066\u3088\u3044\u3002
4. \u56DE\u7B54\u306E\u5404\u4E3B\u5F35\u306E\u76F4\u5F8C\u306B\u3001\u6839\u62E0\u3068\u306A\u3063\u305F\u30CE\u30FC\u30C8\u306E\u756A\u53F7\u3092 [1] [2] \u306E\u5F62\u5F0F\u3067\u4ED8\u3051\u308B\u3053\u3068\u3002
5. \u53C2\u8003\u30CE\u30FC\u30C8\u306E\u5185\u5BB9\u304C\u4E92\u3044\u306B\u77DB\u76FE\u3057\u3066\u3044\u308B\u5834\u5408\u306F\u3001\u3069\u3061\u3089\u304C\u6B63\u3057\u3044\u304B\u5224\u65AD\u305B\u305A\u3001
   \u4E21\u65B9\u306E\u4E3B\u5F35\u3092\u51FA\u5178\u4ED8\u304D\u3067\u4F75\u8A18\u3059\u308B\u3053\u3068\u3002

## \u53C2\u8003\u30CE\u30FC\u30C8\u306E\u6027\u8CEA\uFF08\u91CD\u8981\uFF09
\u53C2\u8003\u30CE\u30FC\u30C8\u306F\u3059\u3079\u3066YouTube\u52D5\u753B\u306E\u8981\u7D04\u3067\u3059\u3002\u3064\u307E\u308A\u52D5\u753B\u306E\u8A71\u8005\u306E\u4E3B\u5F35\u3067\u3042\u308A\u3001
\u691C\u8A3C\u3055\u308C\u305F\u4E8B\u5B9F\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002\u6570\u5B57\u30FB\u6642\u671F\u30FB\u5236\u5EA6\u30FB\u56FA\u6709\u540D\u8A5E\u306B\u3064\u3044\u3066\u306F
\u300C\u301C\u3068\u8FF0\u3079\u3089\u308C\u3066\u3044\u307E\u3059\u300D\u3068\u3044\u3046\u4F1D\u805E\u306E\u5F62\u3067\u66F8\u304F\u3053\u3068\u3002\u65AD\u5B9A\u3057\u306A\u3044\u3053\u3068\u3002`;
var ANSWER_VIEW_TYPE = "vault-rag-answer";
var VaultRagAnswerView = class extends import_obsidian.ItemView {
  // コピー対象（出典・フッターなし）
  constructor(leaf, plugin) {
    super(leaf);
    __publicField(this, "plugin", plugin);
    __publicField(this, "markdown", "");
    __publicField(this, "answerBody", "");
  }
  getViewType() {
    return ANSWER_VIEW_TYPE;
  }
  getDisplayText() {
    return "Vault RAG \u306E\u56DE\u7B54";
  }
  getIcon() {
    return "search";
  }
  async onOpen() {
    await this.render(this.markdown || "_\u307E\u3060\u56DE\u7B54\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u30B3\u30DE\u30F3\u30C9\u300CVault RAG: \u8CEA\u554F\u3059\u308B\u300D\u3092\u5B9F\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002_");
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
  async render(markdown, answerBody = "") {
    this.markdown = markdown;
    this.answerBody = answerBody;
    const el = this.contentEl;
    el.empty();
    el.addClass("vault-rag-answer");
    if (answerBody) {
      const toolbar = el.createDiv({ cls: "vault-rag-toolbar" });
      const copyBtn = toolbar.createEl("button", { cls: "vault-rag-copy-btn", text: "\u30B3\u30D4\u30FC" });
      this.registerDomEvent(copyBtn, "click", () => {
        navigator.clipboard.writeText(this.answerBody).then(
          () => {
            copyBtn.textContent = "\u2713 \u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F";
            setTimeout(() => {
              copyBtn.textContent = "\u30B3\u30D4\u30FC";
            }, 2e3);
          },
          () => {
            new import_obsidian.Notice("\u30AF\u30EA\u30C3\u30D7\u30DC\u30FC\u30C9\u3078\u306E\u30B3\u30D4\u30FC\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
          }
        );
      });
    }
    const body = el.createDiv({ cls: "markdown-rendered" });
    await import_obsidian.MarkdownRenderer.render(this.app, markdown, body, "", this);
    this.registerLinkHandlers(body);
  }
  /**
   * 内部リンクのクリックを拾ってノートを開く。
   * `registerDomEvent` で登録しているので、ビューを閉じると自動で解除される。
   * 中クリックは `click` ではなく `auxclick` で来るため両方を登録する。
   */
  registerLinkHandlers(container) {
    const open = (evt) => {
      const target = evt.target;
      if (!target) return;
      const anchor = target.closest("a.internal-link");
      if (!anchor) return;
      const linktext = anchor.getAttr("data-href") || anchor.getAttr("href");
      if (!linktext) return;
      evt.preventDefault();
      this.app.workspace.openLinkText(linktext, "", import_obsidian.Keymap.isModEvent(evt));
    };
    this.registerDomEvent(container, "click", open);
    this.registerDomEvent(container, "auxclick", (evt) => {
      if (evt.button !== 1) return;
      open(evt);
    });
  }
};
var AskModal = class extends import_obsidian.Modal {
  constructor(app, onSubmit) {
    super(app);
    __publicField(this, "onSubmit", onSubmit);
    __publicField(this, "query", "");
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "\u{1F50D} \u30CE\u30FC\u30C8\u306B\u8CEA\u554F\u3059\u308B" });
    contentEl.createEl("p", {
      text: "\u81EA\u5206\u306E\u30CE\u30FC\u30C8\u306B\u66F8\u304B\u308C\u3066\u3044\u308B\u60C5\u5831\u3060\u3051\u3092\u6839\u62E0\u306B\u56DE\u7B54\u3057\u307E\u3059\u3002\u898B\u3064\u304B\u3089\u306A\u3044\u5834\u5408\u306F\u300C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u300D\u3068\u7B54\u3048\u307E\u3059\u3002",
      cls: "vault-rag-desc"
    });
    const input = contentEl.createEl("textarea", { cls: "vault-rag-query" });
    input.rows = 4;
    input.style.width = "100%";
    input.placeholder = "\u4F8B: \u65B0NISA\u3067\u6700\u521D\u306B\u3084\u308B\u3079\u304D\u3053\u3068\u306F\uFF1F";
    input.addEventListener("input", () => {
      this.query = input.value;
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") {
        if (ev.ctrlKey || ev.metaKey) {
        } else {
          ev.preventDefault();
          this.submit();
        }
      }
    });
    contentEl.createEl("p", {
      text: "Enter \u3067\u9001\u4FE1 \uFF0F \u6539\u884C\u306F Ctrl+Enter \uFF0F \u5B9F\u884C\u4E2D\u306F Esc \u3067\u4E2D\u65AD",
      cls: "vault-rag-desc"
    });
    new import_obsidian.Setting(contentEl).addButton(
      (b) => b.setButtonText("\u691C\u7D22\u3057\u3066\u56DE\u7B54 \u25B6").setCta().onClick(() => {
        this.submit();
      })
    );
    input.focus();
  }
  submit() {
    const q = this.query.trim();
    if (q.length === 0) {
      new import_obsidian.Notice("Vault RAG: \u8CEA\u554F\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044", 5e3);
      return;
    }
    this.close();
    void this.onSubmit(q);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var SUMMARY_STATE_FILE = "summary-state.json";
var SUMMARY_BACKUP_DIR = "summary-backup";
var SUMMARY_STATE_VERSION = 1;
var TOKENS_PER_CHAR = 0.603;
function estimateInputTokens(chars) {
  return Math.round(chars * TOKENS_PER_CHAR);
}
var SUMMARY_MIN_RATIO_VS_PREVIOUS = 0.5;
var SUMMARY_MAX_ATTEMPTS = 3;
function describeAttempts(log) {
  const sizes = log.attempts.map((a) => a.chars.toLocaleString()).join(" \u2192 ");
  if (log.accepted) {
    const n = log.attempts.length;
    return `${log.channel}: ${n}\u56DE\u76EE\u3067\u4E0A\u66F8\u304D\uFF08${sizes} \u6587\u5B57\uFF09`;
  }
  const longest = log.attempts.reduce((m, a) => Math.max(m, a.chars), 0);
  const why = log.attempts.every((a) => a.truncated) ? "\u6253\u3061\u5207\u3089\u308C\u305F\u305F\u3081" : "\u77ED\u3059\u304E\u308B\u305F\u3081";
  return `${log.channel}: ${log.attempts.length}\u56DE\u3068\u3082${why}\u4E0A\u66F8\u304D\u305B\u305A\uFF08\u6700\u9577 ${longest.toLocaleString()} / \u524D ${log.prevChars.toLocaleString()}\uFF09`;
}
function judgeSummaryLength(prevChars, newChars) {
  if (prevChars <= 0) return { ok: true, prevChars, newChars, ratio: 0, skipped: false };
  const ratio = newChars / prevChars * 100;
  const ok = newChars >= prevChars * SUMMARY_MIN_RATIO_VS_PREVIOUS;
  return { ok, prevChars, newChars, ratio, skipped: !ok };
}
function detectSettingsDrift(defaults, saved) {
  const missingArrayItems = [];
  if (!saved) return { missingArrayItems };
  for (const key of Object.keys(defaults)) {
    const d = defaults[key];
    if (!Array.isArray(d)) continue;
    const s = saved[key];
    if (!Array.isArray(s)) continue;
    const items = d.filter((x) => s.indexOf(x) < 0).map((x) => String(x));
    if (items.length > 0) missingArrayItems.push({ key, items });
  }
  return { missingArrayItems };
}
async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(digest);
  let out = "";
  for (let i = 0; i < view.length; i++) out += view[i].toString(16).padStart(2, "0");
  return out;
}
function diffSummaryState(current, saved, budgetPerMin) {
  const diffs = [];
  let unchangedCount = 0;
  for (const c of current) {
    const prev = saved ? saved.channels[c.key] : void 0;
    const estimatedTokens = estimateInputTokens(c.chars);
    const overBudget = estimatedTokens > budgetPerMin;
    if (!prev) {
      diffs.push({
        key: c.key,
        displayName: c.displayName,
        kind: "new",
        noteCount: c.noteCount,
        chars: c.chars,
        estimatedTokens,
        added: c.sources.map((s) => s.path),
        removed: [],
        modified: [],
        manuallyEdited: false,
        summaryExists: c.summaryExists,
        overBudget
      });
      continue;
    }
    const prevByPath = new Map(prev.sources.map((s) => [s.path, s]));
    const curByPath = new Map(c.sources.map((s) => [s.path, s]));
    const added = [];
    const modified = [];
    const removed = [];
    curByPath.forEach((s, p) => {
      const old = prevByPath.get(p);
      if (!old) {
        added.push(p);
        return;
      }
      if (old.size !== s.size || old.hash !== s.hash) modified.push(p);
    });
    prevByPath.forEach((_s, p) => {
      if (!curByPath.has(p)) removed.push(p);
    });
    const manuallyEdited = c.summaryExists && prev.summaryHash.length > 0 && c.summaryHash !== prev.summaryHash;
    const hasChange = added.length > 0 || removed.length > 0 || modified.length > 0;
    if (c.sources.length === 0) {
      diffs.push({
        key: c.key,
        displayName: c.displayName,
        kind: "sourcesGone",
        noteCount: 0,
        chars: 0,
        estimatedTokens: 0,
        added,
        removed,
        modified,
        manuallyEdited,
        summaryExists: c.summaryExists,
        overBudget: false
      });
      continue;
    }
    if (!hasChange) {
      unchangedCount++;
      diffs.push({
        key: c.key,
        displayName: c.displayName,
        kind: "unchanged",
        noteCount: c.noteCount,
        chars: c.chars,
        estimatedTokens,
        added,
        removed,
        modified,
        manuallyEdited,
        summaryExists: c.summaryExists,
        overBudget
      });
      continue;
    }
    diffs.push({
      key: c.key,
      displayName: c.displayName,
      kind: "changed",
      noteCount: c.noteCount,
      chars: c.chars,
      estimatedTokens,
      added,
      removed,
      modified,
      manuallyEdited,
      summaryExists: c.summaryExists,
      overBudget
    });
  }
  const rank = (k) => k === "new" ? 0 : k === "changed" ? 1 : k === "sourcesGone" ? 2 : 3;
  diffs.sort((a, b) => rank(a.kind) - rank(b.kind) || b.chars - a.chars);
  return { diffs, unchangedCount, isFirstRun: saved === null };
}
function groupSummaryUpdateTargets(plan) {
  const needsRebuild = [];
  const manuallyEdited = [];
  const unchanged = [];
  const sourcesGone = [];
  for (const d of plan.diffs) {
    if (d.kind === "sourcesGone") {
      sourcesGone.push(d);
      continue;
    }
    if (d.kind === "new" || d.kind === "changed") {
      needsRebuild.push(d);
      continue;
    }
    if (d.manuallyEdited) manuallyEdited.push(d);
    else unchanged.push(d);
  }
  const defaultSelected = needsRebuild.filter((d) => !d.overBudget).map((d) => d.key);
  const selectableCount = needsRebuild.concat(manuallyEdited).concat(unchanged).filter((d) => !d.overBudget).length;
  return { needsRebuild, manuallyEdited, unchanged, sourcesGone, defaultSelected, selectableCount };
}
var SummaryUpdateModal = class extends import_obsidian.Modal {
  constructor(app, plan, budgetPerMin, onRun) {
    super(app);
    __publicField(this, "plan", plan);
    __publicField(this, "budgetPerMin", budgetPerMin);
    __publicField(this, "onRun", onRun);
    __publicField(this, "selected", /* @__PURE__ */ new Set());
    __publicField(this, "groups");
    __publicField(this, "summaryEl", null);
    __publicField(this, "runButtonEl", null);
    this.groups = groupSummaryUpdateTargets(plan);
    for (const key of this.groups.defaultSelected) this.selected.add(key);
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "\u{1F504} \u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u66F4\u65B0" });
    const g = this.groups;
    this.summaryEl = contentEl.createEl("p", { cls: "vault-rag-desc" });
    this.updateSummary();
    this.renderGroup(contentEl, g.needsRebuild, {
      heading: `\u4F5C\u308A\u76F4\u3057\u304C\u5FC5\u8981\uFF08${g.needsRebuild.length}\uFF09`,
      empty: "\u306A\u3057\u3002\u5143\u30CE\u30FC\u30C8\u306B\u8FFD\u52A0\u30FB\u524A\u9664\u30FB\u5909\u66F4\u304C\u3042\u3063\u305F\u30C1\u30E3\u30F3\u30CD\u30EB\u306F\u3042\u308A\u307E\u305B\u3093",
      collapsed: false
    });
    this.renderGroup(contentEl, g.manuallyEdited, {
      heading: `\u26A0 \u624B\u52D5\u7DE8\u96C6\u306E\u7591\u3044\uFF08${g.manuallyEdited.length}\uFF09`,
      note: "\u5143\u30CE\u30FC\u30C8\u306B\u5909\u66F4\u306F\u3042\u308A\u307E\u305B\u3093\u304C\u3001\u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u5185\u5BB9\u304C\u8A18\u9332\u3068\u9055\u3044\u307E\u3059\u3002\u4F5C\u308A\u76F4\u3057\u3066\u4E0A\u66F8\u304D\u3059\u308B\u3068\u3001\u3053\u306E\u7591\u3044\u306F\u89E3\u6D88\u3055\u308C\u307E\u3059",
      empty: "\u306A\u3057",
      collapsed: false
    });
    this.renderGroup(contentEl, g.unchanged, {
      heading: `\u5909\u66F4\u306A\u3057\uFF08${g.unchanged.length}\uFF09`,
      note: "\u4F5C\u308A\u76F4\u3059\u5FC5\u8981\u306F\u3042\u308A\u307E\u305B\u3093\u304C\u3001\u9078\u3079\u3070\u4F5C\u308A\u76F4\u305B\u307E\u3059",
      empty: "\u306A\u3057",
      collapsed: true
    });
    if (g.sourcesGone.length > 0) {
      contentEl.createEl("h4", { text: `\u5143\u30CE\u30FC\u30C8\u304C\u7121\u304F\u306A\u3063\u305F\u30C1\u30E3\u30F3\u30CD\u30EB\uFF08${g.sourcesGone.length}\uFF09` });
      contentEl.createEl("p", {
        text: "\u5831\u544A\u306E\u307F\u3002\u4F5C\u308A\u76F4\u305B\u306A\u3044\u306E\u3067\u30C1\u30A7\u30C3\u30AF\u3067\u304D\u307E\u305B\u3093\u3002\u307E\u3068\u3081\u30CE\u30FC\u30C8\u306F\u6D88\u3057\u307E\u305B\u3093",
        cls: "vault-rag-desc"
      });
      const ul = contentEl.createEl("ul");
      for (const d of g.sourcesGone) ul.createEl("li", { text: d.displayName });
    }
    new import_obsidian.Setting(contentEl).addButton((b) => b.setButtonText("\u30AD\u30E3\u30F3\u30BB\u30EB").onClick(() => this.close())).addButton((b) => {
      this.runButtonEl = b.buttonEl;
      b.setButtonText("\u5B9F\u884C \u25B6").setCta().onClick(() => {
        const keys = Array.from(this.selected);
        if (keys.length === 0) return;
        this.close();
        void this.onRun(keys);
      });
    });
    this.updateRunButton();
  }
  /** 上部の要約行。グループごとの件数とチェック中の件数を出す。 */
  updateSummary() {
    if (!this.summaryEl) return;
    const g = this.groups;
    const notes = this.plan.diffs.filter((d) => this.selected.has(d.key)).reduce((a, d) => a + d.noteCount, 0);
    this.summaryEl.setText(
      `\u4F5C\u308A\u76F4\u3057\u304C\u5FC5\u8981: ${g.needsRebuild.length} \uFF0F \u624B\u52D5\u7DE8\u96C6\u306E\u7591\u3044: ${g.manuallyEdited.length} \uFF0F \u5909\u66F4\u306A\u3057: ${g.unchanged.length}` + (g.sourcesGone.length > 0 ? ` \uFF0F \u5143\u30CE\u30FC\u30C8\u306A\u3057: ${g.sourcesGone.length}` : "") + `\u3000\u2192\u3000\u30C1\u30A7\u30C3\u30AF\u4E2D: ${this.selected.size} \u30C1\u30E3\u30F3\u30CD\u30EB\uFF08\u5143\u30CE\u30FC\u30C8 \u5408\u8A08 ${notes.toLocaleString()} \u672C\uFF09`
    );
  }
  /** 1 件もチェックされていなければ実行を押せないようにする。 */
  updateRunButton() {
    if (this.runButtonEl) this.runButtonEl.disabled = this.selected.size === 0;
  }
  renderGroup(parent, diffs, opt) {
    let body;
    if (opt.collapsed) {
      const det = parent.createEl("details");
      det.createEl("summary", { text: opt.heading });
      body = det.createDiv();
    } else {
      parent.createEl("h4", { text: opt.heading });
      body = parent.createDiv();
    }
    if (opt.note) body.createEl("p", { text: opt.note, cls: "vault-rag-desc" });
    if (diffs.length === 0) {
      body.createEl("p", { text: opt.empty, cls: "vault-rag-desc" });
      return;
    }
    for (const d of diffs) this.renderRow(body, d);
  }
  renderRow(parent, d) {
    const row = parent.createDiv({ cls: "vault-rag-update-row" });
    const label = row.createEl("label");
    const cb = label.createEl("input", { type: "checkbox" });
    cb.checked = this.selected.has(d.key);
    cb.disabled = d.overBudget;
    cb.addEventListener("change", () => {
      if (cb.checked) this.selected.add(d.key);
      else this.selected.delete(d.key);
      this.updateSummary();
      this.updateRunButton();
    });
    label.createSpan({ text: ` ${d.displayName}` });
    const reasons = [];
    if (d.kind === "new") reasons.push("\u65B0\u898F\u30C1\u30E3\u30F3\u30CD\u30EB");
    if (d.added.length > 0) reasons.push(`\u8FFD\u52A0 ${d.added.length}\u672C`);
    if (d.removed.length > 0) reasons.push(`\u524A\u9664 ${d.removed.length}\u672C`);
    if (d.modified.length > 0) reasons.push(`\u5909\u66F4 ${d.modified.length}\u672C`);
    if (reasons.length === 0) reasons.push(d.manuallyEdited ? "\u307E\u3068\u3081\u30CE\u30FC\u30C8\u304C\u8A18\u9332\u3068\u9055\u3046" : "\u5143\u30CE\u30FC\u30C8\u306B\u5909\u66F4\u306A\u3057");
    row.createDiv({ cls: "vault-rag-desc" }).setText(
      `\u3000${reasons.join(" / ")} \uFF0F \u5168 ${d.noteCount} \u672C \uFF0F \u63A8\u5B9A\u5165\u529B ${d.estimatedTokens.toLocaleString()} \u30C8\u30FC\u30AF\u30F3`
    );
    if (d.overBudget) {
      row.createDiv({ cls: "vault-rag-warn" }).setText(
        `\u3000\u26D4 \u4E0A\u9650\u8D85\u904E\u306E\u305F\u3081\u4F5C\u6210\u4E0D\u53EF\uFF08\u63A8\u5B9A ${d.estimatedTokens.toLocaleString()} > \u4E0A\u9650 ${this.budgetPerMin.toLocaleString()}\uFF09`
      );
    }
    if (d.manuallyEdited && (d.kind === "new" || d.kind === "changed")) {
      row.createDiv({ cls: "vault-rag-warn" }).setText("\u3000\u26A0 \u624B\u52D5\u3067\u7DE8\u96C6\u3055\u308C\u305F\u53EF\u80FD\u6027\u3042\u308A\uFF08\u4E0A\u66F8\u304D\u3055\u308C\u307E\u3059\u3002\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7\u306F\u53D6\u308A\u307E\u3059\uFF09");
    }
    const changedPaths = d.added.concat(d.modified).concat(d.removed);
    if (changedPaths.length > 0) {
      const det = row.createEl("details");
      det.createEl("summary", { text: `\u3000\u5909\u66F4\u306E\u3042\u3063\u305F\u30CE\u30FC\u30C8 ${changedPaths.length} \u4EF6\u3092\u898B\u308B` });
      const ul = det.createEl("ul");
      for (const p of d.added) ul.createEl("li", { text: `\u8FFD\u52A0: ${p}` });
      for (const p of d.modified) ul.createEl("li", { text: `\u5909\u66F4: ${p}` });
      for (const p of d.removed) ul.createEl("li", { text: `\u524A\u9664: ${p}` });
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};
var VaultRagPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    __publicField(this, "settings");
    __publicField(this, "index", null);
    __publicField(this, "vectors", null);
    __publicField(this, "indexBlockedReason", null);
    __publicField(this, "loadTiming", null);
    __publicField(this, "pendingChanges", /* @__PURE__ */ new Set());
    __publicField(this, "reindexTimer", null);
    __publicField(this, "activeRun", null);
    /** `data.json` の生の中身。既定値との差を見るために保持する（落とし穴#34）。 */
    __publicField(this, "savedSettingsRaw", null);
    __publicField(this, "driftNotified", false);
  }
  async onload() {
    await this.loadSettings();
    this.reportSettingsDrift();
    this.addCommand({
      id: "count-target-notes",
      name: "\u5BFE\u8C61\u30CE\u30FC\u30C8\u3092\u6570\u3048\u308B",
      callback: () => {
        void this.runCount();
      }
    });
    this.addCommand({
      id: "preview-chunks",
      name: "\u30C1\u30E3\u30F3\u30AF\u5206\u5272\u3092\u30D7\u30EC\u30D3\u30E5\u30FC",
      callback: () => {
        void this.runPreview();
      }
    });
    this.addCommand({
      id: "build-index",
      name: "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3092\u4F5C\u6210/\u518D\u4F5C\u6210",
      callback: () => {
        void this.runBuildIndex();
      }
    });
    this.addCommand({
      id: "build-channel-summary",
      name: "\u30C1\u30E3\u30F3\u30CD\u30EB\u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u4F5C\u6210\uFF08\u8A66\u4F5C\uFF09",
      callback: () => {
        void this.runBuildChannelSummary();
      }
    });
    this.addCommand({
      id: "update-channel-summaries",
      name: "\u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u66F4\u65B0",
      callback: () => {
        void this.runUpdateSummaries();
      }
    });
    this.addCommand({
      id: "build-all-channel-summaries",
      name: "\u30C1\u30E3\u30F3\u30CD\u30EB\u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u5168\u4EF6\u4F5C\u6210",
      callback: () => {
        void this.runBuildAllChannelSummaries();
      }
    });
    this.addCommand({
      id: "verify-channel-summary",
      name: "\u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u691C\u8A3C",
      callback: () => {
        void this.runVerifyChannelSummary();
      }
    });
    this.registerView(ANSWER_VIEW_TYPE, (leaf) => new VaultRagAnswerView(leaf, this));
    this.addCommand({
      id: "ask",
      name: "\u8CEA\u554F\u3059\u308B",
      callback: () => {
        void this.runAsk();
      }
    });
    this.addCommand({
      id: "search-test",
      name: "\u691C\u7D22\u3092\u30C6\u30B9\u30C8",
      callback: () => {
        void this.runSearchTest();
      }
    });
    this.addCommand({
      id: "repair-summary-citations",
      name: "\u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u6574\u5F62\u3057\u76F4\u3059\uFF08API\u4E0D\u4F7F\u7528\uFF09",
      callback: () => {
        void this.runRepairSummaryCitations();
      }
    });
    this.addCommand({
      id: "verify-all-channel-summaries",
      name: "\u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u5168\u4EF6\u691C\u8A3C",
      callback: () => {
        void this.runVerifyAllChannelSummaries();
      }
    });
    this.addSettingTab(new VaultRagSettingTab(this.app, this));
    this.app.workspace.onLayoutReady(() => {
      void this.loadIndexFromDisk().then(() => {
        this.registerVaultWatchers();
      });
    });
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.savedSettingsRaw = loaded;
    const merged = Object.assign({}, DEFAULT_SETTINGS, loaded);
    if (!Array.isArray(merged.includeSourceTypes)) merged.includeSourceTypes = DEFAULT_SETTINGS.includeSourceTypes.slice();
    if (!Array.isArray(merged.excludeSubfolders)) merged.excludeSubfolders = DEFAULT_SETTINGS.excludeSubfolders.slice();
    if (!Array.isArray(merged.excludeSections)) merged.excludeSections = DEFAULT_SETTINGS.excludeSections.slice();
    merged.chunkSize = clampInt(merged.chunkSize, 100, 8e3, DEFAULT_SETTINGS.chunkSize);
    merged.chunkOverlap = clampInt(merged.chunkOverlap, 0, Math.max(0, merged.chunkSize - 1), DEFAULT_SETTINGS.chunkOverlap);
    merged.vectorTopK = clampInt(merged.vectorTopK, 1, 200, DEFAULT_SETTINGS.vectorTopK);
    merged.keywordTopK = clampInt(merged.keywordTopK, 1, 200, DEFAULT_SETTINGS.keywordTopK);
    merged.finalTopK = clampInt(merged.finalTopK, 1, 50, DEFAULT_SETTINGS.finalTopK);
    merged.maxChunksPerNote = clampInt(merged.maxChunksPerNote, 1, 50, DEFAULT_SETTINGS.maxChunksPerNote);
    merged.embedBatchSize = clampInt(merged.embedBatchSize, 1, 100, DEFAULT_SETTINGS.embedBatchSize);
    merged.embeddingDimensions = clampInt(merged.embeddingDimensions, 128, 3072, DEFAULT_SETTINGS.embeddingDimensions);
    merged.embedIntervalMs = clampInt(merged.embedIntervalMs, 0, 6e4, DEFAULT_SETTINGS.embedIntervalMs);
    merged.summaryMaxOutputTokens = clampInt(merged.summaryMaxOutputTokens, 1024, 2e5, DEFAULT_SETTINGS.summaryMaxOutputTokens);
    merged.summaryIntervalMs = clampInt(merged.summaryIntervalMs, 0, 3e5, DEFAULT_SETTINGS.summaryIntervalMs);
    merged.summaryTokenBudgetPerMin = clampInt(merged.summaryTokenBudgetPerMin, 1e4, GEMINI_FREE_INPUT_TOKENS_PER_MIN, DEFAULT_SETTINGS.summaryTokenBudgetPerMin);
    merged.summaryMinSourceNotes = clampInt(merged.summaryMinSourceNotes, 0, 1e3, DEFAULT_SETTINGS.summaryMinSourceNotes);
    merged.answerMaxTokens = clampInt(merged.answerMaxTokens, 256, 32e3, DEFAULT_SETTINGS.answerMaxTokens);
    if (typeof merged.keywordSearchEnabled !== "boolean") merged.keywordSearchEnabled = DEFAULT_SETTINGS.keywordSearchEnabled;
    if (typeof merged.summaryChannel !== "string") merged.summaryChannel = DEFAULT_SETTINGS.summaryChannel;
    if (typeof merged.summaryFolder !== "string" || !merged.summaryFolder) merged.summaryFolder = DEFAULT_SETTINGS.summaryFolder;
    if (typeof merged.summaryModel !== "string" || !merged.summaryModel) merged.summaryModel = DEFAULT_SETTINGS.summaryModel;
    merged.testModeNoteLimit = clampInt(merged.testModeNoteLimit, 0, 1e4, DEFAULT_SETTINGS.testModeNoteLimit);
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
  reportSettingsDrift() {
    if (this.driftNotified) return;
    this.driftNotified = true;
    const drift = detectSettingsDrift(
      DEFAULT_SETTINGS,
      this.savedSettingsRaw
    );
    if (drift.missingArrayItems.length === 0) return;
    console.warn("[Vault RAG] \u65E2\u5B9A\u5024\u306B\u3042\u3063\u3066 data.json \u306B\u7121\u3044\u914D\u5217\u306E\u8981\u7D20", drift);
    const lines = [];
    for (const a of drift.missingArrayItems) lines.push(`${a.key}: ${a.items.join(" / ")}`);
    new import_obsidian.Notice(
      `\u26A0\uFE0F Vault RAG: \u8A2D\u5B9A\u304C\u65E2\u5B9A\u5024\u306B\u8FFD\u3044\u3064\u3044\u3066\u3044\u307E\u305B\u3093
${lines.join("\n")}
\u4FDD\u5B58\u6E08\u307F\u306E\u8A2D\u5B9A\u304C\u512A\u5148\u3055\u308C\u307E\u3059\u3002\u81EA\u52D5\u3067\u306F\u76F4\u3057\u307E\u305B\u3093\u3002
\u8A73\u7D30\u306F\u30B3\u30F3\u30BD\u30FC\u30EB\uFF08Ctrl+Shift+I\uFF09`,
      0
    );
  }
  /* ---------- インデックスの読み書き ---------- */
  indexPath(file) {
    const dir = this.manifest.dir || `.obsidian/plugins/${this.manifest.id}`;
    return (0, import_obsidian.normalizePath)(`${dir}/${file}`);
  }
  /**
   * 2ファイルを読み、整合性とバージョンを検証する。
   * 問題があれば検索を無効化して再インデックスを促すだけにする（勝手に再生成しない）。
   */
  async loadIndexFromDisk() {
    const adapter = this.app.vault.adapter;
    const jsonPath = this.indexPath(INDEX_JSON_FILE);
    const binPath = this.indexPath(INDEX_BIN_FILE);
    this.index = null;
    this.vectors = null;
    this.indexBlockedReason = null;
    try {
      if (!await adapter.exists(jsonPath) || !await adapter.exists(binPath)) {
        this.indexBlockedReason = "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u307E\u3060\u3042\u308A\u307E\u305B\u3093";
        return;
      }
      const tJsonStart = Date.now();
      const jsonText = await adapter.read(jsonPath);
      const tJsonRead = Date.now();
      const parsed = JSON.parse(jsonText);
      const tJsonParse = Date.now();
      const buf = await adapter.readBinary(binPath);
      const tBinRead = Date.now();
      this.loadTiming = {
        jsonBytes: jsonText.length,
        jsonReadMs: tJsonRead - tJsonStart,
        jsonParseMs: tJsonParse - tJsonRead,
        binBytes: buf.byteLength,
        binReadMs: tBinRead - tJsonParse,
        totalMs: tBinRead - tJsonStart
      };
      const integrity = validateIndexIntegrity(parsed.meta, parsed.chunks.length, buf.byteLength);
      if (integrity) {
        this.indexBlockedReason = integrity;
        console.error("[Vault RAG] \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u306E\u6574\u5408\u6027\u30A8\u30E9\u30FC:", integrity);
        new import_obsidian.Notice(`Vault RAG: \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u58CA\u308C\u3066\u3044\u307E\u3059
${integrity}
\u518D\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u5FC5\u8981\u3067\u3059`, 15e3);
        return;
      }
      if (needsFullReindex(parsed.meta, currentIndexMeta(this.settings, parsed.meta.chunkCount))) {
        this.indexBlockedReason = "\u8A2D\u5B9A\u304C\u5909\u308F\u3063\u305F\u305F\u3081\u518D\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u5FC5\u8981\u3067\u3059";
        console.warn("[Vault RAG] \u8A2D\u5B9A\u5909\u66F4\u3092\u691C\u51FA", parsed.meta, this.settings);
        new import_obsidian.Notice("Vault RAG: \u8A2D\u5B9A\u304C\u5909\u308F\u3063\u305F\u305F\u3081\u518D\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u5FC5\u8981\u3067\u3059", 15e3);
        return;
      }
      this.index = parsed;
      this.vectors = new Float32Array(buf);
      const t = this.loadTiming;
      console.log(
        `[Vault RAG] \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u8AAD\u307F\u8FBC\u307F: ${parsed.chunks.length} \u30C1\u30E3\u30F3\u30AF / ${(buf.byteLength / 1024 / 1024).toFixed(1)} MB
  .json \u8AAD\u8FBC ${t.jsonReadMs}ms + \u30D1\u30FC\u30B9 ${t.jsonParseMs}ms\uFF08${(t.jsonBytes / 1024 / 1024).toFixed(1)}MB\uFF09
  .bin  \u8AAD\u8FBC ${t.binReadMs}ms\uFF08${(t.binBytes / 1024 / 1024).toFixed(1)}MB\uFF09
  \u5408\u8A08 ${t.totalMs}ms`
      );
    } catch (err) {
      this.indexBlockedReason = err instanceof Error ? err.message : String(err);
      console.error("[Vault RAG] \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
      new import_obsidian.Notice(`Vault RAG: \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${this.indexBlockedReason}`, 15e3);
    }
  }
  /** メタ+本文を .json、ベクトルを .bin に書く。JSON に数値配列を入れない（落とし穴#4）。 */
  async saveIndexToDisk(chunks, vectors, meta) {
    const adapter = this.app.vault.adapter;
    const payload = { meta, chunks };
    await adapter.writeBinary(this.indexPath(INDEX_BIN_FILE), vectors.buffer);
    await adapter.write(this.indexPath(INDEX_JSON_FILE), JSON.stringify(payload));
  }
  /* ---------- 対象ノートの収集 ---------- */
  /** フォルダ側の除外ルールを適用した候補ファイル。`source_type` の判定はまだしない。 */
  /**
   * RAG の候補ファイル。
   * `includeSourceTypes` に `channel_summary` が入っているときは、`summaryFolder` も対象に含める
   * （まとめノートは `targetFolder` の外に置いてあるため）。
   */
  collectCandidates(result) {
    const s = this.settings;
    const folder = s.targetFolder.replace(/\/+$/, "");
    const summaryFolder = s.summaryFolder.replace(/\/+$/, "");
    const wantSummaries = s.includeSourceTypes.indexOf("channel_summary") >= 0 && summaryFolder.length > 0;
    const candidates = [];
    for (const file of this.app.vault.getMarkdownFiles()) {
      const inTarget = isUnderFolder(file.path, folder);
      const inSummary = wantSummaries && isUnderFolder(file.path, summaryFolder);
      if (!inTarget && !inSummary) continue;
      if (result) result.filesUnderTarget++;
      if (result && hasExcludedFolder(file.path, [".ai"])) result.filesFromApiUnderAiFolder++;
      if (hasExcludedFolder(file.path, s.excludeSubfolders)) {
        if (result) result.skippedByFolderRule++;
        continue;
      }
      if (inTarget && s.excludeRootFiles && isDirectChild(file.path, folder)) {
        if (result) result.skippedByRootRule++;
        continue;
      }
      candidates.push(file);
    }
    candidates.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
    return candidates;
  }
  /** 除外ルールを適用して対象ノートを数える。外部 API は一切呼ばない。 */
  async countTargetNotes() {
    const started = Date.now();
    const s = this.settings;
    const result = emptyCountResult();
    const candidates = this.collectCandidates(result);
    for (const file of candidates) {
      let raw;
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (err) {
        result.readErrors.push(file.path);
        console.error("[Vault RAG] \u8AAD\u307F\u53D6\u308A\u5931\u6557:", file.path, err);
        continue;
      }
      tallyNote(result, raw, s, file.path);
    }
    result.elapsedMs = Date.now() - started;
    return result;
  }
  async runCount() {
    const counting = new import_obsidian.Notice("Vault RAG: \u96C6\u8A08\u4E2D\u2026", 0);
    try {
      const r = await this.countTargetNotes();
      counting.hide();
      console.log("[Vault RAG] \u96C6\u8A08\u7D50\u679C", r);
      if (r.readErrors.length > 0) console.warn("[Vault RAG] \u8AAD\u307F\u53D6\u308A\u306B\u5931\u6557\u3057\u305F\u30D5\u30A1\u30A4\u30EB", r.readErrors);
      const included = [];
      const excluded = [];
      const keys = Object.keys(r.bySourceType).sort((a, b) => r.bySourceType[b] - r.bySourceType[a]);
      for (const k of keys) {
        const line = `${k} ${r.bySourceType[k].toLocaleString()}`;
        if (this.settings.includeSourceTypes.indexOf(k) >= 0) included.push(line);
        else excluded.push(line);
      }
      const message = `\u{1F4CA} Vault RAG \u5BFE\u8C61\u30CE\u30FC\u30C8\u96C6\u8A08
\u5BFE\u8C61: ${r.includedNotes.toLocaleString()} \u672C / \u672C\u6587 ${r.extractedChars.toLocaleString()} \u6587\u5B57
\u57CB\u3081\u8FBC\u307F\u9001\u4FE1\u91CF\uFF08\u30C1\u30E3\u30F3\u30AF\u91CD\u8907\u8FBC\u307F\u30FB\u30D8\u30C3\u30C0\u9664\u304F\uFF09: ${r.includedChars.toLocaleString()} \u6587\u5B57
\u60F3\u5B9A\u30C1\u30E3\u30F3\u30AF\u6570: ${r.includedChunks.toLocaleString()}\uFF08\u672C\u6587 ${r.bodyChunks.toLocaleString()} + \u30B5\u30DE\u30EA\u30FC ${r.summaryChunks.toLocaleString()}\uFF09
\u3000\u8CAA\u6B32\u30D1\u30C3\u30AD\u30F3\u30B0 ${this.settings.chunkSize}\u6587\u5B57 / \u91CD\u8907${this.settings.chunkOverlap}\u6587\u5B57
\u542B\u3081\u308B: ${included.join(" \u30FB ") || "\u306A\u3057"}
\u9664\u5916: ${excluded.join(" \u30FB ") || "\u306A\u3057"}
\u5BFE\u8C61\u30D5\u30A9\u30EB\u30C0\u5185\u306E .md\uFF08API \u7D4C\u7531\uFF09: ${r.filesUnderTarget.toLocaleString()} \u672C
\u3046\u3061 .ai \u914D\u4E0B: ${r.filesFromApiUnderAiFolder.toLocaleString()} \u672C
\u76F4\u4E0B\u30D5\u30A1\u30A4\u30EB\u9664\u5916: ${r.skippedByRootRule.toLocaleString()} \u672C \uFF0F \u30D5\u30A9\u30EB\u30C0\u9664\u5916: ${r.skippedByFolderRule.toLocaleString()} \u672C
\u8AAD\u307F\u53D6\u308A\u5931\u6557: ${r.readErrors.length.toLocaleString()} \u672C
\u6240\u8981: ${(r.elapsedMs / 1e3).toFixed(1)} \u79D2`;
      new import_obsidian.Notice(message, 0);
    } catch (err) {
      counting.hide();
      console.error("[Vault RAG] \u96C6\u8A08\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
      new import_obsidian.Notice(`Vault RAG: \u96C6\u8A08\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 1e4);
    }
  }
  /* ---------- インデックス作成 ---------- */
  /**
   * 1バッチぶんを埋め込む。レート制限時は「同じモデルで」リトライする。
   * ⛔ 別モデルにフォールバックしてはいけない（落とし穴#19）。
   */
  async embedBatchWithRetry(texts, taskType, controller, onRetry) {
    const s = this.settings;
    const provider = getEmbeddingProvider(s.embeddingProvider);
    const apiKey = getEmbeddingApiKey(s);
    const options = { dimensions: s.embeddingDimensions, taskType };
    let lastError = "";
    for (let attempt = 0; attempt < EMBED_MAX_ATTEMPTS; attempt++) {
      controller.throwIfAborted();
      if (attempt > 0) {
        const waitMs = calcRetryDelayMs(attempt, isRateLimitMessage(lastError));
        onRetry(waitMs, attempt, lastError);
        await controller.sleep(waitMs);
      }
      try {
        return await provider.embed(texts, apiKey, s.embeddingModel, options);
      } catch (err) {
        if (isAbortedError(err)) throw err;
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[Vault RAG] \u57CB\u3081\u8FBC\u307F\u5931\u6557\uFF08${attempt + 1}/${EMBED_MAX_ATTEMPTS}\uFF09`, lastError);
        if (isNonRetryableApiError(lastError)) throw new Error(lastError);
      }
    }
    throw new Error(`\u57CB\u3081\u8FBC\u307F\u306B ${EMBED_MAX_ATTEMPTS} \u56DE\u5931\u6557\u3057\u307E\u3057\u305F: ${lastError}`);
  }
  async runBuildIndex() {
    if (this.activeRun) {
      new import_obsidian.Notice("Vault RAG: \u65E2\u306B\u5B9F\u884C\u4E2D\u3067\u3059", 5e3);
      return;
    }
    const s = this.settings;
    const providerLabel = s.embeddingProvider === "openai" ? "OpenAI" : "Gemini";
    const apiKey = getEmbeddingApiKey(s);
    if (!apiKey) {
      new import_obsidian.Notice(
        `Vault RAG: ${providerLabel} \u306E API \u30AD\u30FC\u304C\u672A\u8A2D\u5B9A\u3067\u3059
\u73FE\u5728\u306E\u57CB\u3081\u8FBC\u307F\u30D7\u30ED\u30D0\u30A4\u30C0: ${s.embeddingProvider}
\u8A2D\u5B9A\u3067\u30AD\u30FC\u3092\u5165\u308C\u308B\u304B\u3001\u30D7\u30ED\u30D0\u30A4\u30C0\u3092\u5207\u308A\u66FF\u3048\u3066\u304F\u3060\u3055\u3044`,
        15e3
      );
      return;
    }
    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const onEsc = (ev) => {
      if (ev.key === "Escape") {
        controller.abort();
        new import_obsidian.Notice("Vault RAG: \u4E2D\u65AD\u3057\u307E\u3059\uFF08\u9001\u4FE1\u6E08\u307F\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u306E\u5B8C\u4E86\u3092\u5F85\u3061\u307E\u3059\uFF09", 5e3);
      }
    };
    document.addEventListener("keydown", onEsc);
    const started = Date.now();
    const testLimit = s.testModeNoteLimit > 0 ? s.testModeNoteLimit : 0;
    const label = testLimit > 0 ? `\u30C6\u30B9\u30C8\u5B9F\u884C\uFF08\u5148\u982D${testLimit}\u672C\uFF09` : "\u5168\u4EF6";
    let done = 0;
    let totalChunks = 0;
    try {
      progress.show(`Vault RAG: \u5BFE\u8C61\u30CE\u30FC\u30C8\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026\uFF08${label}\uFF09`);
      const candidates = this.collectCandidates();
      const chunks = [];
      const readErrors = [];
      let notes = 0;
      let thinSkipped = 0;
      for (const file of candidates) {
        if (testLimit > 0 && notes >= testLimit) break;
        controller.throwIfAborted();
        let raw;
        try {
          raw = await this.app.vault.cachedRead(file);
        } catch (err) {
          readErrors.push(file.path);
          console.error("[Vault RAG] \u8AAD\u307F\u53D6\u308A\u5931\u6557:", file.path, err);
          continue;
        }
        const note = extractNote(raw, s);
        if (s.includeSourceTypes.indexOf(note.sourceType) < 0) continue;
        if (isSummaryTooThin(note, s)) {
          thinSkipped++;
          continue;
        }
        notes++;
        for (const c of buildChunks(note, file.path, file.stat.mtime, s)) chunks.push(c);
      }
      if (chunks.length === 0) {
        progress.hide();
        new import_obsidian.Notice("Vault RAG: \u5BFE\u8C61\u30C1\u30E3\u30F3\u30AF\u304C 0 \u4EF6\u3067\u3057\u305F", 1e4);
        return;
      }
      const dimensions = s.embeddingDimensions;
      const vectors = new Float32Array(chunks.length * dimensions);
      const batchSize = Math.max(1, s.embedBatchSize);
      let embeddedTokens = 0;
      let embeddedChars = 0;
      totalChunks = chunks.length;
      for (let start = 0; start < chunks.length; start += batchSize) {
        controller.throwIfAborted();
        if (start > 0 && s.embedIntervalMs > 0) await controller.sleep(s.embedIntervalMs);
        const slice = chunks.slice(start, start + batchSize);
        progress.show(`Vault RAG: \u57CB\u3081\u8FBC\u307F\u4E2D ${done.toLocaleString()} / ${chunks.length.toLocaleString()} \u30C1\u30E3\u30F3\u30AF\uFF08Esc\u3067\u4E2D\u65AD\uFF09`);
        const result = await this.embedBatchWithRetry(
          slice.map((c) => c.text),
          "RETRIEVAL_DOCUMENT",
          // ノート側。質問側は RETRIEVAL_QUERY
          controller,
          (waitMs, attempt, message2) => {
            progress.show(`Vault RAG: ${Math.round(waitMs / 1e3)}\u79D2\u5F85\u3063\u3066\u518D\u8A66\u884C\uFF08${attempt + 1}/${EMBED_MAX_ATTEMPTS}\uFF09
${message2}`);
          }
        );
        for (let i = 0; i < result.vectors.length; i++) {
          const v = result.vectors[i];
          if (v.length !== dimensions) {
            throw new Error(`\u6B21\u5143\u6570\u304C\u60F3\u5B9A\u3068\u9055\u3044\u307E\u3059: ${v.length} \uFF08\u671F\u5F85 ${dimensions}\uFF09\u3002\u8A2D\u5B9A\u3068\u57CB\u3081\u8FBC\u307F\u30E2\u30C7\u30EB\u3092\u78BA\u8A8D\u3057\u3066\u304F\u3060\u3055\u3044`);
          }
          vectors.set(normalizeVector(v), (start + i) * dimensions);
        }
        embeddedTokens += result.tokens;
        for (const c of slice) embeddedChars += c.text.length;
        done += slice.length;
      }
      progress.show("Vault RAG: \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3092\u4FDD\u5B58\u4E2D\u2026");
      const meta = currentIndexMeta(s, chunks.length);
      await this.saveIndexToDisk(chunks, vectors, meta);
      this.index = { meta, chunks };
      this.vectors = vectors;
      this.indexBlockedReason = null;
      const costUsd = calcEmbeddingCostUsd(s.embeddingModel, embeddedTokens);
      s.totalEmbeddingTokens += embeddedTokens;
      s.totalCostUsd += costUsd;
      await this.saveSettings();
      progress.hide();
      const elapsedSec = (Date.now() - started) / 1e3;
      const binMb = (vectors.byteLength / 1024 / 1024).toFixed(1);
      const usageLine = embeddedTokens > 0 ? `\u57CB\u3081\u8FBC\u307F\u30C8\u30FC\u30AF\u30F3: ${embeddedTokens.toLocaleString()}` : `\u57CB\u3081\u8FBC\u307F\u6587\u5B57\u6570: ${embeddedChars.toLocaleString()}\uFF08${s.embeddingProvider} \u306F usage \u3092\u8FD4\u3055\u306A\u3044\u305F\u3081\u30C8\u30FC\u30AF\u30F3\u6570\u306F\u4E0D\u660E\uFF09`;
      const costLine = embeddedTokens > 0 ? `\u4ECA\u56DE: ${formatUsdJpy(costUsd)}
\u7D2F\u8A08: ${formatUsdJpy(s.totalCostUsd)}` : `\u4ECA\u56DE: \u7121\u6599\u67A0\u306E\u305F\u3081 0 \u5186
\u7D2F\u8A08\uFF08\u8AB2\u91D1\u5206\u306E\u307F\uFF09: ${formatUsdJpy(s.totalCostUsd)}`;
      const message = `\u2705 \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u4F5C\u6210\u5B8C\u4E86\uFF08${label}\uFF09
\u30CE\u30FC\u30C8 ${notes.toLocaleString()} \u672C \u2192 ${chunks.length.toLocaleString()} \u30C1\u30E3\u30F3\u30AF
${usageLine}
${costLine}
\u6240\u8981: ${elapsedSec.toFixed(1)} \u79D2
${INDEX_BIN_FILE}: ${binMb} MB\uFF08${dimensions}\u6B21\u5143\uFF09
\u8AAD\u307F\u53D6\u308A\u5931\u6557: ${readErrors.length} \u672C` + (thinSkipped > 0 ? `
RAG \u5BFE\u8C61\u5916\u306B\u3057\u305F\u307E\u3068\u3081\u30CE\u30FC\u30C8: ${thinSkipped} \u672C\uFF08source_notes < ${s.summaryMinSourceNotes}\uFF09` : "");
      new import_obsidian.Notice(message, 0);
      console.log("[Vault RAG] \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u4F5C\u6210\u5B8C\u4E86", { label, notes, chunks: chunks.length, embeddedTokens, embeddedChars, costUsd, elapsedSec, readErrors, thinSkipped });
    } catch (err) {
      progress.hide();
      const failedSec = (Date.now() - started) / 1e3;
      const progressLine = totalChunks > 0 ? `
\u5B8C\u4E86: ${done.toLocaleString()} / ${totalChunks.toLocaleString()} \u30C1\u30E3\u30F3\u30AF\uFF08${Math.round(done / totalChunks * 100)}%\uFF09\uFF0F \u7D4C\u904E ${failedSec.toFixed(1)} \u79D2` : "";
      if (isAbortedError(err)) {
        new import_obsidian.Notice(`Vault RAG: \u4E2D\u65AD\u3057\u307E\u3057\u305F\u3002\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u306F\u4FDD\u5B58\u3057\u3066\u3044\u307E\u305B\u3093${progressLine}`, 0);
      } else {
        console.error("[Vault RAG] \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
        new import_obsidian.Notice(`Vault RAG: \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}${progressLine}`, 0);
      }
      console.log("[Vault RAG] \u4E2D\u65AD/\u5931\u6557\u6642\u306E\u9032\u6357", { done, totalChunks, elapsedSec: failedSec });
    } finally {
      document.removeEventListener("keydown", onEsc);
      this.activeRun = null;
    }
  }
  /* ---------- チャンネルまとめノート（SUMMARY_NOTES.md / 試作） ---------- */
  /** 対象ノートを全部読み、チャンネル名つきで返す。 */
  async collectNotesWithChannel() {
    const s = this.settings;
    const entries = [];
    const readErrors = [];
    let noChannel = 0;
    for (const file of this.collectCandidates()) {
      let raw;
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (err) {
        readErrors.push(file.path);
        console.error("[Vault RAG] \u8AAD\u307F\u53D6\u308A\u5931\u6557:", file.path, err);
        continue;
      }
      const note = extractNote(raw, s);
      if (s.includeSourceTypes.indexOf(note.sourceType) < 0) continue;
      if (note.sourceType === "channel_summary") continue;
      if (note.main.length === 0) continue;
      const channel = note.frontmatter["channel"] || "";
      if (!channel) {
        noChannel++;
        continue;
      }
      const base = file.path.slice(file.path.lastIndexOf("/") + 1);
      entries.push({
        channel,
        note: { title: base.endsWith(".md") ? base.slice(0, -3) : base, path: file.path, body: note.main }
      });
    }
    return { entries, readErrors, noChannel };
  }
  /** 表記ゆれを吸収したチャンネル一覧。文字数の多い順。 */
  async collectChannelGroups() {
    const { entries, readErrors, noChannel } = await this.collectNotesWithChannel();
    return { groups: groupNotesByChannel(entries), readErrors, noChannel };
  }
  /** 設定のチャンネル名に対応するグループを1件返す（表記ゆれを吸収して突き合わせる）。 */
  async findChannelGroup(channel) {
    const { groups, readErrors } = await this.collectChannelGroups();
    const key = normalizeChannelKey(channel);
    for (const g of groups) if (normalizeChannelKey(g.displayName) === key) return { group: g, readErrors };
    return { group: null, readErrors };
  }
  /** チャンネル名にはファイル名に使えない文字（`|` など）が混ざるので必ず通す。 */
  summaryNotePath(channel) {
    return (0, import_obsidian.normalizePath)(`${this.settings.summaryFolder.replace(/\/+$/, "")}/${toSafeFileName(channel)}.md`);
  }
  /** 1チャンネル分を生成して保存する。呼び出し側が中断制御と進捗を持つ。 */
  async buildOneChannelSummary(group, controller, progress, limiter, writer, attemptLabel = "") {
    const s = this.settings;
    const channel = group.displayName;
    const notes = group.notes;
    const sourceChars = group.chars;
    const outPath = this.summaryNotePath(channel);
    if (isUnderFolder(outPath, s.targetFolder.replace(/\/+$/, ""))) {
      throw new Error(`\u51FA\u529B\u5148\u304C\u5BFE\u8C61\u30D5\u30A9\u30EB\u30C0\u306E\u4E2D\u3067\u3059: ${outPath}`);
    }
    const label = attemptLabel.length > 0 ? ` ${attemptLabel}` : "";
    const prompt = buildSummaryPrompt(notes);
    const estTokens = estimateTokensFromChars(prompt.length);
    console.log(`[Vault RAG] \u307E\u3068\u3081\u751F\u6210: ${channel} / ${notes.length}\u672C / \u672C\u6587${sourceChars}\u6587\u5B57 / \u30D7\u30ED\u30F3\u30D7\u30C8${prompt.length}\u6587\u5B57 / \u63A8\u5B9A${estTokens}\u30C8\u30FC\u30AF\u30F3`);
    if (limiter) {
      const waitMs = limiter.waitMsFor(estTokens);
      if (waitMs > 0) {
        progress.show(`Vault RAG: \u5206\u3042\u305F\u308A\u30C8\u30FC\u30AF\u30F3\u4E0A\u9650\u306E\u305F\u3081 ${Math.ceil(waitMs / 1e3)} \u79D2\u5F85\u6A5F\u4E2D\u2026\uFF08${channel}${label}\uFF09`);
        await controller.sleep(waitMs);
      }
      limiter.record(estTokens);
    }
    progress.show(`Vault RAG: ${channel}${label} \u3092\u751F\u6210\u4E2D\u2026\uFF08${notes.length}\u672C / ${sourceChars.toLocaleString()}\u6587\u5B57\u30FBEsc\u3067\u4E2D\u65AD\uFF09`);
    let result = null;
    let lastError = "";
    for (let attempt = 0; attempt < EMBED_MAX_ATTEMPTS; attempt++) {
      controller.throwIfAborted();
      if (attempt > 0) {
        const hinted = parseRetryAfterMs(lastError);
        const waitMs = hinted !== null ? hinted : calcRetryDelayMs(attempt, isRateLimitMessage(lastError));
        progress.show(`Vault RAG: ${Math.round(waitMs / 1e3)}\u79D2\u5F85\u3063\u3066\u518D\u8A66\u884C\uFF08${attempt + 1}/${EMBED_MAX_ATTEMPTS}\uFF09
${channel}${label}`);
        await controller.sleep(waitMs);
      }
      try {
        result = await callGeminiText(s.geminiApiKey, s.summaryModel, prompt, s.summaryMaxOutputTokens);
        break;
      } catch (err) {
        if (isAbortedError(err)) throw err;
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[Vault RAG] \u307E\u3068\u3081\u751F\u6210\u306E\u5931\u6557\uFF08${attempt + 1}/${EMBED_MAX_ATTEMPTS}\uFF09`, lastError);
        if (isNonRetryableApiError(lastError)) throw new Error(lastError);
      }
    }
    if (!result) throw new Error(`\u307E\u3068\u3081\u751F\u6210\u306B ${EMBED_MAX_ATTEMPTS} \u56DE\u5931\u6557\u3057\u307E\u3057\u305F: ${lastError}`);
    const titles = notes.map((n) => n.title);
    const promoted = promoteBoldOnlyBullets(result.text.trim());
    const numbered = resolveCitationNumbers(promoted.text, notes);
    const corrected = fixCitationsInText(numbered.text, titles);
    const repaired = corrected.fixes.filter((f) => f.after !== null);
    const unresolved = corrected.fixes.filter((f) => f.after === null);
    console.log(`[Vault RAG] K4 \u51FA\u5178: ${channel}`, {
      boldBulletsPromoted: promoted.promoted,
      numberResolved: numbered.resolved,
      numberUnknown: numbered.unknown,
      unknownTokens: numbered.unknownTokens.slice(0, 10),
      nonNumeric: numbered.nonNumeric.length,
      nonNumericSamples: numbered.nonNumeric.slice(0, 5),
      approxRepaired: repaired.length,
      approxUnresolved: unresolved.length
    });
    const adapter = this.app.vault.adapter;
    const folder = (0, import_obsidian.normalizePath)(s.summaryFolder.replace(/\/+$/, ""));
    if (!await adapter.exists(folder)) await adapter.mkdir(folder);
    const frontmatter = buildSummaryFrontmatter(channel, notes.length, sourceChars, s.summaryModel);
    const existed = await adapter.exists(outPath);
    const content = `${frontmatter}

${corrected.text}
`;
    if (writer) await writer(outPath, content, { truncated: result.truncated });
    else await adapter.write(outPath, content);
    return {
      channel,
      variants: group.variants,
      notes: notes.length,
      sourceChars,
      outChars: corrected.text.length,
      ratio: corrected.text.length / sourceChars * 100,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      truncated: result.truncated,
      citationsRepaired: repaired.length,
      citationsUnresolved: unresolved.length + numbered.unknown,
      numberResolved: numbered.resolved,
      numberUnknown: numbered.unknown,
      nonNumeric: numbered.nonNumeric.length,
      outPath,
      existed
    };
  }
  async runBuildChannelSummary() {
    if (this.activeRun) {
      new import_obsidian.Notice("Vault RAG: \u65E2\u306B\u5B9F\u884C\u4E2D\u3067\u3059", 5e3);
      return;
    }
    const s = this.settings;
    const channel = s.summaryChannel.trim();
    if (!channel) {
      new import_obsidian.Notice("Vault RAG: \u307E\u3068\u3081\u5BFE\u8C61\u306E\u30C1\u30E3\u30F3\u30CD\u30EB\u540D\u304C\u672A\u8A2D\u5B9A\u3067\u3059", 1e4);
      return;
    }
    if (!s.geminiApiKey) {
      new import_obsidian.Notice("Vault RAG: Gemini \u306E API \u30AD\u30FC\u304C\u672A\u8A2D\u5B9A\u3067\u3059\n\u8A2D\u5B9A\u3067\u30AD\u30FC\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044", 15e3);
      return;
    }
    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const onEsc = this.makeEscHandler(controller);
    document.addEventListener("keydown", onEsc);
    const started = Date.now();
    try {
      progress.show(`Vault RAG: ${channel} \u306E\u30CE\u30FC\u30C8\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026`);
      const { group, readErrors } = await this.findChannelGroup(channel);
      if (!group) {
        progress.hide();
        new import_obsidian.Notice(`Vault RAG: \u30C1\u30E3\u30F3\u30CD\u30EB\u300C${channel}\u300D\u306E\u5BFE\u8C61\u30CE\u30FC\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`, 1e4);
        return;
      }
      const r = await this.buildOneChannelSummary(group, controller, progress);
      progress.hide();
      const elapsedSec = (Date.now() - started) / 1e3;
      new import_obsidian.Notice(
        `\u2705 \u307E\u3068\u3081\u30CE\u30FC\u30C8\u4F5C\u6210\u5B8C\u4E86
${r.channel}: ${r.notes} \u672C / ${r.sourceChars.toLocaleString()} \u6587\u5B57
\u2192 ${r.outChars.toLocaleString()} \u6587\u5B57\uFF08\u5727\u7E2E\u7387 ${r.ratio.toFixed(1)}%\uFF09
\u51FA\u5178\u306E\u88DC\u6B63: ${r.citationsRepaired} \u4EF6 \uFF0F \u76F4\u305B\u305A\u4E0D\u660E\u306B\u3057\u305F: ${r.citationsUnresolved} \u4EF6
\u30C8\u30FC\u30AF\u30F3: \u5165\u529B ${r.inputTokens.toLocaleString()} / \u51FA\u529B ${r.outputTokens.toLocaleString()}
\u8CBB\u7528: \u7121\u6599\u67A0\u306E\u305F\u3081 0 \u5186
\u6240\u8981: ${elapsedSec.toFixed(1)} \u79D2
\u4FDD\u5B58\u5148: ${r.outPath}${r.existed ? "\uFF08\u4E0A\u66F8\u304D\uFF09" : ""}
\u8AAD\u307F\u53D6\u308A\u5931\u6557: ${readErrors.length} \u672C` + (r.truncated ? "\n\u26A0\uFE0F \u51FA\u529B\u304C maxOutputTokens \u3067\u6253\u3061\u5207\u3089\u308C\u3066\u3044\u307E\u3059" : ""),
        0
      );
      console.log("[Vault RAG] \u307E\u3068\u3081\u30CE\u30FC\u30C8\u4F5C\u6210\u5B8C\u4E86", { ...r, elapsedSec, readErrors });
    } catch (err) {
      progress.hide();
      if (isAbortedError(err)) {
        new import_obsidian.Notice("Vault RAG: \u4E2D\u65AD\u3057\u307E\u3057\u305F\u3002\u307E\u3068\u3081\u30CE\u30FC\u30C8\u306F\u4FDD\u5B58\u3057\u3066\u3044\u307E\u305B\u3093", 1e4);
      } else {
        console.error("[Vault RAG] \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
        new import_obsidian.Notice(`Vault RAG: \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 0);
      }
    } finally {
      document.removeEventListener("keydown", onEsc);
      this.activeRun = null;
    }
  }
  /** 全チャンネル分をまとめて生成する。1本の失敗で全体を止めない。 */
  async runBuildAllChannelSummaries() {
    if (this.activeRun) {
      new import_obsidian.Notice("Vault RAG: \u65E2\u306B\u5B9F\u884C\u4E2D\u3067\u3059", 5e3);
      return;
    }
    const s = this.settings;
    if (!s.geminiApiKey) {
      new import_obsidian.Notice("Vault RAG: Gemini \u306E API \u30AD\u30FC\u304C\u672A\u8A2D\u5B9A\u3067\u3059\n\u8A2D\u5B9A\u3067\u30AD\u30FC\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044", 15e3);
      return;
    }
    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const onEsc = this.makeEscHandler(controller);
    document.addEventListener("keydown", onEsc);
    const started = Date.now();
    const done = [];
    const failed = [];
    try {
      progress.show("Vault RAG: \u5BFE\u8C61\u30CE\u30FC\u30C8\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026");
      const { groups, readErrors, noChannel } = await this.collectChannelGroups();
      if (groups.length === 0) {
        progress.hide();
        new import_obsidian.Notice("Vault RAG: \u30C1\u30E3\u30F3\u30CD\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093", 1e4);
        return;
      }
      const merged = groups.filter((g) => g.variants.length > 1);
      console.log(`[Vault RAG] \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u751F\u6210: ${groups.length} \u30C1\u30E3\u30F3\u30CD\u30EB / channel \u7A7A\u306E\u30CE\u30FC\u30C8 ${noChannel} \u672C`);
      if (merged.length > 0) console.log("[Vault RAG] \u8868\u8A18\u3086\u308C\u3092\u7D71\u5408\u3057\u305F\u30C1\u30E3\u30F3\u30CD\u30EB", merged.map((g) => ({ displayName: g.displayName, variants: g.variants, notes: g.notes.length })));
      const limiter = new TokenRateLimiter(s.summaryTokenBudgetPerMin);
      for (let i = 0; i < groups.length; i++) {
        controller.throwIfAborted();
        if (i > 0 && s.summaryIntervalMs > 0) await controller.sleep(s.summaryIntervalMs);
        const g = groups[i];
        progress.show(`Vault RAG: \u307E\u3068\u3081\u751F\u6210 ${i + 1} / ${groups.length}\uFF08${g.displayName}\uFF09Esc\u3067\u4E2D\u65AD`);
        try {
          done.push(await this.buildOneChannelSummary(g, controller, progress, limiter));
        } catch (err) {
          if (isAbortedError(err)) throw err;
          const message = err instanceof Error ? err.message : String(err);
          failed.push({ channel: g.displayName, error: message });
          console.error(`[Vault RAG] ${g.displayName} \u306E\u751F\u6210\u306B\u5931\u6557`, message);
          if (isNonRetryableApiError(message)) throw new Error(`\u56DE\u5FA9\u3057\u306A\u3044\u30A8\u30E9\u30FC\u306E\u305F\u3081\u4E2D\u65AD\u3057\u307E\u3057\u305F: ${message}`);
        }
      }
      progress.hide();
      this.reportAllSummaries(done, failed, groups.length, started, readErrors.length, noChannel);
    } catch (err) {
      progress.hide();
      const elapsedSec = (Date.now() - started) / 1e3;
      const line = `
\u5B8C\u4E86: ${done.length} / ${done.length + failed.length} \u30C1\u30E3\u30F3\u30CD\u30EB \uFF0F \u7D4C\u904E ${elapsedSec.toFixed(1)} \u79D2`;
      if (isAbortedError(err)) {
        new import_obsidian.Notice(`Vault RAG: \u4E2D\u65AD\u3057\u307E\u3057\u305F\u3002\u751F\u6210\u6E08\u307F\u306E\u307E\u3068\u3081\u30CE\u30FC\u30C8\u306F\u6B8B\u3057\u3066\u3044\u307E\u3059${line}`, 0);
      } else {
        console.error("[Vault RAG] \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
        new import_obsidian.Notice(`Vault RAG: \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}${line}`, 0);
      }
      console.log("[Vault RAG] \u4E2D\u65AD/\u5931\u6557\u6642\u306E\u5185\u8A33", { done: done.map((d) => d.channel), failed });
    } finally {
      document.removeEventListener("keydown", onEsc);
      this.activeRun = null;
    }
  }
  reportAllSummaries(done, failed, total, started, readErrors, noChannel) {
    let srcChars = 0, outChars = 0, inTok = 0, outTok = 0, repaired = 0, unresolved = 0, truncated = 0;
    for (const d of done) {
      srcChars += d.sourceChars;
      outChars += d.outChars;
      inTok += d.inputTokens;
      outTok += d.outputTokens;
      repaired += d.citationsRepaired;
      unresolved += d.citationsUnresolved;
      if (d.truncated) truncated++;
    }
    const elapsedSec = (Date.now() - started) / 1e3;
    const ratio = srcChars > 0 ? outChars / srcChars * 100 : 0;
    console.log("[Vault RAG] \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u751F\u6210\u306E\u7D50\u679C", {
      total,
      done: done.length,
      failed: failed.length,
      srcChars,
      outChars,
      ratio,
      inTok,
      outTok,
      repaired,
      unresolved,
      truncated,
      elapsedSec,
      readErrors,
      noChannel
    });
    console.table(done.map((d) => ({
      channel: d.channel,
      notes: d.notes,
      src: d.sourceChars,
      out: d.outChars,
      ratio: `${d.ratio.toFixed(1)}%`,
      fixed: d.citationsRepaired,
      unknown: d.citationsUnresolved,
      truncated: d.truncated
    })));
    if (failed.length > 0) console.error("[Vault RAG] \u751F\u6210\u306B\u5931\u6557\u3057\u305F\u30C1\u30E3\u30F3\u30CD\u30EB", failed);
    new import_obsidian.Notice(
      `\u2705 \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u306E\u307E\u3068\u3081\u30CE\u30FC\u30C8\u4F5C\u6210\u5B8C\u4E86
${done.length} / ${total} \u30C1\u30E3\u30F3\u30CD\u30EB${failed.length > 0 ? `\uFF08\u5931\u6557 ${failed.length}\uFF09` : ""}
${srcChars.toLocaleString()} \u2192 ${outChars.toLocaleString()} \u6587\u5B57\uFF08\u5727\u7E2E\u7387 ${ratio.toFixed(1)}%\uFF09
\u30C8\u30FC\u30AF\u30F3: \u5165\u529B ${inTok.toLocaleString()} / \u51FA\u529B ${outTok.toLocaleString()}
\u8CBB\u7528: \u7121\u6599\u67A0\u306E\u305F\u3081 0 \u5186
\u51FA\u5178\u306E\u88DC\u6B63: ${repaired} \u4EF6 \uFF0F \u4E0D\u660E\u306B\u3057\u305F: ${unresolved} \u4EF6
\u6240\u8981: ${(elapsedSec / 60).toFixed(1)} \u5206
` + (truncated > 0 ? `\u26A0\uFE0F \u51FA\u529B\u304C\u6253\u3061\u5207\u3089\u308C\u305F\u30C1\u30E3\u30F3\u30CD\u30EB: ${truncated} \u4EF6
` : "") + `\u8A73\u7D30\u306F\u30B3\u30F3\u30BD\u30FC\u30EB\uFF08Ctrl+Shift+I\uFF09`,
      0
    );
  }
  makeEscHandler(controller) {
    return (ev) => {
      if (ev.key === "Escape") {
        controller.abort();
        new import_obsidian.Notice("Vault RAG: \u4E2D\u65AD\u3057\u307E\u3059\uFF08\u9001\u4FE1\u6E08\u307F\u306E\u30EA\u30AF\u30A8\u30B9\u30C8\u306E\u5B8C\u4E86\u3092\u5F85\u3061\u307E\u3059\uFF09", 5e3);
      }
    };
  }
  /**
   * 1チャンネル分の検証（K1b / K3 / K4 / K5）。
   * K1a（数値の全数保全）は 2026-09-25 に検証項目から外した。
   * 圧縮率 5% と数値の全数保全は両立せず、まとめノートは「読み物」に用途を切り分けたため。
   * 数値を確認したいときは出典から元ノートを辿る。
   */
  async verifyOneChannel(group) {
    const adapter = this.app.vault.adapter;
    const outPath = this.summaryNotePath(group.displayName);
    if (!await adapter.exists(outPath)) return null;
    const summaryBody = splitFrontmatter(await adapter.read(outPath)).body;
    const notes = group.notes;
    const sourceChars = group.chars;
    const aggregates = checkAggregateLines(summaryBody);
    const malformed = aggregates.filter((a) => !a.hasRange || !a.hasCount);
    const bulletsWithoutCitation = findBulletsWithoutCitation(summaryBody);
    const knownTitles = new Set(notes.map((n) => n.title));
    const citations = extractCitations(summaryBody);
    const citationCounts = /* @__PURE__ */ new Map();
    for (const c of citations) citationCounts.set(c, (citationCounts.get(c) || 0) + 1);
    const unresolvedNames = [];
    let unknownLabels = 0;
    citationCounts.forEach((count, name) => {
      if (name === "\u540C\u4E0A") return;
      if (name === "\u4E0D\u660E") {
        unknownLabels += count;
        return;
      }
      if (!knownTitles.has(name)) unresolvedNames.push(name);
    });
    return {
      channel: group.displayName,
      notes: notes.length,
      sourceChars,
      summaryChars: summaryBody.length,
      ratio: sourceChars > 0 ? summaryBody.length / sourceChars * 100 : 0,
      aggregateLines: aggregates.length,
      malformedAggregates: malformed.length,
      malformedSamples: malformed.map((a) => a.line),
      bulletsWithoutCitation: bulletsWithoutCitation.length,
      bulletSamples: bulletsWithoutCitation.slice(0, 5),
      citations: citations.length,
      distinctCitations: citationCounts.size,
      unresolvedNames,
      unknownLabels
    };
  }
  async runVerifyChannelSummary() {
    const s = this.settings;
    const channel = s.summaryChannel.trim();
    try {
      const { group } = await this.findChannelGroup(channel);
      if (!group) {
        new import_obsidian.Notice(`Vault RAG: \u30C1\u30E3\u30F3\u30CD\u30EB\u300C${channel}\u300D\u306E\u5143\u30CE\u30FC\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093`, 1e4);
        return;
      }
      const r = await this.verifyOneChannel(group);
      if (!r) {
        new import_obsidian.Notice(`Vault RAG: \u307E\u3068\u3081\u30CE\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093
${this.summaryNotePath(group.displayName)}`, 1e4);
        return;
      }
      console.log("[Vault RAG] \u307E\u3068\u3081\u30CE\u30FC\u30C8\u691C\u8A3C", r);
      new import_obsidian.Notice(
        `\u{1F50D} \u307E\u3068\u3081\u30CE\u30FC\u30C8\u691C\u8A3C: ${r.channel}
K1b \u96C6\u7D04\u884C ${r.aggregateLines} \u4EF6 / \u5F62\u5F0F\u9055\u53CD ${r.malformedAggregates} \u4EF6
K3 \u51FA\u5178\u306A\u3057\u306E\u7B87\u6761\u66F8\u304D: ${r.bulletsWithoutCitation} \u4EF6
K4 \u5B9F\u5728\u3057\u306A\u3044\u51FA\u5178\u540D: ${r.unresolvedNames.length} \u4EF6 / \u27E8\u51FA\u5178: \u4E0D\u660E\u27E9 ${r.unknownLabels} \u4EF6
K5 \u6587\u5B57\u6570: ${r.summaryChars.toLocaleString()} / ${r.sourceChars.toLocaleString()}\uFF08\u5727\u7E2E\u7387 ${r.ratio.toFixed(1)}%\uFF09
\u8A73\u7D30\u306F\u30B3\u30F3\u30BD\u30FC\u30EB\uFF08Ctrl+Shift+I\uFF09`,
        0
      );
    } catch (err) {
      console.error("[Vault RAG] \u691C\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
      new import_obsidian.Notice(`Vault RAG: \u691C\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 15e3);
    }
  }
  /** 全チャンネル分のまとめノートを検証する。 */
  async runVerifyAllChannelSummaries() {
    try {
      const { groups } = await this.collectChannelGroups();
      const results = [];
      const missing = [];
      for (const g of groups) {
        const r = await this.verifyOneChannel(g);
        if (r) results.push(r);
        else missing.push(g.displayName);
      }
      if (results.length === 0) {
        new import_obsidian.Notice("Vault RAG: \u691C\u8A3C\u3067\u304D\u308B\u307E\u3068\u3081\u30CE\u30FC\u30C8\u304C\u3042\u308A\u307E\u305B\u3093", 1e4);
        return;
      }
      let srcChars = 0, sumChars = 0, agg = 0, badAgg = 0, bullets = 0, unresolved = 0, unknown = 0;
      for (const r of results) {
        srcChars += r.sourceChars;
        sumChars += r.summaryChars;
        agg += r.aggregateLines;
        badAgg += r.malformedAggregates;
        bullets += r.bulletsWithoutCitation;
        unresolved += r.unresolvedNames.length;
        unknown += r.unknownLabels;
      }
      const ratio = srcChars > 0 ? sumChars / srcChars * 100 : 0;
      console.log("[Vault RAG] \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u691C\u8A3C", {
        channels: results.length,
        missing,
        srcChars,
        sumChars,
        ratio,
        aggregateLines: agg,
        malformed: badAgg,
        bulletsWithoutCitation: bullets,
        unresolvedNames: unresolved,
        unknownLabels: unknown
      });
      console.table(results.map((r) => ({
        channel: r.channel,
        notes: r.notes,
        src: r.sourceChars,
        out: r.summaryChars,
        ratio: `${r.ratio.toFixed(1)}%`,
        K1b: `${r.aggregateLines}/${r.malformedAggregates}`,
        K3: r.bulletsWithoutCitation,
        K4: `${r.unresolvedNames.length}/${r.unknownLabels}`
      })));
      const offenders = results.filter((r) => r.bulletsWithoutCitation > 0 || r.malformedAggregates > 0 || r.unresolvedNames.length > 0);
      if (offenders.length > 0) console.warn("[Vault RAG] \u8981\u78BA\u8A8D\u306E\u30C1\u30E3\u30F3\u30CD\u30EB", offenders);
      new import_obsidian.Notice(
        `\u{1F50D} \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u691C\u8A3C: ${results.length} \u672C` + (missing.length > 0 ? `\uFF08\u672A\u751F\u6210 ${missing.length}\uFF09` : "") + `
K1b \u96C6\u7D04\u884C ${agg} \u4EF6 / \u5F62\u5F0F\u9055\u53CD ${badAgg} \u4EF6
K3 \u51FA\u5178\u306A\u3057\u306E\u7B87\u6761\u66F8\u304D: ${bullets} \u4EF6
K4 \u5B9F\u5728\u3057\u306A\u3044\u51FA\u5178\u540D: ${unresolved} \u4EF6 / \u27E8\u51FA\u5178: \u4E0D\u660E\u27E9 ${unknown} \u4EF6
K5 ${sumChars.toLocaleString()} / ${srcChars.toLocaleString()} \u6587\u5B57\uFF08\u5727\u7E2E\u7387 ${ratio.toFixed(1)}%\uFF09
\u8A73\u7D30\u306F\u30B3\u30F3\u30BD\u30FC\u30EB\uFF08Ctrl+Shift+I\uFF09`,
        0
      );
    } catch (err) {
      console.error("[Vault RAG] \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u691C\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
      new import_obsidian.Notice(`Vault RAG: \u5168\u30C1\u30E3\u30F3\u30CD\u30EB\u691C\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 15e3);
    }
  }
  /**
   * 既存のまとめノートの出典表記だけを直す。API は呼ばない。
   * `⟨ノート名⟩` に `出典:` を足し、名前の表記ゆれを実在ファイル名に寄せる。
   */
  async runRepairSummaryCitations() {
    const adapter = this.app.vault.adapter;
    try {
      const { groups } = await this.collectChannelGroups();
      let changed = 0, labels = 0, repaired = 0, unresolved = 0, skipped = 0, promotedTotal = 0;
      const perChannel = [];
      for (const g of groups) {
        const outPath = this.summaryNotePath(g.displayName);
        if (!await adapter.exists(outPath)) {
          skipped++;
          continue;
        }
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
            channel: g.displayName,
            promoted: promotedResult.promoted,
            labelsAdded: fixedResult.labelsAdded,
            repaired: fixedRepaired,
            unresolved: fixedUnresolved
          });
        }
        const next = `---
${split.frontmatter}
---

${fixedResult.text}
`;
        if (next !== raw) {
          await adapter.write(outPath, next);
          changed++;
        }
      }
      console.log("[Vault RAG] \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u6574\u5F62", { changed, boldBulletsPromoted: promotedTotal, labelsAdded: labels, repaired, unresolved, skipped });
      if (perChannel.length > 0) console.table(perChannel);
      new import_obsidian.Notice(
        `\u{1F527} \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u6574\u5F62\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F
\u66F8\u304D\u63DB\u3048\u305F\u30CE\u30FC\u30C8: ${changed} \u672C${skipped > 0 ? `\uFF08\u672A\u751F\u6210 ${skipped}\uFF09` : ""}
\u898B\u51FA\u3057\u306B\u683C\u4E0A\u3052\u3057\u305F\u7B87\u6761\u66F8\u304D: ${promotedTotal}
\u300C\u51FA\u5178:\u300D\u3092\u88DC\u3063\u305F\u7B87\u6240: ${labels}
\u30CE\u30FC\u30C8\u540D\u3092\u76F4\u3057\u305F\u7B87\u6240: ${repaired}
\u76F4\u305B\u305A\u4E0D\u660E\u306E\u307E\u307E\u306E\u7B87\u6240: ${unresolved}
API \u547C\u3073\u51FA\u3057\u306A\u3057 / \u8CBB\u7528 0 \u5186`,
        0
      );
    } catch (err) {
      console.error("[Vault RAG] \u51FA\u5178\u306E\u518D\u88DC\u6B63\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
      new import_obsidian.Notice(`Vault RAG: \u51FA\u5178\u306E\u518D\u88DC\u6B63\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 15e3);
    }
  }
  /* ---------- ハイブリッド検索 ---------- */
  /** 質問文を埋め込む。ノート側と違い taskType は RETRIEVAL_QUERY（落とし穴#22）。 */
  async embedQuery(query, controller) {
    const s = this.settings;
    const result = await this.embedBatchWithRetry([query], "RETRIEVAL_QUERY", controller, (waitMs, attempt, message) => {
      console.warn(`[Vault RAG] \u8CEA\u554F\u306E\u57CB\u3081\u8FBC\u307F\u3092\u518D\u8A66\u884C\uFF08${attempt + 1}\uFF09: ${Math.round(waitMs / 1e3)}\u79D2\u5F85\u6A5F / ${message}`);
    });
    const v = result.vectors[0];
    if (!v || v.length !== s.embeddingDimensions) {
      throw new Error(`\u8CEA\u554F\u30D9\u30AF\u30C8\u30EB\u306E\u6B21\u5143\u304C\u60F3\u5B9A\u3068\u9055\u3044\u307E\u3059: ${v ? v.length : 0}\uFF08\u671F\u5F85 ${s.embeddingDimensions}\uFF09`);
    }
    return new Float32Array(normalizeVector(v));
  }
  /**
   * ハイブリッド検索。ベクトル検索とキーワード検索を独立に行い、RRF で統合する。
   * 類似度の絶対値でのしきい値は入れない（落とし穴#24）。
   */
  async hybridSearch(query, controller) {
    const s = this.settings;
    if (!this.index || !this.vectors) {
      throw new Error(this.indexBlockedReason || "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u3066\u3044\u307E\u305B\u3093");
    }
    const chunks = this.index.chunks;
    const dim = this.index.meta.dimensions;
    const t0 = Date.now();
    const queryVec = await this.embedQuery(query, controller);
    const t1 = Date.now();
    const cosines = new Float64Array(chunks.length);
    for (let i = 0; i < chunks.length; i++) cosines[i] = dotProduct(this.vectors, i * dim, queryVec, dim);
    const byVector = Array.from({ length: chunks.length }, (_v, i) => i).sort((a, b) => cosines[b] - cosines[a]).slice(0, s.vectorTopK);
    const vectorRank = /* @__PURE__ */ new Map();
    byVector.forEach((idx, i) => vectorRank.set(idx, i + 1));
    const t2 = Date.now();
    const terms = s.keywordSearchEnabled ? tokenizeQuery(query) : [];
    const matchedTerms = /* @__PURE__ */ new Map();
    const scoreSum = /* @__PURE__ */ new Map();
    for (const term of terms) {
      const scorer = (0, import_obsidian.prepareSimpleSearch)(term);
      for (let i = 0; i < chunks.length; i++) {
        const r = scorer(chunks[i].text);
        if (!r) continue;
        matchedTerms.set(i, (matchedTerms.get(i) || 0) + 1);
        scoreSum.set(i, (scoreSum.get(i) || 0) + r.score);
      }
    }
    const keywordScores = Array.from(matchedTerms.keys()).map((index) => ({ index, terms: matchedTerms.get(index), score: scoreSum.get(index) })).sort((a, b) => b.terms - a.terms || b.score - a.score);
    const byKeyword = keywordScores.slice(0, s.keywordTopK);
    const keywordRank = /* @__PURE__ */ new Map();
    const keywordScore = /* @__PURE__ */ new Map();
    const keywordTermCount = /* @__PURE__ */ new Map();
    byKeyword.forEach((e, i) => {
      keywordRank.set(e.index, i + 1);
      keywordScore.set(e.index, e.score);
      keywordTermCount.set(e.index, e.terms);
    });
    const t3 = Date.now();
    const union = /* @__PURE__ */ new Set([...byVector, ...byKeyword.map((e) => e.index)]);
    const build = (index) => {
      const vr = vectorRank.has(index) ? vectorRank.get(index) : null;
      const kr = keywordRank.has(index) ? keywordRank.get(index) : null;
      return {
        chunkIndex: index,
        cosine: cosines[index],
        vectorRank: vr,
        keywordScore: keywordScore.has(index) ? keywordScore.get(index) : null,
        keywordTerms: keywordTermCount.has(index) ? keywordTermCount.get(index) : null,
        keywordRank: kr,
        rrf: rrfScore([vr, kr], s.rrfK)
      };
    };
    const fused = Array.from(union).map(build).sort((a, b) => b.rrf - a.rrf || b.cosine - a.cosine);
    const vectorOnly = byVector.map(build);
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
      timing: { embedMs: t1 - t0, vectorMs: t2 - t1, keywordMs: t3 - t2, rrfMs: t4 - t3, totalMs: t4 - t0 }
    };
  }
  /** 検索結果を 1 行にする（コンソール出力用）。 */
  formatHit(rank, c) {
    const chunk = this.index.chunks[c.chunkIndex];
    const head = chunk.text.replace(/\s+/g, " ").slice(0, 100);
    return `${String(rank).padStart(2)}. rrf=${c.rrf.toFixed(5)} vec=${c.vectorRank === null ? "-" : String(c.vectorRank).padStart(2)} kw=${c.keywordRank === null ? "-" : String(c.keywordRank).padStart(2)}${c.keywordTerms === null ? "" : `(${c.keywordTerms}\u8A9E)`} cos=${c.cosine.toFixed(4)}
    ${chunk.title.slice(0, 48)}
    ${chunk.sourceType} / ${chunk.kind} / headings=[${chunk.headings.join(" / ").slice(0, 70)}]
    ${head}`;
  }
  async runSearchTest() {
    if (!this.index || !this.vectors) {
      new import_obsidian.Notice(`Vault RAG: \u691C\u7D22\u3067\u304D\u307E\u305B\u3093
${this.indexBlockedReason || "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u3066\u3044\u307E\u305B\u3093"}`, 15e3);
      return;
    }
    const s = this.settings;
    const apiKey = getEmbeddingApiKey(s);
    if (!apiKey) {
      new import_obsidian.Notice(`Vault RAG: ${s.embeddingProvider === "openai" ? "OpenAI" : "Gemini"} \u306E API \u30AD\u30FC\u304C\u672A\u8A2D\u5B9A\u3067\u3059`, 15e3);
      return;
    }
    new SearchTestModal(this.app, async (query) => {
      const controller = new RunController();
      this.activeRun = controller;
      const progress = new ProgressNotice();
      progress.show(`Vault RAG: \u691C\u7D22\u4E2D\u2026\u300C${query}\u300D`);
      try {
        const r = await this.hybridSearch(query, controller);
        progress.hide();
        console.log(`
========== \u691C\u7D22: ${r.query}`);
        console.log(`\u8A9E\u5206\u5272: [${r.terms.join(" | ")}]\uFF08${r.terms.length} \u8A9E\uFF09`);
        console.log(`\u30AD\u30FC\u30EF\u30FC\u30C9\u691C\u7D22\u3067\u30B9\u30B3\u30A2\u304C\u4ED8\u3044\u305F\u30C1\u30E3\u30F3\u30AF: ${r.keywordHits} / ${this.index.chunks.length}`);
        console.log(`\u6642\u9593: \u57CB\u3081\u8FBC\u307F ${r.timing.embedMs}ms / \u30D9\u30AF\u30C8\u30EB ${r.timing.vectorMs}ms / \u30AD\u30FC\u30EF\u30FC\u30C9 ${r.timing.keywordMs}ms / RRF ${r.timing.rrfMs}ms / \u5408\u8A08 ${r.timing.totalMs}ms`);
        console.log(`
--- \u30D9\u30AF\u30C8\u30EB\u691C\u7D22\u306E\u307F \u4E0A\u4F4D${s.finalTopK} ---`);
        r.vectorOnly.slice(0, s.finalTopK).forEach((c, i) => console.log(this.formatHit(i + 1, c)));
        console.log(`
--- RRF\u7D71\u5408\u5F8C \u4E0A\u4F4D${s.finalTopK}\uFF08maxChunksPerNote \u306A\u3057\uFF09---`);
        r.fused.slice(0, s.finalTopK).forEach((c, i) => console.log(this.formatHit(i + 1, c)));
        console.log(`
--- RRF\u7D71\u5408\u5F8C \u4E0A\u4F4D${s.finalTopK}\uFF08maxChunksPerNote=${s.maxChunksPerNote} \u9069\u7528\uFF09---`);
        r.capped.forEach((c, i) => console.log(this.formatHit(i + 1, c)));
        const chunks = this.index.chunks;
        const summaries = r.capped.filter((c) => chunks[c.chunkIndex].sourceType === "channel_summary").length;
        new import_obsidian.Notice(
          `\u{1F50D} \u691C\u7D22\u5B8C\u4E86: ${query}
\u30AD\u30FC\u30EF\u30FC\u30C9\u30D2\u30C3\u30C8 ${r.keywordHits} \u4EF6 / \u307E\u3068\u3081\u30CE\u30FC\u30C8 ${summaries} \u4EF6
1\u4F4D cos=${r.capped.length > 0 ? r.capped[0].cosine.toFixed(4) : "-"}
\u6642\u9593 ${r.timing.totalMs}ms\uFF08\u57CB\u3081\u8FBC\u307F ${r.timing.embedMs}ms\uFF09
\u8A73\u7D30\u306F\u30B3\u30F3\u30BD\u30FC\u30EB\uFF08Ctrl+Shift+I\uFF09`,
          0
        );
      } catch (err) {
        progress.hide();
        if (isAbortedError(err)) new import_obsidian.Notice("Vault RAG: \u4E2D\u65AD\u3057\u307E\u3057\u305F", 5e3);
        else {
          console.error("[Vault RAG] \u691C\u7D22\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
          new import_obsidian.Notice(`Vault RAG: \u691C\u7D22\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 15e3);
        }
      } finally {
        this.activeRun = null;
      }
    }).open();
  }
  /* ---------- 差分更新 ---------- */
  /** そのパスが RAG の対象フォルダ（元ノート or まとめノート）の中か。 */
  isWatchedPath(path) {
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
  registerVaultWatchers() {
    const enqueue = (path, oldPath) => {
      if (oldPath && this.isWatchedPath(oldPath)) this.pendingChanges.add(oldPath);
      if (this.isWatchedPath(path)) this.pendingChanges.add(path);
      if (this.pendingChanges.size === 0) return;
      this.scheduleIncrementalUpdate();
    };
    this.registerEvent(this.app.vault.on("modify", (file) => {
      if (file instanceof import_obsidian.TFile) enqueue(file.path);
    }));
    this.registerEvent(this.app.vault.on("create", (file) => {
      if (file instanceof import_obsidian.TFile) enqueue(file.path);
    }));
    this.registerEvent(this.app.vault.on("delete", (file) => {
      if (file instanceof import_obsidian.TFile) enqueue(file.path);
    }));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (file instanceof import_obsidian.TFile) enqueue(file.path, oldPath);
    }));
  }
  scheduleIncrementalUpdate() {
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
  async runIncrementalUpdate() {
    if (this.activeRun) {
      this.scheduleIncrementalUpdate();
      return;
    }
    if (!this.index || !this.vectors) return;
    if (this.pendingChanges.size === 0) return;
    const s = this.settings;
    const apiKey = getEmbeddingApiKey(s);
    if (!apiKey) {
      console.warn("[Vault RAG] \u5DEE\u5206\u66F4\u65B0\u3092\u98DB\u3070\u3057\u307E\u3057\u305F: API \u30AD\u30FC\u304C\u672A\u8A2D\u5B9A");
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
      progress.show(`Vault RAG: \u5DEE\u5206\u66F4\u65B0\u4E2D\u2026\uFF08${paths.length} \u672C\uFF09`);
      const dim = this.index.meta.dimensions;
      const oldChunks = this.index.chunks;
      const oldVectors = this.vectors;
      const changed = new Set(paths);
      const keptChunks = [];
      const keptVectorSources = [];
      for (let i = 0; i < oldChunks.length; i++) {
        if (changed.has(oldChunks[i].path)) continue;
        keptChunks.push(oldChunks[i]);
        keptVectorSources.push(i);
      }
      const removed = oldChunks.length - keptChunks.length;
      const newChunks = [];
      let notesUpdated = 0;
      const readErrors = [];
      for (const path of paths) {
        controller.throwIfAborted();
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof import_obsidian.TFile)) continue;
        if (!this.isWatchedPath(path)) continue;
        let raw;
        try {
          raw = await this.app.vault.cachedRead(file);
        } catch (err) {
          readErrors.push(path);
          console.error("[Vault RAG] \u8AAD\u307F\u53D6\u308A\u5931\u6557:", path, err);
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
      const newVectors = new Float32Array(newChunks.length * dim);
      let embeddedTokens = 0;
      let embeddedChars = 0;
      const batchSize = Math.max(1, s.embedBatchSize);
      for (let start = 0; start < newChunks.length; start += batchSize) {
        controller.throwIfAborted();
        if (start > 0 && s.embedIntervalMs > 0) await controller.sleep(s.embedIntervalMs);
        const slice = newChunks.slice(start, start + batchSize);
        progress.show(`Vault RAG: \u5DEE\u5206\u306E\u57CB\u3081\u8FBC\u307F\u4E2D ${start} / ${newChunks.length} \u30C1\u30E3\u30F3\u30AF`);
        const result = await this.embedBatchWithRetry(
          slice.map((c) => c.text),
          "RETRIEVAL_DOCUMENT",
          controller,
          (waitMs, attempt, message) => {
            progress.show(`Vault RAG: ${Math.round(waitMs / 1e3)}\u79D2\u5F85\u3063\u3066\u518D\u8A66\u884C\uFF08${attempt + 1}\uFF09
${message}`);
          }
        );
        for (let i = 0; i < result.vectors.length; i++) {
          const v = result.vectors[i];
          if (v.length !== dim) throw new Error(`\u6B21\u5143\u6570\u304C\u60F3\u5B9A\u3068\u9055\u3044\u307E\u3059: ${v.length}\uFF08\u671F\u5F85 ${dim}\uFF09`);
          newVectors.set(normalizeVector(v), (start + i) * dim);
        }
        embeddedTokens += result.tokens;
        for (const c of slice) embeddedChars += c.text.length;
      }
      const merged = keptChunks.concat(newChunks);
      const mergedVectors = new Float32Array(merged.length * dim);
      for (let i = 0; i < keptVectorSources.length; i++) {
        mergedVectors.set(oldVectors.subarray(keptVectorSources[i] * dim, (keptVectorSources[i] + 1) * dim), i * dim);
      }
      mergedVectors.set(newVectors, keptChunks.length * dim);
      const meta = currentIndexMeta(s, merged.length);
      meta.builtAt = this.index.meta.builtAt;
      const integrity = validateIndexIntegrity(meta, merged.length, mergedVectors.byteLength);
      if (integrity) throw new Error(`\u5DEE\u5206\u66F4\u65B0\u5F8C\u306E\u6574\u5408\u6027\u691C\u8A3C\u306B\u5931\u6557: ${integrity}`);
      await this.saveIndexToDisk(merged, mergedVectors, meta);
      this.index = { meta, chunks: merged };
      this.vectors = mergedVectors;
      const costUsd = calcEmbeddingCostUsd(s.embeddingModel, embeddedTokens);
      s.totalEmbeddingTokens += embeddedTokens;
      s.totalCostUsd += costUsd;
      await this.saveSettings();
      progress.hide();
      const elapsedSec = (Date.now() - started) / 1e3;
      const usage = embeddedTokens > 0 ? `\u57CB\u3081\u8FBC\u307F\u30C8\u30FC\u30AF\u30F3: ${embeddedTokens.toLocaleString()} \uFF0F ${formatUsdJpy(costUsd)}` : `\u57CB\u3081\u8FBC\u307F\u6587\u5B57\u6570: ${embeddedChars.toLocaleString()}\uFF08usage \u306A\u3057\uFF09\uFF0F \u7121\u6599\u67A0`;
      new import_obsidian.Notice(
        `\u{1F504} \u5DEE\u5206\u66F4\u65B0\u5B8C\u4E86
\u5BFE\u8C61 ${paths.length} \u672C\uFF08\u66F4\u65B0\u3067\u304D\u305F\u30CE\u30FC\u30C8 ${notesUpdated} \u672C\uFF09
\u30C1\u30E3\u30F3\u30AF: -${removed} / +${newChunks.length} \u2192 \u5408\u8A08 ${merged.length}
${usage}
\u6240\u8981: ${elapsedSec.toFixed(1)} \u79D2 \uFF0F \u6574\u5408\u6027\u691C\u8A3C: OK` + (readErrors.length > 0 ? `
\u8AAD\u307F\u53D6\u308A\u5931\u6557: ${readErrors.length} \u672C` : ""),
        1e4
      );
      console.log("[Vault RAG] \u5DEE\u5206\u66F4\u65B0\u5B8C\u4E86", {
        paths,
        notesUpdated,
        removed,
        added: newChunks.length,
        total: merged.length,
        embeddedTokens,
        embeddedChars,
        costUsd,
        elapsedSec,
        readErrors
      });
    } catch (err) {
      progress.hide();
      for (const p of paths) this.pendingChanges.add(p);
      if (isAbortedError(err)) {
        new import_obsidian.Notice("Vault RAG: \u5DEE\u5206\u66F4\u65B0\u3092\u4E2D\u65AD\u3057\u307E\u3057\u305F\u3002\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u306F\u5909\u66F4\u3057\u3066\u3044\u307E\u305B\u3093", 8e3);
      } else {
        console.error("[Vault RAG] \u5DEE\u5206\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
        new import_obsidian.Notice(`Vault RAG: \u5DEE\u5206\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 15e3);
      }
    } finally {
      this.activeRun = null;
    }
  }
  /* ---------- まとめノートの更新（2026-10-03） ---------- */
  summaryStatePath() {
    return this.indexPath(SUMMARY_STATE_FILE);
  }
  async loadSummaryState() {
    const adapter = this.app.vault.adapter;
    const p = this.summaryStatePath();
    try {
      if (!await adapter.exists(p)) return null;
      const parsed = JSON.parse(await adapter.read(p));
      if (!parsed || typeof parsed !== "object" || !parsed.channels) return null;
      return parsed;
    } catch (err) {
      console.error("[Vault RAG] summary-state.json \u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557", err);
      return null;
    }
  }
  /** チャンネル1件ぶんだけを保存する。中断しても完了済みの記録が残るようにするため。 */
  async saveSummaryChannelState(key, state) {
    const current = await this.loadSummaryState() || {
      version: SUMMARY_STATE_VERSION,
      updatedAt: "",
      channels: {}
    };
    current.version = SUMMARY_STATE_VERSION;
    current.channels[key] = state;
    current.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.app.vault.adapter.write(this.summaryStatePath(), JSON.stringify(current, null, 2));
  }
  async saveSummaryStateAll(state) {
    state.version = SUMMARY_STATE_VERSION;
    state.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    await this.app.vault.adapter.write(this.summaryStatePath(), JSON.stringify(state, null, 2));
  }
  /** いまの各チャンネルの状態を測る。`cutoffByMtime` を渡すと、その時刻以前の元ノートだけを一覧に入れる。 */
  async measureChannels(groups, cutoffByMtime) {
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
        if (f instanceof import_obsidian.TFile) summaryMtime = f.stat.mtime;
      }
      const sources = [];
      let skippedNewer = 0;
      for (const n of g.notes) {
        const file = this.app.vault.getAbstractFileByPath(n.path);
        const mtime = file instanceof import_obsidian.TFile ? file.stat.mtime : 0;
        if (cutoffByMtime && summaryExists && summaryMtime > 0 && mtime > summaryMtime) {
          skippedNewer++;
          totalSkippedNewer++;
          continue;
        }
        let raw = "";
        try {
          raw = file instanceof import_obsidian.TFile ? await this.app.vault.cachedRead(file) : "";
        } catch (err) {
          console.error("[Vault RAG] \u8AAD\u307F\u53D6\u308A\u5931\u6557:", n.path, err);
          continue;
        }
        sources.push({ path: n.path, size: raw.length, hash: await sha256Hex(raw) });
      }
      measured.push({
        key: normalizeChannelKey(g.displayName),
        displayName: g.displayName,
        noteCount: g.notes.length,
        chars: g.chars,
        sources,
        summaryExists,
        summaryHash,
        summarySize,
        skippedNewer,
        group: g
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
  async backupSummaryNote(outPath, suffix = "", content) {
    const adapter = this.app.vault.adapter;
    if (content === void 0 && !await adapter.exists(outPath)) return null;
    const dir = this.indexPath(`${SUMMARY_BACKUP_DIR}/${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}`);
    if (!await adapter.exists(dir)) await adapter.mkdir(dir);
    const base = outPath.slice(outPath.lastIndexOf("/") + 1).replace(/\.md$/, "") + suffix;
    let dest = (0, import_obsidian.normalizePath)(`${dir}/${base}.md`);
    let n = 2;
    while (await adapter.exists(dest)) {
      dest = (0, import_obsidian.normalizePath)(`${dir}/${base}_${n}.md`);
      n++;
      if (n > 999) break;
    }
    await adapter.write(dest, content !== void 0 ? content : await adapter.read(outPath));
    return dest;
  }
  /**
   * まとめノートを書く。`adapter.write()` ではなく Vault API を使う。
   * `vault.modify()` / `vault.create()` なら `modify` / `create` イベントが確実に出て、
   * 既存の差分更新（`vault.on`）が RAG インデックスに反映してくれる。
   */
  async writeSummaryNote(outPath, content) {
    const existing = this.app.vault.getAbstractFileByPath(outPath);
    if (existing instanceof import_obsidian.TFile) {
      await this.app.vault.modify(existing, content);
      return;
    }
    const folder = (0, import_obsidian.normalizePath)(this.settings.summaryFolder.replace(/\/+$/, ""));
    if (!await this.app.vault.adapter.exists(folder)) await this.app.vault.createFolder(folder);
    await this.app.vault.create(outPath, content);
  }
  async runUpdateSummaries() {
    if (this.activeRun) {
      new import_obsidian.Notice("Vault RAG: \u65E2\u306B\u5B9F\u884C\u4E2D\u3067\u3059", 5e3);
      return;
    }
    const s = this.settings;
    if (!s.geminiApiKey) {
      new import_obsidian.Notice("Vault RAG: Gemini \u306E API \u30AD\u30FC\u304C\u672A\u8A2D\u5B9A\u3067\u3059\n\u8A2D\u5B9A\u3067\u30AD\u30FC\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044", 15e3);
      return;
    }
    const progress = new ProgressNotice();
    try {
      progress.show("Vault RAG: \u5143\u30CE\u30FC\u30C8\u3092\u8AAD\u307F\u8FBC\u307F\u4E2D\u2026");
      const { groups } = await this.collectChannelGroups();
      if (groups.length === 0) {
        progress.hide();
        new import_obsidian.Notice("Vault RAG: \u30C1\u30E3\u30F3\u30CD\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093", 1e4);
        return;
      }
      const saved = await this.loadSummaryState();
      const isFirstRun = saved === null;
      progress.show(`Vault RAG: \u5909\u66F4\u3092\u78BA\u8A8D\u4E2D\u2026\uFF08${groups.length} \u30C1\u30E3\u30F3\u30CD\u30EB\uFF09`);
      const { measured, totalSkippedNewer } = await this.measureChannels(groups, isFirstRun);
      progress.hide();
      if (isFirstRun) {
        const state = { version: SUMMARY_STATE_VERSION, updatedAt: "", channels: {} };
        for (const c of measured) {
          state.channels[c.key] = {
            summaryPath: this.summaryNotePath(c.displayName),
            summarySize: c.summarySize,
            summaryHash: c.summaryHash,
            generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            sources: c.sources
          };
        }
        await this.saveSummaryStateAll(state);
        console.log("[Vault RAG] \u521D\u56DE\u306E\u4E00\u89A7\u3092\u4F5C\u6210", {
          channels: measured.length,
          skippedNewer: totalSkippedNewer,
          perChannel: measured.filter((c) => c.skippedNewer > 0).map((c) => ({ ch: c.displayName, newer: c.skippedNewer }))
        });
        new import_obsidian.Notice(
          `\u{1F4CB} \u521D\u56DE\u306E\u4E00\u89A7\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F
${measured.length} \u30C1\u30E3\u30F3\u30CD\u30EB / \u5143\u30CE\u30FC\u30C8 ${measured.reduce((a, c) => a + c.sources.length, 0)} \u672C\u3092\u8A18\u9332
\u307E\u3068\u3081\u30CE\u30FC\u30C8\u751F\u6210\u5F8C\u306B\u66F4\u65B0\u3055\u308C\u305F\u5143\u30CE\u30FC\u30C8 ${totalSkippedNewer} \u672C\u306F\u3001\u6B21\u56DE\u306E\u5B9F\u884C\u3067\u78BA\u8A8D\u3067\u304D\u307E\u3059`,
          0
        );
        return;
      }
      const plan = diffSummaryState(measured, saved, s.summaryTokenBudgetPerMin);
      const grouped = groupSummaryUpdateTargets(plan);
      console.log("[Vault RAG] \u30B0\u30EB\u30FC\u30D7\u5206\u3051", {
        needsRebuild: grouped.needsRebuild.map((d) => d.displayName),
        manuallyEdited: grouped.manuallyEdited.map((d) => d.displayName),
        unchanged: grouped.unchanged.length,
        sourcesGone: grouped.sourcesGone.map((d) => d.displayName),
        selectable: grouped.selectableCount
      });
      new SummaryUpdateModal(this.app, plan, s.summaryTokenBudgetPerMin, async (selectedKeys) => {
        await this.executeSummaryUpdate(selectedKeys, measured, plan);
      }).open();
    } catch (err) {
      progress.hide();
      console.error("[Vault RAG] \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u66F4\u65B0\u6E96\u5099\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
      new import_obsidian.Notice(`Vault RAG: \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u66F4\u65B0\u6E96\u5099\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 15e3);
    }
  }
  async executeSummaryUpdate(selectedKeys, measured, plan) {
    if (this.activeRun) {
      new import_obsidian.Notice("Vault RAG: \u65E2\u306B\u5B9F\u884C\u4E2D\u3067\u3059", 5e3);
      return;
    }
    const s = this.settings;
    const chosen = measured.filter((c) => selectedKeys.indexOf(c.key) >= 0);
    if (chosen.length === 0) {
      new import_obsidian.Notice("Vault RAG: \u5BFE\u8C61\u304C\u9078\u3070\u308C\u3066\u3044\u307E\u305B\u3093", 5e3);
      return;
    }
    const controller = new RunController();
    this.activeRun = controller;
    const progress = new ProgressNotice();
    const onEsc = this.makeEscHandler(controller);
    document.addEventListener("keydown", onEsc);
    const started = Date.now();
    const done = [];
    const failed = [];
    const verified = [];
    const backups = [];
    const logs = [];
    try {
      const limiter = new TokenRateLimiter(s.summaryTokenBudgetPerMin);
      for (let i = 0; i < chosen.length; i++) {
        controller.throwIfAborted();
        if (i > 0 && s.summaryIntervalMs > 0) await controller.sleep(s.summaryIntervalMs);
        const c = chosen[i];
        progress.show(`Vault RAG: \u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u66F4\u65B0 ${i + 1} / ${chosen.length}\uFF08${c.displayName}\uFF09Esc\u3067\u4E2D\u65AD`);
        const outPath = this.summaryNotePath(c.displayName);
        const prevChars = c.summaryExists ? c.summarySize : 0;
        const log = { channel: c.displayName, prevChars, attempts: [], accepted: false, candidatePath: "" };
        logs.push(log);
        try {
          let accepted = null;
          let longest = { content: "", chars: -1 };
          for (let n = 1; n <= SUMMARY_MAX_ATTEMPTS; n++) {
            controller.throwIfAborted();
            const label = SUMMARY_MAX_ATTEMPTS > 1 ? `${n}\u56DE\u76EE` : "";
            progress.show(
              `Vault RAG: \u307E\u3068\u3081\u30CE\u30FC\u30C8\u3092\u66F4\u65B0 ${i + 1} / ${chosen.length} \u2014 ${c.displayName} ${label}\uFF08Esc\u3067\u4E2D\u65AD\uFF09`
            );
            const got = { content: "", truncated: false, tooShort: false, ok: false };
            const built = await this.buildOneChannelSummary(
              c.group,
              controller,
              progress,
              limiter,
              async (path, content, info) => {
                got.content = content;
                got.truncated = info.truncated;
                got.tooShort = judgeSummaryLength(prevChars, content.length).skipped;
                if (info.truncated || got.tooShort) return;
                const backup = await this.backupSummaryNote(path);
                if (backup) backups.push(backup);
                await this.writeSummaryNote(path, content);
                got.ok = true;
              },
              label
            );
            log.attempts.push({
              attempt: n,
              chars: got.content.length,
              inputTokens: built.inputTokens,
              outputTokens: built.outputTokens,
              truncated: got.truncated,
              tooShort: got.tooShort,
              accepted: got.ok
            });
            console.log(
              `[Vault RAG] \u8A66\u884C ${n}/${SUMMARY_MAX_ATTEMPTS}: ${c.displayName} ${got.content.length} \u6587\u5B57\uFF08\u524D ${prevChars}\uFF09 / \u5165\u529B ${built.inputTokens} \u51FA\u529B ${built.outputTokens} / ${got.ok ? "\u5408\u683C" : got.truncated ? "\u6253\u3061\u5207\u308A" : "\u77ED\u3059\u304E\u308B"}`
            );
            if (got.ok) {
              accepted = built;
              break;
            }
            if (got.content.length > longest.chars) longest = { content: got.content, chars: got.content.length };
          }
          if (!accepted) {
            log.candidatePath = await this.backupSummaryNote(outPath, "_\u5019\u88DC", longest.content) || "";
            console.warn(`[Vault RAG] ${SUMMARY_MAX_ATTEMPTS} \u56DE\u3068\u3082\u4E0D\u5408\u683C: ${describeAttempts(log)} \uFF0F \u5019\u88DC: ${log.candidatePath}`);
            continue;
          }
          log.accepted = true;
          done.push(accepted);
          const v = await this.verifyOneChannel(c.group);
          if (v) verified.push(v);
          const raw = await this.app.vault.adapter.read(outPath);
          await this.saveSummaryChannelState(c.key, {
            summaryPath: outPath,
            summarySize: raw.length,
            summaryHash: await sha256Hex(raw),
            generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
            sources: c.sources
          });
        } catch (err) {
          if (isAbortedError(err)) throw err;
          const message = err instanceof Error ? err.message : String(err);
          failed.push({ channel: c.displayName, error: message });
          console.error(`[Vault RAG] ${c.displayName} \u306E\u66F4\u65B0\u306B\u5931\u6557\uFF08\u4E0A\u66F8\u304D\u305B\u305A\u6B21\u3078\uFF09`, message);
          if (isNonRetryableApiError(message)) throw new Error(`\u56DE\u5FA9\u3057\u306A\u3044\u30A8\u30E9\u30FC\u306E\u305F\u3081\u4E2D\u65AD\u3057\u307E\u3057\u305F: ${message}`);
        }
      }
      progress.hide();
      await this.reportSummaryUpdate(done, failed, verified, backups, logs, chosen.length, started, plan);
    } catch (err) {
      progress.hide();
      const elapsedSec = (Date.now() - started) / 1e3;
      const line = `
\u5B8C\u4E86: ${done.length} / ${chosen.length} \u30C1\u30E3\u30F3\u30CD\u30EB\uFF08\u8A18\u9332\u306F\u4FDD\u5B58\u6E08\u307F\uFF09\uFF0F \u7D4C\u904E ${elapsedSec.toFixed(1)} \u79D2`;
      if (isAbortedError(err)) {
        new import_obsidian.Notice(`Vault RAG: \u4E2D\u65AD\u3057\u307E\u3057\u305F${line}`, 0);
      } else {
        console.error("[Vault RAG] \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
        new import_obsidian.Notice(`Vault RAG: \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}${line}`, 0);
      }
      console.log("[Vault RAG] \u4E2D\u65AD/\u5931\u6557\u6642\u306E\u5185\u8A33", { done: done.map((d) => d.channel), failed, backups, logs });
    } finally {
      document.removeEventListener("keydown", onEsc);
      this.activeRun = null;
      await this.addSummaryUsage(logs);
    }
  }
  /**
   * 全試行の使用量を設定の累計に足す。上書きしなかった試行も約 20 万トークン使っている。
   * 中断・失敗のときも呼ぶので、1 回の実行で 1 回だけ呼ぶこと。
   */
  async addSummaryUsage(logs) {
    let inTok = 0, outTok = 0;
    for (const l of logs) for (const a of l.attempts) {
      inTok += a.inputTokens;
      outTok += a.outputTokens;
    }
    if (inTok === 0 && outTok === 0) return;
    const s = this.settings;
    s.totalInputTokens += inTok;
    s.totalOutputTokens += outTok;
    s.totalCostUsd += chargeableChatCostUsd(s, s.summaryModel, inTok, outTok);
    await this.saveSettings();
  }
  async reportSummaryUpdate(done, failed, verified, backups, logs, total, started, plan) {
    let srcChars = 0, outChars = 0;
    for (const d of done) {
      srcChars += d.sourceChars;
      outChars += d.outChars;
    }
    let inTok = 0, outTok = 0, attemptCount = 0;
    for (const l of logs) for (const a of l.attempts) {
      inTok += a.inputTokens;
      outTok += a.outputTokens;
      attemptCount++;
    }
    const costUsd = calcChatCostUsd(this.settings.summaryModel, inTok, outTok);
    let bullets = 0, unresolved = 0, unknown = 0, malformed = 0;
    for (const v of verified) {
      bullets += v.bulletsWithoutCitation;
      unresolved += v.unresolvedNames.length;
      unknown += v.unknownLabels;
      malformed += v.malformedAggregates;
    }
    const elapsedSec = (Date.now() - started) / 1e3;
    const notAccepted = logs.filter((l) => !l.accepted && l.attempts.length > 0);
    const retried = logs.filter((l) => l.attempts.length > 1);
    const planGroups = groupSummaryUpdateTargets(plan);
    console.log("[Vault RAG] \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u66F4\u65B0\u7D50\u679C", {
      total,
      done: done.length,
      failed: failed.length,
      notAccepted: notAccepted.length,
      attempts: attemptCount,
      srcChars,
      outChars,
      inTok,
      outTok,
      costUsd,
      elapsedSec,
      backups
    });
    if (logs.length > 0) {
      console.table(logs.map((l) => ({
        channel: l.channel,
        prev: l.prevChars,
        attempts: l.attempts.length,
        sizes: l.attempts.map((a) => a.chars).join(" / "),
        accepted: l.accepted,
        candidate: l.candidatePath
      })));
    }
    if (notAccepted.length > 0) console.warn("[Vault RAG] \u4E0A\u66F8\u304D\u3057\u306A\u304B\u3063\u305F\u30C1\u30E3\u30F3\u30CD\u30EB", notAccepted);
    if (done.length > 0) console.table(done.map((d) => ({ channel: d.channel, notes: d.notes, src: d.sourceChars, out: d.outChars, ratio: `${d.ratio.toFixed(1)}%` })));
    if (verified.length > 0) console.table(verified.map((v) => ({ channel: v.channel, K1b: `${v.aggregateLines}/${v.malformedAggregates}`, K3: v.bulletsWithoutCitation, K4: `${v.unresolvedNames.length}/${v.unknownLabels}` })));
    if (failed.length > 0) console.error("[Vault RAG] \u66F4\u65B0\u306B\u5931\u6557\u3057\u305F\u30C1\u30E3\u30F3\u30CD\u30EB", failed);
    new import_obsidian.Notice(
      `\u2705 \u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u66F4\u65B0\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F
\u4F5C\u308A\u76F4\u3057: ${done.length} / ${total} \u30C1\u30E3\u30F3\u30CD\u30EB${failed.length > 0 ? `\uFF08\u5931\u6557 ${failed.length}\uFF09` : ""}
\u4F5C\u308A\u76F4\u3055\u306A\u304B\u3063\u305F\u30C1\u30E3\u30F3\u30CD\u30EB: \u5909\u66F4\u306A\u3057 ${planGroups.unchanged.length} \uFF0F \u624B\u52D5\u7DE8\u96C6\u306E\u7591\u3044 ${planGroups.manuallyEdited.length}
` + // 上書きが 0 件なら「0 → 0 文字」は出さない
      (done.length > 0 ? `${srcChars.toLocaleString()} \u2192 ${outChars.toLocaleString()} \u6587\u5B57
` : "") + `\u751F\u6210\u3057\u305F\u56DE\u6570: ${attemptCount} \u56DE` + (retried.length > 0 ? `\uFF08\u3084\u308A\u76F4\u3057 ${retried.length} \u30C1\u30E3\u30F3\u30CD\u30EB\uFF09` : "") + `
\u30C8\u30FC\u30AF\u30F3: \u5165\u529B ${inTok.toLocaleString()} / \u51FA\u529B ${outTok.toLocaleString()}\uFF08\u5168\u8A66\u884C\u306E\u5408\u8A08\uFF09
\u8CBB\u7528: \u7121\u6599\u67A0\u306E\u305F\u3081 0 \u5186\uFF08\u6709\u6599\u30C6\u30A3\u30A2\u63DB\u7B97 ${formatUsdJpy(costUsd)}\uFF09
\u691C\u8A3C: K1b \u5F62\u5F0F\u9055\u53CD ${malformed} / K3 \u51FA\u5178\u306A\u3057 ${bullets} / K4 \u4E0D\u660E ${unknown}
` + logs.map((l) => `${l.accepted ? "" : "\u26A0 "}${describeAttempts(l)}
`).join("") + `\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7: ${backups.length} \u672C
\u6240\u8981: ${(elapsedSec / 60).toFixed(1)} \u5206
\u8A73\u7D30\u306F\u30B3\u30F3\u30BD\u30FC\u30EB\uFF08Ctrl+Shift+I\uFF09`,
      0
    );
  }
  /* ---------- 回答生成（ステップ5） ---------- */
  /**
   * 検索 → 回答生成。出典ブロックはモデルに書かせず、コード側で組み立てる（R2 の保証）。
   * chatModelPriority の順に試し、失敗したら次のモデルへ（chatFallbackMode: auto）。
   */
  async answerQuestion(query, controller) {
    const s = this.settings;
    if (!this.index || !this.vectors) {
      throw new Error(this.indexBlockedReason || "\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u8AAD\u307F\u8FBC\u307E\u308C\u3066\u3044\u307E\u305B\u3093");
    }
    const started = Date.now();
    const search = await this.hybridSearch(query, controller);
    const hits = search.capped;
    const chunks = this.index.chunks;
    const userPrompt = buildAnswerUserPrompt(query, hits, chunks);
    const models = getCallableChatModelIds(s);
    if (models.length === 0) {
      throw new Error(
        `\u56DE\u7B54\u751F\u6210\u306B\u4F7F\u3048\u308B API \u30AD\u30FC\u304C\u3042\u308A\u307E\u305B\u3093
chatModelPriority: ${s.chatModelPriority.join(", ")}
\u8A2D\u5B9A\u3067\u8A72\u5F53\u30D7\u30ED\u30D0\u30A4\u30C0\u306E API \u30AD\u30FC\u3092\u5165\u308C\u3066\u304F\u3060\u3055\u3044`
      );
    }
    const attempts = [];
    let result = null;
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
        console.error(`[Vault RAG] ${getChatModelLabel(modelId)} \u3067\u5931\u6557\u3001\u6B21\u306E\u30E2\u30C7\u30EB\u3078`, message);
      }
    }
    if (!result) {
      throw new Error(`\u3059\u3079\u3066\u306E\u30E2\u30C7\u30EB\u3067\u5931\u6557\u3057\u307E\u3057\u305F:
${attempts.map((a) => `${getChatModelLabel(a.model)}: ${a.error}`).join("\n")}`);
    }
    const costUsd = calcChatCostUsd(modelUsed, result.inputTokens, result.outputTokens);
    const freeTier = isFreeTierChatUsage(s, modelUsed);
    const chargedUsd = chargeableChatCostUsd(s, modelUsed, result.inputTokens, result.outputTokens);
    s.totalInputTokens += result.inputTokens;
    s.totalOutputTokens += result.outputTokens;
    s.totalCostUsd += chargedUsd;
    await this.saveSettings();
    const normalized = normalizeCitationRefs(result.text.trim());
    if (normalized.fixed > 0) console.log(`[Vault RAG] \u51FA\u5178\u756A\u53F7\u306E\u8A18\u6CD5\u3092\u6B63\u898F\u5316: ${normalized.fixed} \u7B87\u6240`);
    const notFound = stripNotFoundCitations(normalized.text);
    if (notFound.stripped > 0) console.log(`[Vault RAG] \u300C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u300D\u306E\u6BB5\u843D\u304B\u3089\u51FA\u5178\u756A\u53F7\u3092\u9664\u53BB: ${notFound.stripped} \u7B87\u6240`);
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
      elapsedMs: Date.now() - started
    };
  }
  /** 回答パネルに出す Markdown を組み立てる。 */
  buildAnswerMarkdown(r) {
    const usdJpy = (usd) => `$${usd.toFixed(4)}\uFF08\u7D04${(usd * USD_TO_JPY).toFixed(1)}\u5186\uFF09`;
    const parts = [
      `## ${r.query}`,
      "",
      r.answer,
      r.citations,
      "",
      "---",
      `\u4F7F\u7528\u30E2\u30C7\u30EB: **${getChatModelLabel(r.modelUsed)}**` + (r.attempts.length > 0 ? `\uFF08${r.attempts.map((a) => getChatModelLabel(a.model)).join(" \u2192 ")} \u3067\u5931\u6557\u5F8C\uFF09` : ""),
      "",
      `\u4ECA\u56DE: ${r.inputTokens.toLocaleString()}in + ${r.outputTokens.toLocaleString()}out tokens`,
      r.freeTier ? `\u4ECA\u56DE: \u7121\u6599\u67A0\u306E\u305F\u3081 0 \u5186\uFF08\u6709\u6599\u63DB\u7B97 ${usdJpy(r.costUsd)}\uFF09` : `\u4ECA\u56DE: ${usdJpy(r.costUsd)}`,
      `\u7D2F\u8A08\uFF08\u5B9F\u969B\u306B\u6255\u3063\u305F\u5206\uFF09: ${usdJpy(this.settings.totalCostUsd)}`,
      `\u6240\u8981: ${(r.elapsedMs / 1e3).toFixed(1)} \u79D2`
    ];
    return parts.join("\n");
  }
  async showAnswerView(markdown, answerBody = "") {
    const existing = this.app.workspace.getLeavesOfType(ANSWER_VIEW_TYPE);
    let leaf = existing.length > 0 ? existing[0] : null;
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      if (leaf) await leaf.setViewState({ type: ANSWER_VIEW_TYPE, active: true });
    }
    if (!leaf) throw new Error("\u53F3\u30B5\u30A4\u30C9\u30D1\u30CD\u30EB\u3092\u958B\u3051\u307E\u305B\u3093\u3067\u3057\u305F");
    this.app.workspace.revealLeaf(leaf);
    const view = leaf.view;
    await view.render(markdown, answerBody);
    return view;
  }
  async runAsk() {
    if (!this.index || !this.vectors) {
      new import_obsidian.Notice(`Vault RAG: \u307E\u305A \u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044
${this.indexBlockedReason || ""}`, 15e3);
      return;
    }
    if (getCallableChatModelIds(this.settings).length === 0) {
      new import_obsidian.Notice(
        `Vault RAG: \u56DE\u7B54\u751F\u6210\u306B\u4F7F\u3048\u308B API \u30AD\u30FC\u304C\u3042\u308A\u307E\u305B\u3093
chatModelPriority: ${this.settings.chatModelPriority.join(", ")}`,
        15e3
      );
      return;
    }
    new AskModal(this.app, async (query) => {
      if (this.activeRun) {
        new import_obsidian.Notice("Vault RAG: \u65E2\u306B\u5B9F\u884C\u4E2D\u3067\u3059", 5e3);
        return;
      }
      const controller = new RunController();
      this.activeRun = controller;
      const progress = new ProgressNotice();
      const onEsc = this.makeEscHandler(controller);
      document.addEventListener("keydown", onEsc);
      try {
        progress.show(`Vault RAG: \u691C\u7D22\u4E2D\u2026\u300C${query}\u300D\uFF08Esc\u3067\u4E2D\u65AD\uFF09`);
        const r = await this.answerQuestion(query, controller);
        progress.hide();
        await this.showAnswerView(this.buildAnswerMarkdown(r), r.answer);
        console.log("[Vault RAG] \u56DE\u7B54\u751F\u6210", {
          query,
          model: r.modelUsed,
          attempts: r.attempts,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          costUsd: r.costUsd,
          elapsedMs: r.elapsedMs,
          sources: r.hits.map((h, i) => `[${i + 1}] ${this.index.chunks[h.chunkIndex].title}`)
        });
        new import_obsidian.Notice(
          `\u2705 \u56DE\u7B54\u5B8C\u4E86\uFF08${getChatModelLabel(r.modelUsed)}\uFF09
\u4ECA\u56DE: ${r.inputTokens.toLocaleString()}in + ${r.outputTokens.toLocaleString()}out tokens
` + (r.freeTier ? `\u4ECA\u56DE: \u7121\u6599\u67A0\u306E\u305F\u3081 0 \u5186\uFF08\u6709\u6599\u63DB\u7B97 ${formatUsdJpy(r.costUsd)}\uFF09
` : `\u4ECA\u56DE: ${formatUsdJpy(r.costUsd)}
`) + `\u7D2F\u8A08\uFF08\u5B9F\u969B\u306B\u6255\u3063\u305F\u5206\uFF09: ${formatUsdJpy(this.settings.totalCostUsd)}`,
          0
        );
      } catch (err) {
        progress.hide();
        if (isAbortedError(err)) new import_obsidian.Notice("Vault RAG: \u4E2D\u65AD\u3057\u307E\u3057\u305F", 5e3);
        else {
          console.error("[Vault RAG] \u56DE\u7B54\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", err);
          new import_obsidian.Notice(`Vault RAG: \u56DE\u7B54\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F
${err instanceof Error ? err.message : String(err)}`, 0);
        }
      } finally {
        document.removeEventListener("keydown", onEsc);
        this.activeRun = null;
      }
    }).open();
  }
  /** 先頭3ノート分のチャンクをコンソールに出す。ノートは作らない（R4）。 */
  async runPreview() {
    const s = this.settings;
    const candidates = this.collectCandidates();
    let shown = 0;
    console.log(`[Vault RAG] \u30C1\u30E3\u30F3\u30AF\u5206\u5272\u30D7\u30EC\u30D3\u30E5\u30FC\uFF08chunkSize=${s.chunkSize} / chunkOverlap=${s.chunkOverlap}\uFF09`);
    for (const file of candidates) {
      if (shown >= 3) break;
      let raw;
      try {
        raw = await this.app.vault.cachedRead(file);
      } catch (err) {
        console.error("[Vault RAG] \u8AAD\u307F\u53D6\u308A\u5931\u6557:", file.path, err);
        continue;
      }
      const note = extractNote(raw, s);
      if (s.includeSourceTypes.indexOf(note.sourceType) < 0) continue;
      if (isSummaryTooThin(note, s)) continue;
      const chunks = buildChunks(note, file.path, file.stat.mtime, s);
      shown++;
      console.log(
        `
========== [${shown}] ${file.path}
source_type=${note.sourceType} / \u672C\u6587 ${note.main.length}\u6587\u5B57 / \u30B5\u30DE\u30EA\u30FC ${note.summary.length}\u6587\u5B57 / \u81EA\u5206\u306E\u30E1\u30E2 ${note.memo.length}\u6587\u5B57 \u2192 ${chunks.length} \u30C1\u30E3\u30F3\u30AF`
      );
      for (const c of chunks) {
        console.log(
          `--- ${c.id}  kind=${c.kind}  ${c.text.length}\u6587\u5B57  headings=[${c.headings.join(" / ")}]
` + c.text
        );
      }
    }
    if (shown === 0) {
      new import_obsidian.Notice("Vault RAG: \u5BFE\u8C61\u30CE\u30FC\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F", 8e3);
      return;
    }
    new import_obsidian.Notice(`Vault RAG: ${shown} \u672C\u3076\u3093\u306E\u30C1\u30E3\u30F3\u30AF\u3092\u30B3\u30F3\u30BD\u30FC\u30EB\u306B\u51FA\u529B\u3057\u307E\u3057\u305F
\uFF08Ctrl+Shift+I \u3067\u958B\u767A\u8005\u30C4\u30FC\u30EB\uFF09`, 8e3);
  }
};
function clampInt(value, min, max, fallback) {
  const n = typeof value === "number" ? Math.floor(value) : NaN;
  if (!isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}
var VaultRagSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    __publicField(this, "plugin");
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "My Vault RAG \u8A2D\u5B9A" });
    new import_obsidian.Setting(containerEl).setName("OpenAI API \u30AD\u30FC").setDesc("\u57CB\u3081\u8FBC\u307F\u30D7\u30ED\u30D0\u30A4\u30C0\u3092 OpenAI \u306B\u3057\u305F\u3068\u304D\u3060\u3051\u4F7F\u3046\u3002https://platform.openai.com/api-keys \u3067\u53D6\u5F97").addText(
      (text) => text.setPlaceholder("sk-...").setValue(this.plugin.settings.openaiApiKey).onChange(async (value) => {
        this.plugin.settings.openaiApiKey = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Claude API \u30AD\u30FC").setDesc("\u56DE\u7B54\u751F\u6210\u3067 Claude \u306E\u30E2\u30C7\u30EB\u3092\u4F7F\u3046\u3068\u304D\u306B\u4F7F\u3046\uFF08\u65E2\u5B9A\u3067\u306F\u30E2\u30C7\u30EB 2 \u306E claude-haiku-4-5\u3002auto \u306E\u3068\u304D\u3001\u4E0A\u4F4D\u306E\u30E2\u30C7\u30EB\u304C\u5931\u6557\u3057\u305F\u3089\u4F7F\u308F\u308C\u308B\uFF09\u3002Anthropic Console \u3067\u53D6\u5F97").addText(
      (text) => text.setPlaceholder("sk-ant-api03-...").setValue(this.plugin.settings.claudeApiKey).onChange(async (value) => {
        this.plugin.settings.claudeApiKey = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Gemini API \u30AD\u30FC").setDesc("\u56DE\u7B54\u751F\u6210\uFF08\u65E2\u5B9A\u3067\u306F\u30E2\u30C7\u30EB 1 \u306E gemini-3.5-flash-lite\uFF09\u3068\u3001\u307E\u3068\u3081\u30CE\u30FC\u30C8\u306E\u751F\u6210\u306B\u4F7F\u3046\u3002\u57CB\u3081\u8FBC\u307F\u30D7\u30ED\u30D0\u30A4\u30C0\u3092 Gemini \u306B\u3057\u305F\u3068\u304D\u306F\u3001\u57CB\u3081\u8FBC\u307F\uFF08gemini-embedding-001\uFF09\u306B\u3082\u4F7F\u3046").addText(
      (text) => text.setPlaceholder("AIza...").setValue(this.plugin.settings.geminiApiKey).onChange(async (value) => {
        this.plugin.settings.geminiApiKey = value.trim();
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("\u5BFE\u8C61\u30D5\u30A9\u30EB\u30C0").setDesc("RAG \u306E\u5BFE\u8C61\u306B\u3059\u308B Vault \u5185\u306E\u30D5\u30A9\u30EB\u30C0\u30D1\u30B9").addText(
      (text) => text.setPlaceholder(DEFAULT_SETTINGS.targetFolder).setValue(this.plugin.settings.targetFolder).onChange(async (value) => {
        this.plugin.settings.targetFolder = value.trim().replace(/\/+$/, "");
        await this.plugin.saveSettings();
      })
    );
    containerEl.createEl("h3", { text: "\u57CB\u3081\u8FBC\u307F" });
    containerEl.createEl("p", {
      text: "\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF\u306F\u3057\u307E\u305B\u3093\u3002\u30D7\u30ED\u30D0\u30A4\u30C0\u3084\u30E2\u30C7\u30EB\u3092\u5909\u3048\u308B\u3068\u65E2\u5B58\u306E\u30D9\u30AF\u30C8\u30EB\u304C\u5168\u3066\u7121\u52B9\u306B\u306A\u308B\u305F\u3081\u3001\u5909\u66F4\u5F8C\u306F\u5168\u4EF6\u306E\u518D\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u5FC5\u8981\u3067\u3059\u3002",
      cls: "vault-rag-desc"
    });
    new import_obsidian.Setting(containerEl).setName("\u57CB\u3081\u8FBC\u307F\u30D7\u30ED\u30D0\u30A4\u30C0").setDesc("Gemini \u306F\u7121\u6599\u67A0\u3067\u4F7F\u3048\u308B\u3002OpenAI \u306F\u6700\u4F4E $5 \u306E\u30AF\u30EC\u30B8\u30C3\u30C8\u8CFC\u5165\u304C\u5FC5\u8981").addDropdown((dd) => {
      dd.addOption("gemini", "Gemini\uFF08gemini-embedding-001\uFF09");
      dd.addOption("openai", "OpenAI\uFF08text-embedding-3-small\uFF09");
      dd.setValue(this.plugin.settings.embeddingProvider);
      dd.onChange(async (value) => {
        this.plugin.settings.embeddingProvider = value;
        this.plugin.settings.embeddingModel = value === "openai" ? "text-embedding-3-small" : "gemini-embedding-001";
        await this.plugin.saveSettings();
        this.display();
        new import_obsidian.Notice("Vault RAG: \u57CB\u3081\u8FBC\u307F\u30D7\u30ED\u30D0\u30A4\u30C0\u3092\u5909\u66F4\u3057\u307E\u3057\u305F\u3002\u5168\u4EF6\u306E\u518D\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u5FC5\u8981\u3067\u3059", 1e4);
      });
    });
    new import_obsidian.Setting(containerEl).setName("\u57CB\u3081\u8FBC\u307F\u30E2\u30C7\u30EB").setDesc("\u5909\u66F4\u3057\u305F\u3089\u5168\u4EF6\u306E\u518D\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u5FC5\u8981").addText(
      (text) => text.setValue(this.plugin.settings.embeddingModel).onChange(async (value) => {
        const v = value.trim();
        if (!v) return;
        this.plugin.settings.embeddingModel = v;
        await this.plugin.saveSettings();
      })
    );
    this.addNumberSetting(containerEl, "embeddingDimensions", "\u30D9\u30AF\u30C8\u30EB\u306E\u6B21\u5143\u6570\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8 1536\u3002Gemini \u306E\u65E2\u5B9A 3072 \u3060\u3068 .bin \u304C\u500D\u306B\u306A\u308B\uFF09", "embeddingDimensions", 128, 3072);
    this.addNumberSetting(containerEl, "embedBatchSize", "1\u30EA\u30AF\u30A8\u30B9\u30C8\u3067\u9001\u308B\u30C1\u30E3\u30F3\u30AF\u6570\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8 100\uFF09", "embedBatchSize", 1, 100);
    this.addNumberSetting(containerEl, "embedIntervalMs", "\u30D0\u30C3\u30C1\u9593\u306E\u30A6\u30A7\u30A4\u30C8\uFF08\u30DF\u30EA\u79D2\u3002\u30C7\u30D5\u30A9\u30EB\u30C8 1000\uFF09\u3002\u9023\u7D9A\u3067\u6295\u3052\u308B\u3068\u7121\u6599\u67A0\u306E\u4E0A\u9650\u306B\u5F53\u305F\u308A\u3084\u3059\u3044", "embedIntervalMs", 0, 6e4);
    containerEl.createEl("h3", { text: "\u30C6\u30B9\u30C8\u5B9F\u884C" });
    containerEl.createEl("p", {
      text: "0 \u3067\u7121\u52B9\u3002N>0 \u306B\u3059\u308B\u3068\u3001\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u4F5C\u6210\u3067\u5148\u982D N \u672C\u306E\u30CE\u30FC\u30C8\u3060\u3051\u3092\u51E6\u7406\u3057\u307E\u3059\u3002\u5168\u4EF6\u306B\u8AB2\u91D1\u3059\u308B\u524D\u306E\u52D5\u4F5C\u78BA\u8A8D\u7528\u3067\u3059\u3002",
      cls: "vault-rag-desc"
    });
    this.addNumberSetting(containerEl, "testModeNoteLimit", "\u51E6\u7406\u3059\u308B\u30CE\u30FC\u30C8\u6570\u306E\u4E0A\u9650\uFF080 = \u5168\u4EF6\uFF09", "testModeNoteLimit", 0, 1e4);
    containerEl.createEl("h3", { text: "\u30C1\u30E3\u30F3\u30AF\u5206\u5272" });
    containerEl.createEl("p", {
      text: "\u5909\u66F4\u3059\u308B\u3068\u65E2\u5B58\u306E\u30D9\u30AF\u30C8\u30EB\u304C\u7121\u52B9\u306B\u306A\u308A\u307E\u3059\u3002\u5909\u66F4\u5F8C\u306F\u5168\u4EF6\u306E\u518D\u30A4\u30F3\u30C7\u30C3\u30AF\u30B9\u304C\u5FC5\u8981\u3067\u3059\u3002",
      cls: "vault-rag-desc"
    });
    this.addNumberSetting(containerEl, "chunkSize", "1\u30C1\u30E3\u30F3\u30AF\u306E\u6700\u5927\u6587\u5B57\u6570\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8 800\uFF09", "chunkSize", 100, 8e3);
    this.addNumberSetting(containerEl, "chunkOverlap", "\u30C1\u30E3\u30F3\u30AF\u9593\u306E\u91CD\u8907\u6587\u5B57\u6570\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8 160\uFF09", "chunkOverlap", 0, 4e3);
    containerEl.createEl("h3", { text: "\u56DE\u7B54\u751F\u6210" });
    containerEl.createEl("p", {
      text: "\u4E0A\u304B\u3089\u9806\u306B\u8A66\u3057\u3001\u5931\u6557\u3057\u305F\u3089\u6B21\u306E\u30E2\u30C7\u30EB\u3078\u5207\u308A\u66FF\u3048\u307E\u3059\uFF08\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF\uFF09\u3002API \u30AD\u30FC\u304C\u672A\u8A2D\u5B9A\u306E\u30E2\u30C7\u30EB\u306F\u81EA\u52D5\u3067\u98DB\u3070\u3057\u307E\u3059\u3002",
      cls: "vault-rag-desc"
    });
    for (let i = 0; i < 3; i++) {
      new import_obsidian.Setting(containerEl).setName(`\u30E2\u30C7\u30EB ${i + 1}${i === 0 ? "\uFF08\u6700\u512A\u5148\uFF09" : ""}`).setDesc(i === 0 ? "\u65E2\u5B9A\u306F Gemini 3.5 Flash-Lite\uFF08\u6709\u6599\u67A0\u306E\u5358\u4FA1\u306F\u5165\u529B $0.30\u30FB\u51FA\u529B $2.50 / 100\u4E07\u30C8\u30FC\u30AF\u30F3\u3002\u7121\u6599\u67A0\u306A\u3089 0 \u5186\uFF09" : "").addDropdown((dd) => {
        dd.addOption("", "\uFF08\u4F7F\u308F\u306A\u3044\uFF09");
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
    new import_obsidian.Setting(containerEl).setName("\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF").setDesc("auto = \u4E0A\u304B\u3089\u9806\u306B\u8A66\u3059 / manual = \u6700\u512A\u5148\u306E\u30E2\u30C7\u30EB\u3060\u3051\u4F7F\u3046").addDropdown((dd) => {
      dd.addOption("auto", "auto\uFF08\u9806\u306B\u8A66\u3059\uFF09");
      dd.addOption("manual", "manual\uFF08\u5148\u982D\u306E\u307F\uFF09");
      dd.setValue(this.plugin.settings.chatFallbackMode);
      dd.onChange(async (value) => {
        this.plugin.settings.chatFallbackMode = value;
        await this.plugin.saveSettings();
      });
    });
    new import_obsidian.Setting(containerEl).setName("Gemini \u306F\u7121\u6599\u67A0\u3067\u4F7F\u3063\u3066\u3044\u308B").setDesc("\u30AA\u30F3\u306E\u9593\u3001Gemini \u306E\u8CBB\u7528\u306F\u7D2F\u8A08\u8CBB\u7528\uFF08totalCostUsd\uFF09\u306B\u52A0\u3048\u307E\u305B\u3093\u3002Google \u306E\u8AB2\u91D1\u3092\u6709\u52B9\u306B\u3057\u305F\u3089\u30AA\u30D5\u306B\u3057\u3066\u304F\u3060\u3055\u3044").addToggle((tg) => {
      tg.setValue(this.plugin.settings.geminiFreeTier);
      tg.onChange(async (value) => {
        this.plugin.settings.geminiFreeTier = value;
        await this.plugin.saveSettings();
      });
    });
    containerEl.createEl("h3", { text: "\u691C\u7D22" });
    this.addNumberSetting(containerEl, "vectorTopK", "\u30D9\u30AF\u30C8\u30EB\u691C\u7D22\u3067\u53D6\u308B\u4EF6\u6570\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8 30\uFF09", "vectorTopK", 1, 200);
    this.addNumberSetting(containerEl, "keywordTopK", "\u30AD\u30FC\u30EF\u30FC\u30C9\u691C\u7D22\u3067\u53D6\u308B\u4EF6\u6570\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8 30\uFF09", "keywordTopK", 1, 200);
    this.addNumberSetting(containerEl, "finalTopK", "RRF \u7D71\u5408\u5F8C\u3001\u56DE\u7B54\u751F\u6210\u306B\u6E21\u3059\u4EF6\u6570\uFF08\u30C7\u30D5\u30A9\u30EB\u30C8 8\uFF09", "finalTopK", 1, 50);
  }
  addNumberSetting(containerEl, name, desc, key, min, max) {
    new import_obsidian.Setting(containerEl).setName(name).setDesc(desc).addText(
      (text) => text.setPlaceholder(String(DEFAULT_SETTINGS[key])).setValue(String(this.plugin.settings[key])).onChange(async (value) => {
        const n = parseInt(value, 10);
        if (!Number.isFinite(n) || n < min || n > max) return;
        this.plugin.settings[key] = n;
        await this.plugin.saveSettings();
      })
    );
  }
};
var SearchTestModal = class extends import_obsidian.Modal {
  constructor(app, onSubmit) {
    super(app);
    __publicField(this, "onSubmit", onSubmit);
    __publicField(this, "query", "");
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "\u{1F50D} \u691C\u7D22\u3092\u30C6\u30B9\u30C8" });
    const input = contentEl.createEl("textarea", { cls: "vault-rag-query" });
    input.rows = 3;
    input.style.width = "100%";
    input.placeholder = "\u4F8B: NotebookLM\u306E\u30BD\u30FC\u30B9\u6570\u306E\u4E0A\u9650\u306F\uFF1F";
    input.addEventListener("input", () => {
      this.query = input.value;
    });
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault();
        this.submit();
      }
    });
    contentEl.createEl("p", {
      text: "\u7D50\u679C\u306F\u30B3\u30F3\u30BD\u30FC\u30EB\uFF08Ctrl+Shift+I\uFF09\u306B\u51FA\u307E\u3059\u3002Ctrl+Enter \u3067\u3082\u9001\u4FE1\u3067\u304D\u307E\u3059\u3002",
      cls: "vault-rag-desc"
    });
    new import_obsidian.Setting(contentEl).addButton(
      (b) => b.setButtonText("\u691C\u7D22 \u25B6").setCta().onClick(() => {
        this.submit();
      })
    );
    input.focus();
  }
  submit() {
    const q = this.query.trim();
    if (q.length === 0) {
      new import_obsidian.Notice("Vault RAG: \u8CEA\u554F\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044", 5e3);
      return;
    }
    this.close();
    void this.onSubmit(q);
  }
  onClose() {
    this.contentEl.empty();
  }
};
