'use strict';

// 生成真正的 DOCX：A4 纵向、逐镜分块、重复表头、长文自然分页。
const StoryboardDocx = (() => {
  const archive = typeof module !== 'undefined' && module.exports ? require('./office-zip.js') : OfficeZip;
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const xml = value => String(value ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const clock = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
  function run(text, properties = '') {
    const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
    return `<w:r>${properties ? `<w:rPr>${properties}</w:rPr>` : ''}${lines.map((line, i) => `${i ? '<w:br/>' : ''}<w:t xml:space="preserve">${xml(line)}</w:t>`).join('')}</w:r>`;
  }
  function paragraph(text, style = 'Normal') {
    return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${run(text)}</w:p>`;
  }
  function cell(text, width, label = false) {
    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${label ? '<w:shd w:fill="F1F5FB"/>' : ''}<w:vAlign w:val="top"/></w:tcPr><w:p><w:pPr><w:spacing w:before="20" w:after="60" w:line="300" w:lineRule="auto"/></w:pPr>${run(text, label ? '<w:b/><w:color w:val="334867"/>' : '')}</w:p></w:tc>`;
  }
  function shotTable(shot) {
    const header = `镜头 ${String(shot.index).padStart(2, '0')}    ${clock(shot.start)}—${clock(shot.end)}    ${shot.duration} 秒    ${shot.phase} · ${shot.purpose}`;
    const borders = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'].map(side => `<w:${side} w:val="single" w:sz="4" w:color="DCE4EF"/>`).join('');
    const rows = [['画面', shot.visual], ['旁白 / 口播', shot.voice], ['字幕', shot.subtitle], ['剪辑说明', shot.editing]].map(([label, value]) => `<w:tr>${cell(label, 1320, true)}${cell(value, 8318)}</w:tr>`).join('');
    return `<w:tbl><w:tblPr><w:tblW w:w="9638" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>${borders}</w:tblBorders><w:tblCellMar><w:top w:w="110" w:type="dxa"/><w:left w:w="140" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:right w:w="140" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid><w:gridCol w:w="1320"/><w:gridCol w:w="8318"/></w:tblGrid><w:tr><w:trPr><w:tblHeader/><w:cantSplit/></w:trPr><w:tc><w:tcPr><w:tcW w:w="9638" w:type="dxa"/><w:gridSpan w:val="2"/><w:shd w:fill="243E67"/></w:tcPr><w:p><w:pPr><w:keepNext/><w:spacing w:before="40" w:after="40"/></w:pPr>${run(header, '<w:b/><w:color w:val="FFFFFF"/>')}</w:p></w:tc></w:tr>${rows}</w:tbl><w:p><w:pPr><w:spacing w:before="0" w:after="80" w:line="80" w:lineRule="exact"/></w:pPr></w:p>`;
  }
  function styles() {
    const font = '<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Microsoft YaHei"/>';
    return declaration + `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr>${font}<w:sz w:val="22"/><w:szCs w:val="22"/><w:color w:val="243047"/><w:lang w:val="zh-CN" w:eastAsia="zh-CN"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="100" w:line="300" w:lineRule="auto"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:after="180"/></w:pPr><w:rPr><w:b/><w:sz w:val="42"/><w:color w:val="000000"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:keepLines/><w:spacing w:before="240" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="28"/><w:color w:val="243E67"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Caption"><w:name w:val="Caption"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="19"/><w:color w:val="59677C"/></w:rPr></w:style></w:styles>`;
  }
  function create(result) {
    const meta = result.meta;
    const parts = [paragraph(meta.topic + ' 分镜脚本', 'Title'), paragraph(`内容类型：${meta.contentType}    发布平台：${meta.platform}    画面比例：${meta.aspect}`), paragraph(`目标时长：${result.plan.total} 秒    镜头数量：${result.shots.length} 镜`), paragraph(`开头 ${result.plan.opening} 秒 + 主体 ${result.plan.body} 秒 + 结尾 ${result.plan.ending} 秒 = ${result.plan.total} 秒`), paragraph('根据表单与本地模板生成，未自动分析视频。以下采用当前已编辑内容；未提供的素材、录音与事实仍需补充确认。', 'Caption'), paragraph('逐镜脚本', 'Heading1')];
    parts.push(...result.shots.map(shotTable));
    for (const line of result.notes.split(/\r?\n/)) {
      if (!line.trim()) continue;
      parts.push(paragraph(line, /^[二三四五]、/.test(line) ? 'Heading1' : 'Normal'));
    }
    const section = '<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
    const document = declaration + `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>${parts.join('')}${section}</w:body></w:document>`;
    return archive.create([
      ['[Content_Types].xml', declaration + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'],
      ['_rels/.rels', declaration + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/document.xml', document],
      ['word/styles.xml', styles()],
      ['word/_rels/document.xml.rels', declaration + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/></Relationships>'],
      ['word/footer1.xml', declaration + '<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="778399"/></w:rPr><w:t xml:space="preserve">爆款视频脚本AI  ·  第 </w:t></w:r><w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple><w:r><w:t xml:space="preserve"> 页</w:t></w:r></w:p></w:ftr>']
    ]);
  }
  return { create };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = StoryboardDocx;
