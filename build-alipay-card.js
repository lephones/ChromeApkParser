import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

async function main() {
  const alipayUrl = "https://qr.alipay.com/0901972522207384";

  // 1. 生成准确无误的真实黑白二维码 PNG Buffer (Error Correction: Medium)
  const qrBuffer = await QRCode.toBuffer(alipayUrl, {
    width: 280,
    margin: 2,
    errorCorrectionLevel: "M",
    color: {
      dark: "#000000",
      light: "#ffffff"
    }
  });

  const qrBase64 = qrBuffer.toString("base64");

  // 2. 构造正统的支付宝品牌背景卡片 SVG
  const cardSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480">
  <defs>
    <linearGradient id="alipayBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1677ff"/>
      <stop offset="100%" stop-color="#0958d9"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- 支付宝经典深蓝微渐变外框 -->
  <rect width="360" height="480" rx="18" fill="url(#alipayBg)"/>

  <!-- 顶部支付宝品牌条 -->
  <g transform="translate(26, 18)">
    <!-- 支字圆圈 -->
    <circle cx="18" cy="18" r="16" fill="#ffffff"/>
    <text x="18" y="23" fill="#1677ff" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="20" font-weight="bold" text-anchor="middle">支</text>
    
    <text x="44" y="16" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="16" font-weight="bold">支付宝</text>
    <text x="44" y="32" fill="rgba(255,255,255,0.85)" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="11">扫一扫，向我付款</text>
  </g>

  <!-- 中间白色大卡片 (放置二维码) -->
  <rect x="22" y="70" width="316" height="344" rx="14" fill="#ffffff" filter="url(#shadow)"/>

  <!-- 嵌入准确的真实黑白二维码图片 -->
  <image href="data:image/png;base64,${qrBase64}" x="40" y="86" width="280" height="280"/>

  <!-- 二维码下方的文字说明 -->
  <text x="180" y="392" fill="#8c8c8c" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="11" text-anchor="middle">支持个人开发者持续维护与开发</text>

  <!-- 底部品牌口号 -->
  <text x="180" y="450" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif" font-size="13" font-weight="500" text-anchor="middle">推荐使用支付宝扫一扫</text>
</svg>`;

  const tempSvgPath = path.resolve("icons/alipay-card-temp.svg");
  const finalPngPath = path.resolve("icons/alipay-qr.png");
  const finalJpgPath = path.resolve("icons/alipay-qr.jpg");

  fs.writeFileSync(tempSvgPath, cardSvg, "utf-8");

  // 使用 macOS 原生 sips 栅格化为高质量的 PNG 与 JPG
  execSync(`sips -s format png "${tempSvgPath}" --out "${finalPngPath}"`);
  execSync(`sips -s format jpeg -s formatOptions 85 "${tempSvgPath}" --out "${finalJpgPath}"`);
  fs.unlinkSync(tempSvgPath);

  // 清理临时文件
  if (fs.existsSync("icons/alipay_real_qr.png")) {
    fs.unlinkSync("icons/alipay_real_qr.png");
  }

  console.log("✅ 成功生成带支付宝官方背景的高清收款卡片:");
  console.log(`- PNG: ${finalPngPath} (${fs.statSync(finalPngPath).size} bytes)`);
  console.log(`- JPG: ${finalJpgPath} (${fs.statSync(finalJpgPath).size} bytes)`);
}

main().catch(console.error);
