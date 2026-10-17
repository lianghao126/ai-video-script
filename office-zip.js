'use strict';

// 无压缩 ZIP 封装，供本地 XLSX / DOCX 导出共用。
const OfficeZip = (() => {
  const encoder = new TextEncoder();
  const crcTable = Array.from({length:256}, (_, value) => {
    let crc = value;
    for (let i = 0; i < 8; i++) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    return crc >>> 0;
  });
  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const localParts = [], centralParts = [];
    let offset = 0, centralSize = 0;
    for (const [path, content] of files) {
      const name = encoder.encode(path), data = encoder.encode(content), checksum = crc32(data);
      const local = new Uint8Array(30), l = new DataView(local.buffer);
      l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x0800, true); l.setUint16(12, 33, true);
      l.setUint32(14, checksum, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true); l.setUint16(26, name.length, true);
      localParts.push(local, name, data);
      const central = new Uint8Array(46), c = new DataView(central.buffer);
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(14, 33, true);
      c.setUint32(16, checksum, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true); c.setUint16(28, name.length, true); c.setUint32(42, offset, true);
      centralParts.push(central, name); centralSize += central.length + name.length; offset += local.length + name.length + data.length;
    }
    const end = new Uint8Array(22), e = new DataView(end.buffer);
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, centralSize, true); e.setUint32(16, offset, true);
    const output = new Uint8Array(offset + centralSize + end.length);
    let cursor = 0;
    for (const part of [...localParts, ...centralParts, end]) { output.set(part, cursor); cursor += part.length; }
    return output;
  }
  return { create: zip };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = OfficeZip;
