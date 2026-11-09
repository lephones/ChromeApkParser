/**
 * Android Resource Table (resources.arsc) Light Parser
 * 专门用于根据资源 ID (形如 @0x7f130028) 快速检索真实应用名（多语言支持）及图标路径
 */

export class ArscParser {
  /**
   * @param {Uint8Array} arscBytes
   */
  constructor(arscBytes) {
    this.buffer = arscBytes instanceof Uint8Array ? arscBytes.buffer : arscBytes;
    this.byteOffset = arscBytes.byteOffset || 0;
    this.byteLength = arscBytes.byteLength || this.buffer.byteLength;
    this.view = new DataView(this.buffer, this.byteOffset, this.byteLength);
    this.globalStrings = [];
    this.initialized = false;
  }

  /**
   * 初始化全局字符串池
   */
  init() {
    if (this.initialized) return;
    if (this.byteLength < 12) return;

    const fileType = this.view.getUint16(0, true);
    if (fileType !== 0x0002) return; // RES_TABLE_TYPE

    const spOffset = 12;
    if (spOffset + 28 > this.byteLength) return;

    const spType = this.view.getUint16(spOffset, true);
    if (spType !== 0x0001) return; // RES_STRING_POOL_TYPE

    const spSize = this.view.getUint32(spOffset + 4, true);
    const strCount = this.view.getUint32(spOffset + 8, true);
    const flags = this.view.getUint32(spOffset + 16, true);
    const strStart = this.view.getUint32(spOffset + 20, true);
    const isUtf8 = (flags & (1 << 8)) !== 0;

    const poolStart = spOffset + strStart;
    const utf8Decoder = new TextDecoder("utf-8", { fatal: false });
    const utf16Decoder = new TextDecoder("utf-16le", { fatal: false });

    for (let i = 0; i < strCount; i++) {
      const off = this.view.getUint32(spOffset + 28 + i * 4, true);
      const p = poolStart + off;
      if (p >= this.byteLength) {
        this.globalStrings.push("");
        continue;
      }

      if (isUtf8) {
        let cp = p;
        let charLen = this.view.getUint8(cp++);
        if (charLen & 0x80) charLen = ((charLen & 0x7f) << 8) | this.view.getUint8(cp++);
        let byteLen = this.view.getUint8(cp++);
        if (byteLen & 0x80) byteLen = ((byteLen & 0x7f) << 8) | this.view.getUint8(cp++);

        const bytes = new Uint8Array(this.buffer, this.byteOffset + cp, byteLen);
        this.globalStrings.push(utf8Decoder.decode(bytes));
      } else {
        let cp = p;
        let charLen = this.view.getUint16(cp, true);
        let dataStart = cp + 2;
        if (charLen & 0x8000) {
          charLen = ((charLen & 0x7fff) << 16) | this.view.getUint16(dataStart, true);
          dataStart += 2;
        }

        const bytes = new Uint8Array(this.buffer, this.byteOffset + dataStart, charLen * 2);
        this.globalStrings.push(utf16Decoder.decode(bytes));
      }
    }

    this.initialized = true;
  }

  /**
   * 根据资源 ID (32位整数，如 0x7f130028) 检索对应的字符串值或路径
   * @param {number|string} resId 资源 ID 数字或 "@0x7f..." 字符串
   * @returns {string[]} 所有匹配到的候选字符串（支持配置多语言）
   */
  resolve(resId) {
    this.init();
    let numId = 0;
    if (typeof resId === "string") {
      const clean = resId.replace(/^@/, "");
      numId = parseInt(clean, 16);
    } else {
      numId = resId;
    }

    if (!numId || isNaN(numId)) return [];

    const targetTypeId = (numId >> 16) & 0xff;
    const targetEntryId = numId & 0xffff;

    const matchedStrings = [];
    let off = 12;
    // 跳过全局字符串池
    const spSize = this.view.getUint32(off + 4, true);
    off += spSize;

    while (off + 8 <= this.byteLength) {
      const type = this.view.getUint16(off, true);
      const headerSize = this.view.getUint16(off + 2, true);
      const size = this.view.getUint32(off + 4, true);
      if (size <= 0) break;

      if (type === 0x0200) { // RES_TABLE_PACKAGE_TYPE
        off += headerSize;
        continue;
      }

      if (type === 0x0201) { // RES_TABLE_TYPE_TYPE
        const typeId = this.view.getUint8(off + 8);
        const entryCount = this.view.getUint32(off + 12, true);
        const entriesStart = this.view.getUint32(off + 16, true);

        if (typeId === targetTypeId && targetEntryId < entryCount) {
          const entryOffsetArrayStart = off + headerSize;
          const entryOff = this.view.getUint32(entryOffsetArrayStart + targetEntryId * 4, true);

          if (entryOff !== 0xffffffff) {
            const itemOff = off + entriesStart + entryOff;
            if (itemOff + 8 <= this.byteLength) {
              const entrySize = this.view.getUint16(itemOff, true);
              const valOff = itemOff + entrySize;
              if (valOff + 8 <= this.byteLength) {
                const valType = this.view.getUint8(valOff + 3);
                const valData = this.view.getUint32(valOff + 4, true);
                if (valType === 0x03 && valData < this.globalStrings.length) {
                  const str = this.globalStrings[valData];
                  if (str && !matchedStrings.includes(str)) {
                    matchedStrings.push(str);
                  }
                }
              }
            }
          }
        }
      }

      off += size;
    }

    return matchedStrings;
  }
}
