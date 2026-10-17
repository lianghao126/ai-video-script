/* 纯前端分镜规则：所有素材与文案仅来自用户描述，不分析视频。 */
const ScriptEngine = (() => {
  const types = ['口播', '产品展示', '探店', '知识分享', '生活记录'];
  const platforms = ['小红书', '抖音', '视频号'];
  const sizes = { '9:16': '1080×1920', '16:9': '1920×1080', '1:1': '1080×1080' };
  const profiles = {
    '口播': [
      { opening: '核心观点', body: ['说明观点', '解释理由', '给出已有建议'], ending: '总结观点', notes: '按语义切分，保留完整句子；有相关补充画面时再覆盖停顿。' },
      { opening: '提出问题', body: ['交代问题', '解释原因', '回应问题'], ending: '回到结论', notes: '围绕一个问题推进，不为踩节拍切断句意。' }
    ],
    '产品展示': [
      { opening: '产品亮相', body: ['外观展示', '操作过程', '细节补充'], ending: '产品收尾', notes: '动作看清后再切换；只描述已展示内容，不添加未经证实的卖点。' },
      { opening: '动作引入', body: ['使用过程', '局部细节', '整体回顾'], ending: '完成动作', notes: '优先让动作起止连贯，细节只从实际提供的画面中选择。' }
    ],
    '探店': [
      { opening: '建立情境', body: ['环境介绍', '体验过程', '体验细节'], ending: '体验回顾', notes: '按真实体验展开；店名、价格和评价以用户提供信息为准。' },
      { opening: '体验切入', body: ['体验细节', '过程补充', '环境回顾'], ending: '自然离场', notes: '细节与环境相互补充，不假设有门头、菜品或服务画面。' }
    ],
    '知识分享': [
      { opening: '引出主题', body: ['解释概念', '展开要点', '说明应用'], ending: '要点回顾', notes: '每段表达一个知识点；数据、案例和结论未提供时标记待补充。' },
      { opening: '提出疑问', body: ['拆解问题', '逐项解释', '说明适用条件'], ending: '回应疑问', notes: '字幕按实际要点编号，术语与事实须核实，不编造答案。' }
    ],
    '生活记录': [
      { opening: '交代情境', body: ['活动开始', '过程记录', '细节停留'], ending: '自然结束', notes: '遵循已有事件顺序，保留完整动作和可用环境声。' },
      { opening: '动作切入', body: ['过程推进', '局部观察', '情境补充'], ending: '安静收束', notes: '围绕同一活动组织已有片段，不假设额外人物、地点或事件。' }
    ]
  };
  function validate(data) {
    const errors = {};
    if (!data.topic.trim()) errors.topic = '请填写视频主题或产品名称。';
    else if (data.topic.length > 120) errors.topic = '主题请控制在 120 个字符以内。';
    const n = Number(data.duration);
    if (String(data.duration).trim() === '' || !Number.isInteger(n) || n < 5 || n > 600) errors.duration = '目标时长请填写 5—600 之间的整数秒。';
    if (!types.includes(data.contentType) || !platforms.includes(data.platform) || !sizes[data.aspect]) errors.options = '请选择页面提供的内容类型、发布平台和画面比例。';
    return errors;
  }
  function saysNo(text, subject) {
    return new RegExp('(?:没有|不要|无需|不需要|不添加|不加|不含|不包含|不使用|不采用|不做|无|取消|禁用|禁止)(?:任何|额外|背景|添加|使用|采用|加|的|\\s){0,6}(?:' + subject + ')', 'i').test(text);
  }
  function timing(data, variant) {
    const total = Number(data.duration);
    const text = data.references + '\n' + data.additional;
    const extract = pattern => { const found = text.match(pattern); return found ? Number(found[1]) : null; };
    const requested = [extract(/(?:开头|开场|前)\s*(?:[:：为用约]|时长|持续)?\s*(\d+)\s*秒/), extract(/主体\s*(?:[:：为用约]|时长|持续)?\s*(\d+)\s*秒/), extract(/(?:结尾|收尾)\s*(?:[:：为用约]|时长|持续)?\s*(\d+)\s*秒/)];
    let parts = [Math.max(1, Math.min(8, Math.round(total * (variant ? .13 : .1)))), 0, Math.max(1, Math.min(15, Math.round(total * (variant ? .17 : .14))))];
    parts[1] = total - parts[0] - parts[2];
    const specified = requested.filter(n => n !== null);
    const sum = specified.reduce((a, b) => a + b, 0);
    const missing = requested.map((n, i) => n === null ? i : -1).filter(i => i !== -1);
    let warning = '';
    if (specified.length) {
      if (specified.some(n => n < 1) || (missing.length === 0 ? sum !== total : sum + missing.length > total)) {
        warning = '分段要求与目标总时长冲突，待确认；当前暂按目标总时长安排。';
      } else {
        const remainder = total - sum;
        const weightSum = missing.reduce((sum, i) => sum + parts[i], 0);
        const allocated = missing.map(i => 1 + Math.floor((remainder - missing.length) * parts[i] / weightSum));
        if (allocated.length) allocated[allocated.length - 1] += remainder - allocated.reduce((a, b) => a + b, 0);
        parts = requested.map((n, i) => n === null ? allocated[missing.indexOf(i)] : n);
      }
    }
    return { total, opening: parts[0], body: parts[1], ending: parts[2], warning };
  }
  function clock(seconds) { return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0'); }
  function assetsFrom(description, total) {
    // 简单分隔只用于候选素材；无法理解的描述不被当作已分析结论。
    const items = description.split(/[、，,；;\n]+/).map(s => s.trim().replace(/[。.]$/, '')).filter(s => s && !/(没有|不含|无需|不需要|未拍|未提供|暂无|尚无)|^无/.test(s) && !(/口播|旁白|人声|配音/.test(s) && !/画面|视频|镜头|出镜|拍摄|展示|特写|场景|录屏/.test(s)) && !/^(?:有|含|包含|带|无)?(?:口播|旁白|人声|配音)(?:素材|音频|声音|录音)?(?:约?\d+(?:\.\d+)?秒)?$/.test(s));
    return items.map((label, index) => {
      const match = label.match(/(?:约)?(\d+(?:\.\d+)?)\s*秒/);
      return { label, index: index + 1, known: !!match, remaining: match ? Number(match[1]) : Math.ceil(total / items.length) };
    });
  }
  function generate(data, version = 0) {
    const errors = validate(data);
    if (Object.keys(errors).length) throw new Error(Object.values(errors).join(' '));
    const variant = version % 2;
    const plan = timing(data, variant);
    const profile = profiles[data.contentType][variant];
    const prefs = data.references + '\n' + data.additional;
    const source = data.materials.trim();
    const narration = (data.narration || '').trim();
    const noVoiceRequested = saysNo(prefs, '口播|旁白|人声|配音');
    const noExistingVoice = saysNo(source, '口播|旁白|人声|配音');
    const noMusic = saysNo(prefs, '配乐|音乐|BGM');
    const noSubtitle = saysNo(prefs, '字幕');
    const calm = !saysNo(prefs, '舒缓|慢节奏|治愈|缓慢') && /舒缓|慢节奏|治愈|缓慢/.test(prefs);
    const fast = !saysNo(prefs, '快节奏|快速|利落|紧凑') && /快节奏|快速|利落|紧凑/.test(prefs);
    const shotLength = data.contentType === '口播' || data.contentType === '知识分享' ? (variant ? 10 : 12) : calm ? (variant ? 7 : 6) : fast ? (variant ? 3 : 2) : (variant ? 6 : 5);
    const middleCount = Math.max(1, Math.ceil(plan.body / shotLength));
    const lengths = [plan.opening, ...Array.from({length:middleCount}, (_, i) => Math.floor(plan.body / middleCount) + (i < plan.body % middleCount ? 1 : 0)), plan.ending];
    const assets = assetsFrom(source, plan.total);
    const allKnown = assets.length > 0 && assets.every(asset => asset.known);
    const knownTotal = assets.reduce((sum, asset) => sum + (asset.known ? asset.remaining : 0), 0);
    let assetIndex = 0;
    const round = n => Math.round(n * 100) / 100;
    function visual(seconds, purpose) {
      let rest = seconds;
      const pieces = [];
      const labels = [];
      while (rest > 0 && assetIndex < assets.length) {
        const asset = assets[assetIndex];
        if (asset.remaining <= 0) { assetIndex++; continue; }
        const take = round(Math.min(rest, asset.remaining));
        const caption = asset.label.replace(/(?:约)?\d+(?:\.\d+)?\s*秒/g, '').replace(/^(?:已有|现有|一段|只有)/, '').trim();
        if (caption && caption.length <= 24) labels.push(caption);
        pieces.push(`素材${asset.index}“${asset.label}”：计划选用未使用片段 ${take} 秒${asset.known ? '' : '（可用长度待确认）'}`);
        asset.remaining = round(asset.remaining - take);
        rest = round(rest - take);
      }
      if (rest > 0) pieces.push(`待补充：本镜尚缺约 ${rest} 秒可用画面；如补拍，可围绕“${purpose}”准备对应画面，不假设素材已经存在`);
      return { text: pieces.join('；') + '。', caption: labels.join(' / ') };
    }
    let cursor = 0;
    const shots = lengths.map((duration, index) => {
      const opening = index === 0;
      const ending = index === lengths.length - 1;
      const purpose = opening ? profile.opening : ending ? profile.ending : profile.body[Math.min(2, Math.floor((index - 1) * 3 / middleCount))];
      const start = cursor;
      cursor += duration;
      const selected = visual(duration, purpose);
      return { index:index + 1, start, end:cursor, duration, phase:opening ? '开头' : ending ? '结尾' : '主体', purpose, visual:selected.text, caption:selected.caption, voice:'', subtitle:'', editing:'' };
    });
    const lines = narration.split(/\n+|(?<=[。！？!?；;])/u).map(s => s.trim()).filter(Boolean);
    const speechNotes = [];
    if (noVoiceRequested && narration) speechNotes.push('已填写旁白文案，但其他要求禁止相关人声：当前不安排旁白，请先确认冲突。');
    if (narration && noExistingVoice && !noVoiceRequested) speechNotes.push('只有文字文案，素材描述未包含对应人声：文案已分配到镜头，录音待补充。');
    if (narration && !noVoiceRequested) speechNotes.push('文案按句分配；文字不等于已有音频。实际语速、停顿与每镜时长需要试听核对，过长时调整镜头或由用户确认删改。');
    shots.forEach((shot, index) => {
      const from = Math.ceil(index * lines.length / shots.length);
      const to = Math.ceil((index + 1) * lines.length / shots.length);
      const words = lines.slice(from, to).join('');
      if (noVoiceRequested) shot.voice = '无（按明确要求不安排相关人声）。';
      else if (narration && words) shot.voice = `“${words}”${noExistingVoice ? '（拟录旁白，录音待补充）' : '（用户提供文案；对应录音与语速待确认）'}`;
      else if (narration) shot.voice = '无新增台词，留给画面或原声；不重复填充已有文案。';
      else if (noExistingVoice) shot.voice = '无（未提供口播文案或录音，不默认新增配音）。';
      else shot.voice = `待补充：本镜“${shot.purpose}”对应的旁白或已有口播文案。`;
      shot.subtitle = noSubtitle ? '无（按明确要求不添加字幕）。' : words && !noVoiceRequested ? `“${words}”（与实际人声对齐；过长时分屏）` : shot.phase === '开头' ? `标题草案：“${data.topic.trim()}”` : shot.phase === '结尾' ? `收尾标题草案：“${data.topic.trim()}｜回顾”` : shot.caption ? `字幕草案：“${shot.caption}”（基于素材描述，需与实际画面一致）` : `章节字幕草案：“${shot.purpose}”（对应画面待补充，使用前确认）`;
      shot.editing = `${profile.notes}${shot.phase === '开头' ? '直接进入主题，避免长片头。' : shot.phase === '结尾' ? '在完整动作或自然停顿处收束，不默认添加营销口号。' : '按本镜时间选取片段，切点跟随信息变化。'}${shot.duration <= 2 ? '本镜较短，字幕保持简短，避免塞入长句。' : ''}`;
    });
    const music = noMusic ? '不添加背景音乐；仅按要求保留实际可用原声。' : calm ? '采用柔和、节拍稀疏的合法可用配乐，避免强鼓点抢占主体。' : /轻快/.test(prefs) && !saysNo(prefs,'轻快') ? '采用轻快、节拍清晰且编配不过密的合法可用配乐。' : '具体音乐风格待确认；未指定时建议节拍稳定、不过度抢占主体的合法可用配乐。';
    const warnings = [plan.warning, ...speechNotes, allKnown && knownTotal < plan.total ? `按描述估算的候选画面共 ${round(knownTotal)} 秒，少于目标 ${plan.total} 秒；不足位置已标待补充，不用重复循环凑时长。` : '', !source ? '自有素材待补充；分镜中的画面是准备建议，不表示你已拥有对应素材。' : '素材仅按描述分隔与粗排，未读取实际画面；每条素材的可用性、长度和切点需人工确认。'].filter(Boolean);
    const intro = `《${data.topic.trim()}》视频分镜脚本
类型：${data.contentType}｜平台：${data.platform}｜总时长：${plan.total} 秒｜比例：${data.aspect}
分镜数：${shots.length} 镜。开头 ${plan.opening} 秒 + 主体 ${plan.body} 秒 + 结尾 ${plan.ending} 秒 = ${plan.total} 秒。
根据表单与本地模板生成，未自动分析上传视频。镜头编号和时间为建议安排，不是对标视频的分析结果。`;
    const notes = `二、创作依据
自有素材（原文）：${source || '待补充。'}
旁白或口播文案（原文）：${narration || '待补充；是否安排人声以素材和明确要求为准。'}
手动参考特点（原文）：${data.references.trim() || '待补充；默认使用清晰结构与自然切换。'}
其他要求（原文）：${data.additional.trim() || '暂无额外要求。'}
优先级：用户明确要求与实际素材条件优先于模板建议，冲突标记待确认。字幕中的章节标题是可修改草案，不代表真实事实或已提供的对白。

三、统一剪辑与声音要求
${fast ? '按紧凑倾向安排较短镜头；关键动作和完整语句优先。' : calm ? '按舒缓倾向留出停顿与动作完成时间。' : '每镜承载一个信息点，切点优先跟随动作、句意与信息变化。'}
转场以用户原文为准；未指定时以直接切换为主，不添加花哨转场。
${noSubtitle ? '不添加字幕。' : '字幕样式以用户原文为准；未指定时使用清晰中文字体、短句、最多两行，避开主体和平台界面。重点以字重或少量颜色变化强调。'}
配乐：${music}
人声：${noVoiceRequested ? '遵循原文限制，不自动加入旁白。' : '只使用实际提供或经用户确认补录的人声。有人声时降低配乐音量，适度降噪，避免爆音。'}

四、待确认与待补充
${warnings.map(w => '· ' + w).join('\n')}
· 未提供的品牌、价格、性能、地点、案例和结论不自行编造。
· 文案草案与实际画面不符时修改或删除，复杂自然语言要求需要人工复核。

五、成片要求
${data.platform}｜${plan.total} 秒｜${data.aspect}｜建议 ${sizes[data.aspect]}，源素材不足时不强行放大。
建议 MP4，帧率按源素材与工具能力选择；保持主体完整、文字可读，不产生意外黑边或拉伸。
实际执行效果取决于剪辑工具能力与提供的素材。本站只生成分镜文字，不剪辑、渲染或导出视频。`;
    const result = { intro, notes, plan, shots, meta: { topic: data.topic.trim(), contentType: data.contentType, platform: data.platform, aspect: data.aspect } };
    return { ...result, text: serialize(result) };
  }
  function serialize(result) {
    const blocks = result.shots.map(shot => `【镜头 ${String(shot.index).padStart(2,'0')}｜${clock(shot.start)}—${clock(shot.end)}｜${shot.duration} 秒｜${shot.phase}·${shot.purpose}】\n画面：${shot.visual}\n旁白／口播：${shot.voice}\n字幕：${shot.subtitle}\n剪辑说明：${shot.editing}`).join('\n\n');
    return `${result.intro}\n\n一、逐镜脚本\n${blocks}\n\n${result.notes}`;
  }
  function exportFilename(topic) {
    const name = topic.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/[ .]+$/g, '').slice(0, 70) || '视频';
    return name + '_分镜脚本.xlsx';
  }
  function validateVideo(file) {
    if (!/\.mp4$/i.test(file.name)) return '仅支持 MP4 文件，请重新选择 .mp4 视频。';
    if (file.size === 0) return '所选文件为空，请选择有效的 MP4 视频。';
    if (file.size > 200 * 1024 * 1024) return '视频超过 200 MB 上限，请选择更小的文件。';
    return '';
  }
  return { validate, generate, timing, validateVideo, serialize, exportFilename, clock };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = ScriptEngine;

if (typeof document !== 'undefined') {
  const byId = id => document.getElementById(id);
  const form = byId('requirements-form');
  const output = byId('prompt-output');
  const fileInput = byId('video-file');
  const video = byId('video-preview');
  const copyButton = byId('copy-prompt');
  const exportButton = byId('export-table');
  const documentButton = byId('export-document');
  const exportToggle = byId('export-toggle');
  const exportMenu = byId('export-menu');
  const exportControl = byId('export-control');
  let currentResult = null;
  const downloadURLs = new Set();
  let previewURL = null;
  let videoFile = null;
  let version = 0;
  let hasResult = false;
  let lastData = null;
  let isCopying = false;
  let historyId = null;
  let historyTimer = null;
  let tableFitFrame = 0;
  let tableFitObserver = null;

  function saveHistory() {
    clearTimeout(historyTimer);
    historyTimer = null;
    if (!currentResult) return;
    try {
      historyId = ScriptHistory.save(currentResult, ScriptEngine.serialize(currentResult), historyId);
      byId('history-save-status').textContent = '已保存到本机历史记录，保留最近 20 份；视频不会保存。';
    } catch (_) {
      byId('history-save-status').textContent = '历史记录保存失败，浏览器存储可能受限或已满。当前脚本仍可复制、导出。';
    }
  }

  function readForm() {
    return { topic: byId('topic').value.trim(), contentType: byId('content-type').value, platform: byId('platform').value, duration: byId('duration').value, aspect: byId('aspect').value, materials: byId('materials').value.trim(), narration: byId('narration').value.trim(), references: byId('references').value.trim(), additional: byId('additional').value.trim() };
  }
  function clearFieldError(id) {
    byId(id).removeAttribute('aria-invalid');
    byId(id + '-error').hidden = true;
    byId(id + '-error').textContent = '';
  }
  function checkForm(data) {
    ['topic', 'duration'].forEach(clearFieldError);
    const errors = ScriptEngine.validate(data);
    let first = null;
    for (const id of ['topic', 'duration']) {
      if (!errors[id]) continue;
      byId(id).setAttribute('aria-invalid', 'true');
      byId(id + '-error').textContent = errors[id];
      byId(id + '-error').hidden = false;
      first ||= byId(id);
    }
    if (first) {
      byId('form-status').textContent = '请先修正标记的字段。';
      first.focus();
      first.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return false;
    }
    if (errors.options) { byId('form-status').textContent = errors.options; return false; }
    return true;
  }
  function updateCount() {
    output.value = currentResult ? ScriptEngine.serialize(currentResult) : '';
    byId('character-count').textContent = output.value.length.toLocaleString('zh-CN') + ' 字符';
    copyButton.disabled = !output.value.trim() || isCopying;
    exportButton.disabled = !currentResult;
    documentButton.disabled = !currentResult;
    exportToggle.disabled = !currentResult;
  }
  function fitCell(area) {
    area.style.height = 'auto';
    area.style.height = Math.min(240, Math.max(100, area.scrollHeight + 2)) + 'px';
  }
  function fitCells(areas) {
    // 先统一写入，再统一测量，避免每个单元格都触发一次布局。
    areas.forEach(area => { area.style.height = 'auto'; });
    const heights = areas.map(area => Math.min(240, Math.max(100, area.scrollHeight + 2)));
    areas.forEach((area, index) => { area.style.height = heights[index] + 'px'; });
  }
  function renderTable() {
    cancelAnimationFrame(tableFitFrame);
    tableFitFrame = 0;
    tableFitObserver?.disconnect();
    const body = byId('storyboard-rows');
    const fragment = document.createDocumentFragment();
    const areas = [];
    const rows = [];
    const fields = [['visual', '画面'], ['voice', '旁白或口播'], ['subtitle', '字幕'], ['editing', '剪辑说明']];
    for (const shot of currentResult.shots) {
      const row = document.createElement('tr');
      rows.push(row);
      const heading = document.createElement('th');
      heading.scope = 'row';
      for (const [className, text] of [['shot-number', `镜头 ${String(shot.index).padStart(2, '0')}`], ['shot-time', `${ScriptEngine.clock(shot.start)}—${ScriptEngine.clock(shot.end)}`], ['shot-duration', `${shot.duration} 秒`], ['shot-purpose', `${shot.phase} · ${shot.purpose}`]]) {
        const span = document.createElement('span');
        span.className = className;
        span.textContent = text;
        heading.append(span);
      }
      row.append(heading);
      for (const [key, label] of fields) {
        const cell = document.createElement('td');
        const area = document.createElement('textarea');
        area.className = 'table-editor';
        area.value = shot[key];
        area.rows = 5;
        area.maxLength = 12000;
        area.setAttribute('aria-label', `镜头 ${shot.index} ${label}`);
        areas.push(area);
        area.addEventListener('input', () => {
          shot[key] = area.value;
          fitCell(area);
          updateCount();
          byId('result-badge').textContent = '已手动编辑';
          byId('copy-status').textContent = '';
          byId('export-status').textContent = '';
          clearTimeout(historyTimer);
          historyTimer = setTimeout(saveHistory, 450);
        });
        cell.append(area);
        row.append(cell);
      }
      fragment.append(row);
    }
    body.replaceChildren(fragment);
    byId('script-notes').textContent = currentResult.notes;
    byId('table-scroll').scrollTop = 0;
    byId('table-scroll').scrollLeft = 0;
    if (typeof IntersectionObserver === 'undefined') {
      tableFitFrame = requestAnimationFrame(() => { tableFitFrame = 0; fitCells(areas); });
    } else {
      // 所有文本仍在表格中；只为即将看到的行测量高度，长脚本不再一次测量上千个输入框。
      const pending = new Set();
      tableFitObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          pending.add(entry.target);
          tableFitObserver.unobserve(entry.target);
        }
        if (!pending.size || tableFitFrame) return;
        tableFitFrame = requestAnimationFrame(() => {
          tableFitFrame = 0;
          const visibleAreas = Array.from(pending).flatMap(row => Array.from(row.querySelectorAll('.table-editor')));
          pending.clear();
          fitCells(visibleAreas);
        });
      }, { root: byId('table-scroll'), rootMargin: '240px 0px' });
      rows.forEach(row => tableFitObserver.observe(row));
    }
  }
  function generate(regenerate = false) {
    const data = readForm();
    if (!checkForm(data)) return;
    version = regenerate ? version + 1 : 0;
    const result = ScriptEngine.generate(data, version);
    if (historyTimer) saveHistory();
    currentResult = result;
    historyId = null;
    saveHistory();
    hasResult = true;
    lastData = JSON.stringify(data);
    byId('result-empty').hidden = true;
    byId('result-content').hidden = false;
    byId('manual-copy').hidden = true;
    renderTable();
    byId('result-badge').textContent = '已生成 · 可编辑';
    byId('result-badge').classList.add('generated');
    byId('regenerate').disabled = false;
    byId('result-summary').textContent = `${result.shots.length} 镜 · ${data.contentType} · ${data.duration} 秒 · ${data.aspect}`;
    byId('copy-status').textContent = '';
    byId('export-status').textContent = '';
    byId('form-status').textContent = regenerate ? '已保留全部需求并更新分镜，表格中的手动修改已被新结果替换。' : '分镜表格已生成，可直接编辑单元格，复制或导出。';
    updateCount();
    byId('table-scroll').focus({ preventScroll: true });
    byId('result-section').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  form.addEventListener('submit', event => { event.preventDefault(); generate(); });
  byId('regenerate').addEventListener('click', () => generate(true));
  form.addEventListener('input', event => {
    if (['topic', 'duration'].includes(event.target.id)) clearFieldError(event.target.id);
    if (hasResult && JSON.stringify(readForm()) !== lastData) byId('form-status').textContent = '需求已修改，请重新生成以更新结果。';
  });
  function fillExample() {
    const example = { topic: '通勤保温杯展示', 'content-type': '产品展示', platform: '小红书', duration: '30', aspect: '9:16', materials: '桌面杯身展示约12秒、开盖特写约5秒、倒水画面约8秒、拿起杯子喝水约5秒；没有口播。', references: '前3秒直接展示产品；镜头干净利落；白色简洁字幕；以直接切换为主；音乐轻快但不吵。', narration: '今天展示这只通勤保温杯。\n先看杯身外观。\n再看开盖和倒水过程。', additional: '不夸大保温性能，不编造价格，不使用花哨转场。' };
    for (const [id, value] of Object.entries(example)) byId(id).value = value;
    form.querySelectorAll('select').forEach(select => select.dispatchEvent(new Event('change', { bubbles: true })));
    ['topic', 'duration'].forEach(clearFieldError);
    byId('form-status').textContent = '示例需求已填入，视频保持不变。点击“生成分镜脚本”即可体验。';
    byId('topic').focus({ preventScroll: true });
    byId('form-title').scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  byId('fill-example').addEventListener('click', fillExample);
  byId('empty-example').addEventListener('click', fillExample);
  byId('clear-inputs').addEventListener('click', () => {
    ['topic', 'materials', 'narration', 'references', 'additional'].forEach(id => {
      byId(id).value = '';
    });
    clearFieldError('topic');
    byId('form-status').textContent = '文字输入已清空，选项与目标时长已保留。' + (hasResult ? '已有脚本仍保留；填写新需求后可重新生成。' : '请填写新主题后生成。');
    byId('topic').focus({ preventScroll: true });
  });
  copyButton.addEventListener('click', async () => {
    if (!output.value.trim() || isCopying) return;
    isCopying = true;
    updateCount();
    const status = byId('copy-status');
    status.textContent = '';
    status.classList.remove('error');
    let success = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(output.value); success = true; }
    } catch (_) { /* 权限拒绝时进入兼容复制或手动选择。 */ }
    if (!success) {
      byId('manual-copy').hidden = false;
      output.focus();
      output.select();
      output.setSelectionRange(0, output.value.length);
      try { success = document.execCommand('copy'); } catch (_) { success = false; }
    }
    status.textContent = success ? '分镜脚本已复制，可用于拍摄准备或交给剪辑工具。' : '自动复制不可用，已选中正文。请按 Ctrl+C（Mac 使用 ⌘C），手机可长按正文复制。';
    status.classList.toggle('error', !success);
    if (success) byId('manual-copy').hidden = true;
    isCopying = false;
    updateCount();
  });
  function closeExportMenu(focus = false) {
    exportMenu.hidden = true;
    exportToggle.setAttribute('aria-expanded', 'false');
    if (focus) exportToggle.focus({ preventScroll: true });
  }
  function openExportMenu(last = false) {
    if (!currentResult) return;
    const rect = exportToggle.getBoundingClientRect();
    const headerBottom = document.querySelector('.site-header').getBoundingClientRect().bottom;
    const below = innerHeight - rect.bottom;
    exportControl.dataset.side = below < 160 && rect.top - headerBottom > below ? 'top' : 'bottom';
    exportMenu.hidden = false;
    exportToggle.setAttribute('aria-expanded', 'true');
    (last ? documentButton : exportButton).focus({ preventScroll: true });
  }
  exportToggle.addEventListener('click', () => exportMenu.hidden ? openExportMenu() : closeExportMenu());
  exportToggle.addEventListener('keydown', event => {
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); openExportMenu(event.key === 'ArrowUp'); }
  });
  exportMenu.addEventListener('keydown', event => {
    const items = [exportButton, documentButton];
    const current = items.indexOf(document.activeElement);
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + 2) % 2;
      items[next].focus();
    } else if (event.key === 'Escape') { event.preventDefault(); closeExportMenu(true); }
    else if (event.key === 'Tab') closeExportMenu(true);
  });
  exportControl.addEventListener('focusout', event => { if (!exportControl.contains(event.relatedTarget)) closeExportMenu(); });
  document.addEventListener('pointerdown', event => { if (!exportControl.contains(event.target)) closeExportMenu(); });
  window.addEventListener('resize', () => closeExportMenu());
  function downloadResult(format) {
    if (!currentResult) return;
    closeExportMenu(true);
    const status = byId('export-status');
    status.classList.remove('error');
    let url;
    let link;
    try {
      const doc = format === 'docx';
      const file = doc ? StoryboardDocx.create(currentResult) : StoryboardXlsx.create(currentResult);
      const type = doc ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      url = URL.createObjectURL(new Blob([file], { type }));
      downloadURLs.add(url);
      link = document.createElement('a');
      link.href = url;
      link.download = ScriptEngine.exportFilename(currentResult.meta.topic).replace(/\.xlsx$/, doc ? '.docx' : '.xlsx');
      link.hidden = true;
      document.body.append(link);
      link.click();
      status.textContent = doc ? '已发起 Word 文档下载，已设置 A4 页面、逐镜排版、自动分页和页码；可在下载列表查看。' : '已发起 Excel 表格下载，已自动优化列宽、行高、换行和表头；可在下载列表查看。';
    } catch (_) {
      status.textContent = '导出失败，请重试，或先复制脚本保存当前内容。';
      status.classList.add('error');
    } finally {
      if (link) link.remove();
      if (url) setTimeout(() => { URL.revokeObjectURL(url); downloadURLs.delete(url); }, 1500);
    }
  }
  exportButton.addEventListener('click', () => downloadResult('xlsx'));
  documentButton.addEventListener('click', () => downloadResult('docx'));
  function videoError(message) {
    byId('video-error').textContent = message;
    byId('video-error').hidden = false;
  }
  function clearVideo() {
    video.pause();
    video.removeAttribute('src');
    video.load();
    if (previewURL) URL.revokeObjectURL(previewURL);
    previewURL = null;
    videoFile = null;
    fileInput.value = '';
    byId('video-container').hidden = true;
    byId('upload-button').hidden = false;
    byId('file-name').textContent = '';
    byId('file-meta').textContent = '';
  }
  function chooseVideo() { fileInput.value = ''; fileInput.click(); }
  byId('upload-button').addEventListener('click', chooseVideo);
  byId('replace-video').addEventListener('click', chooseVideo);
  byId('remove-video').addEventListener('click', () => {
    clearVideo();
    byId('video-error').hidden = true;
    byId('video-status').textContent = '视频已移除，本地预览资源已释放。';
    byId('upload-button').focus();
  });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (!file) return;
    const error = ScriptEngine.validateVideo(file);
    if (error) { videoError(error + (previewURL ? ' 原预览已保留。' : '')); fileInput.value = ''; return; }
    clearVideo();
    byId('video-error').hidden = true;
    videoFile = file;
    previewURL = URL.createObjectURL(file);
    byId('video-container').hidden = false;
    byId('upload-button').hidden = true;
    byId('file-name').textContent = file.name;
    byId('file-meta').textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB · 正在载入本地预览';
    video.src = previewURL;
    video.load();
  });
  video.addEventListener('loadedmetadata', () => {
    if (!videoFile || !previewURL) return;
    if (!Number.isFinite(video.duration) || video.duration <= 0 || video.videoWidth === 0) { clearVideo(); videoError('无法读取有效视频画面，请选择可播放的 MP4 视频。'); return; }
    byId('file-meta').textContent = (videoFile.size / (1024 * 1024)).toFixed(2) + ' MB · ' + video.duration.toFixed(1) + ' 秒 · 仅本地预览';
    byId('video-status').textContent = '已选择 ' + videoFile.name + '，可以在本地播放器预览。';
  });
  video.addEventListener('error', () => {
    if (!previewURL || !video.error || video.getAttribute('src') !== previewURL) return;
    clearVideo();
    videoError('无法播放此文件：文件可能损坏，或 MP4 内的视频编码不受浏览器支持。请尝试 H.264 编码的 MP4 文件。');
  });
  window.addEventListener('pagehide', event => { if (historyTimer) saveHistory(); if (!event.persisted) { clearVideo(); downloadURLs.forEach(url => URL.revokeObjectURL(url)); downloadURLs.clear(); } });
}
