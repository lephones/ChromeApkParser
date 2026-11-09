import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// 读取 manifest.json 获取版本号
const manifestPath = path.resolve("manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const version = manifest.version || "1.0.0";

const distDir = path.resolve("dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

const zipName = `fast-apk-parser-v${version}.zip`;
const zipPath = path.join(distDir, zipName);

// 若旧 zip 已存在先删除
if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

console.log(`📦 开始打包 Fast Apk Parser 发布包 (v${version})...`);

// 打包只包含运行时所需文件，严禁打包 node_modules, test, .git 等
const includeItems = ["manifest.json", "_locales", "core", "icons", "ui"];
const excludePatterns = ["*.DS_Store*", "*alipay-card-temp.svg*"];

const excludeArgs = excludePatterns.map((p) => `-x "${p}"`).join(" ");
const cmd = `zip -r "${zipPath}" ${includeItems.join(" ")} ${excludeArgs}`;

try {
  execSync(cmd, { stdio: "inherit" });
  const stat = fs.statSync(zipPath);
  const sizeKb = (stat.size / 1024).toFixed(1);
  console.log(`\n🎉 打包完成！`);
  console.log(`📁 输出文件: dist/${zipName}`);
  console.log(`⚖️ 文件大小: ${sizeKb} KB (极致轻巧)`);
  console.log(`🚀 此 ZIP 文件可直接上传至 Chrome Web Store 或 Edge Add-ons 开发者控制台！\n`);
} catch (err) {
  console.error("❌ 打包失败:", err.message);
  process.exit(1);
}
