// geminiFreeTier のテスト。API は呼ばず fetch を差し替える。入力はすべて【合成値】。
global.window = { setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a) };
global.document = { addEventListener() {}, removeEventListener() {} };
require("./obsidian-stub.js");
const { BUNDLE, DATA_COPY } = require("./paths.js");   // テスト用のまとめファイルは tests の外（%TEMP%/vault-rag-tests/）
const m = require(BUNDLE);
// data.json: 本物を読み、API キー 3 つを空文字にしたコピーを DATA_COPY（%TEMP%/vault-rag-tests/data.json）に書いて使う。
// 本物には書き込まない。コピーはプロセスの終了時に必ず消す（最後まで通っても、途中で失敗しても）
process.on("exit", () => require("fs").rmSync(DATA_COPY, { force: true }));
{
  const fs = require("fs"), path = require("path");
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data.json"), "utf8"));
  for (const k of ["openaiApiKey", "geminiApiKey", "claudeApiKey"]) if (k in data) data[k] = "";
  fs.mkdirSync(path.dirname(DATA_COPY), { recursive: true });
  fs.writeFileSync(DATA_COPY, JSON.stringify(data, null, 2), "utf8");
}

let ng = 0;
const check = (l, ok, got) => { if (!ok) ng++; console.log(`    ${ok ? "OK  " : "NG  "}${l}${got !== undefined ? `  （実測: ${got}）` : ""}`); };
const r6 = (x) => Math.round(x * 1e8) / 1e8;

// --- fetch を差し替える（【合成値】を返す。ネットワークには出ない） ---
const calls = [];
function installFetch(opt) {
  global.fetch = async (url, init) => {
    calls.push(String(url));
    const isGemini = String(url).indexOf("generativelanguage.googleapis.com") >= 0;
    const isClaude = String(url).indexOf("api.anthropic.com") >= 0;
    if (isGemini && opt.geminiFails) {
      const body = JSON.stringify({ error: { message: "Quota exceeded（合成値）", status: "RESOURCE_EXHAUSTED", code: 429 } });
      return { status: 429, text: async () => body };
    }
    if (isGemini) {
      const body = JSON.stringify({
        candidates: [{ content: { parts: [{ text: "回答の本文です [1]。（合成値）" }] }, finishReason: "STOP" }],
        usageMetadata: { promptTokenCount: 7400, candidatesTokenCount: 800 },
      });
      return { status: 200, text: async () => body };
    }
    if (isClaude) {
      const body = JSON.stringify({
        content: [{ type: "text", text: "回答の本文です [1]。（合成値）" }],
        usage: { input_tokens: 7400, output_tokens: 800 },
        stop_reason: "end_turn",
      });
      return { status: 200, text: async () => body };
    }
    throw new Error("想定外の URL: " + url);
  };
}

function makePlugin(over) {
  const chunk = {
    id: "n/1.md#0", path: "Source/Obsidian/Youtube清書/ch/n1.md", title: "n1",
    channel: "テストch（合成値）", category: "", date: "2026-01-01", url: "",
    sourceType: "youtube", kind: "body", headings: [], text: "[n1｜テストch（合成値）｜2026-01-01]\n本文（合成値）", mtime: 0,
  };
  const plugin = Object.create(m.default.prototype);
  plugin.settings = Object.assign({}, m.DEFAULT_SETTINGS, {
    geminiApiKey: "dummy-gemini-key", claudeApiKey: "dummy-claude-key", openaiApiKey: "",
    chatModelPriority: ["gemini-3.5-flash-lite", "claude-haiku-4-5"],
    chatFallbackMode: "auto",
    totalInputTokens: 0, totalOutputTokens: 0, totalCostUsd: 0,
  }, over);
  plugin.index = { meta: {}, chunks: [chunk] };
  plugin.vectors = new Float32Array(1);
  plugin.indexBlockedReason = null;
  plugin.saveSettings = async () => {};
  plugin.hybridSearch = async () => ({
    capped: [{ chunkIndex: 0, cosine: 0.6, vectorRank: 1, keywordScore: null, keywordTerms: null, keywordRank: null, rrf: 0 }],
  });
  return plugin;
}

(async () => {
  console.log("=== 1. 回答生成（入力は全て合成値 / fetch 差し替え） ===");
  const cases = [
    ["geminiFreeTier=true  / Gemini で回答",       { geminiFreeTier: true },  false, "gemini-3.5-flash-lite", true,  0],
    ["geminiFreeTier=true  / Claude へ切り替え",   { geminiFreeTier: true },  true,  "claude-haiku-4-5",      false, 7400 / 1e6 * 1.0 + 800 / 1e6 * 5.0],
    ["geminiFreeTier=false / Gemini で回答",       { geminiFreeTier: false }, false, "gemini-3.5-flash-lite", false, 7400 / 1e6 * 0.3 + 800 / 1e6 * 2.5],
    ["geminiFreeTier=false / Claude へ切り替え",   { geminiFreeTier: false }, true,  "claude-haiku-4-5",      false, 7400 / 1e6 * 1.0 + 800 / 1e6 * 5.0],
  ];
  for (const [label, over, geminiFails, wantModel, wantFree, wantCharged] of cases) {
    calls.length = 0;
    installFetch({ geminiFails });
    const plugin = makePlugin(over);
    const controller = new (Object.getPrototypeOf(plugin).constructor ? Object : Object)(); // 使わない
    const ctl = { throwIfAborted() {}, isAborted: false, abort() {}, sleep: async () => {} };
    const res = await m.default.prototype.answerQuestion.call(plugin, "質問（合成値）", ctl);
    const s = plugin.settings;
    console.log(`\n  ${label}`);
    console.log(`    使ったモデル: ${res.modelUsed} / 無料枠: ${res.freeTier}`);
    console.log(`    有料換算 costUsd=$${res.costUsd.toFixed(6)} / 実際に加えた chargedUsd=$${res.chargedUsd.toFixed(6)}`);
    console.log(`    totalInputTokens=${s.totalInputTokens} / totalOutputTokens=${s.totalOutputTokens} / totalCostUsd=$${s.totalCostUsd.toFixed(6)}`);
    check("使ったモデルが期待どおり", res.modelUsed === wantModel, res.modelUsed);
    check("無料枠の判定が期待どおり", res.freeTier === wantFree, String(res.freeTier));
    check("トークンは常に数える（7,400 / 800）", s.totalInputTokens === 7400 && s.totalOutputTokens === 800, `${s.totalInputTokens}/${s.totalOutputTokens}`);
    check(wantCharged === 0 ? "totalCostUsd は増えない" : "totalCostUsd が増える",
      r6(s.totalCostUsd) === r6(wantCharged), `$${s.totalCostUsd.toFixed(6)} / 期待 $${wantCharged.toFixed(6)}`);
  }

  console.log("\n=== 2. まとめ生成の費用（入力は全て合成値） ===");
  const logs = [{
    channel: "テストch（合成値）", prevChars: 21531, accepted: true, candidatePath: "",
    attempts: [
      { attempt: 1, chars: 7019, inputTokens: 205000, outputTokens: 2400, truncated: false, tooShort: true, accepted: false },
      { attempt: 2, chars: 32215, inputTokens: 205200, outputTokens: 11000, truncated: false, tooShort: false, accepted: true },
    ],
  }];
  const expected = m.calcChatCostUsd("gemini-3.5-flash-lite", 410200, 13400);
  for (const [free, wantAdd] of [[true, 0], [false, expected]]) {
    const plugin = makePlugin({ geminiFreeTier: free });
    plugin.settings.totalInputTokens = 0; plugin.settings.totalOutputTokens = 0; plugin.settings.totalCostUsd = 0;
    await m.default.prototype.addSummaryUsage.call(plugin, logs);
    const s = plugin.settings;
    console.log(`\n  geminiFreeTier=${free}`);
    console.log(`    totalInputTokens=${s.totalInputTokens} / totalOutputTokens=${s.totalOutputTokens} / totalCostUsd=$${s.totalCostUsd.toFixed(6)}`);
    check("トークンは全試行の合計（410,200 / 13,400）",
      s.totalInputTokens === 410200 && s.totalOutputTokens === 13400, `${s.totalInputTokens}/${s.totalOutputTokens}`);
    check(wantAdd === 0 ? "totalCostUsd は増えない" : `totalCostUsd が増える（$${expected.toFixed(6)}）`,
      r6(s.totalCostUsd) === r6(wantAdd), `$${s.totalCostUsd.toFixed(6)}`);
  }

  console.log("\n=== 3. 無料枠判定の純粋関数（入力は全て合成値） ===");
  const on = Object.assign({}, m.DEFAULT_SETTINGS, { geminiFreeTier: true });
  const off = Object.assign({}, m.DEFAULT_SETTINGS, { geminiFreeTier: false });
  check("on + Gemini → 無料枠", m.isFreeTierChatUsage(on, "gemini-3.5-flash-lite") === true);
  check("on + Claude → 課金", m.isFreeTierChatUsage(on, "claude-haiku-4-5") === false);
  check("on + OpenAI → 課金", m.isFreeTierChatUsage(on, "gpt-5.6-luna") === false);
  check("off + Gemini → 課金", m.isFreeTierChatUsage(off, "gemini-3.5-flash-lite") === false);
  check("on + Gemini の加算額は 0", m.chargeableChatCostUsd(on, "gemini-3.5-flash-lite", 1e6, 1e6) === 0);
  check("off + Gemini の加算額は有料換算と同じ",
    m.chargeableChatCostUsd(off, "gemini-3.5-flash-lite", 1e6, 1e6) === m.calcChatCostUsd("gemini-3.5-flash-lite", 1e6, 1e6));
  check("on + Claude の加算額は有料換算と同じ",
    m.chargeableChatCostUsd(on, "claude-haiku-4-5", 1e6, 1e6) === m.calcChatCostUsd("claude-haiku-4-5", 1e6, 1e6));

  console.log("\n=== 4. 設定の違いの通知（入力は全て合成値） ===");
  const defaults = { arr: ["x", "y", "z"], onlyInDefault: true, num: 5 };
  const d1 = m.detectSettingsDrift(defaults, { arr: ["x"], onlyInDefault: false, num: 5 });
  check("配列に足りない要素 y / z は通知する",
    JSON.stringify(d1.missingArrayItems) === '[{"key":"arr","items":["y","z"]}]', JSON.stringify(d1.missingArrayItems));
  const d2 = m.detectSettingsDrift(defaults, { arr: ["x", "y", "z"], num: 5 });
  check("保存値に無いキー onlyInDefault は通知しない", d2.missingArrayItems.length === 0, JSON.stringify(d2));
  check("missingKeys というフィールドは無い", !("missingKeys" in d2), Object.keys(d2).join(","));
  const d3 = m.detectSettingsDrift(defaults, { onlyInDefault: false, num: 5 });
  check("保存値に無い配列は通知しない（既定値がそのまま入る）", d3.missingArrayItems.length === 0, JSON.stringify(d3));
  const d4 = m.detectSettingsDrift(defaults, null);
  check("初回起動（保存値なし）は通知しない", d4.missingArrayItems.length === 0);

  console.log("\n=== 5. 実データ: data.json（%TEMP% のコピー。API キーは空）との差 ===");
  const fs = require("fs");
  const saved = JSON.parse(fs.readFileSync(DATA_COPY, "utf8"));
  check("コピーの API キー 3 つは空文字", ["openaiApiKey", "geminiApiKey", "claudeApiKey"].every((k) => !(k in saved) || saved[k] === ""));
  const real = m.detectSettingsDrift(m.DEFAULT_SETTINGS, saved);
  console.log(`  geminiFreeTier は data.json に${Object.prototype.hasOwnProperty.call(saved, "geminiFreeTier") ? "ある" : "まだ無い"}`);
  check("配列の差分 0 件（キーが無くても通知されない）", real.missingArrayItems.length === 0, JSON.stringify(real.missingArrayItems));

  console.log(`\n${ng === 0 ? "すべて OK" : "NG " + ng + " 件"}`);
  process.exit(ng === 0 ? 0 : 1);
})();
