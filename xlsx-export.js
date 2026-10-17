/* 原生浏览器 XLSX 导出。固定阅读版式，按内容计算行高；超长文字自动拆为续行。 */
const StoryboardXlsx = (() => {
  const widths = [7, 12, 12, 10, 19, 38, 34, 34, 46];
  const columns = ['镜头', '开始时间\n（分:秒）', '结束时间\n（分:秒）', '时长\n（秒）', '段落 / 用途', '画面', '旁白 / 口播', '字幕', '剪辑说明'];
  const archive = typeof module !== 'undefined' && module.exports ? require('./office-zip.js') : OfficeZip;
  const xml = value => String(value ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const units = character => /[\u0000-\u007f]/.test(character) ? .55 : 1;
  const capacity = width => Math.max(3, (width * 7 - 16) / (11 * 96 / 72));
  function lineCount(text, width) {
    let lines = 1, used = 0;
    const max = capacity(width);
    for (const character of String(text ?? '')) {
      if (character === '\n') { lines++; used = 0; }
      else { const size = units(character); if (used + size > max) { lines++; used = 0; } used += size; }
    }
    return lines;
  }
  function splitText(text, width, maxLines = 17) {
    const chunks = [];
    let chunk = '', used = 0, lines = 1;
    const max = capacity(width);
    for (const character of String(text ?? '')) {
      if (character === '\n') {
        chunk += character;
        if (lines >= maxLines) { chunks.push(chunk); chunk = ''; lines = 1; } else lines++;
        used = 0;
      } else {
        const size = units(character);
        if (used + size > max) {
          if (lines >= maxLines) { chunks.push(chunk); chunk = ''; lines = 1; } else lines++;
          used = 0;
        }
        chunk += character; used += size;
      }
    }
    if (chunk || !chunks.length) chunks.push(chunk);
    return chunks;
  }
  function layout(result) {
    const rows = [];
    for (const shot of result.shots) {
      const values = [shot.visual, shot.voice, shot.subtitle, shot.editing];
      const pieces = values.map((text, index) => splitText(text, widths[index + 5]));
      const count = Math.max(...pieces.map(parts => parts.length));
      for (let part = 0; part < count; part++) {
        const cells = [part ? `${shot.index}（续${part + 1}）` : shot.index, part ? '' : shot.start / 86400, part ? '' : shot.end / 86400, part ? '' : shot.duration, part ? '内容续行' : `${shot.phase} · ${shot.purpose}`, ...pieces.map(parts => parts[part] || '')];
        const lines = Math.max(...cells.map((text, index) => lineCount(text, widths[index])));
        rows.push({ cells, shotIndex: shot.index, continuation: part > 0, height: Math.min(409, Math.max(60, Math.ceil(lines * 19 + 16))) });
      }
    }
    return rows;
  }
  const declaration = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  function cell(value, column, row, style) {
    const ref = String.fromCharCode(65 + column) + row;
    if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
    // inlineStr 保留文字本身，不将用户文案当作公式或自动识别的日期。
    return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
  }
  function styles() {
    const fonts = [
      '<font><sz val="11"/><color rgb="FF34323F"/><name val="Microsoft YaHei"/><family val="2"/></font>',
      '<font><b/><sz val="20"/><color rgb="FFFFFFFF"/><name val="Microsoft YaHei"/></font>',
      '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Microsoft YaHei"/></font>',
      '<font><sz val="11"/><color rgb="FF655A7C"/><name val="Microsoft YaHei"/></font>',
      '<font><sz val="10"/><color rgb="FF81788E"/><name val="Microsoft YaHei"/></font>'
    ];
    const fills = ['<fill><patternFill patternType="none"/></fill>', '<fill><patternFill patternType="gray125"/></fill>', ...['7160DA','F3F0FB','FFFFFF','6956B4'].map(color => `<fill><patternFill patternType="solid"><fgColor rgb="FF${color}"/><bgColor indexed="64"/></patternFill></fill>`)];
    const border = '<border>' + ['left','right','top','bottom'].map(side => `<${side} style="thin"><color rgb="FFE4DEEE"/></${side}>`).join('') + '<diagonal/></border>';
    const xf = (font, fill, bordered, center = false, numFmt = 0) => `<xf numFmtId="${numFmt}" fontId="${font}" fillId="${fill}" borderId="${bordered ? 1 : 0}" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1" applyNumberFormat="1"><alignment horizontal="${center ? 'center' : 'left'}" vertical="top" wrapText="1"/></xf>`;
    const formats = [xf(0,0,false), xf(1,2,false), xf(3,3,false), xf(4,4,false), xf(2,5,true,true), xf(0,4,true), xf(0,3,true), xf(0,4,true,true), xf(0,3,true,true), xf(0,4,true,true,164), xf(0,3,true,true,164)];
    return declaration + `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="[m]:ss"/></numFmts><fonts count="${fonts.length}">${fonts.join('')}</fonts><fills count="${fills.length}">${fills.join('')}</fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>${border}</borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="${formats.length}">${formats.join('')}</cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  }
  function create(result) {
    const physicalRows = layout(result);
    const lastRow = physicalRows.length + 5;
    const title = `${result.meta.topic}｜分镜脚本`;
    const metadata = `发布平台：${result.meta.platform}    内容类型：${result.meta.contentType}    画面比例：${result.meta.aspect}    目标时长：${result.plan.total} 秒    镜头数量：${result.shots.length}`;
    const notice = '根据表单与模板生成，未自动分析视频。时间单位为分:秒；可直接编辑文字。超长内容自动拆为续行，续行不重复计时。';
    const totalWidth = widths.reduce((sum, width) => sum + width, 0);
    const titleHeight = Math.max(42, Math.ceil(lineCount(title, totalWidth / 1.85) * 30 + 12));
    const mergedRow = (row, height, value, style) => `<row r="${row}" ht="${height}" customHeight="1">${Array.from({length:9},(_,i)=>cell(i ? '' : value,i,row,style)).join('')}</row>`;
    const rows = [mergedRow(1,titleHeight,title,1), mergedRow(2,30,metadata,2), mergedRow(3,34,notice,3), '<row r="4" ht="12" customHeight="1"/>', `<row r="5" ht="36" customHeight="1">${columns.map((value,i)=>cell(value,i,5,4)).join('')}</row>`];
    physicalRows.forEach((row, index) => {
      const number = index + 6, alternate = row.shotIndex % 2 === 0;
      rows.push(`<row r="${number}" ht="${row.height}" customHeight="1">${row.cells.map((value,i)=>cell(value,i,number,i === 1 || i === 2 ? (alternate ? 10 : 9) : i <= 3 ? (alternate ? 8 : 7) : alternate ? 6 : 5)).join('')}</row>`);
    });
    const sheet = declaration + `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetPr><pageSetUpPr fitToPage="1"/></sheetPr><dimension ref="A1:I${lastRow}"/><sheetViews><sheetView showGridLines="0" zoomScale="100" workbookViewId="0"><pane xSplit="1" ySplit="5" topLeftCell="B6" activePane="bottomRight" state="frozen"/><selection pane="bottomRight" activeCell="B6" sqref="B6"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="22"/><cols>${widths.map((width,i)=>`<col min="${i+1}" max="${i+1}" width="${width}" customWidth="1"/>`).join('')}</cols><sheetData>${rows.join('')}</sheetData><autoFilter ref="A5:I${lastRow}"/><mergeCells count="3"><mergeCell ref="A1:I1"/><mergeCell ref="A2:I2"/><mergeCell ref="A3:I3"/></mergeCells><printOptions horizontalCentered="1"/><pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup paperSize="8" orientation="landscape" fitToWidth="1" fitToHeight="0"/></worksheet>`;
    return archive.create([
      ['[Content_Types].xml', declaration + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', declaration + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', declaration + `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="分镜脚本" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm.Print_Titles" localSheetId="0">'分镜脚本'!$1:$5</definedName><definedName name="_xlnm.Print_Area" localSheetId="0">'分镜脚本'!$A$1:$I$${lastRow}</definedName></definedNames></workbook>`],
      ['xl/_rels/workbook.xml.rels', declaration + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', styles()],
      ['xl/worksheets/sheet1.xml', sheet]
    ]);
  }
  return { create, layout, splitText };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = StoryboardXlsx;
