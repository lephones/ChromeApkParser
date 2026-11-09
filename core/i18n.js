/**
 * Fast Apk Parser - Internationalization (i18n) Module
 * 支持中英文双语自动检测 (Chrome 原生 / navigator.language) 与手动无缝切换
 * 专为中国与海外全球开发者深度适配
 */

export const I18N_STRINGS = {
  zh: {
    page_title_popup: "Fast Apk Parser - 极速本地与在线 APK/AAB 解析器",
    page_title_viewer: "Fast Apk Parser 工作台 - 极速本地与在线 APK/AAB 解析器",
    logo_title_popup: "Fast Apk Parser",
    logo_title_viewer: "Fast Apk Parser 工作台",
    logo_subtitle: "极速零解压 · 本地与线上 APK / AAB 深度解析与审查",
    fullscreen_btn: "↗ 全屏展开",
    fullscreen_btn_title: "在新标签页全屏打开",
    lang_btn_text: "English",
    lang_btn_title: "Switch Language / 切换为英文",
    coffee_btn: "☕ 请喝咖啡",
    coffee_btn_title: "如果觉得好用，请作者喝杯咖啡吧 ❤️",
    drop_title: "拖拽本地 APK / AAB 文件到此处，或点击选择",
    drop_subtitle: "支持 APK 安装包与 AAB 格式 · 零全量解压 · 纯前端内存解析",
    url_placeholder: "输入线上 APK / AAB 下载直链 (HTTP/HTTPS)...",
    parse_btn: "极速解析",
    quick_samples: "快速体验示例:",
    sample_telegram: "开源 Telegram APK",
    sample_local: "本地测试样本",
    sample_local_alert: "请直接将本地电脑上的测试 APK 或 AAB 文件拖拽到上方虚线框内即可！",
    empty_url_alert: "请输入有效的 APK / AAB 下载直链 (HTTP/HTTPS)",
    url_parse_fail: "线上解析失败，请检查直链是否有效或目标网站是否允许跨域",
    unknown_app: "未知应用",
    main_activity_label: "启动类:",
    copy_activity_title: "复制启动类名",
    copy_pkg_title: "复制包名",
    download_icon_title: "下载高清图标原图",
    google_play: "🛍️ Google Play 商店",
    coolapk: "📱 酷安搜索",
    app_version_label: "应用版本",
    system_compat_label: "系统适配",
    min_supported_prefix: "最低支持: ",
    abi_label: "架构支持 (ABI)",
    abi_common: "通用架构 / 纯 Java",
    package_sign_label: "安装包与签名",
    no_sign: "未检测到独立签名",
    sig_suffix: " 签名",
    tab_permissions: "申请权限",
    tab_manifest: "AndroidManifest.xml",
    perm_search_placeholder: "搜索权限名称或功能 (如: 定位、相机、网络)...",
    perm_empty: "该应用未声明任何系统权限",
    perm_dangerous: "敏感隐私",
    perm_special: "特殊权限",
    perm_normal: "普通权限",
    manifest_toolbar_title: "完整还原 AndroidManifest.xml (带专业语法高亮)",
    copy_all_xml: "📋 复制全部",
    download_xml: "💾 导出 XML 文件",
    copy_btn: "复制",
    copied_btn: "已复制 ✓",
    copy_failed: "复制失败，请手动选取复制",
    mode_local: "本地零解压",
    stream_download: "全量流式下载",
    range_download: "断点下载 (耗流 {netMb} MB · 节省 {percent}%)",
    perf_badge: "⚡ 目录耗时 {cdCost}ms · 总耗时 {totalCost}ms · {mode}",
    status_preparing: "正在准备解析...",
    status_parsing_local: "正在解析本地文件: {name}...",
    status_connecting: "正在连接服务器并嗅探 APK/AAB 目录...",
    status_extracting: "正在提取元数据、启动类与证书...",
    non_zip_error: "目标文件不是合法的 APK/AAB 文件（缺少 ZIP 'PK' 标志头，可能是网页或链接已失效）",
    
    // 赞赏打赏弹窗文案
    sponsor_modal_title: "☕ 请作者喝杯咖啡",
    sponsor_modal_desc: "如果 Fast Apk Parser 为您节省了宝贵的时间，欢迎请作者喝杯咖啡！无论是一杯热咖啡还是暖心赞助，都是对纯前端零解压逆向工具持续迭代的最大动力 ❤️",
    tab_paypal: "PayPal",
    tab_alipay: "支付宝",
    tab_wechat: "微信支付",
    paypal_intro: "支持通过 PayPal 进行快捷赞助支持",
    paypal_btn_me: "前往 PayPal.me/lephone 赞助 💳",
    copy_paypal_link: "复制链接 (paypal.me/lephone) 📋",
    alipay_intro: "打开手机支付宝 [扫一扫] 即可赞赏向我付款",
    wechat_intro: "打开手机微信 [扫一扫] 即可赞赏支持",
    qr_custom_tip: "💡 提示：如需自定义，可替换 `icons/alipay-qr.jpg` 与 `icons/wechat-qr.jpg`",
    qr_tip_alipay: "支付宝扫一扫向我付款",
    qr_tip_wechat: "微信扫一扫赞赏码",
    sponsor_banner_title: "喜欢 Fast Apk Parser 吗？请作者喝杯咖啡吧 ☕",
    sponsor_banner_desc: "毫秒级零解压，省时省流！如果它帮到了您的工作与逆向，期待您的暖心支持！",
    sponsor_banner_btn: "💖 赞赏支持"
  },
  en: {
    page_title_popup: "Fast Apk Parser - Instant APK & AAB Inspector",
    page_title_viewer: "Fast Apk Parser Studio - Instant APK & AAB Inspector",
    logo_title_popup: "Fast Apk Parser",
    logo_title_viewer: "Fast Apk Parser Studio",
    logo_subtitle: "Instant zero-extraction APK & AAB inspector in browser",
    fullscreen_btn: "↗ Fullscreen",
    fullscreen_btn_title: "Open fullscreen in new tab",
    lang_btn_text: "中文",
    lang_btn_title: "切换为简体中文 / Switch Language",
    coffee_btn: "☕ Buy me a coffee",
    coffee_btn_title: "Buy the author a coffee to support future updates ❤️",
    drop_title: "Drop local APK / AAB file here, or click to browse",
    drop_subtitle: "Supports APK & AAB · Zero-extraction · 100% Client-side",
    url_placeholder: "Enter direct APK / AAB download URL (HTTP/HTTPS)...",
    parse_btn: "Inspect Now",
    quick_samples: "Quick samples:",
    sample_telegram: "Telegram APK (Open Source)",
    sample_local: "Local Test File",
    sample_local_alert: "Please drag and drop any local APK or AAB file into the dashed box above!",
    empty_url_alert: "Please enter a valid APK / AAB download URL (HTTP/HTTPS)",
    url_parse_fail: "Failed to inspect online package. Please check if the link is accessible or has CORS restrictions.",
    unknown_app: "Unknown App",
    main_activity_label: "Main Activity:",
    copy_activity_title: "Copy launcher activity",
    copy_pkg_title: "Copy package name",
    download_icon_title: "Download high-res app icon",
    google_play: "🛍️ Google Play Store",
    coolapk: "📱 Coolapk Search",
    app_version_label: "APP VERSION",
    system_compat_label: "COMPATIBILITY",
    min_supported_prefix: "Min Supported: ",
    abi_label: "ARCHITECTURES (ABI)",
    abi_common: "Universal / Java Only",
    package_sign_label: "PACKAGE & SIGNATURE",
    no_sign: "No Signature Found",
    sig_suffix: " Signature",
    tab_permissions: "Permissions",
    tab_manifest: "AndroidManifest.xml",
    perm_search_placeholder: "Search permissions or keywords (e.g. location, camera)...",
    perm_empty: "No permissions declared by this application",
    perm_dangerous: "Dangerous",
    perm_special: "Special",
    perm_normal: "Normal",
    manifest_toolbar_title: "Decompiled AndroidManifest.xml (with IDE syntax highlighting)",
    copy_all_xml: "📋 Copy All",
    download_xml: "💾 Export XML",
    copy_btn: "Copy",
    copied_btn: "Copied ✓",
    copy_failed: "Copy failed, please copy manually",
    mode_local: "Local Zero-Extraction",
    stream_download: "Stream Download",
    range_download: "Range Download (Traffic {netMb} MB · Saved {percent}%)",
    perf_badge: "⚡ Catalog {cdCost}ms · Total {totalCost}ms · {mode}",
    status_preparing: "Preparing inspection...",
    status_parsing_local: "Parsing local file: {name}...",
    status_connecting: "Connecting to server & probing APK/AAB catalog...",
    status_extracting: "Extracting metadata, main activity & certificates...",
    non_zip_error: "The target file is not a valid APK/AAB (Missing ZIP 'PK' header, might be a webpage or invalid link)",

    // Sponsor Modal Strings
    sponsor_modal_title: "☕ Buy Me a Coffee",
    sponsor_modal_desc: "If Fast Apk Parser saved your valuable time, consider buying me a coffee! Your support fuels ongoing open-source features & updates ❤️",
    tab_paypal: "PayPal",
    tab_alipay: "Alipay",
    tab_wechat: "WeChat Pay",
    paypal_intro: "Quick sponsorship via PayPal (paypal.me/lephone)",
    paypal_btn_me: "Donate via PayPal.me/lephone 💳",
    copy_paypal_link: "Copy Link (paypal.me/lephone) 📋",
    alipay_intro: "Open Alipay mobile app and scan the QR code to sponsor",
    wechat_intro: "Open WeChat mobile app and scan the QR code to sponsor",
    qr_custom_tip: "💡 Tip: You can customize QR codes by replacing `icons/alipay-qr.jpg` and `icons/wechat-qr.jpg`",
    qr_tip_alipay: "Scan with Alipay to sponsor",
    qr_tip_wechat: "Scan with WeChat to sponsor",
    sponsor_banner_title: "Enjoying Fast Apk Parser? Buy me a coffee ☕",
    sponsor_banner_desc: "Lightning fast zero-extraction APK tool. If it saved your day, your support is truly appreciated!",
    sponsor_banner_btn: "💖 Sponsor Now"
  }
};

export class I18nManager {
  constructor() {
    this.currentLang = this._detectDefaultLanguage();
  }

  _detectDefaultLanguage() {
    // 优先读取用户手动设定的持久化偏好
    const saved = localStorage.getItem("fast_apk_parser_lang");
    if (saved === "zh" || saved === "en") return saved;

    // 优先读取 Chrome 扩展环境原生语言
    let chromeLang = "";
    try {
      if (typeof chrome !== "undefined" && chrome.i18n && chrome.i18n.getUILanguage) {
        chromeLang = chrome.i18n.getUILanguage();
      }
    } catch (e) {}

    const lang = (chromeLang || (typeof navigator !== "undefined" ? navigator.language : "") || "").toLowerCase();
    if (lang.startsWith("zh")) {
      return "zh";
    }
    // 海外/国际化默认一律为纯正英文
    return "en";
  }

  getLang() {
    return this.currentLang;
  }

  setLang(lang) {
    if (lang !== "zh" && lang !== "en") return;
    this.currentLang = lang;
    localStorage.setItem("fast_apk_parser_lang", lang);
  }

  toggleLang() {
    const next = this.currentLang === "zh" ? "en" : "zh";
    this.setLang(next);
    return next;
  }

  t(key, params = {}) {
    const dict = I18N_STRINGS[this.currentLang] || I18N_STRINGS.zh;
    let text = dict[key] || I18N_STRINGS.en[key] || key;

    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), v);
    }
    return text;
  }
}

export const i18n = new I18nManager();
