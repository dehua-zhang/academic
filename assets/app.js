(function () {
  "use strict";

  document.documentElement.classList.remove("no-js");

  var ORDER = ["research", "experience", "news", "highlights", "publications", "join", "contact"];

  function esc(v) {
    return String(v == null ? "" : v)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  /* ---------- 安全层：URL 协议白名单 + 富文本标签白名单 ---------- */
  function isSafeUrl(h) {
    h = String(h == null ? "" : h).trim();
    if (!h || /[\x00-\x1f]/.test(h)) return false;
    if (/^[a-z][a-z0-9+.-]*:/i.test(h)) return /^(https?:|mailto:|tel:)/i.test(h);
    return true; /* 相对路径、#锚点、/ 开头均允许 */
  }

  function safeHref(v) {
    var h = String(v == null ? "" : v).trim();
    return isSafeUrl(h) ? esc(h) : "#";
  }

  /* 外链统一：新窗口打开 + 反向链接防护 + 屏幕阅读器提示 */
  var EXT_NOTE = '<span class="sr-only">（在新窗口打开）</span>';
  function linkAttrs(v) {
    var h = String(v == null ? "" : v).trim();
    return 'href="' + safeHref(h) + '"' +
      (/^https?:/i.test(h) && isSafeUrl(h) ? ' target="_blank" rel="noopener noreferrer"' : "");
  }
  function extNote(v) { return /^https?:/i.test(String(v == null ? "" : v).trim()) ? EXT_NOTE : ""; }

  var ALLOWED_TAGS = { B: 1, STRONG: 1, EM: 1, I: 1, U: 1, BR: 1, CODE: 1, SUP: 1, SUB: 1, A: 1, SPAN: 1 };
  function sanitize(html) {
    /* template.content 是 inert 片段：解析时不会执行脚本或加载图片资源 */
    var tpl = document.createElement("template");
    tpl.innerHTML = html;
    (function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (node) {
        if (node.nodeType === 3) return;
        if (node.nodeType !== 1) { parent.removeChild(node); return; }
        if (!ALLOWED_TAGS[node.tagName]) {
          parent.replaceChild(document.createTextNode(node.textContent || ""), node);
          return;
        }
        Array.prototype.slice.call(node.attributes).forEach(function (a) {
          var name = a.name.toLowerCase();
          if (node.tagName === "A" && name === "href") {
            if (isSafeUrl(a.value)) node.setAttribute("rel", "noopener noreferrer");
            else node.removeAttribute("href");
          } else if (name !== "title") {
            node.removeAttribute(a.name); /* 移除 onclick / onerror / style 等 */
          }
        });
        walk(node);
      });
    })(tpl.content);
    return tpl.innerHTML;
  }

  /* 允许 **加粗** 与简单 HTML（<a>、<em> 等），但只保留白名单标签与属性 */
  function rich(v) {
    return sanitize(String(v == null ? "" : v).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>"));
  }
  function arr(v) { return Array.isArray(v) ? v : []; }
  function pad(n) { return String(n).padStart(2, "0"); }

  /* ---------- 站内文件（PDF 等）：支持下载属性 + 缺失自动隐藏 ---------- */
  var FILE_RE = /\.(pdf|zip|docx?|pptx?|xlsx?|txt|csv|png|jpe?g|gif|svg)$/i;

  function isLocalFile(href) {
    var h = String(href == null ? "" : href).trim();
    if (!h) return false;
    if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(h)) return false;
    return FILE_RE.test(h.split(/[?#]/)[0]);
  }

  /* download 可以是 true（用文件名）或自定义文件名 */
  function fileAttr(o, href) {
    if (!isLocalFile(href)) return "";
    var s = ' data-file="1"';
    var dl = o && o.download;
    if (dl) s += dl === true ? ' download' : ' download="' + esc(dl) + '"';
    return s;
  }

  function sectionHead(id, d, index) {
    var s = (d.sections && d.sections[id]) || {};
    return '<div class="section-head">' +
      '<span class="num" aria-hidden="true">' + pad(index) + '</span>' +
      '<h2 id="h-' + id + '">' + esc(s.title || "") + '</h2>' +
      '<p class="sub">' + esc(s.sub || "") + '</p>' +
      '</div>';
  }

  function renderHeroInfo(p) {
    var box = p.heroInfo || {};
    var rows = arr(box.items).map(function (it) {
      return '<div class="hero-info-item"><dt>' + esc(it.label) + '</dt><dd>' + rich(it.value) + '</dd></div>';
    }).join("");
    var links = arr(box.links).map(function (l) {
      var href = String(l.href || "#");
      return '<a ' + linkAttrs(href) + '>' + esc(l.label) + extNote(href) + '</a>';
    }).join("");
    if (!rows && !links) return "";
    return '<div class="hero-info">' +
        (rows ? '<dl>' + rows + '</dl>' : "") +
        (links ? '<div class="hero-info-links">' + links + '</div>' : "") +
      '</div>';
  }

  function renderHero(d) {
    var p = d.profile || {};

    var paras = arr(p.paragraphs).map(function (t) { return '<p>' + rich(t) + '</p>'; }).join("");
    var stats = (p.showStats === false ? [] : arr(p.stats)).map(function (s) {
      return '<div class="stat"><b>' + esc(s.value) + '</b><span>' + esc(s.label) + '</span></div>';
    }).join("");
    var chips = arr(p.keywords).map(function (k) {
      return '<span class="chip">' + esc(k) + '</span>';
    }).join("");

    var hidePhoto = String(p.photo || "").toLowerCase() === "none";
    var initial = String(p.initial || String(p.name || "").trim().charAt(0)).trim().charAt(0);
    var frame = p.photo && !hidePhoto
      ? '<div class="portrait-frame has-photo"><img src="' + safeHref(p.photo) + '" alt="' + esc(p.name) + ' 的照片" width="160" height="160" decoding="async"></div>'
      : '<div class="portrait-frame"><span class="portrait-initial" aria-hidden="true">' + esc(initial) + '</span></div>';

    var portrait = hidePhoto ? "" : '<div class="portrait">' + frame + '</div>';

    var identity = '<div class="hero-id">' + portrait +
      '<div class="hero-id-text">' +
        '<h1>' + esc(p.name) + '</h1>' +
        (p.nameEn ? '<p class="hero-en">' + esc(p.nameEn) + '</p>' : "") +
      '</div>' + renderHeroInfo(p) + '</div>';

    return '<div class="profile-main">' + identity +
        (paras ? '<div class="bio">' + paras + '</div>' : "") +
        (p.quote ? '<blockquote class="quote">' + rich(p.quote) + '</blockquote>' : "") +
        (chips ? '<div class="chips" aria-label="研究关键词">' +
          (p.keywordsLabel ? '<span class="chips-label">' + esc(p.keywordsLabel) + '</span>' : "") +
          chips + '</div>' : "") +
        (stats ? '<div class="stats">' + stats + '</div>' : "") +
      '</div>';
  }

  function renderResearch(d, num) {
    var items = arr((d.research || {}).items).filter(function (it) {
      return it && (it.title || it.description);
    }).map(function (it, k) {
      var kw = arr(it.keywords).map(esc).join('<span>·</span>');
      return '<article class="rcard reveal">' +
        '<span class="ghost" aria-hidden="true">' + pad(k + 1) + '</span>' +
        (it.title ? '<h3>' + esc(it.title) + '</h3>' : "") +
        (it.description ? '<p>' + rich(it.description) + '</p>' : "") +
        (kw ? '<div class="kw">' + kw + '</div>' : "") +
        '</article>';
    }).join("");
    if (!items) return "";
    return sectionHead("research", d, num.next()) + '<div class="research-grid">' + items + '</div>';
  }

  function renderExperience(d, num) {
    var items = arr(d.experience).filter(function (e) {
      return e && (e.title || e.period);
    }).map(function (e) {
      return '<div class="tl-item reveal' + (e.current ? " now" : "") + '">' +
        (e.period ? '<div class="tl-when">' + esc(e.period) + '</div>' : "") +
        '<h4>' + esc(e.title) + (e.org ? '<small>' + esc(e.org) + '</small>' : "") + '</h4>' +
        (e.note ? '<p>' + rich(e.note) + '</p>' : "") +
        '</div>';
    }).join("");
    if (!items) return "";
    return sectionHead("experience", d, num.next()) + '<div class="tl">' + items + '</div>';
  }

  function renderNews(d, num) {
    var cfg = (d.sections && d.sections.news) || {};
    var limit = Math.floor(Number(cfg.collapseAfter));
    if (!isFinite(limit) || limit < 1) limit = 5;

    var rows = arr(d.news).filter(function (n) {
      return n && n.text;
    }).map(function (n, i) {
      var tags = arr(n.tags).map(function (t) {
        var gold = String(t).charAt(0) === "!";
        return '<span class="tag' + (gold ? " gold" : "") + '">' + esc(String(t).replace(/^!/, "")) + '</span>';
      }).join("");
      var folded = i >= limit;
      return '<li class="' + (folded ? "news-extra" : "reveal") + (n.date ? "" : " no-date") + '"' +
        (folded ? " hidden" : "") + '>' +
        (n.date ? '<time' + (n.iso ? ' datetime="' + esc(n.iso) + '"' : "") + '>' + esc(n.date) + '</time>' : '<time hidden></time>') +
        '<p>' + rich(n.text) + tags + '</p>' +
        '</li>';
    });
    if (!rows.length) return "";

    var extra = rows.length - limit;
    var toggle = extra > 0
      ? '<button type="button" class="news-toggle" aria-expanded="false" aria-controls="newsList">' +
          '展开其余 ' + extra + ' 条动态' +
        '</button>'
      : "";

    return sectionHead("news", d, num.next()) +
      '<ul class="news" id="newsList">' + rows.join("") + '</ul>' + toggle;
  }

  function renderHighlights(d, num) {
    var rows = arr(d.highlights).filter(function (h) {
      return h && (h.title || h.text);
    }).map(function (h, k) {
      var idx = pad(k + 1);
      var img = String(h.image || "").trim();
      var figure = '<div class="highlight-figure" data-index="' + idx + '">' +
        (img ? '<img src="' + safeHref(img) + '" alt="' + esc(h.alt || h.title || "") +
          '" loading="lazy" decoding="async">' : "") +
        '</div>';
      var tags = arr(h.tags).map(function (t) {
        return '<span class="venue-tag">' + esc(t) + '</span>';
      }).join("");
      var links = arr(h.links).map(function (l) {
        var href = String(l.href || "#");
        return '<a ' + linkAttrs(href) + fileAttr(l, href) + '>' + esc(l.label) + extNote(href) + '</a>';
      }).join("");
      return '<article class="highlight reveal">' + figure +
        '<div class="highlight-body">' +
          (h.title ? '<h3>' + esc(h.title) + '</h3>' : "") +
          (h.text ? '<p>' + rich(h.text) + '</p>' : "") +
          (tags ? '<div class="highlight-tags">' + tags + '</div>' : "") +
          (links ? '<div class="highlight-links">' + links + '</div>' : "") +
        '</div></article>';
    }).join("");
    if (!rows) return "";
    return sectionHead("highlights", d, num.next()) + '<div class="highlights">' + rows + '</div>';
  }

  function pubItem(p) {
    var tags = arr(p.tags).map(function (t) {
      var gold = String(t).charAt(0) === "!";
      return '<span class="venue-tag' + (gold ? " gold" : "") + '">' + esc(String(t).replace(/^!/, "")) + '</span>';
    }).join("");
    var links = arr(p.links).map(function (l) {
      var href = String(l.href || "#");
      return '<a ' + linkAttrs(href) + fileAttr(l, href) + '>' + esc(l.label) + extNote(href) + '</a>';
    }).join("");
    var venueLine = (p.venue || p.detail || tags)
      ? '<p class="pub-venue">' +
          (p.venue ? '<em>' + esc(p.venue) + '</em>' : "") +
          (p.detail ? (p.venue ? " " : "") + esc(p.detail) : "") + tags +
        '</p>'
      : "";
    var doi = String(p.doi || "").trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
    var doiHref = "https://doi.org/" + doi;
    var doiLine = doi
      ? '<p class="pub-doi">DOI: <a ' + linkAttrs(doiHref) + '>' + esc(doi) + extNote(doiHref) + '</a></p>'
      : "";
    return '<li class="pub" data-type="' + esc(p.type || "conference") + '">' +
      '<div>' +
        '<p class="pub-title">' + esc(p.title) + '</p>' +
        (p.authors ? '<p class="pub-authors">' + rich(p.authors) + '</p>' : "") +
        venueLine +
        doiLine +
      '</div>' +
      '<div class="pub-links">' + (p.featured ? '<span class="star">★ 精选</span>' : "") + links + '</div>' +
      '</li>';
  }

  function renderPublications(d, num) {
    var pub = d.publications || {};
    var groups = arr(pub.groups).map(function (g) {
      return {
        year: (g && g.year) || "",
        items: arr(g && g.items).filter(function (p) { return p && p.title; })
      };
    }).filter(function (g) { return g.items.length; });
    var counts = { all: 0 };
    groups.forEach(function (g) {
      g.items.forEach(function (p) {
        counts.all++;
        var t = p.type || "conference";
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    if (!counts.all) return "";

    var filters = arr(pub.filters).map(function (f, k) {
      return '<button type="button" class="filter' + (k === 0 ? " active" : "") + '" data-filter="' + esc(f.key) +
        '" aria-pressed="' + (k === 0 ? "true" : "false") + '">' +
        esc(f.label) + '<span class="count" aria-hidden="true">' + (counts[f.key] || 0) + '</span></button>';
    }).join("");

    var body = groups.map(function (g) {
      var rows = g.items.map(pubItem).join("");
      return '<div class="year-group">' + (g.year ? '<h3>' + esc(g.year) + '</h3>' : "") +
        '<ul class="pub-list">' + rows + '</ul></div>';
    }).join("");

    return sectionHead("publications", d, num.next()) +
      (filters ? '<div class="filters" role="group" aria-label="论文筛选">' + filters + '</div>' : "") +
      '<p id="filterStatus" class="sr-only" role="status" aria-live="polite"></p>' +
      '<div id="pubBody">' + body + '</div>' +
      (pub.note ? '<p class="more-line">' + rich(pub.note) + '</p>' : "");
  }

  function renderJoin(d, num) {
    var items = arr((d.join || {}).items).filter(function (c) {
      return c && (c.title || arr(c.paragraphs).length || arr(c.bullets).length);
    }).map(function (c) {
      var ps = arr(c.paragraphs).map(function (t) { return "<p>" + rich(t) + "</p>"; }).join("");
      var ul = arr(c.bullets).length
        ? "<ul>" + arr(c.bullets).map(function (b) { return "<li>" + rich(b) + "</li>"; }).join("") + "</ul>"
        : "";
      return '<div class="join-card reveal">' +
        (c.title ? '<h3>' + esc(c.title) + '</h3>' : "") + ps + ul + '</div>';
    }).join("");
    if (!items) return "";
    return sectionHead("join", d, num.next()) + '<div class="join-grid">' + items + '</div>';
  }

  function renderContact(d, num) {
    var c = d.contact || {};
    var lines = arr(c.lines).map(function (l) {
      return '<div><dt>' + esc(l.label) + '</dt><dd>' + rich(l.value) + '</dd></div>';
    }).join("");
    var links = arr(c.links).map(function (l) {
      var href = String(l.href || "#");
      return '<a ' + linkAttrs(href) + fileAttr(l, href) + '>' + esc(l.label) + extNote(href) + '</a>';
    }).join("");

    if (!c.email && !lines && !links) return "";

    var left = (c.email || lines)
      ? '<div class="reveal">' +
          (c.email ? '<a class="mail" href="mailto:' + esc(c.email) + '">' + esc(c.email) + '</a>' : "") +
          (lines ? '<dl class="contact-lines" style="margin:0">' + lines + '</dl>' : "") +
        '</div>'
      : "";
    var right = links
      ? '<div class="reveal">' +
          '<p style="margin:0 0 12px;font-size:13.5px;color:var(--muted);letter-spacing:.06em">' +
            esc(c.linksTitle || "学术主页与代码") + '</p>' +
          '<div class="link-list">' + links + '</div>' +
        '</div>'
      : "";

    return sectionHead("contact", d, num.next()) +
      '<div class="contact-grid' + (left && right ? "" : " single") + '">' + left + right + '</div>';
  }

  function fill(key, html) {
    var el = document.querySelector('[data-render="' + key + '"]');
    if (el) el.innerHTML = html;
  }

  function setMeta(attr, key, value) {
    var el = document.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", value);
  }

  /* SEO 标签全部按 content.json 在运行时生成，不在 index.html 里保存内容副本 */
  function syncSeo(d) {
    var site = d.site || {}, p = d.profile || {};
    var title = site.title || (p.name ? p.name + " | 个人学术主页" : "个人学术主页");
    var desc = site.description || "";
    var url = /^https?:/.test(location.protocol) ? location.origin + location.pathname : "";

    document.title = title;
    setMeta("name", "description", desc);
    if (p.name) setMeta("name", "author", p.name);
    setMeta("property", "og:type", "profile");
    setMeta("property", "og:title", title);
    setMeta("property", "og:site_name", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:locale", String(site.lang || "zh-CN").replace("-", "_"));
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:card", "summary");
    if (url) {
      setMeta("property", "og:url", url);
      var canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      canonical.href = url;
    }

    var person = { "@type": "Person", "name": p.name || "" };
    if (url) person.url = url;
    if (p.nameEn) person.alternateName = p.nameEn;
    var c = d.contact || {};
    if (c.email) person.email = "mailto:" + c.email;
    var sameAs = [];
    arr(c.links).forEach(function (l) {
      var u = String((l || {}).href || "");
      if (/^https?:/i.test(u) && sameAs.indexOf(u) === -1) sameAs.push(u);
    });
    if (sameAs.length) person.sameAs = sameAs;
    var knows = [];
    arr(p.keywords).concat(arr((d.research || {}).items).map(function (r) { return (r || {}).title; }))
      .forEach(function (v) { if (v && knows.indexOf(v) === -1) knows.push(v); });
    if (knows.length) person.knowsAbout = knows;

    var page = {
      "@type": "ProfilePage", "name": title, "description": desc,
      "inLanguage": site.lang || "zh-CN", "mainEntity": person
    };
    if (url) page.url = url;
    var ld = document.querySelector('script[type="application/ld+json"]');
    if (!ld) {
      ld = document.createElement("script");
      ld.type = "application/ld+json";
      document.head.appendChild(ld);
    }
    ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@graph": [person, page] })
      .replace(/</g, "\\u003c");
  }

  var THEME_NAMES = [
    "green", "lightblue", "navy", "lightgreen", "deepgreen", "red", "orange", "purple", "graphite",
    "burgundy", "indigo", "teal", "sepia", "ink"
  ];

  /* 主题：content.json 里 site.theme 指定，也可用 ?theme=navy 临时预览 */
  function applyTheme(site) {
    var q = "";
    try { q = new URLSearchParams(location.search).get("theme") || ""; } catch (e) {}
    var t = String(q || (site && site.theme) || "green").toLowerCase();
    if (THEME_NAMES.indexOf(t) === -1) t = "green";
    document.documentElement.setAttribute("data-theme", t);

    var cs = getComputedStyle(document.documentElement);
    var accent = (cs.getPropertyValue("--accent") || "#14563f").trim();
    var bg = (cs.getPropertyValue("--bg") || "#fbfaf7").trim();

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", accent);

    var icon = document.querySelector('link[rel="icon"]');
    if (icon) {
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect width="64" height="64" rx="14" fill="' + accent + '"/>' +
        '<path d="M19 45V19l13 15 13-15v26" fill="none" stroke="' + bg + '" stroke-width="4" ' +
        'stroke-linejoin="round" stroke-linecap="round"/></svg>';
      icon.setAttribute("href", "data:image/svg+xml," + encodeURIComponent(svg));
    }
  }

  function renderAll(d) {
    var site = d.site || {};
    var p = d.profile || {};
    applyTheme(site);
    syncSeo(d);
    if (site.lang) document.documentElement.lang = site.lang;

    function put(selector, text) {
      var el = document.querySelector(selector);
      if (el) el.textContent = text;
    }
    put("[data-brand-mark]", site.brandMark || p.initial || String(p.name || "").trim().charAt(0));
    put("[data-brand-name]", p.name || "");
    put("[data-brand-en]", p.nameEn || "");

    fill("hero", renderHero(d));

    /* 逐块渲染：某块没有内容（或在 sections 里写了 "hide": true）就整块隐藏，导航里也不出现 */
    var num = { n: 0, next: function () { return ++this.n; } };
    var renderers = [
      ["research", renderResearch],
      ["experience", renderExperience],
      ["news", renderNews],
      ["highlights", renderHighlights],
      ["publications", renderPublications],
      ["join", renderJoin],
      ["contact", renderContact]
    ];

    var visible = [];
    renderers.forEach(function (pair) {
      var id = pair[0];
      var cfg = (d.sections && d.sections[id]) || {};
      var sec = document.getElementById(id);
      var holder = document.querySelector('[data-render="' + id + '"]');
      var htmlText = cfg.hide ? "" : pair[1](d, num);
      if (!htmlText) {
        if (sec) sec.style.display = "none";
        if (holder) holder.innerHTML = "";
        return;
      }
      if (sec) sec.style.display = "";
      if (holder) holder.innerHTML = htmlText;
      visible.push(id);
    });

    var nav = document.getElementById("nav");
    if (nav) {
      nav.innerHTML = visible.map(function (id) {
        var s = (d.sections && d.sections[id]) || {};
        return '<a href="#' + id + '">' + esc(s.nav || s.title || id) + '</a>';
      }).join("");
    }
    if (typeof refreshNavOverflow === "function") refreshNavOverflow();

    fill("footer", '<span>' + esc(site.footerLeft) + '</span><span>' + esc(site.footerRight) + '</span>');
  }

  /* 加载失败时保留页面骨架，并给出可操作的提示 */
  function showError(err) {
    var isFile = location.protocol === "file:";
    showJsonAlert(
      (isFile
        ? "直接用 file:// 打开时浏览器会拒绝读取 content.json，这不是内容出错。"
        : "无法读取 content.json，页面内容暂时无法显示。") +
      " 请在本目录运行 preview.bat（或 python -m http.server 8000），再访问 http://localhost:8000/。" +
      " 错误信息：" + (err && err.message ? err.message : err)
    );
    var hero = document.querySelector('[data-render="hero"]');
    if (hero && !hero.innerHTML.trim()) {
      hero.innerHTML = '<p class="lede">页面内容未能加载，请按上方提示操作后刷新页面。</p>';
    }
  }

  /* ---------- 轻量数据校验：坏数据不覆盖已有的静态内容 ---------- */
  function validateData(d) {
    var problems = [];
    if (!d || typeof d !== "object" || Array.isArray(d)) return ["根节点必须是 JSON 对象"];
    if (!(d.profile && typeof d.profile.name === "string" && d.profile.name.trim())) {
      problems.push("profile.name 不能为空");
    }
    arr((d.publications || {}).groups).forEach(function (g, gi) {
      arr(g && g.items).forEach(function (it, ii) {
        if (it && !it.title) problems.push("publications.groups[" + gi + "].items[" + ii + "].title 不能为空");
      });
    });
    return problems;
  }

  /* ---------- 一页只绑定一次：滚动进度 / 回到顶部 ---------- */
  function setupGlobal() {
    var progress = document.getElementById("progress");
    var toTop = document.getElementById("toTop");

    function onScroll() {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY || document.documentElement.scrollTop;
      if (progress) progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      if (toTop) toTop.classList.toggle("show", y > 560);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (toTop) {
      toTop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
    setupColorMode();
    setupNavOverflow();
  }

  /* ---------- 明暗模式：默认跟随系统，可手动覆盖并记住选择 ---------- */
  function setupColorMode() {
    var btn = document.getElementById("themeToggle");
    var root = document.documentElement;
    var media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

    function sync(notify) {
      var mode = root.getAttribute("data-color-mode") === "dark" ? "dark" : "light";
      root.style.colorScheme = mode;
      if (btn) {
        btn.setAttribute("aria-pressed", mode === "dark" ? "true" : "false");
        btn.setAttribute("aria-label", mode === "dark" ? "切换到浅色模式" : "切换到深色模式");
      }
      if (notify) toast(mode === "dark" ? "已切换到深色模式" : "已切换到浅色模式");
    }

    if (btn) {
      btn.addEventListener("click", function () {
        var next = root.getAttribute("data-color-mode") === "dark" ? "light" : "dark";
        root.setAttribute("data-color-mode", next);
        try { localStorage.setItem("color-mode", next); } catch (e) {}
        sync(true);
      });
    }
    if (media) {
      var onChange = function () {
        var saved = null;
        try { saved = localStorage.getItem("color-mode"); } catch (e) {}
        if (saved !== "dark" && saved !== "light") {
          root.setAttribute("data-color-mode", media.matches ? "dark" : "light");
          sync(false);
        }
      };
      if (media.addEventListener) media.addEventListener("change", onChange);
      else if (media.addListener) media.addListener(onChange);
    }
    sync(false);
  }

  /* ---------- 导航可横滑时给出渐隐提示 ---------- */
  var refreshNavOverflow = function () {};
  function setupNavOverflow() {
    var nav = document.getElementById("nav");
    if (!nav || !nav.parentNode) return;
    var wrap = nav.parentNode;
    refreshNavOverflow = function () {
      var more = nav.scrollWidth > nav.clientWidth + 2;
      var atEnd = nav.scrollLeft + nav.clientWidth >= nav.scrollWidth - 2;
      wrap.classList.toggle("can-scroll", more && !atEnd);
    };
    nav.addEventListener("scroll", refreshNavOverflow, { passive: true });
    window.addEventListener("resize", refreshNavOverflow, { passive: true });
    refreshNavOverflow();
  }

  /* ---------- 每次重新渲染后重绑：导航高亮 / 入场动画 / 论文筛选 ---------- */
  var spyObserver = null;
  var revealObserver = null;

  function setupDynamic(isReload) {
    if (spyObserver) { spyObserver.disconnect(); spyObserver = null; }
    if (revealObserver) { revealObserver.disconnect(); revealObserver = null; }

    var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
    var sections = ORDER.map(function (id) { return document.getElementById(id); }).filter(Boolean);

    function setActive(id) {
      navLinks.forEach(function (a) {
        a.classList.toggle("active", a.getAttribute("href") === "#" + id);
      });
    }

    if ("IntersectionObserver" in window && sections.length) {
      spyObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) setActive(e.target.id);
        });
      }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
      sections.forEach(function (s) { spyObserver.observe(s); });
    }

    var revealEls = document.querySelectorAll(".reveal");
    if (isReload || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            revealObserver.unobserve(e.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }

    var filters = document.querySelectorAll(".filter");
    var pubs = Array.prototype.slice.call(document.querySelectorAll(".pub"));
    var groups = Array.prototype.slice.call(document.querySelectorAll(".year-group"));

    filters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        filters.forEach(function (b) {
          b.classList.remove("active");
          b.setAttribute("aria-pressed", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-pressed", "true");
        var type = btn.dataset.filter;
        var shown = 0;

        pubs.forEach(function (p) {
          p.hidden = type !== "all" && p.dataset.type !== type;
          if (!p.hidden) shown++;
        });
        groups.forEach(function (g) {
          g.hidden = g.querySelectorAll(".pub:not([hidden])").length === 0;
        });
        var status = document.getElementById("filterStatus");
        if (status) {
          var label = (btn.childNodes[0] && btn.childNodes[0].nodeValue || "").trim();
          status.textContent = label + "：已显示 " + shown + " 篇论文";
        }
      });
    });

    var newsToggle = document.querySelector(".news-toggle");
    if (newsToggle) {
      newsToggle.addEventListener("click", function () {
        var extras = document.querySelectorAll(".news-extra");
        var expanded = newsToggle.getAttribute("aria-expanded") === "true";
        extras.forEach(function (li) { li.hidden = expanded; });
        newsToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
        newsToggle.textContent = expanded ? "展开其余 " + extras.length + " 条动态" : "收起";
      });
    }

    var highlightImgs = document.querySelectorAll(".highlight-figure img");
    Array.prototype.slice.call(highlightImgs).forEach(function (img) {
      var fallback = function () { img.style.display = "none"; };
      if (img.complete && img.naturalWidth === 0) fallback();
      else img.addEventListener("error", fallback);
    });

    pruneMissingFiles();
  }

  /* 站内文件（如 papers/xxx.pdf）不存在时自动隐藏对应链接，避免点出 404。
     同一路径只探测一次，且允许 HTTP 缓存 HEAD 结果。 */
  function pruneMissingFiles() {
    var links = Array.prototype.slice.call(document.querySelectorAll('a[data-file="1"]'));
    var byHref = {};
    links.forEach(function (a) {
      var href = a.getAttribute("href");
      if (!href) return;
      (byHref[href] || (byHref[href] = [])).push(a);
    });
    Object.keys(byHref).forEach(function (href) {
      fetch(href, { method: "HEAD" })
        .then(function (res) {
          if (res.status !== 404) return;
          byHref[href].forEach(function (a) {
            a.style.display = "none";
            a.setAttribute("aria-hidden", "true");
            var box = a.parentNode;
            if (box && box.classList && box.classList.contains("pub-links") &&
                !box.querySelector("a:not([aria-hidden='true'])") && !box.querySelector(".star")) {
              box.style.display = "none";
            }
          });
        })
        .catch(function () { /* 本地 file:// 打开时无法检测，保持原样 */ });
    });
  }

  /* ---------- 读取、渲染、以及保存后自动刷新 ---------- */
  var lastRaw = null;
  var firstLoad = true;

  function toast(msg) {
    var el = document.getElementById("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(function () { el.classList.remove("show"); }, 1600);
  }

  function showJsonAlert(msg) {
    var el = document.getElementById("jsonAlert");
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
  }

  function clearJsonAlert() {
    var el = document.getElementById("jsonAlert");
    if (el) el.hidden = true;
  }

  function jsonErrorText(err, text) {
    var msg = String(err && err.message ? err.message : err);
    var m = /position (\d+)/.exec(msg);
    var where = "";
    if (m) {
      var pos = Math.min(parseInt(m[1], 10), text.length);
      var lines = text.slice(0, pos).split("\n");
      where = "第 " + lines.length + " 行、第 " + (lines[lines.length - 1].length + 1) + " 列附近";
    }
    return "content.json 有语法错误" + (where ? "（" + where + "）" : "") +
      "：多半是少了或多了一个逗号、引号没配对。改好保存后本页会自动恢复。";
  }

  function blankState() {
    var hero = document.querySelector('[data-render="hero"]');
    if (hero && !hero.innerHTML.trim()) {
      hero.innerHTML = '<div style="padding:70px 0;color:var(--muted);font-size:15px;line-height:2">' +
        '正在等待 content.json 修正…<br>' +
        '<span style="font-size:13px">保存文件后，页面会自动加载内容，无需刷新。</span></div>';
    }
  }

  function isLocalPreview() {
    return location.protocol === "file:" ||
      /^(localhost|127\.0\.0\.1|\[::1\])$/i.test(location.hostname);
  }

  function load(isPoll) {
    /* 线上走默认缓存（让静态托管的 ETag / Cache-Control 生效）；仅本地预览禁用缓存以便热重载 */
    var local = isLocalPreview();
    var url = local ? "content.json?t=" + Date.now() : "content.json";
    return fetch(url, local ? { cache: "no-store" } : {})
      .then(function (res) {
        if (!res.ok) throw new Error("无法读取 content.json（HTTP " + res.status + "）");
        return res.text();
      })
      .then(function (text) {
        if (text === lastRaw) return;
        var data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          showJsonAlert(jsonErrorText(e, text));
          blankState();
          return;
        }
        var problems = validateData(data);
        if (problems.length) {
          showJsonAlert("content.json 字段有误，已保留静态内容：" + problems.slice(0, 3).join("；"));
          blankState();
          return;
        }
        lastRaw = text;
        clearJsonAlert();
        try {
          renderAll(data);
        } catch (e) {
          showJsonAlert("页面渲染出错（content.json 语法本身没问题）：" +
            (e && e.message ? e.message : e) + "。把这条信息发给维护者即可定位。");
          return;
        }
        setupDynamic(!firstLoad);
        if (!firstLoad) toast("内容已更新");
        firstLoad = false;
      })
      .catch(function (err) {
        if (isPoll) return;
        showError(err);
      });
  }

  setupGlobal();
  load(false);

  /* 本地预览时每 1.2 秒检查一次 JSON，保存即自动刷新；
     线上（GitHub Pages 等）内容随发布更新，不再轮询，避免无谓请求 */
  if (isLocalPreview()) {
    setInterval(function () { load(true); }, 1200);
  }
})();
