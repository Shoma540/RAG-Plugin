// 長さの歯止め・設定の差分・通知の警告のテスト。入力はすべて【合成値】。API は呼ばない。
const fs = require("fs"); const path = require("path");
global.window = { setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a) };
global.document = { addEventListener() {}, removeEventListener() {} };
require("./obsidian-stub.js");
const { BUNDLE, ROOT, DATA_COPY } = require("./paths.js");   // テスト用のまとめファイルと一時フォルダは tests の外（%TEMP%/vault-rag-tests/）
const m = require(BUNDLE);
// data.json: 本物を読み、API キー 3 つを空文字にしたコピーを DATA_COPY（%TEMP%/vault-rag-tests/data.json）に書いて使う。
// 本物には書き込まない。コピーはプロセスの終了時に必ず消す（最後まで通っても、途中で失敗しても）
process.on("exit", () => fs.rmSync(DATA_COPY, { force: true }));
{
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "data.json"), "utf8"));
  for (const k of ["openaiApiKey", "geminiApiKey", "claudeApiKey"]) if (k in data) data[k] = "";
  fs.mkdirSync(path.dirname(DATA_COPY), { recursive: true });
  fs.writeFileSync(DATA_COPY, JSON.stringify(data, null, 2), "utf8");
}

let ng = 0;
const check = (label, ok, got) => { if (!ok) ng++; console.log(`  ${ok ? "OK  " : "NG  "}${label}${got !== undefined ? `  （実測: ${got}）` : ""}`); };

console.log("=== 1. judgeSummaryLength（入力は全て合成値） ===");
console.log(`  閾値の定数 SUMMARY_MIN_RATIO_VS_PREVIOUS = ${m.SUMMARY_MIN_RATIO_VS_PREVIOUS}`);
const cases = [
  ["50% 未満（劣化）",        21531, 5925,  true ],
  ["ちょうど 50%",            10000, 5000,  false],
  ["50% を 1 文字下回る",     10000, 4999,  true ],
  ["50% を 1 文字上回る",     10000, 5001,  false],
  ["正常（約 90%）",          11631, 10440, false],
  ["長くなった（120%）",      10000, 12000, false],
  ["前の版が無い（新規）",         0, 300,   false],
  ["新規で極端に短い",             0, 10,    false],
];
for (const [label, prev, next, wantSkip] of cases) {
  const g = m.judgeSummaryLength(prev, next);
  check(`${label}: ${prev} → ${next}`, g.skipped === wantSkip,
    `skipped=${g.skipped} / ok=${g.ok} / ${prev > 0 ? g.ratio.toFixed(1) + "%" : "判定なし"}`);
}

console.log("\n=== 2. 候補ファイルの連番（実ファイルで確認。バックアップ用の一時フォルダに書く） ===");
const tmp = path.join(ROOT, "tmp-backup");
fs.rmSync(tmp, { recursive: true, force: true });
fs.mkdirSync(tmp, { recursive: true });
// backupSummaryNote の連番規則をそのまま再現して確認する（プラグインのメソッドを呼ぶ）
const adapter = {
  async exists(p) { return fs.existsSync(path.join(tmp, p)); },
  async read(p) { return fs.readFileSync(path.join(tmp, p), "utf8"); },
  async write(p, d) { fs.mkdirSync(path.dirname(path.join(tmp, p)), { recursive: true }); fs.writeFileSync(path.join(tmp, p), d, "utf8"); },
  async mkdir(p) { fs.mkdirSync(path.join(tmp, p), { recursive: true }); },
};
const plugin = Object.create(m.default.prototype);
plugin.app = { vault: { adapter } };
plugin.manifest = { id: "p", dir: "plug" };
plugin.settings = Object.assign({}, m.DEFAULT_SETTINGS);
(async () => {
  const out = "Source/Obsidian/チャンネルまとめ/テストch.md";
  await adapter.write(out, "前の版の中身（合成値）");
  const paths = [];
  for (let i = 1; i <= 3; i++) {
    paths.push(await m.default.prototype["backupSummaryNote"].call(plugin, out, "_候補", `候補${i}（合成値）`));
  }
  const b1 = await m.default.prototype["backupSummaryNote"].call(plugin, out);
  const b2 = await m.default.prototype["backupSummaryNote"].call(plugin, out);
  const base = (p) => p.slice(p.lastIndexOf("/") + 1);
  check("候補 1 本目は _候補.md",   base(paths[0]) === "テストch_候補.md",   base(paths[0]));
  check("候補 2 本目は _候補_2.md", base(paths[1]) === "テストch_候補_2.md", base(paths[1]));
  check("候補 3 本目は _候補_3.md", base(paths[2]) === "テストch_候補_3.md", base(paths[2]));
  check("候補の中身が新しい版",     fs.readFileSync(path.join(tmp, paths[0]), "utf8") === "候補1（合成値）");
  check("退避 1 本目は 連番なし",   base(b1) === "テストch.md",   base(b1));
  check("退避 2 本目は _2.md",      base(b2) === "テストch_2.md", base(b2));
  check("退避の中身は前の版",       fs.readFileSync(path.join(tmp, b1), "utf8") === "前の版の中身（合成値）");
  const gone = await m.default.prototype["backupSummaryNote"].call(plugin, "Source/Obsidian/チャンネルまとめ/無い.md");
  check("存在しないファイルの退避は null", gone === null, String(gone));

  console.log("\n=== 3. detectSettingsDrift（入力は全て合成値） ===");
  const defaults = { a: 1, arr: ["x", "y", "z"], onlyInDefault: true };
  const d1 = m.detectSettingsDrift(defaults, { a: 1, arr: ["x"] });
  check("配列に足りない要素 y / z を検出", JSON.stringify(d1.missingArrayItems) === '[{"key":"arr","items":["y","z"]}]', JSON.stringify(d1.missingArrayItems));
  check("無いキー onlyInDefault は通知しない（2026-10-03 仕様変更）", !("missingKeys" in d1), Object.keys(d1).join(","));
  const d2 = m.detectSettingsDrift(defaults, { a: 9, arr: ["z", "y", "x", "w"], onlyInDefault: false });
  check("並び順違い・余分な要素は差分としない", d2.missingArrayItems.length === 0);
  const d3 = m.detectSettingsDrift(defaults, null);
  check("保存値なし（初回起動）は差分なし", d3.missingArrayItems.length === 0);

  console.log("\n=== 4. 実際の DEFAULT_SETTINGS と data.json（%TEMP% のコピー。API キーは空） ===");
  const saved = JSON.parse(fs.readFileSync(DATA_COPY, "utf8"));
  check("コピーの API キー 3 つは空文字", ["openaiApiKey", "geminiApiKey", "claudeApiKey"].every((k) => !(k in saved) || saved[k] === ""));
  const real = m.detectSettingsDrift(m.DEFAULT_SETTINGS, saved);
  check("配列の差分 0 件", real.missingArrayItems.length === 0, JSON.stringify(real.missingArrayItems));
  check("missingKeys は返さない", !("missingKeys" in real), Object.keys(real).join(","));

  console.log("\n=== 5. 短すぎ・打ち切り（MAX_TOKENS）の警告（通知の組み立てを合成値で確認） ===");
  // reportSummaryUpdate を今の引数の形で呼び、通知の文面を見る（2026-10-10 に今のコードに合わせた）。
  // 第 5 引数はチャンネルごとの試行の経過（SummaryAttemptLog[]）。警告の行は describeAttempts() が作る。
  // 打ち切られた版は上書きしないので、done（上書きしたチャンネル）には正常ch だけが入る
  globalThis.__vaultRagNotices.length = 0;
  const mk = (ch) => ({
    channel: ch, variants: [ch], notes: 3, sourceChars: 1000, outChars: 900, ratio: 90,
    inputTokens: 600, outputTokens: 400, truncated: false, citationsRepaired: 0, citationsUnresolved: 0,
    numberResolved: 3, numberUnknown: 0, nonNumeric: 0, outPath: `s/${ch}.md`, existed: true,
  });
  const at = (attempt, chars, flags) => Object.assign(
    { attempt, chars, inputTokens: 600, outputTokens: 400, truncated: false, tooShort: false, accepted: false }, flags);
  const logs = [
    { channel: "短すぎたch（合成値）", prevChars: 21531, accepted: false, candidatePath: "x/短すぎたch_候補.md",
      attempts: [at(1, 5925, { tooShort: true }), at(2, 7019, { tooShort: true }), at(3, 10397, { tooShort: true })] },
    { channel: "打ち切られたch（合成値）", prevChars: 20000, accepted: false, candidatePath: "x/打ち切られたch_候補.md",
      attempts: [at(1, 15000, { truncated: true }), at(2, 16000, { truncated: true }), at(3, 17000, { truncated: true })] },
    { channel: "正常ch（合成値）", prevChars: 1000, accepted: true, candidatePath: "",
      attempts: [at(1, 900, { accepted: true })] },
  ];
  await m.default.prototype["reportSummaryUpdate"].call(
    plugin,
    [mk("正常ch（合成値）")],
    [],
    [],
    ["dummy-backup"],
    logs,
    3, Date.now() - 60000,
    { diffs: [], unchangedCount: 5, isFirstRun: false },
  );
  const msg = globalThis.__vaultRagNotices[globalThis.__vaultRagNotices.length - 1].message;
  console.log("--- 通知の本文 ---");
  console.log(msg.split("\n").map((l) => "  " + l).join("\n"));
  check("短すぎた警告が出る", msg.indexOf("⚠ 短すぎたch（合成値）: 3回とも短すぎるため上書きせず（最長 10,397 / 前 21,531）") >= 0);
  check("MAX_TOKENS（打ち切り）の警告が出る", msg.indexOf("⚠ 打ち切られたch（合成値）: 3回とも打ち切られたため上書きせず（最長 17,000 / 前 20,000）") >= 0);
  check("上書きしたチャンネルには ⚠ が付かない",
    msg.indexOf("\n正常ch（合成値）: 1回目で上書き（900 文字）") >= 0 && msg.indexOf("⚠ 正常ch") < 0);
  check("作り直しの件数は done の 1 件", msg.indexOf("作り直し: 1 / 3 チャンネル") >= 0);

  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${ng === 0 ? "すべて OK" : "NG " + ng + " 件"}`);
})();
