// stripNotFoundCitations（B2）のテスト。入力はすべて【合成値】。API は呼ばない（fetch を差し替える）。
global.window = { setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a) };
global.document = { addEventListener() {}, removeEventListener() {} };
require("./obsidian-stub.js");
const { BUNDLE } = require("./paths.js");   // テスト用のまとめファイルは tests の外（%TEMP%/vault-rag-tests/）
const m = require(BUNDLE);

let ng = 0;
const check = (l, ok, got) => { if (!ok) ng++; console.log(`    ${ok ? "OK  " : "NG  "}${l}${got !== undefined ? `  （実測: ${got}）` : ""}`); };
const show = (s) => JSON.stringify(s);

const CITED = "### 出典";
const UNCITED = "### 検索で見つかった他のノート（本文では未参照）";
const NF = "該当する情報がノート内に見つかりませんでした";

// 【合成値】8 件のヒット。ノートは n1〜n8（すべて別ノート）
const chunks = [];
for (let i = 1; i <= 8; i++) {
  chunks.push({
    id: `n${i}.md#0`, path: `Source/Obsidian/Youtube清書/合成ch/n${i}.md`, title: `n${i}`,
    channel: "合成ch", category: "", date: "2026-01-01", url: "",
    sourceType: "youtube", kind: "body", headings: [], text: `[n${i}｜合成ch｜2026-01-01]\n本文（合成値）`, mtime: 0,
  });
}
const hits = chunks.map((_, i) => ({ chunkIndex: i, cosine: 0.5, vectorRank: i + 1, keywordScore: null, keywordTerms: null, keywordRank: null, rrf: 0 }));

/** 出典ブロックの「### 出典」の下に並んだノート名（n1 など）を返す */
function citedNotes(block) {
  const lines = block.split("\n");
  const at = lines.indexOf(CITED);
  if (at < 0) return [];
  const out = [];
  for (let i = at + 1; i < lines.length && lines[i].trim() !== "" && !lines[i].startsWith("###"); i++) {
    const mm = lines[i].match(/\|(n\d)\]\]/);
    if (mm) out.push(mm[1]);
  }
  return out;
}

// 【合成値】ケース: [ラベル, モデルの出力（normalizeCitationRefs の前）, 期待する本文, 期待する除去数, 「### 出典」が出るか, 「### 出典」の下のノート]
const cases = [
  ["① 見つからず [3] ＋空行＋検索し直しの提案",
    `${NF}。[3]\n\n「天気」の語で検索し直すと見つかる可能性があります。`,
    `${NF}。\n\n「天気」の語で検索し直すと見つかる可能性があります。`, 1, false, []],
  ["② 見つからず [1]〜[8]（1 段落だけ）",
    `${NF}[1][2][3][4][5][6][7][8]`,
    NF, 8, false, []],
  ["③ 見つからず＋空行＋2 段落目に [2]",
    `${NF}。\n\nただし、関連する内容として〜です[2]。`,
    `${NF}。\n\nただし、関連する内容として〜です[2]。`, 0, true, ["n2"]],
  ["④ 一部だけ見つかった回答",
    `Aは〜です[1]。Bについては${NF}。`,
    `Aは〜です[1]。Bについては${NF}。`, 0, true, ["n1"]],
  ["⑤ ノートにある内容の普通の回答",
    "新NISAの年間投資枠は360万円と述べられています[1][2]。\n\n成長投資枠は240万円とされています[3]。",
    "新NISAの年間投資枠は360万円と述べられています[1][2]。\n\n成長投資枠は240万円とされています[3]。", 0, true, ["n1", "n2", "n3"]],
  // 以下は追加の確認（ご指示の①〜⑤の外）
  ["追加A 1 段落目に [3]、2 段落目に [2]（2 段落目は残す）",
    `${NF}。[3]\n\nただし、関連する内容として〜です[2]。`,
    `${NF}。\n\nただし、関連する内容として〜です[2]。`, 1, true, ["n2"]],
  ["追加B 本文がカンマ区切り [1, 2]（normalizeCitationRefs の後で除去。直前の半角空白も消える）",
    `${NF} [1, 2]`,
    NF, 2, false, []],
  ["作業2の例 「でした [3]。」→「でした。」（直前の半角空白も消える）",
    `${NF} [3]。`,
    `${NF}。`, 1, false, []],
  ["追加C 「でした　[3]。」→「でした。」（直前の全角空白も消える）",
    `${NF}　[3]。`,
    `${NF}。`, 1, false, []],
  ["追加G 「でした [1] [2]。」→「でした。」（[N] の間の空白も消える）",
    `${NF} [1] [2]。`,
    `${NF}。`, 2, false, []],
  ["追加H 2 段落目の「 [2]」は空白ごと残す",
    `${NF} [3]。\n\nただし、関連する内容として〜です [2]。`,
    `${NF}。\n\nただし、関連する内容として〜です [2]。`, 1, true, ["n2"]],
  ["追加D 空行が全角空白だけの行",
    `${NF}。[1]\n　\n「天気」で検索し直してください[2]。`,
    `${NF}。\n　\n「天気」で検索し直してください[2]。`, 1, true, ["n2"]],
  ["追加E 最初の段落が 2 行（2 行目に別の文）→ 一致しない",
    `${NF}。[1]\n天気は晴れと述べられています[1]。`,
    `${NF}。[1]\n天気は晴れと述べられています[1]。`, 0, true, ["n1"]],
  ["追加F 決まり文句の前に別の語 → 一致しない",
    `残念ながら${NF}。[1]`,
    `残念ながら${NF}。[1]`, 0, true, ["n1"]],
];

// --- fetch の差し替え（【合成値】の Gemini 応答を返す。ネットワークには出ない） ---
let modelText = "";
const calls = [];
global.fetch = async (url) => {
  calls.push(String(url));
  if (String(url).indexOf("generativelanguage.googleapis.com") < 0) throw new Error("想定外の URL: " + url);
  const body = JSON.stringify({
    candidates: [{ content: { parts: [{ text: modelText }] }, finishReason: "STOP" }],
    usageMetadata: { promptTokenCount: 100, candidatesTokenCount: 10 },
  });
  return { status: 200, text: async () => body };
};

function makePlugin() {
  const plugin = Object.create(m.default.prototype);
  plugin.settings = Object.assign({}, m.DEFAULT_SETTINGS, {
    geminiApiKey: "dummy-gemini-key（合成値）", claudeApiKey: "", openaiApiKey: "",
    chatModelPriority: ["gemini-3.5-flash-lite"], chatFallbackMode: "manual",
  });
  plugin.index = { meta: {}, chunks };
  plugin.vectors = new Float32Array(1);
  plugin.indexBlockedReason = null;
  plugin.saveSettings = async () => {};
  plugin.hybridSearch = async () => ({ capped: hits });
  return plugin;
}

(async () => {
  for (const [label, raw, wantText, wantStripped, wantCited, wantNotes] of cases) {
    console.log(`\n=== ${label}（合成値） ===`);
    console.log(`  入力: ${show(raw)}`);

    // 1) 関数を直接呼ぶ（answerQuestion と同じ順: normalize → strip → buildCitationBlock）
    const n = m.normalizeCitationRefs(raw.trim());
    const r = m.stripNotFoundCitations(n.text);
    const block = m.buildCitationBlock(hits, chunks, r.text);
    console.log(`  出力: ${show(r.text)} / 除去 ${r.stripped} 箇所`);
    check("本文が期待どおり", r.text === wantText, show(r.text));
    check(`除去数が ${wantStripped}`, r.stripped === wantStripped, String(r.stripped));
    check(wantCited ? "「### 出典」が出る" : "「### 出典」が出ない", block.split("\n").includes(CITED) === wantCited);
    check("未参照の見出しは常に出る（未参照のノートがあるため）", block.split("\n").includes(UNCITED));
    check(`「### 出典」の下のノートが ${wantNotes.join(",") || "なし"}`, citedNotes(block).join(",") === wantNotes.join(","), citedNotes(block).join(",") || "なし");
    if (wantStripped === 0) check("一致しない／除去 0 なら本文は正規化後のまま", r.text === n.text);

    // 2) answerQuestion を通しで呼ぶ（モデルの出力だけ差し替え）
    modelText = raw;
    calls.length = 0;
    const ctl = { throwIfAborted() {}, isAborted: false, abort() {}, sleep: async () => {} };
    const res = await m.default.prototype.answerQuestion.call(makePlugin(), "質問（合成値）", ctl);
    check("answerQuestion の answer が関数の出力と同じ", res.answer === r.text, show(res.answer));
    check("answerQuestion の citations が関数の出力と同じ", res.citations === block);
    check("通信は Gemini の 1 回だけ（差し替え済み）", calls.length === 1 && calls[0].indexOf("generativelanguage.googleapis.com") >= 0, calls.length + " 回");
  }

  console.log("\n=== 2 回通しても同じ（合成値） ===");
  for (const [label, raw] of cases) {
    const once = m.stripNotFoundCitations(m.normalizeCitationRefs(raw).text);
    const twice = m.stripNotFoundCitations(once.text);
    check(label, twice.text === once.text && twice.stripped === 0);
  }

  console.log(`\n${ng === 0 ? "すべて OK" : "NG " + ng + " 件"}`);
  process.exit(ng === 0 ? 0 : 1);
})();
