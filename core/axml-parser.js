/**
 * Android Manifest Parser (支持 APK 编译二进制 AXML、AAB Protobuf XML 与明文 XML 自适应解析)
 */

import { ProtoXmlParser } from "./proto-xml-parser.js";

export const ANDROID_API_LEVELS = {
  14: "Android 4.0 (Ice Cream Sandwich)",
  15: "Android 4.0.3",
  16: "Android 4.1 (Jelly Bean)",
  17: "Android 4.2",
  18: "Android 4.3",
  19: "Android 4.4 (KitKat)",
  21: "Android 5.0 (Lollipop)",
  22: "Android 5.1",
  23: "Android 6.0 (Marshmallow)",
  24: "Android 7.0 (Nougat)",
  25: "Android 7.1",
  26: "Android 8.0 (Oreo)",
  27: "Android 8.1",
  28: "Android 9.0 (Pie)",
  29: "Android 10 (Q)",
  30: "Android 11 (R)",
  31: "Android 12 (S)",
  32: "Android 12L (Sv2)",
  33: "Android 13 (Tiramisu)",
  34: "Android 14 (Upside Down Cake)",
  35: "Android 15 (Vanilla Ice Cream)",
  36: "Android 16 (Baklava)"
};

const RES_ATTR_MAP = {
  0x01010000: "theme",
  0x01010001: "label",
  0x01010002: "icon",
  0x01010003: "name",
  0x0101001b: "permission",
  0x01010020: "exported",
  0x01010024: "authorities",
  0x0101020c: "minSdkVersion",
  0x0101021b: "versionCode",
  0x0101021c: "versionName",
  0x01010270: "targetSdkVersion",
  0x01010572: "compileSdkVersion",
  0x01010573: "compileSdkVersionCodename"
};

export class ManifestParser {
  /**
   * @param {Uint8Array} bytes 原始文件字节数据
   */
  constructor(bytes) {
    this.bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  }

  /**
   * 自适应解析：自动判断是 APK 二进制 AXML、AAB Protobuf 还是明文 XML
   */
  parse() {
    if (this.bytes.byteLength < 4) {
      throw new Error("Manifest 文件内容过短");
    }

    const view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
    const magic16 = view.getUint16(0, true);

    if (magic16 === 0x0003) {
      // 1. APK 二进制 AXML
      const binaryParser = new BinaryAxmlParser(this.bytes);
      return binaryParser.parse();
    } else if (this.bytes[0] === 0x0a) {
      // 2. AAB (Android App Bundle) 的 Protobuf 二进制 XML
      try {
        const protoParser = new ProtoXmlParser(this.bytes);
        return protoParser.parse();
      } catch (e) {
        // 如果 Proto 解析失败，回退尝试明文解析
        const plainParser = new PlainXmlParser(this.bytes);
        return plainParser.parse();
      }
    } else {
      // 3. 明文 XML
      const plainParser = new PlainXmlParser(this.bytes);
      return plainParser.parse();
    }
  }
}

/**
 * 明文 XML 解析器
 */
class PlainXmlParser {
  constructor(bytes) {
    this.bytes = bytes;
  }

  parse() {
    const textDecoder = new TextDecoder("utf-8");
    const xmlText = textDecoder.decode(this.bytes);

    const metadata = {
      packageName: "",
      versionCode: "",
      versionName: "",
      minSdkVersion: null,
      minSdkName: "",
      targetSdkVersion: null,
      targetSdkName: "",
      compileSdkVersion: null,
      applicationLabel: "",
      applicationIcon: "",
      mainActivity: "",
      permissions: [],
      activities: [],
      services: [],
      receivers: [],
      providers: []
    };

    if (typeof DOMParser !== "undefined") {
      try {
        const dom = new DOMParser().parseFromString(xmlText, "text/xml");
        const manifestEl = dom.querySelector("manifest");
        if (manifestEl) {
          metadata.packageName = manifestEl.getAttribute("package") || "";
          metadata.versionCode = manifestEl.getAttribute("android:versionCode") || "";
          metadata.versionName = manifestEl.getAttribute("android:versionName") || "";
        }

        const usesSdk = dom.querySelector("uses-sdk");
        if (usesSdk) {
          const min = usesSdk.getAttribute("android:minSdkVersion");
          const target = usesSdk.getAttribute("android:targetSdkVersion");
          if (min) metadata.minSdkVersion = parseInt(min, 10) || min;
          if (target) metadata.targetSdkVersion = parseInt(target, 10) || target;
        }

        dom.querySelectorAll("uses-permission, uses-permission-sdk-23").forEach((el) => {
          const name = el.getAttribute("android:name");
          if (name && !metadata.permissions.includes(name)) {
            metadata.permissions.push(name);
          }
        });

        const appEl = dom.querySelector("application");
        if (appEl) {
          metadata.applicationLabel = appEl.getAttribute("android:label") || "";
          metadata.applicationIcon = appEl.getAttribute("android:icon") || "";
        }

        dom.querySelectorAll("activity, activity-alias").forEach((actEl) => {
          const actName = actEl.getAttribute("android:name") || actEl.getAttribute("android:targetActivity");
          if (actName) {
            metadata.activities.push(actName);

            const isMain = !!actEl.querySelector('intent-filter > action[android\\:name="android.intent.action.MAIN"], action[name="android.intent.action.MAIN"]');
            const isLauncher = !!actEl.querySelector('intent-filter > category[android\\:name="android.intent.category.LAUNCHER"], category[name="android.intent.category.LAUNCHER"]');
            if (isMain && isLauncher && !metadata.mainActivity) {
              metadata.mainActivity = actName;
            }
          }
        });

        dom.querySelectorAll("service").forEach((el) => {
          const name = el.getAttribute("android:name");
          if (name) metadata.services.push(name);
        });
        dom.querySelectorAll("receiver").forEach((el) => {
          const name = el.getAttribute("android:name");
          if (name) metadata.receivers.push(name);
        });
        dom.querySelectorAll("provider").forEach((el) => {
          const name = el.getAttribute("android:name");
          if (name) metadata.providers.push(name);
        });
      } catch (e) {}
    }

    if (!metadata.packageName) {
      const pkgMatch = xmlText.match(/package\s*=\s*["']([^"']+)["']/i);
      if (pkgMatch) metadata.packageName = pkgMatch[1];
    }
    if (!metadata.versionCode) {
      const vcMatch = xmlText.match(/versionCode\s*=\s*["']([^"']+)["']/i);
      if (vcMatch) metadata.versionCode = vcMatch[1];
    }
    if (!metadata.versionName) {
      const vnMatch = xmlText.match(/versionName\s*=\s*["']([^"']+)["']/i);
      if (vnMatch) metadata.versionName = vnMatch[1];
    }
    if (!metadata.minSdkVersion) {
      const minMatch = xmlText.match(/minSdkVersion\s*=\s*["']([^"']+)["']/i);
      if (minMatch) metadata.minSdkVersion = parseInt(minMatch[1], 10) || minMatch[1];
    }
    if (!metadata.targetSdkVersion) {
      const targetMatch = xmlText.match(/targetSdkVersion\s*=\s*["']([^"']+)["']/i);
      if (targetMatch) metadata.targetSdkVersion = parseInt(targetMatch[1], 10) || targetMatch[1];
    }

    if (metadata.minSdkVersion) {
      metadata.minSdkName = ANDROID_API_LEVELS[metadata.minSdkVersion] || `API ${metadata.minSdkVersion}`;
    }
    if (metadata.targetSdkVersion) {
      metadata.targetSdkName = ANDROID_API_LEVELS[metadata.targetSdkVersion] || `API ${metadata.targetSdkVersion}`;
    }

    if (metadata.mainActivity && metadata.packageName) {
      let act = metadata.mainActivity;
      if (act.startsWith(".")) {
        metadata.mainActivity = `${metadata.packageName}${act}`;
      } else if (!act.includes(".")) {
        metadata.mainActivity = `${metadata.packageName}.${act}`;
      }
    }

    return {
      metadata,
      formattedXml: xmlText.trim()
    };
  }
}

/**
 * 二进制 AXML 解析器
 */
class BinaryAxmlParser {
  constructor(bytes) {
    this.buffer = bytes.buffer;
    this.byteOffset = bytes.byteOffset || 0;
    this.byteLength = bytes.byteLength || this.buffer.byteLength;
    this.view = new DataView(this.buffer, this.byteOffset, this.byteLength);

    this.strings = [];
    this.resourceIds = [];
    this.namespaces = new Map();
    this.prefixToUri = new Map();

    this.manifestData = {
      packageName: "",
      versionCode: "",
      versionName: "",
      minSdkVersion: null,
      minSdkName: "",
      targetSdkVersion: null,
      targetSdkName: "",
      compileSdkVersion: null,
      applicationLabel: "",
      applicationIcon: "",
      mainActivity: "",
      permissions: [],
      activities: [],
      services: [],
      receivers: [],
      providers: []
    };

    this._currentActivity = null;
    this._currentHasMainAction = false;
    this._currentHasLauncherCategory = false;

    this.xmlLines = [];
    this.indentLevel = 0;
  }

  parse() {
    let offset = 8;
    const totalLength = this.byteLength;

    while (offset < totalLength) {
      if (offset + 8 > totalLength) break;

      const chunkType = this.view.getUint16(offset, true);
      const chunkSize = this.view.getUint32(offset + 4, true);

      if (chunkSize <= 0 || offset + chunkSize > totalLength + 10) {
        break;
      }

      switch (chunkType) {
        case 0x0001:
          this._parseStringPool(offset, chunkSize);
          break;
        case 0x0180:
          this._parseResourceMap(offset, chunkSize);
          break;
        case 0x0100:
          this._parseStartNamespace(offset);
          break;
        case 0x0101:
          break;
        case 0x0102:
          this._parseStartElement(offset, chunkSize);
          break;
        case 0x0103:
          this._parseEndElement(offset);
          break;
        case 0x0104:
          this._parseCData(offset);
          break;
        default:
          break;
      }

      offset += chunkSize;
    }

    if (this.manifestData.minSdkVersion) {
      this.manifestData.minSdkName =
        ANDROID_API_LEVELS[this.manifestData.minSdkVersion] || `API ${this.manifestData.minSdkVersion}`;
    }
    if (this.manifestData.targetSdkVersion) {
      this.manifestData.targetSdkName =
        ANDROID_API_LEVELS[this.manifestData.targetSdkVersion] || `API ${this.manifestData.targetSdkVersion}`;
    }

    if (this.manifestData.mainActivity && this.manifestData.packageName) {
      let act = this.manifestData.mainActivity;
      if (act.startsWith(".")) {
        this.manifestData.mainActivity = `${this.manifestData.packageName}${act}`;
      } else if (!act.includes(".")) {
        this.manifestData.mainActivity = `${this.manifestData.packageName}.${act}`;
      }
    }

    return {
      metadata: this.manifestData,
      formattedXml: this.xmlLines.join("\n")
    };
  }

  _parseStringPool(offset, chunkSize) {
    const stringCount = this.view.getUint32(offset + 8, true);
    const flags = this.view.getUint32(offset + 16, true);
    const stringsStart = this.view.getUint32(offset + 20, true);
    const isUtf8 = (flags & (1 << 8)) !== 0;

    const stringOffsets = [];
    for (let i = 0; i < stringCount; i++) {
      stringOffsets.push(this.view.getUint32(offset + 28 + i * 4, true));
    }

    const poolStart = offset + stringsStart;
    const utf8Decoder = new TextDecoder("utf-8", { fatal: false });
    const utf16Decoder = new TextDecoder("utf-16le", { fatal: false });

    for (let i = 0; i < stringCount; i++) {
      const strOffset = poolStart + stringOffsets[i];
      if (strOffset >= offset + chunkSize) {
        this.strings.push("");
        continue;
      }

      if (isUtf8) {
        let p = strOffset;
        let charLen = this.view.getUint8(p++);
        if (charLen & 0x80) {
          charLen = ((charLen & 0x7f) << 8) | this.view.getUint8(p++);
        }
        let byteLen = this.view.getUint8(p++);
        if (byteLen & 0x80) {
          byteLen = ((byteLen & 0x7f) << 8) | this.view.getUint8(p++);
        }

        const bytes = new Uint8Array(this.buffer, this.byteOffset + p, byteLen);
        this.strings.push(utf8Decoder.decode(bytes));
      } else {
        const p = strOffset;
        let charLen = this.view.getUint16(p, true);
        let dataStart = p + 2;
        if (charLen & 0x8000) {
          charLen = ((charLen & 0x7fff) << 16) | this.view.getUint16(dataStart, true);
          dataStart += 2;
        }

        const bytes = new Uint8Array(this.buffer, this.byteOffset + dataStart, charLen * 2);
        this.strings.push(utf16Decoder.decode(bytes));
      }
    }
  }

  _parseResourceMap(offset, chunkSize) {
    const count = (chunkSize - 8) / 4;
    for (let i = 0; i < count; i++) {
      this.resourceIds.push(this.view.getUint32(offset + 8 + i * 4, true));
    }
  }

  _parseStartNamespace(offset) {
    const prefixIdx = this.view.getInt32(offset + 16, true);
    const uriIdx = this.view.getInt32(offset + 20, true);
    const prefix = prefixIdx >= 0 ? this.strings[prefixIdx] : "android";
    const uri = uriIdx >= 0 ? this.strings[uriIdx] : "";

    if (uri) {
      this.namespaces.set(uri, prefix);
      this.prefixToUri.set(prefix, uri);
    }
  }

  _parseStartElement(offset, chunkSize) {
    const nameIdx = this.view.getInt32(offset + 20, true);
    const attrStart = this.view.getUint16(offset + 24, true);
    const attrSize = this.view.getUint16(offset + 26, true);
    const attrCount = this.view.getUint16(offset + 28, true);

    const tagName = (nameIdx >= 0 ? this.strings[nameIdx] : "") || "node";
    const attributes = [];

    let attrOffset = offset + 16 + attrStart;
    for (let i = 0; i < attrCount; i++) {
      const aNsIdx = this.view.getInt32(attrOffset, true);
      const aNameIdx = this.view.getInt32(attrOffset + 4, true);
      const aValStrIdx = this.view.getInt32(attrOffset + 8, true);
      const aType = this.view.getUint8(attrOffset + 15);
      const aData = this.view.getUint32(attrOffset + 16, true);

      let aName = aNameIdx >= 0 ? this.strings[aNameIdx] : "";
      if (!aName && aNameIdx >= 0 && this.resourceIds[aNameIdx]) {
        aName = RES_ATTR_MAP[this.resourceIds[aNameIdx]] || `attr_0x${this.resourceIds[aNameIdx].toString(16)}`;
      }

      const aNsUri = aNsIdx >= 0 ? this.strings[aNsIdx] : "";
      let prefix = "";
      if (aNsUri) {
        prefix = this.namespaces.get(aNsUri) || "android";
      }

      let aValue = "";
      if (aValStrIdx >= 0 && aValStrIdx < this.strings.length && this.strings[aValStrIdx] !== "") {
        aValue = this.strings[aValStrIdx];
      } else {
        aValue = this._formatAttributeValue(aType, aData);
      }

      const fullAttrName = prefix ? `${prefix}:${aName}` : aName;
      attributes.push({ name: fullAttrName, rawName: aName, value: aValue, type: aType, data: aData });

      attrOffset += attrSize;
    }

    this._collectMetadata(tagName, attributes);

    const indent = "  ".repeat(this.indentLevel);
    let line = `${indent}<${tagName}`;

    if (this.indentLevel === 0 && this.namespaces.size > 0) {
      for (const [uri, pfx] of this.namespaces.entries()) {
        line += `\n${indent}  xmlns:${pfx}="${uri}"`;
      }
    }

    for (const attr of attributes) {
      line += `\n${indent}  ${attr.name}="${this._escapeXml(attr.value)}"`;
    }
    line += ">";
    this.xmlLines.push(line);
    this.indentLevel++;
  }

  _parseEndElement(offset) {
    const nameIdx = this.view.getInt32(offset + 20, true);
    const tagName = (nameIdx >= 0 ? this.strings[nameIdx] : "") || "node";

    if (tagName === "activity" || tagName === "activity-alias") {
      if (this._currentHasMainAction && this._currentHasLauncherCategory && !this.manifestData.mainActivity) {
        this.manifestData.mainActivity = this._currentActivity;
      }
      this._currentActivity = null;
      this._currentHasMainAction = false;
      this._currentHasLauncherCategory = false;
    }

    this.indentLevel = Math.max(0, this.indentLevel - 1);
    const indent = "  ".repeat(this.indentLevel);
    this.xmlLines.push(`${indent}</${tagName}>`);
  }

  _parseCData(offset) {
    const dataIdx = this.view.getInt32(offset + 16, true);
    const text = dataIdx >= 0 ? this.strings[dataIdx] : "";
    if (text.trim()) {
      const indent = "  ".repeat(this.indentLevel);
      this.xmlLines.push(`${indent}${this._escapeXml(text)}`);
    }
  }

  _formatAttributeValue(type, data) {
    switch (type) {
      case 0x01:
        return `@0x${data.toString(16).padStart(8, "0")}`;
      case 0x02:
        return `?0x${data.toString(16).padStart(8, "0")}`;
      case 0x03:
        return data < this.strings.length ? this.strings[data] : `<string_${data}>`;
      case 0x10:
        return data.toString(10);
      case 0x11:
        return `0x${data.toString(16)}`;
      case 0x12:
        return data !== 0 ? "true" : "false";
      case 0x1c:
      case 0x1d:
      case 0x1e:
      case 0x1f:
        return `#${data.toString(16).padStart(8, "0")}`;
      default:
        return data.toString();
    }
  }

  _collectMetadata(tag, attrs) {
    const attrMap = {};
    for (const a of attrs) {
      attrMap[a.rawName] = a.value;
      attrMap[a.name] = a.value;
    }

    if (tag === "manifest") {
      this.manifestData.packageName = attrMap["package"] || "";
      this.manifestData.versionCode = attrMap["versionCode"] || attrMap["android:versionCode"] || "";
      this.manifestData.versionName = attrMap["versionName"] || attrMap["android:versionName"] || "";
      if (attrMap["compileSdkVersion"]) {
        this.manifestData.compileSdkVersion = attrMap["compileSdkVersion"];
      }
    } else if (tag === "uses-sdk") {
      const min = attrMap["minSdkVersion"] || attrMap["android:minSdkVersion"];
      const target = attrMap["targetSdkVersion"] || attrMap["android:targetSdkVersion"];
      if (min) this.manifestData.minSdkVersion = parseInt(min, 10) || min;
      if (target) this.manifestData.targetSdkVersion = parseInt(target, 10) || target;
    } else if (tag === "uses-permission" || tag === "uses-permission-sdk-23") {
      const permName = attrMap["name"] || attrMap["android:name"];
      if (permName && !this.manifestData.permissions.includes(permName)) {
        this.manifestData.permissions.push(permName);
      }
    } else if (tag === "application") {
      this.manifestData.applicationLabel = attrMap["label"] || attrMap["android:label"] || "";
      this.manifestData.applicationIcon = attrMap["icon"] || attrMap["android:icon"] || "";
    } else if (tag === "activity" || tag === "activity-alias") {
      const actName = attrMap["name"] || attrMap["android:name"] || attrMap["targetActivity"] || "";
      if (actName) {
        this.manifestData.activities.push(actName);
        this._currentActivity = actName;
        this._currentHasMainAction = false;
        this._currentHasLauncherCategory = false;
      }
    } else if (tag === "action") {
      const actionName = attrMap["name"] || attrMap["android:name"] || "";
      if (actionName === "android.intent.action.MAIN") {
        this._currentHasMainAction = true;
      }
    } else if (tag === "category") {
      const categoryName = attrMap["name"] || attrMap["android:name"] || "";
      if (categoryName === "android.intent.category.LAUNCHER") {
        this._currentHasLauncherCategory = true;
      }
    } else if (tag === "service") {
      const name = attrMap["name"] || attrMap["android:name"];
      if (name) this.manifestData.services.push(name);
    } else if (tag === "receiver") {
      const name = attrMap["name"] || attrMap["android:name"];
      if (name) this.manifestData.receivers.push(name);
    } else if (tag === "provider") {
      const name = attrMap["name"] || attrMap["android:name"];
      if (name) this.manifestData.providers.push(name);
    }
  }

  _escapeXml(str) {
    if (typeof str !== "string") return String(str);
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}

export const AxmlParser = ManifestParser;
