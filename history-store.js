'use strict';

// 只保存文字脚本，不保存视频、Object URL 或录音。
const ScriptHistory = (() => {
  const key = 'video-script-ai.history.v1';
  const limit = 20;
  function valid(entry) {
    const r = entry?.result;
    return typeof entry?.id === 'string' && Number.isFinite(Date.parse(entry.updatedAt)) &&
      typeof entry.text === 'string' && typeof r?.meta?.topic === 'string' &&
      typeof r.meta.contentType === 'string' && typeof r.meta.platform === 'string' &&
      typeof r.meta.aspect === 'string' && typeof r.notes === 'string' &&
      Number.isInteger(r.plan?.total) && r.plan.total >= 5 && r.plan.total <= 600 &&
      Array.isArray(r.shots) && r.shots.length > 0 && r.shots.length <= 600 &&
      r.shots.every(s => Number.isInteger(s.start) && Number.isInteger(s.end) &&
        Number.isInteger(s.duration) && ['phase', 'purpose', 'visual', 'voice', 'subtitle', 'editing'].every(k => typeof s[k] === 'string'));
  }
  function list() {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) throw new Error('历史记录格式无效');
    return entries.filter(valid).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)).slice(0, limit);
  }
  function save(result, text, existingId) {
    let entries;
    try { entries = list(); } catch (_) { entries = []; }
    const now = new Date().toISOString();
    const id = existingId || now + '-' + Math.random().toString(36).slice(2, 10);
    const old = entries.find(entry => entry.id === id);
    const snapshot = JSON.parse(JSON.stringify({ intro: result.intro, notes: result.notes, plan: result.plan, meta: result.meta, shots: result.shots }));
    const entry = { id, createdAt: old?.createdAt || now, updatedAt: now, result: snapshot, text };
    if (!valid(entry)) throw new Error('脚本数据无效');
    entries = [entry, ...entries.filter(item => item.id !== id)].slice(0, limit);
    localStorage.setItem(key, JSON.stringify(entries));
    return id;
  }
  return { list, save };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ScriptHistory;
