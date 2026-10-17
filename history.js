'use strict';

(() => {
  const list = document.getElementById('history-list');
  const status = document.getElementById('history-status');
  const clock = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function render() {
    list.replaceChildren();
    let entries;
    try { entries = ScriptHistory.list(); }
    catch (_) {
      document.getElementById('history-empty').hidden = true;
      status.textContent = '无法读取历史记录：浏览器存储可能受限或记录已损坏。可返回工作台继续生成。';
      return;
    }
    document.getElementById('history-empty').hidden = entries.length !== 0;
    status.textContent = entries.length ? `共 ${entries.length} 份脚本 · 点击记录展开查看` : '';
    for (const entry of entries) {
      const r = entry.result;
      const card = node('details', 'card history-record');
      const summary = node('summary', 'history-record-heading');
      const copy = node('div', 'history-record-title');
      copy.append(node('h2', '', r.meta.topic), node('p', '', `${r.meta.contentType} · ${r.meta.platform} · ${r.plan.total} 秒 · ${r.meta.aspect} · ${r.shots.length} 镜`));
      const aside = node('div', 'history-record-aside');
      const time = node('time', '', new Date(entry.updatedAt).toLocaleString('zh-CN', { hour12: false }));
      time.dateTime = entry.updatedAt;
      aside.append(time, node('span', 'history-record-toggle', '查看脚本 ⌄'));
      summary.append(copy, aside);
      card.append(summary);
      // 展开时才创建表格，避免一次渲染全部历史分镜。
      card.addEventListener('toggle', () => {
        if (!card.open || card.dataset.loaded) return;
        card.dataset.loaded = 'true';
        const body = node('div', 'history-record-body');
        const scroll = node('div', 'storyboard-scroll');
        scroll.tabIndex = 0;
        scroll.setAttribute('role', 'region');
        scroll.setAttribute('aria-label', r.meta.topic + '的历史分镜表格，可左右滚动');
        const table = node('table', 'storyboard-table history-table');
        table.append(node('caption', 'visually-hidden', r.meta.topic + '的历史分镜脚本'));
        const cols = node('colgroup');
        for (let i = 0; i < 5; i++) cols.append(node('col', i === 0 ? 'time-column' : ''));
        const head = node('thead');
        const headerRow = node('tr');
        for (const label of ['镜头 / 时间', '画面', '旁白 / 口播', '字幕', '剪辑说明']) {
          const th = node('th', '', label); th.scope = 'col'; headerRow.append(th);
        }
        head.append(headerRow);
        const rows = node('tbody');
        for (const shot of r.shots) {
          const row = node('tr');
          const th = node('th'); th.scope = 'row';
          th.append(node('span', 'shot-number', `镜头 ${String(shot.index).padStart(2, '0')}`), node('span', 'shot-time', `${clock(shot.start)}—${clock(shot.end)}`), node('span', 'shot-duration', `${shot.duration} 秒`), node('span', 'shot-purpose', `${shot.phase} · ${shot.purpose}`));
          row.append(th);
          for (const key of ['visual', 'voice', 'subtitle', 'editing']) row.append(node('td', '', shot[key]));
          rows.append(row);
        }
        table.append(cols, head, rows); scroll.append(table); body.append(scroll);
        const notes = node('details', 'script-notes');
        notes.append(node('summary', '', '创作依据、配乐与待补充信息'), node('pre', '', r.notes));
        const actions = node('div', 'history-record-actions');
        const button = node('button', 'button secondary', '复制脚本'); button.type = 'button';
        const feedback = node('p', 'field-help'); feedback.setAttribute('role', 'status');
        button.addEventListener('click', async () => {
          try {
            await navigator.clipboard.writeText(entry.text);
            feedback.textContent = '脚本已复制。';
          } catch (_) {
            let area = body.querySelector('.history-manual-copy');
            if (!area) {
              area = node('textarea', 'history-manual-copy'); area.readOnly = true;
              area.setAttribute('aria-label', '手动复制历史脚本'); area.value = entry.text; body.append(area);
            }
            area.focus(); area.select();
            feedback.textContent = '自动复制不可用，请按 Ctrl+C，手机长按正文复制。';
          }
        });
        actions.append(button, feedback); body.append(notes, actions); card.append(body);
      });
      list.append(card);
    }
  }
  render();
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  window.addEventListener('storage', render);
})();
