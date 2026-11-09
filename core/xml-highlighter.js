/**
 * Advanced XML Syntax Highlighter for AndroidManifest.xml
 * 纯前端 0 依赖，专业级区分 XML 声明、注释、标签、命名空间前缀、属性名、等号、
 * 细分属性值（资源引用、布尔值、数字版本、类名包名、普通字符串）及行号。
 */

export class XmlHighlighter {
  /**
   * 将原始 XML 文本转换为带丰富语法高亮 HTML 的代码段
   * @param {string} xmlText 原始 XML 字符串
   * @returns {string} 包含行号与微观语法标记的 HTML
   */
  static highlight(xmlText) {
    if (!xmlText) return "";

    const lines = xmlText.split("\n");
    const totalLines = lines.length;
    const padLen = String(totalLines).length;

    let highlightedHtml = "";

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const paddedNum = String(lineNum).padStart(padLen, " ");
      const highlightedContent = XmlHighlighter._highlightLine(line);

      highlightedHtml += `<span class="xml-line"><span class="line-num" data-line="${lineNum}">${paddedNum}</span><span class="line-content">${highlightedContent}</span></span>\n`;
    });

    return highlightedHtml;
  }

  static _highlightLine(line) {
    if (!line.trim()) return "&nbsp;";

    // 1. 转义基础字符
    const escape = (s) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // 2. 特殊行处理：XML 声明 <?xml ... ?>
    if (line.trim().startsWith("<?xml")) {
      return `<span class="xml-prolog">${escape(line)}</span>`;
    }

    // 3. 特殊行处理：注释 <!-- ... -->
    if (line.trim().startsWith("<!--") || line.includes("&lt;!--")) {
      return `<span class="xml-comment">${escape(line)}</span>`;
    }

    // 4. 通用节点与属性行高亮
    // 匹配标签开始、属性及闭合
    let result = "";
    let i = 0;
    const len = line.length;

    while (i < len) {
      // 检查标签开始 <tag 或 </tag
      if (line[i] === "<") {
        let tagEnd = i + 1;
        while (tagEnd < len && !/[\s>]/.test(line[tagEnd])) {
          tagEnd++;
        }
        const fullTag = line.slice(i, tagEnd); // 如 "<manifest" 或 "</application"
        const isClose = fullTag.startsWith("</");
        const bracket = isClose ? "&lt;/" : "&lt;";
        const tagName = isClose ? fullTag.slice(2) : fullTag.slice(1);

        result += `<span class="xml-bracket">${bracket}</span><span class="xml-tag-name">${escape(tagName)}</span>`;
        i = tagEnd;
        continue;
      }

      // 检查标签闭合 > 或 />
      if (line[i] === ">") {
        result += `<span class="xml-bracket">&gt;</span>`;
        i++;
        continue;
      }
      if (line[i] === "/" && line[i + 1] === ">") {
        result += `<span class="xml-bracket">/&gt;</span>`;
        i += 2;
        continue;
      }

      // 检查属性 attribute="value"
      // 匹配：(xmlns:android|android:name|package)="value"
      if (/[a-zA-Z0-9_\-:]/.test(line[i])) {
        let attrEnd = i;
        while (attrEnd < len && line[attrEnd] !== "=" && !/[\s>]/.test(line[attrEnd])) {
          attrEnd++;
        }

        const attrName = line.slice(i, attrEnd);
        // 如果后面跟着 '='，确认是属性
        let eqPos = attrEnd;
        while (eqPos < len && /\s/.test(line[eqPos])) eqPos++;

        if (eqPos < len && line[eqPos] === "=") {
          // 高亮属性名（细分命名空间前缀）
          result += XmlHighlighter._formatAttrName(attrName);
          result += `<span class="xml-equal">=</span>`;

          let valStart = eqPos + 1;
          while (valStart < len && /\s/.test(line[valStart])) valStart++;

          if (valStart < len && (line[valStart] === '"' || line[valStart] === "'")) {
            const quoteChar = line[valStart];
            let valEnd = valStart + 1;
            while (valEnd < len && line[valEnd] !== quoteChar) {
              valEnd++;
            }
            if (valEnd < len) valEnd++; // 包含闭合引号

            const fullVal = line.slice(valStart, valEnd);
            result += XmlHighlighter._formatAttrValue(fullVal);
            i = valEnd;
            continue;
          } else {
            i = eqPos + 1;
            continue;
          }
        }
      }

      // 默认字符与空白
      result += escape(line[i]);
      i++;
    }

    return result;
  }

  /**
   * 格式化属性名（区分 namespace 前缀与属性本体）
   */
  static _formatAttrName(attr) {
    if (attr.includes(":")) {
      const [ns, name] = attr.split(":");
      return `<span class="xml-attr-ns">${ns}</span><span class="xml-colon">:</span><span class="xml-attr-name">${name}</span>`;
    }
    return `<span class="xml-attr-name">${attr}</span>`;
  }

  /**
   * 细致区分不同类型的属性值
   */
  static _formatAttrValue(valWithQuotes) {
    const raw = valWithQuotes.slice(1, -1); // 去掉外层引号
    const quote = "&quot;";

    // 1. 资源引用 (如 "@0x7f..." 或 "@string/app_name") -> 紫色
    if (raw.startsWith("@") || raw.startsWith("?")) {
      return `<span class="xml-quote">${quote}</span><span class="xml-val-ref">${raw}</span><span class="xml-quote">${quote}</span>`;
    }

    // 2. 布尔值 (true / false) -> 橙色
    if (raw === "true" || raw === "false") {
      return `<span class="xml-quote">${quote}</span><span class="xml-val-bool">${raw}</span><span class="xml-quote">${quote}</span>`;
    }

    // 3. 纯数字 / 尺寸 (如 "1", "34", "1.0.0") -> 靛蓝色
    if (/^[\d.]+$/.test(raw)) {
      return `<span class="xml-quote">${quote}</span><span class="xml-val-num">${raw}</span><span class="xml-quote">${quote}</span>`;
    }

    // 4. 颜色值 (如 "#ffffff")
    if (/^#[0-9a-fA-F]{3,8}$/.test(raw)) {
      return `<span class="xml-quote">${quote}</span><span class="xml-val-color">${raw}</span><span class="xml-quote">${quote}</span>`;
    }

    // 5. 类名 / 包名组件 (如 "com.example.MainActivity" 或 ".SplashActivity")
    if (raw.includes(".") && !raw.includes(" ")) {
      return `<span class="xml-quote">${quote}</span><span class="xml-val-class">${raw}</span><span class="xml-quote">${quote}</span>`;
    }

    // 6. 普通字符串值 -> 墨绿色
    return `<span class="xml-quote">${quote}</span><span class="xml-val-str">${raw}</span><span class="xml-quote">${quote}</span>`;
  }
}
