# My-Vault-RAG-Plugin のテスト

src/main.ts のコードを Obsidian の外（Node）で動かして確かめるテスト。
入力はすべて合成値で、API は呼ばない。実行中の通信は block-net.js で遮断する。

## ファイル

| ファイル | 内容 |
|---|---|
| test-diff.js | まとめノートの変更検知（diffSummaryState） |
| test-guard.js | 長さの歯止め・候補ファイルの連番・設定の差の通知・まとめ更新の通知 |
| test-groups.js | 確認モーダルの 3 グループ分け（groupSummaryUpdateTargets） |
| test-retry.js | まとめ生成の自動やり直し |
| test-cost.js | まとめ生成の使用量が累計費用（totalCostUsd）を変えないこと |
| test-freetier.js | Gemini 無料枠（geminiFreeTier）の費用の扱い |
| test-notfound.js | 「見つかりませんでした」の段落の `[N]` を取り除く処理（stripNotFoundCitations） |
| obsidian-stub.js | obsidian モジュールの代わり。テスト用のまとめファイルに組み込む |
| block-net.js | 実行中の通信を遮断する（`node --require` で読み込む） |
| paths.js | テストが使う場所（下の表）をまとめたもの |

## テストが使う場所（tests の外。paths.js で決めている）

すべて `%TEMP%/vault-rag-tests/` の下に置く。

| 場所 | 内容 |
|---|---|
| test-bundle.js | テスト用のまとめファイル。実行のたびに今の src から作り直す（下の手順 1） |
| data.json | 本物の data.json から API キー 3 つを空文字にしたコピー。test-guard.js と test-freetier.js が開始時に書き、終わると消す（途中で失敗しても消す） |
| tmp-backup/ | test-guard.js の一時フォルダ（終わると消える。途中で失敗したときは残り、次に流したときに消える。中身は合成値） |
| tmp-retry/ | test-retry.js の一時フォルダ（同上） |

- 本物の data.json は読むだけで、書き込まない
- コピーでは API キー 3 つ（openaiApiKey / geminiApiKey / claudeApiKey）を空文字にしてある。
  テストは API キーの値を画面にもログにも出さない
- コピーは、テストのプロセスが終わるときに必ず消す（`process.on("exit")`。最後まで通っても、途中で失敗しても）

## 流し方（PowerShell。プラグインのフォルダで実行する）

### 1. テスト用のまとめファイルを、今の src から作る（実行のたびに作り直す）

```
npx esbuild src/main.ts --bundle --alias:obsidian=./tests/obsidian-stub.js --external:electron --format=cjs --target=es2018 --outfile="$env:TEMP/vault-rag-tests/test-bundle.js"
```

- 出力先は `%TEMP%/vault-rag-tests/` だけ。tests にも、プラグインの main.js にも出力しない
- プラグイン本体のビルド（CLAUDE.md の「ビルド」のコマンド。main.js を作る）とは別物。
  obsidian をスタブに差し替えて、Node で動かすためのもの

### 2. 7 本を、通信を遮断して流す

```
[Console]::OutputEncoding = [Text.Encoding]::UTF8
Get-ChildItem tests/test-*.js | ForEach-Object {
  $out = node --require ./tests/block-net.js $_.FullName 2>&1
  $ok = @($out | Select-String '^\s*OK  ').Count
  $ng = @($out | Select-String '^\s*NG  ').Count
  $net = ($out | Select-String '^\[通信の遮断\]').Line
  "{0}`texit={1}`tOK={2}`tNG={3}`t{4}" -f $_.Name, $LASTEXITCODE, $ok, $ng, $net
}
```

全部通ったときは、7 本とも `exit=0`・`NG=0` で、「実際の通信を試みた回数: 0」になる。
流した後の `%TEMP%/vault-rag-tests/` に data.json は残らない（残るのは test-bundle.js だけ）。

1 本ずつ中身を見るときは、次のように流す。

```
node --require ./tests/block-net.js tests/test-guard.js
```
