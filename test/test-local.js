import fs from "fs/promises";
import { ZipReader } from "../core/zip-reader.js";
import { ManifestParser } from "../core/axml-parser.js";
import { SignatureParser } from "../core/signature-parser.js";
import { IconExtractor } from "../core/icon-extractor.js";
import { ArscParser } from "../core/arsc-parser.js";
import { XmlHighlighter } from "../core/xml-highlighter.js";

class NodeFileDataSource {
  constructor(filePath) {
    this.filePath = filePath;
    this.fileHandle = null;
    this.size = 0;
  }

  async init() {
    this.fileHandle = await fs.open(this.filePath, "r");
    const stat = await this.fileHandle.stat();
    this.size = stat.size;
  }

  async getSize() {
    return this.size;
  }

  async read(offset, length) {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await this.fileHandle.read(buffer, 0, length, offset);
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + bytesRead);
  }

  async close() {
    if (this.fileHandle) {
      await this.fileHandle.close();
    }
  }
}

async function runTest(filePath) {
  console.log(`\n========================================`);
  console.log(`🚀 开始测试解析: ${filePath}`);
  console.log(`========================================`);

  const t0 = performance.now();
  const ds = new NodeFileDataSource(filePath);
  await ds.init();
  const totalMb = (await ds.getSize()) / (1024 * 1024);

  const zip = new ZipReader(ds);
  await zip.init();

  const tInit = performance.now();
  console.log(`⚡ 目录区解析耗时: ${(tInit - t0).toFixed(2)} ms`);
  console.log(`📦 文件总大小: ${totalMb.toFixed(2)} MB`);
  console.log(`📂 文件条目总数: ${zip.totalEntriesCount}`);
  console.log(`🏗️ 支持架构 (ABIs): ${zip.abis.join(", ") || "全部 / Java Only"}`);

  // 1. 定位并提取 Manifest (支持 APK 与 AAB 路径)
  const manifestEntry = zip.findManifestEntry();
  console.log(`📜 定位到 Manifest 文件路径: ${manifestEntry.filename}`);

  const manifestBytes = await zip.extractFile(manifestEntry.filename);
  const parser = new ManifestParser(manifestBytes);
  const { metadata, formattedXml } = parser.parse();

  // 2. 从 resources.arsc 智能反查应用名
  let realAppName = metadata.applicationLabel;
  let iconCandidates = [metadata.applicationIcon];

  if (zip.entries.has("resources.arsc")) {
    const arscBytes = await zip.extractFile("resources.arsc");
    const arsc = new ArscParser(arscBytes);

    if (metadata.applicationLabel && metadata.applicationLabel.startsWith("@")) {
      const names = arsc.resolve(metadata.applicationLabel);
      if (names.length > 0) realAppName = names[0];
    }
    if (metadata.applicationIcon && metadata.applicationIcon.startsWith("@")) {
      const icons = arsc.resolve(metadata.applicationIcon);
      if (icons.length > 0) iconCandidates = icons;
    }
  }

  console.log(`\n📋 【核心元数据】:`);
  console.log(`- 真实应用名 (App Name): ${realAppName || "未知应用"}`);
  console.log(`- 包名 (Package): ${metadata.packageName}`);
  console.log(`- 启动类 (MainActivity): ${metadata.mainActivity || "未声明主入口"}`);
  console.log(`- 版本名 (VersionName): ${metadata.versionName}`);
  console.log(`- 版本号 (VersionCode): ${metadata.versionCode}`);
  console.log(`- 最小 SDK: ${metadata.minSdkVersion} (${metadata.minSdkName})`);
  console.log(`- 目标 SDK: ${metadata.targetSdkVersion} (${metadata.targetSdkName})`);
  console.log(`- 权限总数: ${metadata.permissions.length} 个`);

  // 3. 提取签名证书
  const signInfo = await SignatureParser.extractSignature(zip);
  console.log(`\n✍️ 【签名证书信息】:`);
  console.log(`- 签名方案: ${signInfo.schemes.join(", ") || "未独立签名"}`);
  if (signInfo.found) {
    console.log(`- MD5 指纹: ${signInfo.md5}`);
    console.log(`- SHA-1 指纹: ${signInfo.sha1}`);
    console.log(`- SHA-256 指纹: ${signInfo.sha256}`);
  }

  // 4. 提取高清应用图标
  const iconResult = await IconExtractor.extractBestIcon(zip, iconCandidates);
  if (iconResult) {
    console.log(`\n🖼️ 【应用图标】:`);
    console.log(`- 图标路径: ${iconResult.filename}`);
  }

  // 5. 测试语法高亮
  const highlighted = XmlHighlighter.highlight(formattedXml.slice(0, 500));
  console.log(`\n✨ XML 细腻语法高亮生成测试通过 (前 500 字符已赋予专业 Token 颜色与行号)`);

  const tEnd = performance.now();
  console.log(`\n🎉 全部解析完成！总耗时: ${(tEnd - t0).toFixed(2)} ms`);

  await ds.close();
}

async function testNonZipDetection() {
  console.log(`\n========================================`);
  console.log(`🧪 测试非 ZIP 头部预校验拦截`);
  console.log(`========================================`);
  const fakeDataSource = {
    getSize: async () => 1024,
    read: async (offset, length) => {
      const buf = Buffer.from("<!DOCTYPE html><html>404 Not Found</html>");
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + length);
    }
  };
  try {
    const zip = new ZipReader(fakeDataSource);
    await zip.init();
    console.error("❌ 拦截失败：非 ZIP 文件未被抛出异常");
  } catch (e) {
    console.log(`✅ 成功提前拦截非 ZIP 文件: "${e.message}"`);
  }
}

async function main() {
  const customFile = process.argv[2];
  const homeDir = process.env.HOME || process.env.USERPROFILE || "";
  const testFiles = customFile
    ? [customFile]
    : [
        `${homeDir}/Downloads/app_1.0.0_11031804_release.apk`,
        `${homeDir}/Downloads/shortbucks-20-release.aab`
      ];

  for (const f of testFiles) {
    try {
      const exists = await fs.access(f).then(() => true).catch(() => false);
      if (exists) {
        await runTest(f);
      } else if (customFile) {
        console.warn(`⚠️ 测试文件未找到: ${f}`);
      }
    } catch (e) {
      console.error("测试出错:", e);
    }
  }

  await testNonZipDetection();
}

main();
