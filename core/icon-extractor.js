/**
 * APK App Icon Extractor
 * 通过 Central Directory 智能检索最高清的应用图标文件，按需单文件提取并转换为 Base64
 */

export class IconExtractor {
  /**
   * 从 APK 中提取最高分辨率图标
   * @param {import('./zip-reader.js').ZipReader} zipReader
   * @param {string|string[]} iconHint AXML 中 application 标签的 icon 属性或 arsc 反查出的路径列表
   * @returns {Promise<{ dataUrl: string, filename: string } | null>}
   */
  static async extractBestIcon(zipReader, iconHint = "") {
    const allFiles = zipReader.getFileList();
    const candidates = [];

    const getScore = (name) => {
      let score = 0;
      if (name.includes("xxxhdpi")) score += 600;
      else if (name.includes("xxhdpi")) score += 500;
      else if (name.includes("xhdpi")) score += 400;
      else if (name.includes("hdpi")) score += 300;
      else if (name.includes("mdpi")) score += 200;
      else if (name.includes("ldpi")) score += 100;
      else score += 150;

      if (name.includes("ic_launcher_round")) score += 50;
      else if (name.includes("ic_launcher")) score += 80;
      else if (name.includes("icon") || name.includes("app_icon")) score += 70;

      if (name.endsWith(".png")) score += 10;
      else if (name.endsWith(".webp")) score += 8;
      else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) score += 5;
      else score -= 1000; // xml 等矢量图暂不作为首选位图

      return score;
    };

    // 1. 检查 hint (可能是字符串或数组)
    const hints = Array.isArray(iconHint) ? iconHint : [iconHint];
    for (const h of hints) {
      if (typeof h === "string" && (h.endsWith(".png") || h.endsWith(".webp") || h.endsWith(".jpg"))) {
        if (zipReader.entries.has(h)) {
          candidates.push({ filename: h, score: 9000 + getScore(h) });
        }
      }
    }

    // 2. 遍历 Central Directory 检索候选启动图
    for (const file of allFiles) {
      if (!file.startsWith("res/")) continue;
      if (!file.match(/\.(png|webp|jpg)$/i)) continue;

      const lower = file.toLowerCase();
      if (
        lower.includes("ic_launcher") ||
        lower.includes("app_icon") ||
        lower.includes("icon") ||
        lower.includes("logo")
      ) {
        candidates.push({
          filename: file,
          score: getScore(file)
        });
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    // 单独解压该图标文件
    const imageBytes = await zipReader.extractFile(best.filename);
    const mime = best.filename.endsWith(".webp")
      ? "image/webp"
      : best.filename.endsWith(".jpg") || best.filename.endsWith(".jpeg")
      ? "image/jpeg"
      : "image/png";

    let base64 = "";
    if (typeof btoa !== "undefined") {
      let binary = "";
      const len = imageBytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(imageBytes[i]);
      }
      base64 = btoa(binary);
    } else {
      base64 = Buffer.from(imageBytes).toString("base64");
    }

    return {
      dataUrl: `data:${mime};base64,${base64}`,
      filename: best.filename
    };
  }
}
