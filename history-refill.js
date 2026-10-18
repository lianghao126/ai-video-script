'use strict';

// 历史入口只回填表单，不调用生成引擎；URL 只携带记录 ID。
(() => {
  const params = new URLSearchParams(location.search);
  const source = params.get('history-source');
  const id = params.get('history-id');
  if (!source || !id) return;
  const status = document.getElementById('form-status');
  if (!status) return;
  try {
    const entries = source === 'demo' ? HistoryDemo.entries : source === 'local' ? ScriptHistory.list() : [];
    const entry = entries.find(item => item.id === id);
    if (!entry) throw new Error('missing');
    const r = entry.result;
    const input = source === 'demo' ? entry.input : { topic: r.meta.topic, contentType: r.meta.contentType, platform: r.meta.platform, duration: String(r.plan.total), aspect: r.meta.aspect };
    const ids = { topic: 'topic', contentType: 'content-type', platform: 'platform', duration: 'duration', aspect: 'aspect', materials: 'materials', narration: 'narration', references: 'references', additional: 'additional' };
    for (const key of ['contentType', 'platform', 'aspect']) {
      if (!Array.from(document.getElementById(ids[key]).options).some(option => option.value === input[key])) throw new Error('options');
    }
    if (!Number.isInteger(Number(input.duration)) || Number(input.duration) < 5 || Number(input.duration) > 600) throw new Error('duration');
    for (const [key, fieldId] of Object.entries(ids)) {
      const field = document.getElementById(fieldId);
      const value = String(input[key] || '');
      field.value = field.maxLength > 0 ? value.slice(0, field.maxLength) : value;
      field.dispatchEvent(new Event(field.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
    }
    status.textContent = source === 'demo'
      ? '已填入模拟记录的原始需求。请确认并点击“生成分镜脚本”；当前尚未生成新结果。'
      : '已带回本机记录的主题与成片参数。旧记录未保存完整原始输入，请补充素材、旁白及参考要求后再生成；视频需自行选择。';
    document.getElementById('topic').focus({ preventScroll: true });
  } catch (_) {
    status.textContent = '无法读取这条历史记录，它可能已不在当前浏览器中，或参数不兼容。请重新填写需求，或使用“一键填入示例”。';
  }
  // 防止刷新时再次回填而覆盖用户后续输入。
  try {
    const url = new URL(location.href);
    url.searchParams.delete('history-source');
    url.searchParams.delete('history-id');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch (_) { /* file 模式的地址限制不影响表单回填。 */ }
})();
