// groupSummaryUpdateTargets のテスト。入力はすべて【合成値】。API は呼ばない。
global.window = { setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a) };
global.document = { addEventListener() {}, removeEventListener() {} };
require("./obsidian-stub.js");
const { BUNDLE } = require("./paths.js");   // テスト用のまとめファイルは tests の外（%TEMP%/vault-rag-tests/）
const m = require(BUNDLE);

const BUDGET = 240000;
const src = (p, size, hash) => ({ path: p, size, hash });
let ng = 0;
const check = (label, ok, got) => { if (!ok) ng++; console.log(`  ${ok ? "OK  " : "NG  "}${label}${got !== undefined ? `  （実測: ${got}）` : ""}`); };

// ---- 【合成値】保存済みの状態 ----
const saved = {
  version: 1, updatedAt: "2026-10-01T00:00:00.000Z",
  channels: {
    chA: { summaryPath: "s/A.md", summarySize: 1000, summaryHash: "hA", generatedAt: "", sources: [src("n/a1.md", 100, "h1")] },
    chB: { summaryPath: "s/B.md", summarySize: 1000, summaryHash: "hB", generatedAt: "", sources: [src("n/b1.md", 100, "h1")] },
    chC: { summaryPath: "s/C.md", summarySize: 1000, summaryHash: "hC", generatedAt: "", sources: [src("n/c1.md", 100, "h1")] },
    chD: { summaryPath: "s/D.md", summarySize: 1000, summaryHash: "hD", generatedAt: "", sources: [src("n/d1.md", 100, "h1")] },
    chE: { summaryPath: "s/E.md", summarySize: 1000, summaryHash: "hE", generatedAt: "", sources: [src("n/e1.md", 100, "h1")] },
    chF: { summaryPath: "s/F.md", summarySize: 1000, summaryHash: "hF", generatedAt: "", sources: [src("n/f1.md", 100, "h1")] },
  },
};
// ---- 【合成値】現在の状態 ----
const current = [
  // 変更あり（元ノートのハッシュが違う / まとめノートは記録どおり）
  { key: "chA", displayName: "A 変更あり（合成値）", noteCount: 1, chars: 1000, summaryExists: true, summaryHash: "hA",
    sources: [src("n/a1.md", 100, "CHANGED")] },
  // 変更あり ＋ 手動編集
  { key: "chB", displayName: "B 変更あり＋手動編集（合成値）", noteCount: 1, chars: 1000, summaryExists: true, summaryHash: "EDITED",
    sources: [src("n/b1.md", 100, "CHANGED")] },
  // 手動編集のみ（元ノートは変わっていない）
  { key: "chC", displayName: "C 手動編集のみ（合成値）", noteCount: 1, chars: 1000, summaryExists: true, summaryHash: "EDITED",
    sources: [src("n/c1.md", 100, "h1")] },
  // 変更なし
  { key: "chD", displayName: "D 変更なし（合成値）", noteCount: 1, chars: 1000, summaryExists: true, summaryHash: "hD",
    sources: [src("n/d1.md", 100, "h1")] },
  // 変更なし ＋ 上限超過
  { key: "chE", displayName: "E 変更なし＋上限超過（合成値）", noteCount: 500, chars: 450000, summaryExists: true, summaryHash: "hE",
    sources: [src("n/e1.md", 100, "h1")] },
  // 元ノートが全部消えた
  { key: "chF", displayName: "F 元ノートなし（合成値）", noteCount: 0, chars: 0, summaryExists: true, summaryHash: "hF",
    sources: [] },
  // 新規チャンネル
  { key: "chG", displayName: "G 新規（合成値）", noteCount: 2, chars: 2000, summaryExists: false, summaryHash: "",
    sources: [src("n/g1.md", 100, "h1"), src("n/g2.md", 200, "h2")] },
];

const plan = m.diffSummaryState(current, saved, BUDGET);
const g = m.groupSummaryUpdateTargets(plan);

console.log("=== groupSummaryUpdateTargets（入力は全て合成値） ===");
const names = (arr) => arr.map((d) => d.displayName.replace("（合成値）", "")).join(" / ") || "（なし）";
console.log(`  作り直しが必要 (${g.needsRebuild.length}): ${names(g.needsRebuild)}`);
console.log(`  手動編集の疑い (${g.manuallyEdited.length}): ${names(g.manuallyEdited)}`);
console.log(`  変更なし       (${g.unchanged.length}): ${names(g.unchanged)}`);
console.log(`  元ノートなし   (${g.sourcesGone.length}): ${names(g.sourcesGone)}`);
console.log(`  既定でチェック: ${g.defaultSelected.join(" / ") || "（なし）"}`);
console.log(`  チェック可能な数: ${g.selectableCount}\n`);

const has = (arr, k) => arr.some((d) => d.key === k);
check("A（変更あり）は 作り直しが必要", has(g.needsRebuild, "A".replace("A", "chA")));
check("B（変更あり＋手動編集）は 作り直しが必要", has(g.needsRebuild, "chB"));
check("B には手動編集の警告が付く", g.needsRebuild.find((d) => d.key === "chB").manuallyEdited === true);
check("B は手動編集グループには入らない", !has(g.manuallyEdited, "chB"));
check("C（手動編集のみ）は 手動編集グループ", has(g.manuallyEdited, "chC"));
check("D（変更なし）は 変更なしグループ", has(g.unchanged, "chD"));
check("E（変更なし＋上限超過）は 変更なしグループ", has(g.unchanged, "chE"));
check("E は overBudget=true", g.unchanged.find((d) => d.key === "chE").overBudget === true);
check("F（元ノートなし）は 元ノートなしグループ", has(g.sourcesGone, "chF"));
check("G（新規）は 作り直しが必要", has(g.needsRebuild, "chG"));
check("既定でチェックされるのは A / B / G の 3 件",
  g.defaultSelected.length === 3 && ["chA", "chB", "chG"].every((k) => g.defaultSelected.indexOf(k) >= 0),
  g.defaultSelected.join(","));
check("手動編集・変更なしは既定でチェックされない",
  g.defaultSelected.indexOf("chC") < 0 && g.defaultSelected.indexOf("chD") < 0);
check("チェック可能な数は 5（A/B/G/C/D。E は上限超過・F は不可）", g.selectableCount === 5, String(g.selectableCount));

console.log("\n=== 0 件チェックの扱い ===");
// モーダルは selected.size === 0 でボタンを無効化する。その条件になる計画を作る
const allOver = m.diffSummaryState(
  [{ key: "chX", displayName: "X 上限超過だけ（合成値）", noteCount: 9, chars: 450000, summaryExists: false, summaryHash: "", sources: [src("n/x.md", 1, "h")] }],
  { version: 1, updatedAt: "", channels: {} }, BUDGET,
);
const gx = m.groupSummaryUpdateTargets(allOver);
check("上限超過しかない場合、既定でチェック 0 件", gx.defaultSelected.length === 0, String(gx.defaultSelected.length));
check("上限超過しかない場合、チェック可能 0 件 → 実行は押せない", gx.selectableCount === 0, String(gx.selectableCount));

console.log("\n=== 全グループに安全装置が効くことの確認 ===");
// 50% の歯止めはグループに関係なく writer の中で判定する。判定関数は共通
for (const [label, prev, next] of [["変更なしを選んで劣化（合成値）", 21531, 5925], ["手動編集を選んで正常（合成値）", 11631, 10440]]) {
  const j = m.judgeSummaryLength(prev, next);
  console.log(`  ${label}: ${prev} → ${next} = ${j.ratio.toFixed(1)}% → ${j.skipped ? "上書きしない" : "上書きする"}`);
}
check("グループに関係なく同じ judgeSummaryLength を通る", m.judgeSummaryLength(21531, 5925).skipped === true);

console.log(`\n${ng === 0 ? "すべて OK" : "NG " + ng + " 件"}`);
