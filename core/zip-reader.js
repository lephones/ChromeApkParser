/**
 * Zero-Extraction Selective ZIP Reader for APK & AAR
 * 仅读取 ZIP 末尾目录区（EOCD + Central Directory），按需单独解压目标文件，
 * 支持 APK (lib/) 与 AAR (jni/) 架构自动检测，支持子目录 Manifest 定位。
 */

export class ZipReader {
  /**
   * @param {Object} dataSource - 具备 read(offset, length) 和 getSize() 的数据源
   */
  constructor(dataSource) {
    this.source = dataSource;
    this.entries = new Map();
    this.abis = [];
    this.hasV2Signature = false;
    this.totalEntriesCount = 0;
  }

  /**
   * 初始化：定位 EOCD 并解析 Central Directory
   */
  async init() {
    const totalSize = await this.source.getSize();
    if (totalSize < 22) {
      throw new Error("文件体积过小，不是有效的 APK/AAR 文件");
    }

    // 0. 预检查文件头是否为 ZIP 魔数 (PK\x03\x04: 0x04034b50)
    const magicBuf = await this.source.read(0, 4);
    const magicView = new DataView(magicBuf);
    const magic = magicView.getUint32(0, true);
    if (magic !== 0x04034b50) {
      throw new Error("目标文件不是合法的 APK/AAR 文件（缺少 ZIP 'PK' 标志头，可能是网页或链接已失效）");
    }

    // 1. 定位 End of Central Directory (EOCD)
    const tailCheckLen = Math.min(totalSize, 65536 + 22);
    const tailBuffer = await this.source.read(totalSize - tailCheckLen, tailCheckLen);
    const tailView = new DataView(tailBuffer);

    let eocdOffsetInTail = -1;
    for (let i = tailBuffer.byteLength - 22; i >= 0; i--) {
      if (tailView.getUint32(i, true) === 0x06054b50) {
        eocdOffsetInTail = i;
        break;
      }
    }

    if (eocdOffsetInTail === -1) {
      throw new Error("未找到 ZIP 目录末尾标识 (EOCD)，文件可能不是有效 APK/AAR 或已损坏");
    }

    const totalEntries = tailView.getUint16(eocdOffsetInTail + 10, true);
    const cdSize = tailView.getUint32(eocdOffsetInTail + 12, true);
    const cdOffset = tailView.getUint32(eocdOffsetInTail + 16, true);
    this.totalEntriesCount = totalEntries;

    // 2. 检测 APK v2/v3 签名块
    await this._checkApkSigBlock(cdOffset);

    // 3. 读取 Central Directory 数据
    const cdBuffer = await this.source.read(cdOffset, cdSize);
    const cdView = new DataView(cdBuffer);
    const textDecoder = new TextDecoder("utf-8");

    let p = 0;
    const abiSet = new Set();

    while (p + 46 <= cdSize) {
      const sig = cdView.getUint32(p, true);
      if (sig !== 0x02014b50) {
        break;
      }

      const compressionMethod = cdView.getUint16(p + 10, true);
      const compressedSize = cdView.getUint32(p + 20, true);
      const uncompressedSize = cdView.getUint32(p + 24, true);
      const fileNameLen = cdView.getUint16(p + 28, true);
      const extraLen = cdView.getUint16(p + 30, true);
      const commentLen = cdView.getUint16(p + 32, true);
      const localHeaderOffset = cdView.getUint32(p + 42, true);

      const nameBytes = new Uint8Array(cdBuffer, p + 46, fileNameLen);
      const filename = textDecoder.decode(nameBytes);

      // 提取架构 (ABI)：兼容 APK (lib/<abi>/*.so) 与 AAR (jni/<abi>/*.so)
      if ((filename.startsWith("lib/") || filename.startsWith("jni/")) && filename.includes(".so")) {
        const parts = filename.split("/");
        if (parts.length >= 3 && parts[1]) {
          abiSet.add(parts[1]);
        }
      }

      this.entries.set(filename, {
        filename,
        compressionMethod,
        compressedSize,
        uncompressedSize,
        localHeaderOffset
      });

      p += 46 + fileNameLen + extraLen + commentLen;
    }

    this.abis = Array.from(abiSet).sort();
    return this;
  }

  async _checkApkSigBlock(cdOffset) {
    if (cdOffset < 24) return;
    try {
      const footerBuf = await this.source.read(cdOffset - 24, 24);
      const magic = new Uint8Array(footerBuf, 8, 16);
      const magicStr = String.fromCharCode(...magic);
      if (magicStr === "APK Sig Block 42") {
        this.hasV2Signature = true;
      }
    } catch (e) {}
  }

  getFileList() {
    return Array.from(this.entries.keys());
  }

  findEntries(regex) {
    const matched = [];
    for (const [name, entry] of this.entries.entries()) {
      if (regex.test(name)) {
        matched.push(entry);
      }
    }
    return matched;
  }

  /**
   * 智能定位 Manifest 条目（兼容 APK 根目录与 AAR 的 manifest/ 子目录）
   */
  findManifestEntry() {
    if (this.entries.has("AndroidManifest.xml")) {
      return this.entries.get("AndroidManifest.xml");
    }
    if (this.entries.has("manifest/AndroidManifest.xml")) {
      return this.entries.get("manifest/AndroidManifest.xml");
    }
    const matched = this.findEntries(/(?:^|\/)AndroidManifest\.xml$/i);
    return matched.length > 0 ? matched[0] : null;
  }

  async extractFile(filename) {
    const entry = this.entries.get(filename);
    if (!entry) {
      throw new Error(`文件未在包目录中找到: ${filename}`);
    }

    const headerBuf = await this.source.read(entry.localHeaderOffset, 30);
    const headerView = new DataView(headerBuf);
    const sig = headerView.getUint32(0, true);
    if (sig !== 0x04034b50) {
      throw new Error(`Local File Header 校验失败: ${filename}`);
    }

    const localFileNameLen = headerView.getUint16(26, true);
    const localExtraLen = headerView.getUint16(28, true);
    const dataOffset = entry.localHeaderOffset + 30 + localFileNameLen + localExtraLen;

    if (entry.compressedSize === 0) {
      return new Uint8Array(0);
    }

    const compressedBuf = await this.source.read(dataOffset, entry.compressedSize);
    const compressedBytes = new Uint8Array(compressedBuf);

    if (entry.compressionMethod === 0) {
      return compressedBytes;
    } else if (entry.compressionMethod === 8) {
      return await this._inflate(compressedBytes);
    } else {
      throw new Error(`不支持的压缩算法: ${entry.compressionMethod}`);
    }
  }

  async _inflate(bytes) {
    if (typeof DecompressionStream !== "undefined") {
      try {
        const ds = new DecompressionStream("deflate-raw");
        const writer = ds.writable.getWriter();
        writer.write(bytes);
        writer.close();
        const reader = ds.readable.getReader();
        const chunks = [];
        let total = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          total += value.length;
        }
        const result = new Uint8Array(total);
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        return result;
      } catch (err) {
        return this._fallbackInflate(bytes);
      }
    }
    return this._fallbackInflate(bytes);
  }

  async _fallbackInflate(bytes) {
    if (typeof process !== "undefined" && process.versions && process.versions.node) {
      const zlib = await import("zlib");
      return new Promise((resolve, reject) => {
        zlib.inflateRaw(bytes, (err, buf) => {
          if (err) reject(err);
          else resolve(new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength));
        });
      });
    }
    throw new Error("当前环境未找到 Deflate 解压器");
  }
}

/**
 * 本地文件数据源 (按需懒加载)
 */
export class BlobDataSource {
  constructor(blob) {
    this.blob = blob;
    this.totalBytesRead = 0;
  }

  async getSize() {
    return this.blob.size;
  }

  async read(offset, length) {
    this.totalBytesRead += length;
    const slice = this.blob.slice(offset, offset + length);
    return await slice.arrayBuffer();
  }
}

/**
 * 线上 HTTP Range 智能断点数据源
 */
export class HttpRangeDataSource {
  constructor(url, onProgress = null) {
    this.url = url;
    this.onProgress = onProgress;
    this.size = null;
    this.supportRange = null;
    this.totalNetworkBytes = 0;
    this.cachedRanges = [];
    this.fullBuffer = null;
  }

  _notify(status, downloaded, total) {
    if (this.onProgress) {
      const percent = total > 0 ? Math.round((downloaded / total) * 100) : 0;
      this.onProgress({ status, downloaded, total, percent, networkBytes: this.totalNetworkBytes });
    }
  }

  async getSize() {
    if (this.size !== null) return this.size;

    this._notify("正在校验目标地址是否为有效 APK/AAR 文件...", 0, 0);

    // 1. 发送 Range: bytes=0-3 校验文件头魔数 (仅消耗 4 字节！)
    try {
      const testResp = await fetch(this.url, { headers: { Range: "bytes=0-3" } });
      if (testResp.status === 206) {
        this.supportRange = true;
        const cr = testResp.headers.get("content-range");
        if (cr) {
          const match = cr.match(/\/(\d+)$/);
          if (match) {
            this.size = parseInt(match[1], 10);
          }
        }

        const headBytes = await testResp.arrayBuffer();
        this.totalNetworkBytes += headBytes.byteLength;
        this._addCache(0, headBytes);

        // 校验是否为 ZIP 头 PK\x03\x04 (0x04034b50)
        const magicView = new DataView(headBytes);
        if (magicView.byteLength >= 4 && magicView.getUint32(0, true) !== 0x04034b50) {
          throw new Error("目标链接不是有效的 APK/AAR 文件（文件头非 ZIP 格式，可能是一个普通网页或鉴权跳转页）");
        }
      } else if (testResp.status === 200) {
        this.supportRange = false;
        const fullBuf = await testResp.arrayBuffer();
        this.totalNetworkBytes += fullBuf.byteLength;
        this.fullBuffer = fullBuf;
        this.size = fullBuf.byteLength;

        const magicView = new DataView(fullBuf);
        if (magicView.byteLength < 4 || magicView.getUint32(0, true) !== 0x04034b50) {
          throw new Error("目标链接不是有效的 APK/AAR 文件（文件头非 ZIP 格式，可能是一个普通网页或鉴权跳转页）");
        }
        return this.size;
      }
    } catch (e) {
      if (e.message.includes("不是有效的 APK/AAR")) throw e;
    }

    // 2. HEAD 探测
    if (this.size === null) {
      try {
        const headResp = await fetch(this.url, { method: "HEAD" });
        const cl = headResp.headers.get("content-length");
        if (cl) {
          this.size = parseInt(cl, 10);
        }
      } catch (e) {}
    }

    // 3. 预下载末尾 1MB
    if (this.size !== null && this.supportRange !== false) {
      const tailPreloadBytes = Math.min(this.size, 1024 * 1024);
      const tailStart = this.size - tailPreloadBytes;
      const tailEnd = this.size - 1;

      this._notify(`检测支持断点下载，正在快速抓取末尾目录区 (${Math.round(tailPreloadBytes / 1024)} KB)...`, 0, this.size);

      try {
        const tailResp = await fetch(this.url, {
          headers: { Range: `bytes=${tailStart}-${tailEnd}` }
        });

        if (tailResp.status === 206) {
          this.supportRange = true;
          const buf = await tailResp.arrayBuffer();
          this.totalNetworkBytes += buf.byteLength;
          this._addCache(tailStart, buf);
          this._notify("目录区抓取完成，开始解析...", buf.byteLength, this.size);
          return this.size;
        }
      } catch (e) {}
    }

    // 4. 流式下载回退
    if (!this.fullBuffer) {
      this._notify("服务器不支持断点下载，正在流式下载...", 0, this.size || 0);
      const fullResp = await fetch(this.url);
      if (!fullResp.ok) {
        throw new Error(`下载失败: ${fullResp.status} ${fullResp.statusText}`);
      }

      const reader = fullResp.body.getReader();
      const contentLength = +(fullResp.headers.get("Content-Length") || this.size || 0);
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        this.totalNetworkBytes += value.length;
        this._notify(`正在下载 (${(received / 1024 / 1024).toFixed(1)} MB)...`, received, contentLength);
      }

      const merged = new Uint8Array(received);
      let off = 0;
      for (const chunk of chunks) {
        merged.set(chunk, off);
        off += chunk.length;
      }

      this.fullBuffer = merged.buffer;
      this.size = received;
      this.supportRange = false;

      const magicView = new DataView(this.fullBuffer);
      if (magicView.byteLength < 4 || magicView.getUint32(0, true) !== 0x04034b50) {
        throw new Error("目标链接不是有效的 APK/AAR 文件（文件头非 ZIP 格式，可能是一个普通网页或链接已失效）");
      }
    }

    return this.size;
  }

  async read(offset, length) {
    if (this.fullBuffer) {
      return this.fullBuffer.slice(offset, offset + length);
    }

    const cached = this._findInCache(offset, length);
    if (cached) {
      return cached;
    }

    const end = offset + length - 1;
    this._notify(`按需加载元数据块 (${Math.round(length / 1024)} KB)...`, this.totalNetworkBytes, this.size);

    const resp = await fetch(this.url, {
      headers: { Range: `bytes=${offset}-${end}` }
    });

    if (resp.status === 206) {
      const buf = await resp.arrayBuffer();
      this.totalNetworkBytes += buf.byteLength;
      this._addCache(offset, buf);
      return buf;
    } else if (resp.status === 200) {
      const buf = await resp.arrayBuffer();
      this.totalNetworkBytes += buf.byteLength;
      this.fullBuffer = buf;
      this.size = buf.byteLength;
      return buf.slice(offset, offset + length);
    } else {
      throw new Error(`Range 请求失败 [${resp.status}]: ${resp.statusText}`);
    }
  }

  _addCache(start, buffer) {
    this.cachedRanges.push({
      start,
      end: start + buffer.byteLength,
      buffer
    });
  }

  _findInCache(offset, length) {
    const targetEnd = offset + length;
    for (const range of this.cachedRanges) {
      if (offset >= range.start && targetEnd <= range.end) {
        const sliceOffset = offset - range.start;
        return range.buffer.slice(sliceOffset, sliceOffset + length);
      }
    }
    return null;
  }
}
