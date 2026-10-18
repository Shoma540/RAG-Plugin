// テストで使う場所をまとめる（2026-10-10）。
// - テスト用のまとめファイル（test-bundle.js）と一時フォルダは tests の外（%TEMP%/vault-rag-tests/）に置く。
//   test-bundle.js は実行のたびに今の src から作り直す（作り方は README.md）
// - テストは本物の data.json を直接は使わない。test-guard.js と test-freetier.js が、本物を読んで API キー 3 つを
//   空文字にしたコピーを DATA_COPY（%TEMP%/vault-rag-tests/data.json）に書き、テストの終了時に消す。本物には書き込まない
const os = require("os");
const path = require("path");

const ROOT = path.join(os.tmpdir(), "vault-rag-tests");
const BUNDLE = path.join(ROOT, "test-bundle.js");
const DATA_COPY = path.join(ROOT, "data.json");

module.exports = { ROOT, BUNDLE, DATA_COPY };
