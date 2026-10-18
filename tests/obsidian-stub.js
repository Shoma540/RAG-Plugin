// Node で main.ts を実機と同じコードパスで動かすためのスタブ。
globalThis.__vaultRagNotices = globalThis.__vaultRagNotices || [];
const notices = globalThis.__vaultRagNotices;

class Notice {
  constructor(message, duration) {
    this.message = message;
    this.hidden = false;
    notices.push(this);
  }
  hide() { this.hidden = true; }
}
class Plugin {}
class PluginSettingTab {}
class Setting {}
// --alias でこのスタブがバンドルに取り込まれるため、ハーネス側と同一クラスにする必要がある。
// globalThis に置いて両者で共有し、instanceof が成立するようにする。
globalThis.__vaultRagTFile = globalThis.__vaultRagTFile || class TFile {};
const TFile = globalThis.__vaultRagTFile;
class App {}
class Modal { constructor(app) { this.app = app; } open() {} close() {} }
class ItemView { constructor(leaf) { this.leaf = leaf; } }
class WorkspaceLeaf {}
const MarkdownRenderer = { async render() {} };

function normalizePath(p) { return p.replace(/\\/g, "/").replace(/\/+/g, "/"); }

/**
 * ⚠ 以下2つは Obsidian 内部関数の「近似スタブ」。本物ではない。
 * Obsidian 本体は Electron 内でしか動かないため Node では実行できない。
 * 公開されている挙動（simple は空白区切りの全語一致 / fuzzy は文字の部分列一致）を再現している。
 * ここで得たキーワード検索のスコアは参考値であり、実機での確認が必要。
 */
function prepareSimpleSearch(query) {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 0);
  return (text) => {
    const lower = text.toLowerCase();
    const matches = [];
    let score = 0;
    for (const t of terms) {
      const at = lower.indexOf(t);
      if (at < 0) return null;                 // 1語でも無ければ不一致
      matches.push([at, at + t.length]);
      score += t.length * 1.0 - at * 0.001;    // 長い語ほど加点、位置が前ほど加点
    }
    return { score, matches };
  };
}

function prepareFuzzySearch(query) {
  const q = query.toLowerCase().replace(/\s+/g, "");
  return (text) => {
    const lower = text.toLowerCase();
    let pos = 0;
    let hits = 0;
    let lastAt = -1;
    let contiguous = 0;
    for (const ch of q) {
      const at = lower.indexOf(ch, pos);
      if (at < 0) return null;                 // 部分列として含まれなければ不一致
      if (at === lastAt + 1) contiguous++;
      hits++;
      lastAt = at;
      pos = at + 1;
    }
    // 連続して当たった分を重く見る（本物も連続一致を優遇する）
    const score = hits * 0.1 + contiguous * 1.0 - (pos / Math.max(1, lower.length)) * 0.5;
    return { score, matches: [] };
  };
}

async function requestUrl(opts) {
  const res = await fetch(opts.url, { method: opts.method || "GET", headers: opts.headers, body: opts.body });
  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* JSON でないことがある */ }
  return { status: res.status, text, json };
}

module.exports = {
  Plugin, PluginSettingTab, Notice, Setting, TFile, App, Modal, ItemView, WorkspaceLeaf, MarkdownRenderer,
  normalizePath, prepareFuzzySearch, prepareSimpleSearch, requestUrl, __notices: notices,
};
