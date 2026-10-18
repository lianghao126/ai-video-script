'use strict';

(() => {
  const byId = id => document.getElementById(id);
  const list = byId('history-list');
  const status = byId('history-status');
  let source = 'demo';
  let emptyDemo = false;
  const clock = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function appendDetail(body, entry) {
    const r = entry.result;
    const inputs = node('section', 'history-input-detail');
    inputs.append(node('h3', '', '原始输入'));
    if (source === 'demo') {
      const data = node('dl');
      for (const [key, label] of [['topic', '视频主题'], ['materials', '自有素材'], ['narration', '旁白文案'], ['references', '参考特点'], ['additional', '其他要求']]) {
        data.append(node('dt', '', label), node('dd', '', entry.input[key] || '未填写'));
      }
      inputs.append(data);
    } else {
      inputs.append(node('p', '', '旧本机记录未保留完整原始输入，仅能确认主题与成片参数。再次生成时请补充素材、旁白及参考要求；以下为已保存的脚本。'));
    }
    body.append(inputs);
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
      button.disabled = true;
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
      } finally { button.disabled = false; }
    });
    actions.append(button, feedback); body.append(notes, actions);
  }

  function render() {
    list.replaceChildren();
    byId('history-demo').setAttribute('aria-pressed', String(source === 'demo'));
    byId('history-local').setAttribute('aria-pressed', String(source === 'local'));
    byId('history-toggle-empty').hidden = source !== 'demo';
    byId('history-toggle-empty').textContent = emptyDemo ? '恢复模拟记录' : '体验空状态';
    byId('history-toggle-empty').setAttribute('aria-pressed', String(emptyDemo));
    byId('history-source-title').textContent = source === 'demo' ? '当前显示模拟数据' : '当前显示本机记录';
    byId('history-source-help').textContent = source === 'demo'
      ? '以下为固定示例，不是你的真实生成记录；不接数据库，也不会写入本机历史。'
      : '这些是当前浏览器保存的本地模板脚本，保留最近 20 份；不是云端记录，更换浏览器或清除网站数据后可能不可见。';
    let entries;
    try { entries = source === 'demo' ? (emptyDemo ? [] : HistoryDemo.entries) : ScriptHistory.list(); }
    catch (_) {
      byId('history-empty').hidden = true;
      status.textContent = '无法读取本机历史：浏览器存储可能受限或记录已损坏。可切换模拟记录体验，或返回工作台继续生成。';
      return;
    }
    byId('history-empty').hidden = entries.length !== 0;
    byId('history-empty-label').textContent = source === 'demo' ? '模拟空状态' : '本机暂无记录';
    byId('history-empty-help').textContent = source === 'demo'
      ? '这里仅演示无数据时的界面，不会删除模拟记录或已有本机记录。'
      : '从第一份分镜脚本开始，生成后会自动保存在当前浏览器中。';
    status.textContent = entries.length ? `${entries.length} 份${source === 'demo' ? '模拟' : '本机'}脚本 · 每份结果包含逐镜画面与文案` : source === 'demo' ? '正在体验空状态，数据未被删除。' : '';
    entries.forEach((entry, index) => {
      const r = entry.result;
      const card = node('article', 'card history-record history-record-v2');
      const heading = node('div', 'history-card-heading');
      const title = node('h2', '', r.meta.topic); title.id = `history-title-${index}`;
      card.setAttribute('aria-labelledby', title.id);
      heading.append(title, node('span', 'history-data-badge', source === 'demo' ? '模拟记录' : '本机记录'));
      const label = node('p', 'history-summary-label', '原始输入摘要');
      const excerpt = node('p', 'history-input-summary', source === 'demo'
        ? `主题：${entry.input.topic}；素材：${entry.input.materials}；参考：${entry.input.references}`
        : `主题：${r.meta.topic}。旧记录未保存完整原始输入，素材与参考要求待补充。`);
      const metadata = node('dl', 'history-metadata');
      const timeKnown = Number.isFinite(Date.parse(entry.createdAt));
      const time = node('time', '', new Date(timeKnown ? entry.createdAt : entry.updatedAt).toLocaleString('zh-CN', { hour12: false }));
      time.dateTime = timeKnown ? entry.createdAt : entry.updatedAt;
      for (const [name, value] of [[timeKnown ? '生成时间' : '最近保存', time], ['内容类型', r.meta.contentType], ['结果数量', `1 份脚本 · ${r.shots.length} 镜`], ['成片规格', `${r.meta.platform} · ${r.plan.total} 秒 · ${r.meta.aspect}`]]) {
        const item = node('div');
        const dd = node('dd'); dd.append(typeof value === 'string' ? node('span', '', value) : value);
        item.append(node('dt', '', name), dd); metadata.append(item);
      }
      const actions = node('div', 'history-card-actions');
      const detail = node('button', 'button secondary', '查看详情'); detail.type = 'button';
      detail.setAttribute('aria-label', '查看详情：' + r.meta.topic);
      detail.setAttribute('aria-expanded', 'false');
      const body = node('div', 'history-record-body'); body.id = `history-detail-${index}`; body.hidden = true;
      detail.setAttribute('aria-controls', body.id);
      detail.addEventListener('click', () => {
        if (!body.dataset.loaded) { appendDetail(body, entry); body.dataset.loaded = 'true'; }
        body.hidden = !body.hidden;
        detail.setAttribute('aria-expanded', String(!body.hidden));
        detail.textContent = body.hidden ? '查看详情' : '收起详情';
        detail.setAttribute('aria-label', (body.hidden ? '查看详情：' : '收起详情：') + r.meta.topic);
      });
      const again = node('a', 'button primary', '再次生成');
      again.href = 'workspace.html?history-source=' + source + '&history-id=' + encodeURIComponent(entry.id) + '#generator';
      again.setAttribute('aria-label', '再次生成：' + r.meta.topic);
      actions.append(detail, again);
      card.append(heading, label, excerpt, metadata, actions, body); list.append(card);
    });
  }
  byId('history-demo').addEventListener('click', () => { source = 'demo'; emptyDemo = false; render(); });
  byId('history-local').addEventListener('click', () => { source = 'local'; render(); });
  byId('history-toggle-empty').addEventListener('click', () => { emptyDemo = !emptyDemo; render(); });
  render();
  window.addEventListener('pageshow', event => { if (event.persisted) render(); });
  window.addEventListener('storage', () => { if (source === 'local') render(); });
})();
