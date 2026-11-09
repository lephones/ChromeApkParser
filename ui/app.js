import { ZipReader, BlobDataSource, HttpRangeDataSource } from "../core/zip-reader.js";
import { AxmlParser } from "../core/axml-parser.js";
import { SignatureParser } from "../core/signature-parser.js";
import { IconExtractor } from "../core/icon-extractor.js";
import { ArscParser } from "../core/arsc-parser.js";
import { enrichPermission } from "../core/permissions-dict.js";
import { XmlHighlighter } from "../core/xml-highlighter.js";
import { i18n } from "../core/i18n.js";

// DOM 元素引用
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const urlInput = document.getElementById("urlInput");
const parseUrlBtn = document.getElementById("parseUrlBtn");
const statusBox = document.getElementById("statusBox");
const statusText = document.getElementById("statusText");
const progressBar = document.getElementById("progressBar");
const resultSection = document.getElementById("resultSection");
const perfBadge = document.getElementById("perfBadge");

// 应用详情元素
const appIcon = document.getElementById("appIcon");
const downloadIconBtn = document.getElementById("downloadIconBtn");
const appName = document.getElementById("appName");
const pkgName = document.getElementById("pkgName");
const copyPkgBtn = document.getElementById("copyPkgBtn");

// 启动类 (MainActivity)
const mainActivityRow = document.getElementById("mainActivityRow");
const mainActivityText = document.getElementById("mainActivityText");
const copyMainActivityBtn = document.getElementById("copyMainActivityBtn");
const mainActivityLabelEl = document.getElementById("mainActivityLabel");

const googlePlayLink = document.getElementById("googlePlayLink");
const coolapkLink = document.getElementById("coolapkLink");
const appVersion = document.getElementById("appVersion");
const versionCode = document.getElementById("versionCode");
const targetSdk = document.getElementById("targetSdk");
const minSdk = document.getElementById("minSdk");
const abiBadges = document.getElementById("abiBadges");
const fileSize = document.getElementById("fileSize");
const sigBadges = document.getElementById("sigBadges");

// 签名相关
const signMd5 = document.getElementById("signMd5");
const signSha1 = document.getElementById("signSha1");
const signSha256 = document.getElementById("signSha256");
const copyMd5Btn = document.getElementById("copyMd5Btn");
const copySha1Btn = document.getElementById("copySha1Btn");
const copySha256Btn = document.getElementById("copySha256Btn");

// 权限与 XML Tab
const permCount = document.getElementById("permCount");
const permSearch = document.getElementById("permSearch");
const permList = document.getElementById("permList");
const xmlCode = document.getElementById("xmlCode");
const copyXmlBtn = document.getElementById("copyXmlBtn");
const downloadXmlBtn = document.getElementById("downloadXmlBtn");
const manifestToolbarTitle = document.getElementById("manifestToolbarTitle");

const openViewerBtn = document.getElementById("openViewerBtn");
const langToggleBtn = document.getElementById("langToggleBtn");
const langBtnText = document.getElementById("langBtnText");
const sample1Btn = document.getElementById("sample1Btn");
const sample2Btn = document.getElementById("sample2Btn");

// 赞助支持元素
const coffeeBtn = document.getElementById("coffeeBtn");
const coffeeBtnText = document.getElementById("coffeeBtnText");
const sponsorBannerBtn = document.getElementById("sponsorBannerBtn");
const sponsorBannerTitle = document.getElementById("sponsorBannerTitle");
const sponsorBannerSub = document.getElementById("sponsorBannerSub");
const sponsorModal = document.getElementById("sponsorModal");
const closeSponsorModal = document.getElementById("closeSponsorModal");
const sponsorModalTitle = document.getElementById("sponsorModalTitle");
const sponsorModalDesc = document.getElementById("sponsorModalDesc");
const tabPaypalBtn = document.getElementById("tabPaypalBtn");
const tabAlipayBtn = document.getElementById("tabAlipayBtn");
const tabWechatBtn = document.getElementById("tabWechatBtn");
const contentPaypal = document.getElementById("contentPaypal");
const contentAlipay = document.getElementById("contentAlipay");
const contentWechat = document.getElementById("contentWechat");
const paypalIntro = document.getElementById("paypalIntro");
const paypalBtnMe = document.getElementById("paypalBtnMe");
const copyPaypalLinkBtn = document.getElementById("copyPaypalLinkBtn");
const alipayIntro = document.getElementById("alipayIntro");
const wechatIntro = document.getElementById("wechatIntro");
const qrTipAlipay = document.getElementById("qrTipAlipay");
const qrTipWechat = document.getElementById("qrTipWechat");

// 顶部与说明元素引用
const logoTitleEl = document.getElementById("logoTitle");
const logoSubtitleEl = document.getElementById("logoSubtitle");
const dropTitleEl = document.getElementById("dropTitle");
const dropSubtitleEl = document.getElementById("dropSubtitle");
const samplePrefixEl = document.getElementById("samplePrefix");

let currentRawXml = "";
let currentIconUrl = "";
let currentRawPermissions = [];
let currentMetadata = null;
let currentPerfInfo = null;
let currentSignInfo = null;
let currentAbis = [];

// ==========================================
// 国际化 (i18n) 语言切换与文案全量更新
// ==========================================
function updateStaticI18n() {
  const lang = i18n.getLang();
  const isViewer = document.body.classList.contains("fullscreen");

  // 1. 更新网页标签标题 (document.title) 与 html lang 属性
  document.title = isViewer ? i18n.t("page_title_viewer") : i18n.t("page_title_popup");
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";

  // 2. 更新头部 Logo 标题与副标题
  if (logoTitleEl) {
    logoTitleEl.textContent = isViewer ? i18n.t("logo_title_viewer") : i18n.t("logo_title_popup");
  }
  if (logoSubtitleEl) {
    logoSubtitleEl.textContent = i18n.t("logo_subtitle");
  }

  // 3. 更新语言切换按钮本身与赞助按钮
  if (langBtnText) {
    langBtnText.textContent = i18n.t("lang_btn_text");
  }
  if (langToggleBtn) {
    langToggleBtn.title = i18n.t("lang_btn_title");
  }
  if (coffeeBtnText) {
    coffeeBtnText.textContent = i18n.t("coffee_btn");
  }
  if (coffeeBtn) {
    coffeeBtn.title = i18n.t("coffee_btn_title");
  }

  // 赞助横幅与弹窗文案
  if (sponsorBannerTitle) sponsorBannerTitle.textContent = i18n.t("sponsor_banner_title");
  if (sponsorBannerSub) sponsorBannerSub.textContent = i18n.t("sponsor_banner_desc");
  if (sponsorBannerBtn) sponsorBannerBtn.textContent = i18n.t("sponsor_banner_btn");
  if (sponsorModalTitle) sponsorModalTitle.textContent = i18n.t("sponsor_modal_title");
  if (sponsorModalDesc) sponsorModalDesc.textContent = i18n.t("sponsor_modal_desc");
  if (tabPaypalBtn) tabPaypalBtn.textContent = i18n.t("tab_paypal");
  if (tabAlipayBtn) tabAlipayBtn.textContent = i18n.t("tab_alipay");
  if (tabWechatBtn) tabWechatBtn.textContent = i18n.t("tab_wechat");
  if (paypalIntro) paypalIntro.textContent = i18n.t("paypal_intro");
  if (paypalBtnMe) paypalBtnMe.querySelector("span").textContent = i18n.t("paypal_btn_me");
  if (copyPaypalLinkBtn) copyPaypalLinkBtn.textContent = i18n.t("copy_paypal_link");
  if (alipayIntro) alipayIntro.textContent = i18n.t("alipay_intro");
  if (wechatIntro) wechatIntro.textContent = i18n.t("wechat_intro");
  if (qrTipAlipay) qrTipAlipay.textContent = i18n.t("qr_tip_alipay");
  if (qrTipWechat) qrTipWechat.textContent = i18n.t("qr_tip_wechat");

  // 4. 全屏展开按钮
  if (openViewerBtn) {
    openViewerBtn.title = i18n.t("fullscreen_btn_title");
  }
  const fsBtnSpan = document.querySelector('[data-i18n="fullscreen_btn"]');
  if (fsBtnSpan) {
    fsBtnSpan.textContent = i18n.t("fullscreen_btn");
  }

  // 5. 拖拽与上传输入区
  if (dropTitleEl) dropTitleEl.textContent = i18n.t("drop_title");
  if (dropSubtitleEl) dropSubtitleEl.textContent = i18n.t("drop_subtitle");
  if (urlInput) urlInput.placeholder = i18n.t("url_placeholder");
  if (parseUrlBtn) parseUrlBtn.textContent = i18n.t("parse_btn");
  if (samplePrefixEl) samplePrefixEl.textContent = i18n.t("quick_samples");
  if (sample1Btn) sample1Btn.textContent = i18n.t("sample_telegram");
  if (sample2Btn) sample2Btn.textContent = i18n.t("sample_local");

  // 6. 应用头部操作与提示
  if (downloadIconBtn) downloadIconBtn.title = i18n.t("download_icon_title");
  if (copyPkgBtn) copyPkgBtn.title = i18n.t("copy_pkg_title");
  if (mainActivityLabelEl) mainActivityLabelEl.textContent = i18n.t("main_activity_label");
  if (copyMainActivityBtn) copyMainActivityBtn.title = i18n.t("copy_activity_title");
  if (googlePlayLink) googlePlayLink.querySelector("span").textContent = i18n.t("google_play");
  if (coolapkLink) coolapkLink.querySelector("span").textContent = i18n.t("coolapk");

  // 7. 四大核心指标卡片标签
  const cards = document.querySelectorAll(".info-card");
  if (cards.length >= 4) {
    cards[0].querySelector(".info-label").textContent = i18n.t("app_version_label");
    cards[1].querySelector(".info-label").textContent = i18n.t("system_compat_label");
    cards[2].querySelector(".info-label").textContent = i18n.t("abi_label");
    cards[3].querySelector(".info-label").textContent = i18n.t("package_sign_label");
  }

  // 8. 签名卡片操作按钮
  if (copyMd5Btn) copyMd5Btn.textContent = i18n.t("copy_btn");
  if (copySha1Btn) copySha1Btn.textContent = i18n.t("copy_btn");
  if (copySha256Btn) copySha256Btn.textContent = i18n.t("copy_btn");

  // 9. Tab 导航与 Manifest 工具栏
  const permTabBtn = document.querySelector('[data-tab="permissions"]');
  if (permTabBtn) {
    permTabBtn.innerHTML = `${i18n.t("tab_permissions")} (<span id="permCount">${currentRawPermissions.length}</span>)`;
  }
  const manifestTabBtn = document.querySelector('[data-tab="manifest"]');
  if (manifestTabBtn) {
    manifestTabBtn.textContent = i18n.t("tab_manifest");
  }
  if (manifestToolbarTitle) {
    manifestToolbarTitle.textContent = i18n.t("manifest_toolbar_title");
  }
  if (copyXmlBtn) copyXmlBtn.textContent = i18n.t("copy_all_xml");
  if (downloadXmlBtn) downloadXmlBtn.textContent = i18n.t("download_xml");
  if (permSearch) permSearch.placeholder = i18n.t("perm_search_placeholder");

  // 10. 若当前已有解析数据，动态刷新其双语渲染内容
  if (currentMetadata) {
    minSdk.textContent = `${i18n.t("min_supported_prefix")}${currentMetadata.minSdkName || `API ${currentMetadata.minSdkVersion || "-"}`}`;
    renderAbiBadges(currentAbis);
    renderSigBadges(currentSignInfo);
    renderPermissions(currentRawPermissions);
  }

  if (currentPerfInfo) {
    perfBadge.innerHTML = `<span>${i18n.t("perf_badge", currentPerfInfo)}</span>`;
  }
}

// 绑定语言切换按钮
if (langToggleBtn) {
  langToggleBtn.addEventListener("click", () => {
    i18n.toggleLang();
    updateStaticI18n();
  });
}

// ==========================================
// 赞助打赏弹窗 (Sponsor Modal) 事件绑定
// ==========================================
function openSponsorModal() {
  if (sponsorModal) sponsorModal.classList.add("open");
}

function closeSponsorModalFunc() {
  if (sponsorModal) sponsorModal.classList.remove("open");
}

if (coffeeBtn) {
  coffeeBtn.addEventListener("click", openSponsorModal);
}
if (sponsorBannerBtn) {
  sponsorBannerBtn.addEventListener("click", openSponsorModal);
}
if (closeSponsorModal) {
  closeSponsorModal.addEventListener("click", closeSponsorModalFunc);
}
if (sponsorModal) {
  sponsorModal.addEventListener("click", (e) => {
    if (e.target === sponsorModal) {
      closeSponsorModalFunc();
    }
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && sponsorModal && sponsorModal.classList.contains("open")) {
    closeSponsorModalFunc();
  }
});

// 赞助渠道 Tab 切换 (PayPal / Alipay / WeChat)
const sponsorTabs = [
  { btn: tabPaypalBtn, content: contentPaypal },
  { btn: tabAlipayBtn, content: contentAlipay },
  { btn: tabWechatBtn, content: contentWechat }
];

sponsorTabs.forEach(({ btn, content }) => {
  if (!btn || !content) return;
  btn.addEventListener("click", () => {
    sponsorTabs.forEach((t) => {
      if (t.btn) t.btn.classList.remove("active");
      if (t.content) t.content.classList.remove("active");
    });
    btn.classList.add("active");
    content.classList.add("active");
  });
});

// 一键复制 PayPal 赞助链接
if (copyPaypalLinkBtn) {
  copyPaypalLinkBtn.addEventListener("click", async () => {
    const link = "https://paypal.me/lephone";
    try {
      await navigator.clipboard.writeText(link);
      const original = copyPaypalLinkBtn.textContent;
      copyPaypalLinkBtn.textContent = i18n.t("copied_btn");
      setTimeout(() => {
        copyPaypalLinkBtn.textContent = original;
      }, 1500);
    } catch (e) {
      alert(i18n.t("copy_failed"));
    }
  });
}

// Tab 切换逻辑
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.tab === "permissions" ? "tabPermissions" : "tabManifest";
    const targetEl = document.getElementById(target);
    if (targetEl) targetEl.classList.add("active");
  });
});

// 全屏展开逻辑 (chrome.runtime.getURL)
if (openViewerBtn) {
  openViewerBtn.addEventListener("click", () => {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      chrome.tabs.create({ url: chrome.runtime.getURL("ui/viewer.html") });
    } else {
      window.open("viewer.html", "_blank");
    }
  });
}

// 拖拽高亮与文件选择
dropZone.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    parseLocalFile(file);
  }
});

["dragenter", "dragover"].forEach((name) => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });
});

["dragleave", "drop"].forEach((name) => {
  dropZone.addEventListener(name, (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
  });
});

dropZone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files[0];
  if (file) {
    parseLocalFile(file);
  }
});

// 线上直链输入解析
parseUrlBtn.addEventListener("click", () => {
  const url = urlInput.value.trim();
  if (!url) {
    alert(i18n.t("empty_url_alert"));
    return;
  }
  parseOnlineUrl(url);
});

urlInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    parseUrlBtn.click();
  }
});

if (sample1Btn) {
  sample1Btn.addEventListener("click", () => {
    urlInput.value = "https://telegram.org/dl/android/apk";
    parseOnlineUrl(urlInput.value);
  });
}
if (sample2Btn) {
  sample2Btn.addEventListener("click", () => {
    alert(i18n.t("sample_local_alert"));
  });
}

function showStatus(msg, percent = 0) {
  statusBox.style.display = "block";
  statusText.textContent = msg;
  progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
}

function hideStatus() {
  statusBox.style.display = "none";
}

// 本地文件解析
async function parseLocalFile(file) {
  const t0 = performance.now();
  showStatus(i18n.t("status_parsing_local", { name: file.name }), 30);
  resultSection.style.display = "none";

  try {
    const ds = new BlobDataSource(file);
    const zip = new ZipReader(ds);
    await zip.init();
    const tInit = performance.now();

    await processParsedApk(zip, file.size, t0, tInit, i18n.t("mode_local"));
  } catch (err) {
    console.error("解析失败:", err);
    alert(err.message);
  } finally {
    hideStatus();
  }
}

// 线上直链断点解析
async function parseOnlineUrl(url) {
  const t0 = performance.now();
  showStatus(i18n.t("status_connecting"), 20);
  resultSection.style.display = "none";

  try {
    const ds = new HttpRangeDataSource(url, (info) => {
      showStatus(info.status, info.percent);
    });

    const zip = new ZipReader(ds);
    await zip.init();
    const tInit = performance.now();
    const totalSize = await ds.getSize();

    const netMb = (ds.totalNetworkBytes / 1024 / 1024).toFixed(2);
    const savePercent = totalSize > 0 ? Math.round((1 - ds.totalNetworkBytes / totalSize) * 100) : 0;
    const tag = ds.supportRange
      ? i18n.t("range_download", { netMb, percent: savePercent })
      : i18n.t("stream_download");

    await processParsedApk(zip, totalSize, t0, tInit, tag);
  } catch (err) {
    console.error("线上解析失败:", err);
    alert(err.message || i18n.t("url_parse_fail"));
  } finally {
    hideStatus();
  }
}

// 渲染架构徽章
function renderAbiBadges(abis) {
  abiBadges.innerHTML = "";
  if (abis && abis.length > 0) {
    abis.forEach((abi) => {
      const sp = document.createElement("span");
      sp.className = "badge abi";
      sp.textContent = abi;
      abiBadges.appendChild(sp);
    });
  } else {
    const sp = document.createElement("span");
    sp.className = "badge";
    sp.textContent = i18n.t("abi_common");
    abiBadges.appendChild(sp);
  }
}

// 渲染签名方案徽章
function renderSigBadges(signInfo) {
  sigBadges.innerHTML = "";
  if (signInfo && signInfo.schemes && signInfo.schemes.length > 0) {
    signInfo.schemes.forEach((s) => {
      const sp = document.createElement("span");
      sp.className = "badge v2";
      const shortScheme = s.split(" ")[0];
      sp.textContent = `${shortScheme}${i18n.t("sig_suffix")}`;
      sigBadges.appendChild(sp);
    });
  } else {
    const sp = document.createElement("span");
    sp.className = "badge";
    sp.textContent = i18n.t("no_sign");
    sigBadges.appendChild(sp);
  }
}

// 统一渲染解析结果
async function processParsedApk(zip, totalSize, t0, tInit, modeTag) {
  showStatus(i18n.t("status_extracting"), 75);

  // 1. 定位并提取 AndroidManifest.xml (支持 APK 根目录与 AAB base/manifest/ 路径)
  const manifestEntry = zip.findManifestEntry();
  if (!manifestEntry) {
    throw new Error("Target package does not contain AndroidManifest.xml");
  }

  const manifestBytes = await zip.extractFile(manifestEntry.filename);
  const parser = new AxmlParser(manifestBytes);
  const { metadata, formattedXml } = parser.parse();
  currentRawXml = formattedXml;
  currentMetadata = metadata;
  currentAbis = zip.abis || [];

  // 2. 从 resources.arsc 智能反查真实应用名与混淆图标路径 (APK 场景)
  let realAppName = metadata.applicationLabel;
  let iconCandidates = [metadata.applicationIcon];

  if (zip.entries.has("resources.arsc")) {
    const needsLabel = !realAppName || realAppName.startsWith("@");
    const needsIcon = !metadata.applicationIcon || metadata.applicationIcon.startsWith("@");

    if (needsLabel || needsIcon) {
      try {
        const arscBytes = await zip.extractFile("resources.arsc");
        const arsc = new ArscParser(arscBytes);

        if (needsLabel && metadata.applicationLabel) {
          const resolvedNames = arsc.resolve(metadata.applicationLabel);
          if (resolvedNames.length > 0) {
            realAppName = resolvedNames[0];
          }
        }

        if (needsIcon && metadata.applicationIcon) {
          const resolvedIcons = arsc.resolve(metadata.applicationIcon);
          if (resolvedIcons.length > 0) {
            iconCandidates = resolvedIcons;
          }
        }
      } catch (e) {
        console.warn("解析 resources.arsc 出错:", e);
      }
    }
  }

  // 3. 提取应用高清图标
  const iconResult = await IconExtractor.extractBestIcon(zip, iconCandidates);
  if (iconResult && iconResult.dataUrl) {
    currentIconUrl = iconResult.dataUrl;
    appIcon.src = currentIconUrl;
  } else {
    appIcon.src = "../icons/icon128.png";
    currentIconUrl = "";
  }

  // 4. 提取签名证书指纹
  const signInfo = await SignatureParser.extractSignature(zip);
  currentSignInfo = signInfo;

  const tEnd = performance.now();
  const totalCost = (tEnd - t0).toFixed(1);
  const cdCost = (tInit - t0).toFixed(1);

  currentPerfInfo = { cdCost, totalCost, mode: modeTag };
  perfBadge.innerHTML = `<span>${i18n.t("perf_badge", currentPerfInfo)}</span>`;

  // 渲染基本信息
  appName.textContent = realAppName || metadata.packageName || i18n.t("unknown_app");
  pkgName.textContent = metadata.packageName || "-";

  // 渲染启动类 (MainActivity)
  if (metadata.mainActivity && mainActivityRow && mainActivityText) {
    mainActivityText.textContent = metadata.mainActivity;
    mainActivityRow.style.display = "inline-flex";
  } else if (mainActivityRow) {
    mainActivityRow.style.display = "none";
  }

  appVersion.textContent = metadata.versionName ? `v${metadata.versionName}` : "-";
  versionCode.textContent = `VersionCode: ${metadata.versionCode || "-"}`;

  targetSdk.textContent = metadata.targetSdkName || `API ${metadata.targetSdkVersion || "-"}`;
  minSdk.textContent = `${i18n.t("min_supported_prefix")}${metadata.minSdkName || `API ${metadata.minSdkVersion || "-"}`}`;

  const sizeMb = (totalSize / 1024 / 1024).toFixed(1);
  fileSize.textContent = `${sizeMb} MB`;

  // 架构 ABI 徽章渲染
  renderAbiBadges(currentAbis);

  // 签名方案徽章渲染
  renderSigBadges(currentSignInfo);

  // 签名指纹
  signMd5.textContent = signInfo.md5 || "N/A";
  signSha1.textContent = signInfo.sha1 || "N/A";
  signSha256.textContent = signInfo.sha256 || "N/A";

  // 应用商店链接
  const pkg = metadata.packageName;
  if (pkg) {
    googlePlayLink.href = `https://play.google.com/store/apps/details?id=${pkg}`;
    googlePlayLink.style.display = "inline-flex";
    coolapkLink.href = `https://www.coolapk.com/apk/${pkg}`;
    coolapkLink.style.display = "inline-flex";
  } else {
    googlePlayLink.style.display = "none";
    coolapkLink.style.display = "none";
  }

  // 权限列表渲染
  currentRawPermissions = metadata.permissions || [];
  renderPermissions(currentRawPermissions);

  // 细腻专业 XML 语法高亮渲染
  renderXml(formattedXml);

  resultSection.style.display = "flex";
}

function renderPermissions(rawList) {
  const lang = i18n.getLang();
  const list = rawList.map((p) => enrichPermission(p, lang));
  const permCountEl = document.getElementById("permCount");
  if (permCountEl) permCountEl.textContent = list.length;
  permList.innerHTML = "";

  if (list.length === 0) {
    permList.innerHTML = `<div style="text-align: center; color: var(--text-dim); padding: 20px;">${i18n.t("perm_empty")}</div>`;
    return;
  }

  list.forEach((p) => {
    const item = document.createElement("div");
    item.className = `perm-item ${p.level}`;
    const levelLabel =
      p.level === "dangerous"
        ? i18n.t("perm_dangerous")
        : p.level === "special"
        ? i18n.t("perm_special")
        : i18n.t("perm_normal");

    item.innerHTML = `
      <div class="perm-head">
        <span class="perm-title">${p.title}</span>
        <span class="perm-badge-level ${p.level}">${levelLabel}</span>
      </div>
      <div class="perm-raw">${p.raw}</div>
      <div class="perm-desc">${p.description}</div>
    `;
    permList.appendChild(item);
  });
}

permSearch.addEventListener("input", (e) => {
  const kw = e.target.value.trim().toLowerCase();
  if (!kw) {
    renderPermissions(currentRawPermissions);
    return;
  }
  const lang = i18n.getLang();
  const enriched = currentRawPermissions.map((p) => enrichPermission(p, lang));
  const filtered = enriched.filter(
    (p) =>
      p.raw.toLowerCase().includes(kw) ||
      p.title.toLowerCase().includes(kw) ||
      p.description.toLowerCase().includes(kw)
  );

  permList.innerHTML = "";
  filtered.forEach((p) => {
    const item = document.createElement("div");
    item.className = `perm-item ${p.level}`;
    const levelLabel =
      p.level === "dangerous"
        ? i18n.t("perm_dangerous")
        : p.level === "special"
        ? i18n.t("perm_special")
        : i18n.t("perm_normal");

    item.innerHTML = `
      <div class="perm-head">
        <span class="perm-title">${p.title}</span>
        <span class="perm-badge-level ${p.level}">${levelLabel}</span>
      </div>
      <div class="perm-raw">${p.raw}</div>
      <div class="perm-desc">${p.description}</div>
    `;
    permList.appendChild(item);
  });
});

function renderXml(xmlText) {
  xmlCode.innerHTML = XmlHighlighter.highlight(xmlText);
}

function setupCopy(btn, getText) {
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const text = getText();
    if (!text || text === "-" || text === "N/A") return;
    try {
      await navigator.clipboard.writeText(text);
      const originalText = btn.textContent;
      btn.textContent = i18n.t("copied_btn");
      btn.style.color = "#047857";
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.color = "";
      }, 1500);
    } catch (e) {
      alert(i18n.t("copy_failed"));
    }
  });
}

setupCopy(copyPkgBtn, () => pkgName.textContent);
setupCopy(copyMainActivityBtn, () => mainActivityText.textContent);
setupCopy(copyMd5Btn, () => signMd5.textContent);
setupCopy(copySha1Btn, () => signSha1.textContent);
setupCopy(copySha256Btn, () => signSha256.textContent);
setupCopy(copyXmlBtn, () => currentRawXml);

downloadIconBtn.addEventListener("click", () => {
  if (!currentIconUrl) return;
  const a = document.createElement("a");
  a.href = currentIconUrl;
  a.download = `${pkgName.textContent || "app"}_icon.png`;
  a.click();
});

downloadXmlBtn.addEventListener("click", () => {
  if (!currentRawXml) return;
  const blob = new Blob([currentRawXml], { type: "text/xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `AndroidManifest_${pkgName.textContent || "app"}.xml`;
  a.click();
});

// 二维码图片容错与降级加载（符合 Manifest V3 CSP 规范，替代内联 onerror）
const alipayQrImg = document.getElementById("alipayQrImg");
if (alipayQrImg) {
  alipayQrImg.addEventListener("error", () => {
    alipayQrImg.src = "../icons/alipay-qr.png";
  }, { once: true });
}

const wechatQrImg = document.getElementById("wechatQrImg");
if (wechatQrImg) {
  wechatQrImg.addEventListener("error", () => {
    wechatQrImg.src = "../icons/wechat-qr.png";
  }, { once: true });
}

// 初始化静态文案
updateStaticI18n();
