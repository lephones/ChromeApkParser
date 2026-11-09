# Privacy Policy for Fast Apk Parser

**Last updated:** November 9, 2026

## 1. Overview
Fast Apk Parser is an open-source, client-side browser extension designed to inspect Android application packages (APK and AAB files) directly in your browser without full decompression.

We respect and protect your privacy. **We do NOT collect, transmit, store, or sell any personal data, usage history, or analyzed file content.**

---

## 2. Data Processing & Storage

### 2.1 File Analysis (100% Client-Side)
- **Local Files**: When you select or drag an APK/AAB file into the extension, all file processing (ZIP catalog parsing, Manifest decompilation, signature calculation) takes place **entirely in your browser's local memory**. Your files are never uploaded to any remote server.
- **Online Links**: When you inspect a remote APK download URL, the extension sends HTTP Range requests directly from your browser to the target server hosting the APK. The retrieved headers and metadata are processed purely inside your local browser tab.

### 2.2 Local Storage (`localStorage`)
The extension only uses local browser storage to save your user preferences:
- Selected UI language (`zh` or `en`).

No personal identifiable information (PII) is ever recorded.

---

## 3. Permissions Justification

| Permission | Purpose |
| :--- | :--- |
| `host_permissions (<all_urls>)` | Used exclusively to send HTTP Range requests to inspect direct APK download URLs provided by you. No browsing activity or web traffic is tracked or intercepted. |

---

## 4. Contact & Support
If you have questions about this privacy policy, feel free to submit an issue on GitHub:
https://github.com/lephones/ChromeApkParser
