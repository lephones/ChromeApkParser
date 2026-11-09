/**
 * AAB (Android App Bundle) Protobuf AndroidManifest.xml Parser
 * 解析 Google AAPT2 序列化的 aapt.pb.XmlNode 二进制结构，
 * 提取包名、版本、权限、组件、MainActivity 并重构彩色 XML。
 */

import { ANDROID_API_LEVELS } from "./axml-parser.js";

// 轻量 Protobuf 协议流读取器
class ProtoReader {
  constructor(bytes) {
    this.bytes = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    this.pos = 0;
    this.len = this.bytes.length;
    this.textDecoder = new TextDecoder("utf-8");
  }

  isEnd() {
    return this.pos >= this.len;
  }

  readVarint() {
    let result = 0;
    let shift = 0;
    while (this.pos < this.len) {
      const b = this.bytes[this.pos++];
      result |= (b & 0x7f) << shift;
      if (!(b & 0x80)) break;
      shift += 7;
    }
    return result >>> 0;
  }

  readBytes(length) {
    const start = this.pos;
    this.pos += length;
    return this.bytes.subarray(start, this.pos);
  }

  readString(length) {
    const bytes = this.readBytes(length);
    return this.textDecoder.decode(bytes);
  }

  skip(wireType) {
    if (wireType === 0) {
      this.readVarint();
    } else if (wireType === 1) {
      this.pos += 8;
    } else if (wireType === 2) {
      const len = this.readVarint();
      this.pos += len;
    } else if (wireType === 5) {
      this.pos += 4;
    }
  }
}

export class ProtoXmlParser {
  /**
   * @param {Uint8Array} bytes AAB 中的 base/manifest/AndroidManifest.xml 字节
   */
  constructor(bytes) {
    this.bytes = bytes;
    this.metadata = {
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

    this.namespaces = new Map(); // uri -> prefix
    this.xmlLines = [];
  }

  parse() {
    const reader = new ProtoReader(this.bytes);
    const rootNode = this._parseXmlNode(reader);

    if (rootNode && rootNode.element) {
      this._traverseElement(rootNode.element, 0);
    }

    // 格式化 SDK 中文代号
    if (this.metadata.minSdkVersion) {
      this.metadata.minSdkName = ANDROID_API_LEVELS[this.metadata.minSdkVersion] || `API ${this.metadata.minSdkVersion}`;
    }
    if (this.metadata.targetSdkVersion) {
      this.metadata.targetSdkName = ANDROID_API_LEVELS[this.metadata.targetSdkVersion] || `API ${this.metadata.targetSdkVersion}`;
    }

    // 格式化主入口组件
    if (this.metadata.mainActivity && this.metadata.packageName) {
      let act = this.metadata.mainActivity;
      if (act.startsWith(".")) {
        this.metadata.mainActivity = `${this.metadata.packageName}${act}`;
      } else if (!act.includes(".")) {
        this.metadata.mainActivity = `${this.metadata.packageName}.${act}`;
      }
    }

    return {
      metadata: this.metadata,
      formattedXml: this.xmlLines.join("\n")
    };
  }

  _parseXmlNode(reader) {
    const node = { element: null, text: "" };
    while (!reader.isEnd()) {
      const tag = reader.readVarint();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x07;

      if (fieldNum === 1 && wireType === 2) {
        const len = reader.readVarint();
        const subBytes = reader.readBytes(len);
        node.element = this._parseXmlElement(new ProtoReader(subBytes));
      } else if (fieldNum === 2 && wireType === 2) {
        const len = reader.readVarint();
        node.text = reader.readString(len);
      } else {
        reader.skip(wireType);
      }
    }
    return node;
  }

  _parseXmlElement(reader) {
    const el = {
      name: "",
      namespaceUri: "",
      namespaces: [],
      attributes: [],
      children: []
    };

    while (!reader.isEnd()) {
      const tag = reader.readVarint();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x07;

      if (fieldNum === 1 && wireType === 2) {
        // namespace_declaration
        const len = reader.readVarint();
        const nsBytes = reader.readBytes(len);
        const ns = this._parseNamespace(new ProtoReader(nsBytes));
        el.namespaces.push(ns);
        if (ns.uri && ns.prefix) {
          this.namespaces.set(ns.uri, ns.prefix);
        }
      } else if (fieldNum === 2 && wireType === 2) {
        const len = reader.readVarint();
        el.namespaceUri = reader.readString(len);
      } else if (fieldNum === 3 && wireType === 2) {
        const len = reader.readVarint();
        el.name = reader.readString(len);
      } else if (fieldNum === 4 && wireType === 2) {
        // attribute
        const len = reader.readVarint();
        const attrBytes = reader.readBytes(len);
        el.attributes.push(this._parseAttribute(new ProtoReader(attrBytes)));
      } else if (fieldNum === 5 && wireType === 2) {
        // child_node
        const len = reader.readVarint();
        const childBytes = reader.readBytes(len);
        el.children.push(this._parseXmlNode(new ProtoReader(childBytes)));
      } else {
        reader.skip(wireType);
      }
    }
    return el;
  }

  _parseNamespace(reader) {
    const ns = { prefix: "", uri: "" };
    while (!reader.isEnd()) {
      const tag = reader.readVarint();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x07;

      if (fieldNum === 1 && wireType === 2) {
        const len = reader.readVarint();
        ns.prefix = reader.readString(len);
      } else if (fieldNum === 2 && wireType === 2) {
        const len = reader.readVarint();
        ns.uri = reader.readString(len);
      } else {
        reader.skip(wireType);
      }
    }
    return ns;
  }

  _parseAttribute(reader) {
    const attr = { namespaceUri: "", name: "", value: "", resourceId: 0 };
    while (!reader.isEnd()) {
      const tag = reader.readVarint();
      const fieldNum = tag >> 3;
      const wireType = tag & 0x07;

      if (fieldNum === 1 && wireType === 2) {
        const len = reader.readVarint();
        attr.namespaceUri = reader.readString(len);
      } else if (fieldNum === 2 && wireType === 2) {
        const len = reader.readVarint();
        attr.name = reader.readString(len);
      } else if (fieldNum === 3 && wireType === 2) {
        const len = reader.readVarint();
        attr.value = reader.readString(len);
      } else if (fieldNum === 5 && wireType === 0) {
        attr.resourceId = reader.readVarint();
      } else {
        reader.skip(wireType);
      }
    }
    return attr;
  }

  _traverseElement(element, indent) {
    const tagName = element.name || "node";
    const indentStr = "  ".repeat(indent);
    const attrMap = {};

    let line = `${indentStr}<${tagName}`;

    // 命名空间输出
    if (indent === 0) {
      if (element.namespaces.length > 0) {
        for (const ns of element.namespaces) {
          line += `\n${indentStr}  xmlns:${ns.prefix}="${ns.uri}"`;
        }
      } else {
        line += `\n${indentStr}  xmlns:android="http://schemas.android.com/apk/res/android"`;
      }
    }

    // 属性输出与元数据提取
    for (const attr of element.attributes) {
      let prefix = "";
      if (attr.namespaceUri) {
        prefix = this.namespaces.get(attr.namespaceUri) || (attr.namespaceUri.includes("android") ? "android" : "");
      }
      const fullName = prefix ? `${prefix}:${attr.name}` : attr.name;
      let val = attr.value;
      if (!val && attr.resourceId) {
        val = `@0x${attr.resourceId.toString(16).padStart(8, "0")}`;
      }

      attrMap[attr.name] = val;
      attrMap[fullName] = val;

      line += `\n${indentStr}  ${fullName}="${this._escapeXml(val)}"`;
    }

    // 收集元数据
    this._collectMetadata(tagName, attrMap, element);

    if (element.children.length === 0) {
      line += " />";
      this.xmlLines.push(line);
      return;
    }

    line += ">";
    this.xmlLines.push(line);

    for (const child of element.children) {
      if (child.element) {
        this._traverseElement(child.element, indent + 1);
      } else if (child.text && child.text.trim()) {
        this.xmlLines.push(`${indentStr}  ${this._escapeXml(child.text.trim())}`);
      }
    }

    this.xmlLines.push(`${indentStr}</${tagName}>`);
  }

  _collectMetadata(tagName, attrMap, element) {
    if (tagName === "manifest") {
      this.metadata.packageName = attrMap["package"] || "";
      this.metadata.versionCode = attrMap["versionCode"] || attrMap["android:versionCode"] || "";
      this.metadata.versionName = attrMap["versionName"] || attrMap["android:versionName"] || "";
    } else if (tagName === "uses-sdk") {
      const min = attrMap["minSdkVersion"] || attrMap["android:minSdkVersion"];
      const target = attrMap["targetSdkVersion"] || attrMap["android:targetSdkVersion"];
      if (min) this.metadata.minSdkVersion = parseInt(min, 10) || min;
      if (target) this.metadata.targetSdkVersion = parseInt(target, 10) || target;
    } else if (tagName === "uses-permission" || tagName === "uses-permission-sdk-23") {
      const p = attrMap["name"] || attrMap["android:name"];
      if (p && !this.metadata.permissions.includes(p)) {
        this.metadata.permissions.push(p);
      }
    } else if (tagName === "application") {
      this.metadata.applicationLabel = attrMap["label"] || attrMap["android:label"] || "";
      this.metadata.applicationIcon = attrMap["icon"] || attrMap["android:icon"] || "";
    } else if (tagName === "activity" || tagName === "activity-alias") {
      const act = attrMap["name"] || attrMap["android:name"] || attrMap["targetActivity"];
      if (act) {
        this.metadata.activities.push(act);

        // 探测 MAIN + LAUNCHER
        const isMain = this._hasIntentAction(element, "android.intent.action.MAIN");
        const isLauncher = this._hasIntentCategory(element, "android.intent.category.LAUNCHER");
        if (isMain && isLauncher && !this.metadata.mainActivity) {
          this.metadata.mainActivity = act;
        }
      }
    } else if (tagName === "service") {
      const s = attrMap["name"] || attrMap["android:name"];
      if (s) this.metadata.services.push(s);
    } else if (tagName === "receiver") {
      const r = attrMap["name"] || attrMap["android:name"];
      if (r) this.metadata.receivers.push(r);
    } else if (tagName === "provider") {
      const pr = attrMap["name"] || attrMap["android:name"];
      if (pr) this.metadata.providers.push(pr);
    }
  }

  _hasIntentAction(el, targetAction) {
    for (const child of el.children) {
      if (child.element && child.element.name === "intent-filter") {
        for (const sub of child.element.children) {
          if (sub.element && sub.element.name === "action") {
            for (const a of sub.element.attributes) {
              if (a.name === "name" && a.value === targetAction) return true;
            }
          }
        }
      }
    }
    return false;
  }

  _hasIntentCategory(el, targetCategory) {
    for (const child of el.children) {
      if (child.element && child.element.name === "intent-filter") {
        for (const sub of child.element.children) {
          if (sub.element && sub.element.name === "category") {
            for (const a of sub.element.attributes) {
              if (a.name === "name" && a.value === targetCategory) return true;
            }
          }
        }
      }
    }
    return false;
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
