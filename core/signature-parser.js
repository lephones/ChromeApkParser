/**
 * APK Signature & X.509 Certificate Parser
 * 支持从 META-INF/*.RSA, *.DSA (v1 签名) 以及 APK Signing Block (v2/v3 签名块)
 * 提取 X.509 证书并计算 MD5 / SHA-1 / SHA-256 指纹，解析持有者与签名版本。
 */

// 纯 JS MD5 实现
function md5(bytes) {
  function safeAdd(x, y) {
    const lsw = (x & 0xffff) + (y & 0xffff);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xffff);
  }
  function bitRol(num, cnt) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
  function cmn(q, a, b, x, s, t) {
    return safeAdd(bitRol(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
  }
  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | (~b & d), a, b, x, s, t);
  }
  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & ~d), a, b, x, s, t);
  }
  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  const n = bytes.length;
  const words = [];
  for (let i = 0; i < n; i++) {
    words[i >> 2] |= (bytes[i] & 0xff) << ((i % 4) * 8);
  }
  words[n >> 2] |= 0x80 << ((n % 4) * 8);
  words[(((n + 8) >> 6) << 4) + 14] = n * 8;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < words.length; i += 16) {
    const olda = a, oldb = b, oldc = c, oldd = d;
    a = ff(a, b, c, d, words[i + 0] || 0, 7, -680876936);
    d = ff(d, a, b, c, words[i + 1] || 0, 12, -389564586);
    c = ff(c, d, a, b, words[i + 2] || 0, 17, 606105819);
    b = ff(b, c, d, a, words[i + 3] || 0, 22, -1044525330);
    a = ff(a, b, c, d, words[i + 4] || 0, 7, -176418897);
    d = ff(d, a, b, c, words[i + 5] || 0, 12, 1200080426);
    c = ff(c, d, a, b, words[i + 6] || 0, 17, -1473231341);
    b = ff(b, c, d, a, words[i + 7] || 0, 22, -45705983);
    a = ff(a, b, c, d, words[i + 8] || 0, 7, 1770035416);
    d = ff(d, a, b, c, words[i + 9] || 0, 12, -1958414417);
    c = ff(c, d, a, b, words[i + 10] || 0, 17, -42063);
    b = ff(b, c, d, a, words[i + 11] || 0, 22, -1990404162);
    a = ff(a, b, c, d, words[i + 12] || 0, 7, 1804603682);
    d = ff(d, a, b, c, words[i + 13] || 0, 12, -40341101);
    c = ff(c, d, a, b, words[i + 14] || 0, 17, -1502002290);
    b = ff(b, c, d, a, words[i + 15] || 0, 22, 1236535329);

    a = gg(a, b, c, d, words[i + 1] || 0, 5, -165796510);
    d = gg(d, a, b, c, words[i + 6] || 0, 9, -1069501632);
    c = gg(c, d, a, b, words[i + 11] || 0, 14, 643717713);
    b = gg(b, c, d, a, words[i + 0] || 0, 20, -373897302);
    a = gg(a, b, c, d, words[i + 5] || 0, 5, -701558691);
    d = gg(d, a, b, c, words[i + 10] || 0, 9, 38016083);
    c = gg(c, d, a, b, words[i + 15] || 0, 14, -660478335);
    b = gg(b, c, d, a, words[i + 4] || 0, 20, -405537848);
    a = gg(a, b, c, d, words[i + 9] || 0, 5, 568446438);
    d = gg(d, a, b, c, words[i + 14] || 0, 9, -1019803690);
    c = gg(c, d, a, b, words[i + 3] || 0, 14, -187363961);
    b = gg(b, c, d, a, words[i + 8] || 0, 20, 1163531501);
    a = gg(a, b, c, d, words[i + 13] || 0, 5, -1444681467);
    d = gg(d, a, b, c, words[i + 2] || 0, 9, -51403784);
    c = gg(c, d, a, b, words[i + 7] || 0, 14, 1735328473);
    b = gg(b, c, d, a, words[i + 12] || 0, 20, -1926607734);

    a = hh(a, b, c, d, words[i + 5] || 0, 4, -378558);
    d = hh(d, a, b, c, words[i + 8] || 0, 11, -2022574463);
    c = hh(c, d, a, b, words[i + 11] || 0, 16, 1839030562);
    b = hh(b, c, d, a, words[i + 14] || 0, 23, -35309556);
    a = hh(a, b, c, d, words[i + 1] || 0, 4, -1530992060);
    d = hh(d, a, b, c, words[i + 4] || 0, 11, 1272893353);
    c = hh(c, d, a, b, words[i + 7] || 0, 16, -155497632);
    b = hh(b, c, d, a, words[i + 10] || 0, 23, -1094730640);
    a = hh(a, b, c, d, words[i + 13] || 0, 4, 681279174);
    d = hh(d, a, b, c, words[i + 0] || 0, 11, -358537222);
    c = hh(c, d, a, b, words[i + 3] || 0, 16, -722521979);
    b = hh(b, c, d, a, words[i + 6] || 0, 23, 76029189);
    a = hh(a, b, c, d, words[i + 9] || 0, 4, -640364487);
    d = hh(d, a, b, c, words[i + 12] || 0, 11, -421815835);
    c = hh(c, d, a, b, words[i + 15] || 0, 16, 530742520);
    b = hh(b, c, d, a, words[i + 2] || 0, 23, -995338651);

    a = ii(a, b, c, d, words[i + 0] || 0, 6, -198630844);
    d = ii(d, a, b, c, words[i + 7] || 0, 10, 1126891415);
    c = ii(c, d, a, b, words[i + 14] || 0, 15, -1416354905);
    b = ii(b, c, d, a, words[i + 5] || 0, 21, -57434055);
    a = ii(a, b, c, d, words[i + 12] || 0, 6, 1700485571);
    d = ii(d, a, b, c, words[i + 3] || 0, 10, -1894986606);
    c = ii(c, d, a, b, words[i + 10] || 0, 15, -1051523);
    b = ii(b, c, d, a, words[i + 1] || 0, 21, -2054922799);
    a = ii(a, b, c, d, words[i + 8] || 0, 6, 1873313359);
    d = ii(d, a, b, c, words[i + 15] || 0, 10, -30611744);
    c = ii(c, d, a, b, words[i + 6] || 0, 15, -1560198380);
    b = ii(b, c, d, a, words[i + 13] || 0, 21, 1309151649);
    a = ii(a, b, c, d, words[i + 4] || 0, 6, -145523070);
    d = ii(d, a, b, c, words[i + 11] || 0, 10, -1120210379);
    c = ii(c, d, a, b, words[i + 2] || 0, 15, 718787259);
    b = ii(b, c, d, a, words[i + 9] || 0, 21, -343485551);

    a = safeAdd(a, olda);
    b = safeAdd(b, oldb);
    c = safeAdd(c, oldc);
    d = safeAdd(d, oldd);
  }

  const hexChars = "0123456789abcdef";
  let hex = "";
  for (const val of [a, b, c, d]) {
    for (let j = 0; j < 4; j++) {
      const byte = (val >>> (j * 8)) & 0xff;
      hex += hexChars[(byte >>> 4) & 0x0f] + hexChars[byte & 0x0f];
    }
  }
  return hex;
}

export class SignatureParser {
  /**
   * 从 APK 数据源或已解压的签名数据中提取证书与指纹
   * @param {import('./zip-reader.js').ZipReader} zipReader
   */
  static async extractSignature(zipReader) {
    const result = {
      schemes: [],
      md5: "",
      md5Raw: "",
      sha1: "",
      sha256: "",
      subject: "Android App Certificate",
      issuer: "",
      found: false
    };

    // 1. 优先尝试 APK Signing Block (v2 / v3 签名)
    try {
      const v2CertDer = await SignatureParser._extractFromSigningBlock(zipReader);
      if (v2CertDer) {
        result.found = true;
        result.schemes.push("v2 (APK Signature Scheme v2)");
        await SignatureParser._fillFingerprints(result, v2CertDer);
      }
    } catch (e) {
      // 忽略错误，继续尝试 v1
    }

    // 2. 尝试 META-INF 中的 v1 签名 (.RSA / .DSA / .EC)
    const rsaFiles = zipReader.findEntries(/META-INF\/.*\.(RSA|DSA|EC)$/i);
    if (rsaFiles.length > 0) {
      result.schemes.push("v1 (JAR Signature)");
      if (!result.found) {
        try {
          const rsaBytes = await zipReader.extractFile(rsaFiles[0].filename);
          const certDer = SignatureParser._extractCertFromPkcs7(rsaBytes);
          if (certDer) {
            result.found = true;
            await SignatureParser._fillFingerprints(result, certDer);
          }
        } catch (e) {
          // 容错
        }
      }
    }

    return result;
  }

  /**
   * 从 APK Signing Block 提取 X.509 证书 DER
   */
  static async _extractFromSigningBlock(zipReader) {
    const totalSize = await zipReader.source.getSize();
    const tailCheckLen = Math.min(totalSize, 65536 + 22);
    const tailBuffer = await zipReader.source.read(totalSize - tailCheckLen, tailCheckLen);
    const tailView = new DataView(tailBuffer);

    let eocdOffsetInTail = -1;
    for (let i = tailBuffer.byteLength - 22; i >= 0; i--) {
      if (tailView.getUint32(i, true) === 0x06054b50) {
        eocdOffsetInTail = i;
        break;
      }
    }
    if (eocdOffsetInTail === -1) return null;

    const cdOffset = tailView.getUint32(eocdOffsetInTail + 16, true);
    if (cdOffset < 24) return null;

    // 读取 cdOffset 之前的 24 字节
    const footerBuf = await zipReader.source.read(cdOffset - 24, 24);
    const footerView = new DataView(footerBuf);
    const magicStr = String.fromCharCode(...new Uint8Array(footerBuf, 8, 16));
    if (magicStr !== "APK Sig Block 42") {
      return null;
    }

    const blockSizeLow = footerView.getUint32(0, true);
    if (blockSizeLow <= 0 || blockSizeLow > 5 * 1024 * 1024) {
      return null; // 超出合理大小限制
    }

    const blockStart = cdOffset - blockSizeLow - 8;
    const blockBuf = await zipReader.source.read(blockStart, blockSizeLow);
    const blockView = new DataView(blockBuf);

    let p = 8;
    while (p < blockSizeLow - 24) {
      const pairLen = blockView.getUint32(p, true);
      const id = blockView.getUint32(p + 8, true);

      if (id === 0x7109871a || id === 0xf05368c0) {
        // v2 (0x7109871a) 或 v3 (0xf05368c0) 签名块
        const v2Offset = p + 12;
        const signersLen = blockView.getUint32(v2Offset, true);
        const signedDataLen = blockView.getUint32(v2Offset + 4 + 4, true);

        // signedData 内部: digests sequence -> certificates sequence
        const digestsLen = blockView.getUint32(v2Offset + 12, true);
        let certsOff = v2Offset + 12 + 4 + digestsLen;
        const certsSeqLen = blockView.getUint32(certsOff, true);
        certsOff += 4;
        const certLen = blockView.getUint32(certsOff, true);
        certsOff += 4;

        if (certLen > 0 && certsOff + certLen <= blockSizeLow) {
          return new Uint8Array(blockBuf, certsOff, certLen);
        }
      }

      p += 8 + pairLen;
    }

    return null;
  }

  static async _fillFingerprints(result, certDer) {
    const md5Hex = md5(certDer);
    result.md5 = md5Hex.match(/.{2}/g).join(":").toUpperCase();
    result.md5Raw = md5Hex.toLowerCase();

    let sha1Hex = "";
    let sha256Hex = "";

    if (typeof crypto !== "undefined" && crypto.subtle) {
      const sha1Buf = await crypto.subtle.digest("SHA-1", certDer);
      sha1Hex = Array.from(new Uint8Array(sha1Buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const sha256Buf = await crypto.subtle.digest("SHA-256", certDer);
      sha256Hex = Array.from(new Uint8Array(sha256Buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } else {
      const nodeCrypto = await import("crypto");
      sha1Hex = nodeCrypto.createHash("sha1").update(certDer).digest("hex");
      sha256Hex = nodeCrypto.createHash("sha256").update(certDer).digest("hex");
    }

    result.sha1 = sha1Hex.match(/.{2}/g).join(":").toUpperCase();
    result.sha256 = sha256Hex.match(/.{2}/g).join(":").toUpperCase();

    // 简单解析 Subject
    const textDecoder = new TextDecoder("utf-8");
    const rawStr = textDecoder.decode(certDer);
    const cnMatches = [];
    const re = /(?:CN|O|OU|C|ST|L)\s*=\s*([^,\x00-\x1f]+)/g;
    let m;
    while ((m = re.exec(rawStr)) !== null) {
      if (m[1] && m[1].trim()) cnMatches.push(m[0].trim());
    }
    if (cnMatches.length > 0) {
      result.subject = Array.from(new Set(cnMatches)).join(", ");
    }
  }

  static _extractCertFromPkcs7(bytes) {
    const len = bytes.length;
    for (let i = 0; i < len - 10; i++) {
      if (bytes[i] === 0x30) {
        let off = i + 1;
        let l = bytes[off++];
        if (l & 0x80) off += l & 0x7f;

        if (off < len && bytes[off] === 0x30) {
          const probeMax = Math.min(off + 30, len);
          for (let k = off; k < probeMax; k++) {
            if (bytes[k] === 0xa0 && bytes[k + 1] === 0x03 && bytes[k + 2] === 0x02 && bytes[k + 3] === 0x01) {
              let certLen = bytes[i + 1];
              let headerSize = 2;
              if (certLen & 0x80) {
                const count = certLen & 0x7f;
                certLen = 0;
                for (let c = 0; c < count; c++) {
                  certLen = (certLen << 8) | bytes[i + 2 + c];
                }
                headerSize = 2 + count;
              }
              const totalCertBytes = headerSize + certLen;
              if (i + totalCertBytes <= len) {
                return bytes.slice(i, i + totalCertBytes);
              }
            }
          }
        }
      }
    }
    return null;
  }
}
