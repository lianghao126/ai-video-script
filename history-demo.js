'use strict';

// 固定的界面演示数据，不是用户的生成记录，也不会写入本机历史。
const HistoryDemo = (() => {
  const examples = [
    {
      id: 'demo-cup', createdAt: '2026-10-18T02:30:00.000Z',
      input: { topic: '通勤保温杯展示', contentType: '产品展示', platform: '小红书', duration: '30', aspect: '9:16', materials: '杯身展示约10秒、开盖与倒水约15秒、拿杯画面约5秒；没有口播。', narration: '今天展示这只通勤保温杯。\n从外观到使用过程，一起看一看。', references: '开头直接亮相；按动作切换镜头；白色简洁字幕；轻快配乐。', additional: '不编造价格和保温性能，不使用花哨转场。' },
      lengths: [3, 22, 5],
      visuals: ['使用描述中的杯身展示片段，直接呈现主体。', '使用剩余杯身、开盖和倒水画面，按动作顺序组织；实际可用长度需确认。', '如拿杯画面动作完整，以该画面自然收尾。'],
      voices: ['今天展示这只通勤保温杯。（录音待补充）', '从外观到使用过程，一起看一看。（录音待补充）', '无新增台词，保留可用原声。'],
      subtitles: ['通勤保温杯展示', '从外观到使用过程', '今天的展示，到这里']
    },
    {
      id: 'demo-photo', createdAt: '2026-10-17T08:15:00.000Z',
      input: { topic: '手机拍摄构图入门', contentType: '知识分享', platform: '抖音', duration: '45', aspect: '9:16', materials: '已有构图讲解录屏约30秒，示范照片和片尾画面尚未提供。', narration: '今天聊一聊手机拍摄的构图。\n先确定画面主体，再检查画面边缘。', references: '按知识点分段；重点词用蓝色强调；不使用背景音乐。', additional: '未提供的案例与画面标为待补充。' },
      lengths: [5, 34, 6],
      visuals: ['待补充：与手机构图主题对应的开场画面，不假设已有示范照片。', '使用已有讲解录屏；按描述尚缺约4秒主体画面，需补充或确认可用长度。', '待补充：回顾构图要点的片尾画面。'],
      voices: ['今天聊一聊手机拍摄的构图。（录音待确认）', '先确定画面主体，再检查画面边缘。（录音与语速待确认）', '待补充：与画面一致的总结文案。'],
      subtitles: ['手机拍摄构图入门', '确定主体 · 检查边缘', '要点回顾（具体内容待确认）']
    },
    {
      id: 'demo-weekend', createdAt: '2026-10-16T11:00:00.000Z',
      input: { topic: '周末散步记录', contentType: '生活记录', platform: '视频号', duration: '60', aspect: '16:9', materials: '出门画面约8秒、步行与沿途观察约44秒、结束画面约8秒；有环境声，没有口播。', narration: '', references: '舒缓节奏；保留环境声；动作完整后再切换；不要新增旁白。', additional: '不添加未经提供的人物、地点名称或事件。' },
      lengths: [8, 44, 8],
      visuals: ['选用已有出门画面，交代活动开始。', '按描述中的步行与观察片段组织，保持实际事件顺序。', '选用已有结束画面，保留完整动作。'],
      voices: ['无，使用实际可用环境声。', '无，不新增旁白。', '无，保留环境声自然收束。'],
      subtitles: ['周末散步记录', '字幕随实际画面确认，不编造地点', '周末散步记录 · 结束']
    }
  ];
  const clock = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  const entries = examples.map(example => {
    const input = example.input;
    let cursor = 0;
    const shots = example.lengths.map((duration, i) => {
      const start = cursor;
      cursor += duration;
      return { index: i + 1, start, end: cursor, duration, phase: ['开头', '主体', '结尾'][i], purpose: ['主题引入', '内容展开', '自然收束'][i], visual: example.visuals[i], voice: example.voices[i], subtitle: example.subtitles[i], editing: input.references + ' ' + input.additional };
    });
    const result = { intro: '固定模拟脚本，仅用于历史页交互演示；没有分析视频。', meta: { topic: input.topic, contentType: input.contentType, platform: input.platform, aspect: input.aspect }, plan: { total: Number(input.duration) }, shots, notes: '这是静态示例，不是用户的真实生成记录。\n参考特点：' + input.references + '\n其他要求：' + input.additional + '\n素材与录音的实际内容、长度及使用授权需要人工确认。' };
    const text = result.intro + '\n\n' + shots.map(s => `【镜头 ${s.index}｜${clock(s.start)}—${clock(s.end)}｜${s.duration} 秒】\n画面：${s.visual}\n旁白／口播：${s.voice}\n字幕：${s.subtitle}\n剪辑说明：${s.editing}`).join('\n\n') + '\n\n' + result.notes;
    return { id: example.id, createdAt: example.createdAt, updatedAt: example.createdAt, input, result, text };
  });
  return { entries };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = HistoryDemo;
