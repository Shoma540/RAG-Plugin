// addSummaryUsage が totalCostUsd を変えないことの確認。入力は【合成値】。
global.window = { setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a) };
global.document = { addEventListener() {}, removeEventListener() {} };
require("./obsidian-stub.js");
const { BUNDLE } = require("./paths.js");   // テスト用のまとめファイルは tests の外（%TEMP%/vault-rag-tests/）
const m = require(BUNDLE);
const plugin = Object.create(m.default.prototype);
plugin.settings = Object.assign({}, m.DEFAULT_SETTINGS, {
  totalInputTokens: 1000, totalOutputTokens: 100, totalCostUsd: 0.0051233,
});
plugin.saveSettings = async () => {};
const logs = [{
  channel: "テストch（合成値）", prevChars: 21531, accepted: true, candidatePath: "",
  attempts: [
    { attempt: 1, chars: 7019, inputTokens: 205000, outputTokens: 2400, truncated: false, tooShort: true, accepted: false },
    { attempt: 2, chars: 10397, inputTokens: 205100, outputTokens: 3600, truncated: false, tooShort: true, accepted: false },
    { attempt: 3, chars: 32215, inputTokens: 205200, outputTokens: 11000, truncated: false, tooShort: false, accepted: true },
  ],
}];
(async () => {
  const before = { ...plugin.settings };
  await m.default.prototype.addSummaryUsage.call(plugin, logs);
  const after = plugin.settings;
  let ng = 0;
  const check = (l, ok, got) => { if (!ok) ng++; console.log(`  ${ok ? "OK  " : "NG  "}${l}${got !== undefined ? `  （実測: ${got}）` : ""}`); };
  console.log("=== addSummaryUsage（入力は全て合成値） ===");
  console.log(`  totalInputTokens  ${before.totalInputTokens} -> ${after.totalInputTokens}`);
  console.log(`  totalOutputTokens ${before.totalOutputTokens} -> ${after.totalOutputTokens}`);
  console.log(`  totalCostUsd      ${before.totalCostUsd} -> ${after.totalCostUsd}`);
  check("入力トークンは 3 回の合計 +615,300", after.totalInputTokens === 1000 + 615300, String(after.totalInputTokens));
  check("出力トークンは 3 回の合計 +17,000", after.totalOutputTokens === 100 + 17000, String(after.totalOutputTokens));
  check("totalCostUsd は 1 円も動かない", after.totalCostUsd === before.totalCostUsd, String(after.totalCostUsd));
  const ref = m.calcChatCostUsd("gemini-3.5-flash-lite", 615300, 17000);
  console.log(`  参考: 有料ティア換算なら $${ref.toFixed(4)}（約${(ref * 150).toFixed(1)}円）。これは通知にだけ出す`);
  console.log(`\n${ng === 0 ? "すべて OK" : "NG " + ng + " 件"}`);
  process.exit(ng === 0 ? 0 : 1);
})();
