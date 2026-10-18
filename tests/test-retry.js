// 自動やり直しのテスト。生成部分を差し替え、入力はすべて【合成値】。API は呼ばない。
const fs = require("fs"); const path = require("path");
global.window = { setTimeout: (...a) => setTimeout(...a), clearTimeout: (...a) => clearTimeout(...a) };
global.document = { addEventListener() {}, removeEventListener() {} };
require("./obsidian-stub.js");
const { BUNDLE, ROOT } = require("./paths.js");   // テスト用のまとめファイルと一時フォルダは tests の外（%TEMP%/vault-rag-tests/）
const m = require(BUNDLE);
const { webcrypto } = require("node:crypto");
if (!global.crypto) global.crypto = webcrypto;

const TMP = path.join(ROOT, "tmp-retry");
const TFile = globalThis.__vaultRagTFile;
const TODAY = new Date().toISOString().slice(0, 10);
let ng = 0;
const check = (l, ok, got) => { if (!ok) ng++; console.log(`    ${ok ? "OK  " : "NG  "}${l}${got !== undefined ? `  （実測: ${got}）` : ""}`); };

function makePlugin(prevChars) {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  const abs = (p) => path.join(TMP, p);
  const files = new Map();
  const adapter = {
    async exists(p) { return fs.existsSync(abs(p)); },
    async read(p) { return fs.readFileSync(abs(p), "utf8"); },
    async write(p, d) { fs.mkdirSync(path.dirname(abs(p)), { recursive: true }); fs.writeFileSync(abs(p), d, "utf8"); },
    async mkdir(p) { fs.mkdirSync(abs(p), { recursive: true }); },
  };
  const vault = {
    adapter,
    getAbstractFileByPath: (p) => files.get(p) || null,
    async modify(f, content) { await adapter.write(f.path, content); },
    async create(p, content) { await adapter.write(p, content); const f = new TFile(); f.path = p; files.set(p, f); },
    async createFolder(p) { await adapter.mkdir(p); },
  };
  const plugin = Object.create(m.default.prototype);
  plugin.app = { vault, workspace: { onLayoutReady: (cb) => cb() } };
  plugin.manifest = { id: "p", dir: "plug" };
  plugin.settings = Object.assign({}, m.DEFAULT_SETTINGS, {
    summaryFolder: "s", summaryIntervalMs: 0, summaryTokenBudgetPerMin: 10000000,
    totalInputTokens: 0, totalOutputTokens: 0, totalCostUsd: 0,
  });
  plugin.activeRun = null;
  plugin.saveSettings = async () => {};
  plugin.verifyOneChannel = async () => null;        // 検証は別テスト済みなので省く
  const outPath = "s/テストch.md";
  if (prevChars > 0) {
    fs.mkdirSync(abs("s"), { recursive: true });
    fs.writeFileSync(abs(outPath), "前".repeat(prevChars), "utf8");
    const f = new TFile(); f.path = outPath; files.set(outPath, f);
  }
  return { plugin, abs, outPath };
}

// 【合成値】の生成結果を順番に返すスタブ
function installFakeBuild(plugin, script, hooks) {
  const calls = [];
  plugin.buildOneChannelSummary = async (group, controller, progress, limiter, writer, attemptLabel) => {
    const n = calls.length;
    const spec = script[n];
    if (!spec) throw new Error("スクリプトを超えて呼ばれた");
    calls.push({ attempt: n + 1, label: attemptLabel, spec });
    if (hooks && hooks.before) await hooks.before(n + 1, controller);
    const head = "---\nfm\n---\n";
    const content = head + "本".repeat(Math.max(0, spec.chars - head.length));
    await writer("s/テストch.md", content, { truncated: !!spec.truncated });
    return {
      channel: group.displayName, variants: [group.displayName], notes: 3,
      sourceChars: 300000, outChars: content.length, ratio: 1,
      inputTokens: spec.inTok, outputTokens: spec.outTok, truncated: !!spec.truncated,
      citationsRepaired: 0, citationsUnresolved: 0, numberResolved: 0, numberUnknown: 0, nonNumeric: 0,
      outPath: "s/テストch.md", existed: true,
    };
  };
  return calls;
}

async function run(label, prevChars, script, hooks) {
  console.log(`\n=== ${label}（入力は全て合成値） ===`);
  const { plugin, abs, outPath } = makePlugin(prevChars);
  const calls = installFakeBuild(plugin, script, hooks);
  const group = { displayName: "テストch", variants: ["テストch"], notes: [{ title: "n1", path: "n/1.md", body: "x" }], chars: 300000 };
  const measured = [{
    key: "k", displayName: "テストch", group,
    sources: [{ path: "n/1.md", size: 10, hash: "h" }],
    summaryExists: prevChars > 0, summarySize: prevChars,
  }];
  const plan = {
    diffs: [{
      key: "k", displayName: "テストch", kind: prevChars > 0 ? "changed" : "new", noteCount: 1, chars: 300000,
      estimatedTokens: 180900, added: ["n/1.md"], removed: [], modified: [], manuallyEdited: false,
      summaryExists: prevChars > 0, overBudget: false,
    }],
    unchangedCount: 0, isFirstRun: false,
  };
  globalThis.__vaultRagNotices.length = 0;
  await m.default.prototype.executeSummaryUpdate.call(plugin, ["k"], measured, plan);

  const visible = globalThis.__vaultRagNotices.filter((x) => !x.hidden);
  const notice = (visible.length > 0 ? visible[visible.length - 1] : { message: "" }).message;
  const cur = fs.existsSync(abs(outPath)) ? fs.readFileSync(abs(outPath), "utf8") : "";
  const bdir = path.join(TMP, "plug/summary-backup", TODAY);
  const backups = fs.existsSync(bdir) ? fs.readdirSync(bdir).sort() : [];
  const statePath = path.join(TMP, "plug/summary-state.json");
  const state = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, "utf8")) : null;

  console.log(`  試行 ${calls.length} 回 / 進捗ラベル: ${calls.map((c) => c.label).join(", ")}`);
  console.log(`  現在のファイル ${cur.length} 文字（前の版 ${prevChars}）`);
  console.log(`  summary-backup: ${backups.join(" / ") || "（なし）"}`);
  console.log(`  summary-state.json: ${state ? "記録あり（size=" + state.channels.k.summarySize + "）" : "記録なし"}`);
  console.log(`  累計トークン: 入力 ${plugin.settings.totalInputTokens} / 出力 ${plugin.settings.totalOutputTokens}`);
  for (const l of notice.split("\n")) {
    if (l.indexOf("テストch:") >= 0 || l.indexOf("生成した回数") >= 0 || l.indexOf("トークン:") >= 0 ||
        l.indexOf("文字") >= 0 || l.indexOf("中断") >= 0) console.log(`  通知> ${l}`);
  }
  return { calls, cur, backups, state, notice, settings: plugin.settings, bdir };
}

(async () => {
  // 1. 短い → 短い → 合格
  {
    const r = await run("1. 短い → 短い → 合格", 21531, [
      { chars: 7019, inTok: 205000, outTok: 2400 },
      { chars: 10397, inTok: 205100, outTok: 3600 },
      { chars: 32047, inTok: 205200, outTok: 11000 },
    ]);
    check("試行は 3 回", r.calls.length === 3, String(r.calls.length));
    check("3 回目の版で上書きされた", r.cur.length === 32047, String(r.cur.length));
    check("退避（前の版）が 1 本ある", r.backups.filter((b) => b.indexOf("候補") < 0).length === 1, r.backups.join(","));
    check("候補ファイルは保存されない", r.backups.filter((b) => b.indexOf("候補") >= 0).length === 0, r.backups.join(","));
    check("記録が更新された", r.state !== null && r.state.channels.k.summarySize === 32047, r.state ? String(r.state.channels.k.summarySize) : "null");
    check("累計トークンは 3 回の合計 615,300 / 17,000",
      r.settings.totalInputTokens === 615300 && r.settings.totalOutputTokens === 17000,
      `${r.settings.totalInputTokens} / ${r.settings.totalOutputTokens}`);
    check("通知に「3回目で上書き（7,019 → 10,397 → 32,047 文字）」",
      r.notice.indexOf("テストch: 3回目で上書き（7,019 → 10,397 → 32,047 文字）") >= 0);
  }

  // 2. 短い ×3
  {
    const r = await run("2. 短い ×3（上書きしない）", 21531, [
      { chars: 7019, inTok: 205000, outTok: 2400 },
      { chars: 10397, inTok: 205100, outTok: 3600 },
      { chars: 5925, inTok: 205200, outTok: 2000 },
    ]);
    check("試行は 3 回", r.calls.length === 3, String(r.calls.length));
    check("前の版が残っている（上書きしていない）", r.cur.length === 21531, String(r.cur.length));
    const cands = r.backups.filter((b) => b.indexOf("候補") >= 0);
    check("候補は 1 本だけ", cands.length === 1, r.backups.join(","));
    check("候補は最長の 10,397 文字",
      cands.length === 1 && fs.readFileSync(path.join(r.bdir, cands[0]), "utf8").length === 10397,
      cands.length === 1 ? String(fs.readFileSync(path.join(r.bdir, cands[0]), "utf8").length) : "—");
    check("退避（前の版）は作られない", r.backups.filter((b) => b.indexOf("候補") < 0).length === 0, r.backups.join(","));
    check("記録は更新されない", r.state === null, r.state ? "記録あり" : "記録なし");
    check("累計トークンは 3 回の合計", r.settings.totalInputTokens === 615300, String(r.settings.totalInputTokens));
    check("通知に「3回とも短すぎるため上書きせず（最長 10,397 / 前 21,531）」",
      r.notice.indexOf("テストch: 3回とも短すぎるため上書きせず（最長 10,397 / 前 21,531）") >= 0);
    check("「0 → 0 文字」の行が出ない", r.notice.indexOf("0 → 0 文字") < 0);
  }

  // 3. 打ち切り（長さは十分）→ 合格
  {
    const r = await run("3. 打ち切り（長さは十分）→ 合格", 21531, [
      { chars: 25000, inTok: 205000, outTok: 65536, truncated: true },
      { chars: 24000, inTok: 205100, outTok: 9000 },
    ]);
    check("試行は 2 回（打ち切りも失敗扱い）", r.calls.length === 2, String(r.calls.length));
    check("2 回目の版で上書きされた", r.cur.length === 24000, String(r.cur.length));
    check("記録が更新された", r.state !== null && r.state.channels.k.summarySize === 24000);
    check("通知に「2回目で上書き（25,000 → 24,000 文字）」", r.notice.indexOf("テストch: 2回目で上書き（25,000 → 24,000 文字）") >= 0);
  }

  // 4. 1回目で合格
  {
    const r = await run("4. 1回目で合格（やり直さない）", 21531, [
      { chars: 20000, inTok: 205000, outTok: 7000 },
    ]);
    check("試行は 1 回だけ", r.calls.length === 1, String(r.calls.length));
    check("上書きされた", r.cur.length === 20000, String(r.cur.length));
    check("通知に「1回目で上書き（20,000 文字）」", r.notice.indexOf("テストch: 1回目で上書き（20,000 文字）") >= 0);
    check("累計トークンは 1 回分", r.settings.totalInputTokens === 205000, String(r.settings.totalInputTokens));
  }

  // 5. 新規チャンネル
  {
    const r = await run("5. 新規チャンネル（前の版なし・極端に短い）", 0, [
      { chars: 300, inTok: 5000, outTok: 100 },
    ]);
    check("長さの判定をしないので 1 回で上書き", r.calls.length === 1 && r.cur.length === 300, `${r.calls.length} 回 / ${r.cur.length} 文字`);
    check("記録が更新された", r.state !== null && r.state.channels.k.summarySize === 300);
  }
  {
    const r = await run("5b. 新規チャンネル（打ち切りだけはやり直す）", 0, [
      { chars: 300, inTok: 5000, outTok: 65536, truncated: true },
      { chars: 400, inTok: 5100, outTok: 150 },
    ]);
    check("打ち切りなのでやり直し、2 回目で上書き", r.calls.length === 2 && r.cur.length === 400, `${r.calls.length} 回 / ${r.cur.length} 文字`);
  }

  // 6. 2回目の途中で中断
  {
    const r = await run("6. 2回目の途中で中断", 21531, [
      { chars: 7019, inTok: 205000, outTok: 2400 },
      { chars: 30000, inTok: 205100, outTok: 9000 },
    ], { before: async (n, controller) => { if (n === 2) { controller.abort(); controller.throwIfAborted(); } } });
    check("2 回目が呼ばれた（その中で中断）", r.calls.length === 2, String(r.calls.length));
    check("前の版が残っている（上書きしていない）", r.cur.length === 21531, String(r.cur.length));
    check("記録は更新されない", r.state === null, r.state ? "記録あり" : "記録なし");
    check("1 回目のトークンは数えられている", r.settings.totalInputTokens === 205000, String(r.settings.totalInputTokens));
    check("中断の通知が出ている", r.notice.indexOf("中断しました") >= 0, r.notice.split("\n")[0]);
  }

  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\n${ng === 0 ? "すべて OK" : "NG " + ng + " 件"}`);
  process.exit(ng === 0 ? 0 : 1);
})();
