// diffSummaryState のテスト。入力はすべて【合成値】。API は呼ばない。
global.window = { setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a) };
global.document = { addEventListener() {}, removeEventListener() {} };
require("./obsidian-stub.js");
const { BUNDLE } = require("./paths.js");   // テスト用のまとめファイルは tests の外（%TEMP%/vault-rag-tests/）
const m = require(BUNDLE);

const BUDGET = 240000;
const src = (p, size, hash) => ({ path: p, size, hash });

// 【合成値】保存済みの状態
const saved = {
  version: 1,
  updatedAt: "2026-10-01T00:00:00.000Z",
  channels: {
    chA: { summaryPath: "s/A.md", summarySize: 1000, summaryHash: "hA", generatedAt: "2026-10-01T00:00:00.000Z",
           sources: [src("n/a1.md", 100, "h1"), src("n/a2.md", 200, "h2")] },
    chB: { summaryPath: "s/B.md", summarySize: 1000, summaryHash: "hB", generatedAt: "2026-10-01T00:00:00.000Z",
           sources: [src("n/b1.md", 100, "h1"), src("n/b2.md", 200, "h2")] },
    chC: { summaryPath: "s/C.md", summarySize: 1000, summaryHash: "hC", generatedAt: "2026-10-01T00:00:00.000Z",
           sources: [src("n/c1.md", 100, "h1")] },
    chD: { summaryPath: "s/D.md", summarySize: 1000, summaryHash: "hD", generatedAt: "2026-10-01T00:00:00.000Z",
           sources: [src("n/d1.md", 100, "h1")] },
    chE: { summaryPath: "s/E.md", summarySize: 1000, summaryHash: "hE", generatedAt: "2026-10-01T00:00:00.000Z",
           sources: [src("n/e1.md", 100, "h1")] },
    chG: { summaryPath: "s/G.md", summarySize: 1000, summaryHash: "hG", generatedAt: "2026-10-01T00:00:00.000Z",
           sources: [src("n/g1.md", 100, "h1")] },
  },
};

// 【合成値】現在の状態
const current = [
  // 追加: a3 が増えた
  { key: "chA", displayName: "A（追加）", noteCount: 3, chars: 3000, summaryExists: true, summaryHash: "hA",
    sources: [src("n/a1.md", 100, "h1"), src("n/a2.md", 200, "h2"), src("n/a3.md", 300, "h3")] },
  // 削除: b2 が消えた
  { key: "chB", displayName: "B（削除）", noteCount: 1, chars: 1000, summaryExists: true, summaryHash: "hB",
    sources: [src("n/b1.md", 100, "h1")] },
  // 変更: c1 のハッシュが違う（サイズは同じ）
  { key: "chC", displayName: "C（変更・サイズ同じ）", noteCount: 1, chars: 1000, summaryExists: true, summaryHash: "hC",
    sources: [src("n/c1.md", 100, "CHANGED")] },
  // 変更なし
  { key: "chD", displayName: "D（変更なし）", noteCount: 1, chars: 1000, summaryExists: true, summaryHash: "hD",
    sources: [src("n/d1.md", 100, "h1")] },
  // 手動編集の疑い（元ノートは変更なし）
  { key: "chE", displayName: "E（手動編集の疑い）", noteCount: 1, chars: 1000, summaryExists: true, summaryHash: "EDITED",
    sources: [src("n/e1.md", 100, "h1")] },
  // 新規チャンネル（保存済みに無い）
  { key: "chF", displayName: "F（新規チャンネル）", noteCount: 2, chars: 2000, summaryExists: false, summaryHash: "",
    sources: [src("n/f1.md", 100, "h1"), src("n/f2.md", 200, "h2")] },
  // 元ノートが全部消えた
  { key: "chG", displayName: "G（元ノートが全部消えた）", noteCount: 0, chars: 0, summaryExists: true, summaryHash: "hG",
    sources: [] },
  // 上限超過（推定 240,000 超）
  { key: "chH", displayName: "H（上限超過）", noteCount: 500, chars: 450000, summaryExists: false, summaryHash: "",
    sources: [src("n/h1.md", 100, "h1")] },
];

const plan = m.diffSummaryState(current, saved, BUDGET);
console.log("=== diffSummaryState のテスト（入力は全て合成値） ===");
console.log(`isFirstRun=${plan.isFirstRun} / 変更なし=${plan.unchangedCount}\n`);
console.log("種別        追加 削除 変更 手動 上限超 推定トークン  表示名");
for (const d of plan.diffs) {
  console.log(
    `${d.kind.padEnd(12)}${String(d.added.length).padStart(3)}${String(d.removed.length).padStart(5)}` +
    `${String(d.modified.length).padStart(5)}${(d.manuallyEdited ? "  ○" : "  -").padStart(5)}` +
    `${(d.overBudget ? "  ○" : "  -").padStart(6)}${String(d.estimatedTokens).padStart(12)}  ${d.displayName}`,
  );
}

console.log("\n--- 期待との照合 ---");
const get = (k) => plan.diffs.find((d) => d.key === k);
const checks = [
  ["chA 追加1件 / changed", get("chA").kind === "changed" && get("chA").added.length === 1],
  ["chB 削除1件 / changed", get("chB").kind === "changed" && get("chB").removed.length === 1],
  ["chC 変更1件（サイズ同じでもハッシュで検知）", get("chC").kind === "changed" && get("chC").modified.length === 1],
  ["chD unchanged", get("chD").kind === "unchanged"],
  ["chE unchanged かつ 手動編集の疑い", get("chE").kind === "unchanged" && get("chE").manuallyEdited === true],
  ["chF new", get("chF").kind === "new"],
  ["chG sourcesGone", get("chG").kind === "sourcesGone"],
  ["chH overBudget", get("chH").overBudget === true],
  ["unchangedCount は 2（D と E）", plan.unchangedCount === 2],
];
for (const [label, ok] of checks) console.log(`  ${ok ? "OK  " : "NG  "}${label}`);

console.log("\n=== 初回（saved=null）===");
const first = m.diffSummaryState(current, null, BUDGET);
console.log(`isFirstRun=${first.isFirstRun} / 全件が "new" か: ${first.diffs.every((d) => d.kind === "new") ? "OK" : "NG"}`);

console.log("\n=== トークン推定（実測比 0.603） ===");
for (const chars of [185993, 350059, 398000, 450000]) {
  const t = m.estimateInputTokens(chars);
  console.log(`  ${chars.toLocaleString()} 文字 → ${t.toLocaleString()} トークン  ${t > BUDGET ? "⛔ 上限超過" : "OK"}`);
}
