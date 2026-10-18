// テストの実行中に、実際の通信が出ないようにする（node --require で先に読み込む）。
// テストが自分で fetch を差し替える場合はそちらが使われる（差し替え後の fetch は通信しない作り）。
let attempted = 0;
globalThis.fetch = async (url) => {
  attempted++;
  throw new Error("テスト中の通信を遮断: " + String(url).replace(/\?.*$/, ""));
};
process.on("exit", () => { console.log(`[通信の遮断] 実際の通信を試みた回数: ${attempted}`); });
