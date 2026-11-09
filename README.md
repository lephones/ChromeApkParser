# Fast Apk Parser (Chrome Extension)

[English](#english) | [简体中文](#简体中文)

---

<a name="english"></a>
## English

🚀 **Instant, ultra-lightweight, zero-extraction Android APK & AAB inspector Chrome extension.**

Inspect local or remote APK / AAB files in milliseconds directly in your browser without decompressing hundreds of megabytes. By extracting only the Central Directory of the ZIP format, it instantly parses metadata, `MainActivity`, signature fingerprints, permissions, architectures, and decompiles `AndroidManifest.xml` with syntax highlighting.

### ✨ Highlights
- ⚡ **Zero Full Extraction**: Reads ZIP catalog in memory. Parses 100MB+ APKs in under 25ms.
- 🛑 **Pre-flight Magic Byte Check**: Probes the first 4 bytes (`PK\x03\x04`) before downloading to block invalid links or HTML pages with zero wasted bandwidth.
- 🌐 **HTTP Range Download**: Probes the end 1MB of online APKs, saving >99% network traffic.
- 📦 **APK & AAB Support**: Handles standard APKs (AXML & ARSC) and Google Play App Bundles (AAB with Protobuf Manifest).
- 🏷️ **Real App Name & High-Res Icon**: Resolves obfuscated resource IDs (`@0x7f...`) using an in-memory `resources.arsc` string pool and type chunk reader.
- 🚀 **MainActivity Detection**: Detects launcher activity (`android.intent.action.MAIN` + `LAUNCHER`) with 1-click copy.
- 🔐 **Signature Inspection**: Supports v1 (JAR) and v2/v3 (APK Signing Block) with 1-click copy for MD5, SHA-1, and SHA-256.
- 🎨 **IDE-Grade XML Syntax Highlighting**: Fine-grained color tokens for tags, namespace prefixes, attributes, references, and boolean/integer values.
- 🌍 **Internationalization (i18n)**: Native Chrome extension localization (`default_locale: en`), supports English & Chinese with instant live toggle.

---

<a name="简体中文"></a>
## 简体中文

🚀 **超轻量、毫秒级、零全量解压的 Android APK 与 AAB 解析审查 Chrome 扩展。**

支持**本地 APK / AAB 拖拽秒开**与**线上直链断点智能探测**，无需全量解压数百 MB 的安装包，仅通过读取 ZIP 目录区（Central Directory）即可瞬间提取核心元数据、启动类（MainActivity）、签名指纹与高亮还原 `AndroidManifest.xml`。

### ✨ 核心特性

1. ⚡ **零全量解压与非 ZIP 头快速拦截**
   - **下载前预校验**：线上通过 4 字节 Range 请求、本地通过前 4 字节校验 `PK\x03\x04` 文件头。若目标是网页、404、JSON 等非 APK 链接，**0.001 秒直接拦截**，零网络流量浪费！
   - **零全量解压**：绝不解压大型 `classes*.dex` 与 native `.so`，百兆安装包仅需 10~25 毫秒即可出结果。

2. 🌐 **线上 APK 断点智能下载**
   - 针对线上直链，优先利用 `Range: bytes=-1048576` 预拉取末尾 1MB 目录树，500MB 大包仅消耗约 1MB 流量，节省 99% 以上带宽。

3. 📦 **双格式全面兼容 (APK & AAB)**
   - 完美解析标准 APK 二进制 AXML 与 Google Play AAB 规范（Protobuf `aapt.pb.XmlNode`）。

4. 📋 **全方位核心信息看板**
   - **真实应用名与图标**：通过 `resources.arsc` 毫秒级定向反查混淆 ID，还原真实名字与高清原图。
   - **启动入口类 (MainActivity)**：自动嗅探 `MAIN + LAUNCHER` 主入口组件，支持一键快速复制。
   - **系统版本与架构 (ABI)**：自动计算 Min/Target SDK（Android 8.0 ~ Android 16），秒判 `arm64-v8a`、`armeabi-v7a`、`x86_64` 等。
   - **证书指纹 (MD5 / SHA-1 / SHA-256)**：兼容 v1 与 v2/v3 签名方案，一键复制对接开放平台。
   - **双语国际化 (i18n)**：Chrome 原生多语言架构，默认英文支持全球用户，中文环境智能自适应，右上角支持一键无缝热切换。

---

## 🛠️ 安装教程 (Installation)

1. 打开 Chrome 浏览器，访问：`chrome://extensions/`
2. 开启右上角 **「开发者模式」 (Developer mode)**。
3. 点击左上角 **「加载已解压的扩展程序」 (Load unpacked)**。
4. 选择解压或克隆后的扩展程序目录（即包含 `manifest.json` 的文件夹）
5. 安装完成，点击扩展图标即可开始使用！

---

## ☕ 赞助与支持 (Sponsor)

如果您觉得 **Fast Apk Parser** 为您节省了宝贵的时间，欢迎请作者喝杯咖啡！

- **PayPal**: [paypal.me/lephone](https://paypal.me/lephone)
- **支付宝 (Alipay)**:
  ![点击查看收款码](icons/alipay-qr.jpg) 
- **微信支付 (WeChat)**:
  ![点击查看微信赞赏码](icons/wechat-qr.jpg)

