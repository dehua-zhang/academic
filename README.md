# 个人学术主页 · 使用说明

这是一个**零依赖的静态个人主页**：不用安装框架、不用构建、不用数据库。
所有文字和设置都写在 `content.json` 一个文件里，浏览器打开页面时由 `assets/app.js` 读取并渲染。

> 日常只需要记住一件事：**改 `content.json` → 保存 → 页面自动更新**。

---

## 1. 快速开始

### 准备

- 安装 Python 3，安装时勾选 **Add python.exe to PATH**（Windows）。
- 用任意文本编辑器打开 `content.json`，记事本、VS Code 都可以。

### 启动预览（Windows）

1. 双击项目里的 `preview.bat`。
2. 会弹出一个命令行窗口，服务就绪后自动打开默认浏览器，地址是 `http://127.0.0.1:8000/`。
3. **保持这个窗口开着**，它就是本地服务器；按 `Ctrl+C` 或直接关闭窗口即停止。
4. 修改 `content.json` 并保存，约 1 秒后页面自动刷新，并弹出「内容已更新」提示。
5. 8000 端口被占用时，在命令行里运行 `preview.bat 8080` 换一个端口。

macOS / Linux 没有 `.bat`，或不想用脚本时，在项目目录下手动运行：

```powershell
python -m http.server 8000
```

然后打开 `http://localhost:8000/`。

> **不要直接双击 `index.html`。** 浏览器禁止 `file://` 页面读取 `content.json`，
> 直接打开只会看到「无法读取 content.json」的提示。必须走本地服务器；
> 发布到网上后是 `https://` 地址，就没有这个限制了。

---

## 2. 文件清单

| 文件 | 作用 | 要上传吗 |
| --- | --- | --- |
| `index.html` | 页面骨架，引用样式与脚本 | 是 |
| `content.json` | **全部文字与设置**，日常只改这一个 | 是 |
| `assets/style.css` | 样式、14 套配色、深色模式、响应式 | 是（整个 `assets/` 目录） |
| `assets/app.js` | 读取 JSON、渲染正文、导航、筛选、主题等 | 是 |
| `.nojekyll` | 让 GitHub Pages 跳过 Jekyll（隐藏文件，别漏） | 是 |
| `preview.bat` | 本地预览脚本，只在自己电脑上用 | 否 |
| `README.md` | 本说明 | 否 |

`README.md` 和 `preview.bat` 上传了也不影响页面，但没必要。
自己添加的照片、PDF、代表性研究配图等文件也要一起上传，并在 `content.json` 里用相对路径引用。

---

## 3. `content.json` 长什么样

文件最前面有一段 `_readme`，那是写在 JSON 里的速查说明，页面不会显示，可以一直留着。
后面各部分按页面从上到下排列：

| 字段 | 管什么 | 常用子字段 |
| --- | --- | --- |
| `site` | 站点信息 | `title` 网页标题、`description` 简介、`theme` 配色、`lang`、`brandMark` 左上角字母、`footerLeft` / `footerRight` 页脚 |
| `profile` | 页面顶部的个人区 | `name`、`nameEn`、`photo`、`paragraphs` 简介正文、`quote` 引言、`keywords` / `keywordsLabel`、`stats` / `showStats`、`heroInfo` 名字右侧信息栏 |
| `sections` | 各板块的标题、导航文字与开关 | `title`、`sub`、`nav`、`hide`、`collapseAfter` |
| `research` / `experience` / `news` / `highlights` / `publications` / `join` / `contact` | 各板块的内容 | 见下表 |

各板块内容的写法：

| 板块 | 结构 | 一条记录通常包含 |
| --- | --- | --- |
| 研究方向 `research` | `{ "items": [...] }` | `title`、`description`、`keywords` |
| 教育与工作经历 `experience` | 数组 | `period`、`title`、`org`、`current`、`note` |
| 研究动态 `news` | 数组 | `date`、`iso`、`text`、`tags` |
| 代表性研究展示 `highlights` | 数组 | `image`、`alt`、`title`、`text`、`tags`、`links` |
| 发表论文 `publications` | `{ "filters", "note", "groups" }` | `groups[].year` 与 `items[]`；论文含 `title`、`authors`、`venue`、`detail`、`type`、`tags`、`doi`、`featured`、`links` |
| 招生与合作 `join` | `{ "items": [...] }` | `title`、`paragraphs`、`bullets` |
| 联系方式 `contact` | 对象 | `email`、`linksTitle`、`lines`、`links` |

几条通用规则：

- 引号里的中文直接改；**每项之间用英文逗号分隔，最后一项后面不要加逗号**。
- 数组 `[ ]` 里的每条内容用 `{ }` 包住；想加一条，复制一整段 `{ }` 再改内容。
- 文字里可以用 `**加粗**`，也支持 `<a> <em> <b> <br>` 等少量标签；渲染前会做标签白名单与链接协议检查。
- `tags` 中以 `!` 开头的标签会显示为金色，例如 `"!Best Paper"`。
- 论文的 `type` 只写 `conference`（会议）、`journal`（期刊）、`preprint`（预印本），筛选按钮会自动按它统计数量。
- 不想要的内容，可以留空 `""`、写成 `[]`，或把那一项整段删掉（注意别删掉上一行末尾的逗号）；留空不会在页面上留下空标题或空框。

---

## 4. 常见修改，一步一步来

### 改姓名和简介

在 `profile` 里改 `name`、`nameEn`、`paragraphs`（每一段是数组里的一项）和 `quote`。
想换小头像：把图片放进项目目录，`photo` 填相对路径（如 `"photo.jpg"`）；
留空 `""` 会显示姓名首字占位图，写 `"none"` 则完全不显示头像。

### 改名字右侧的信息栏

`profile.heroInfo` 分两组：

- `items`：一排「标签 + 内容」，如职务、单位、实验室、邮箱；内容支持简单 HTML（例如 `mailto:` 邮箱链接）。
- `links`：ResearchGate、ORCID、个人博客等，会显示成小圆角按钮。

把其中一组留空 `[]`，就只隐藏那一组。窄屏时信息栏会自动换到名字下方。

### 加一条研究动态

在 `news` 数组里复制一段 `{ }`，改 `date`、`iso`、`text`、`tags`。
默认只显示前 5 条，多出来的会折叠，点「展开」才显示。

### 加一篇论文

在对应年份的 `publications.groups[].items` 里复制一段，填 `title`、`authors`、
`venue`、`detail`、`type`、`tags`、`links`。另外可加：

- `"doi": "10.xxxx/yyyy"` → 期刊信息下方显示可点击的 DOI（也可以直接填完整的 `https://doi.org/...`）。
- `"featured": true` → 标记为「★ 精选」。

### 加一条代表性研究

在 `highlights` 数组里加一段：`image` 填图片相对路径、`alt` 写图片说明、
`title` / `text` 写说明文字，另可加 `tags` 和 `links`。
图片文件还不存在时，会显示带序号的渐变占位块，不会出现破图。

### 改板块标题和导航文字

在 `sections` 里改对应板块：

- `title` / `sub`：页面上的大标题和英文小标题；
- `nav`：顶部导航显示的短文字（不写就默认用 `title`）。

改完保存，导航和板块编号会自动重排。

### 隐藏某个板块

- 想**保留内容、暂时不显示**：给 `sections` 里那一项加 `"hide": true`（`research`、`join` 已预置了这个字段，当前示例里两者都是 `true`）。
- 想**彻底不要**：把对应内容留空 `""` 或写成 `[]`，整块会自动消失。
- 隐藏后顶部导航里也不再出现，板块编号自动连续重排。

### 改网页标题、描述和页脚

都在 `site` 里：`title`、`description`、`footerLeft`、`footerRight`、`brandMark`。

---

## 5. 开关速查表

| 想做的事 | 改哪里 | 怎么写 |
| --- | --- | --- |
| 隐藏顶部统计数字，但保留数据 | `profile.showStats` | `false`；改回 `true` 或删掉该行即恢复 |
| 隐藏某个板块 | `sections.板块.hide` | `true` |
| 调整研究动态折叠条数 | `sections.news.collapseAfter` | 填数字；填很大的数＝全部显示 |
| 改关键词前的小标题 | `profile.keywordsLabel` | 任意文字；留空 `""` 则不显示 |
| 不显示头像 | `profile.photo` | `"none"` |
| 附件点击直接下载 | 对应 `links` 项 | 加 `"download": true`，或写自定义文件名 |
| 显示金色标签 | `tags` 里的项 | 文字前加 `!` |
| 临时预览别的配色 | 网址 | 末尾加 `?theme=teal` |

---

## 6. 外观

- **14 套配色**：`green`（代码默认）`lightblue` `navy` `lightgreen` `deepgreen` `red` `orange` `purple` `graphite`，
  以及 `burgundy`（勃艮第红）、`indigo`（靛蓝）、`teal`（青碧）、`sepia`（羊皮纸棕）、`ink`（水墨黑）。
  改 `site.theme` 即可（当前示例文件里设的是 `sepia`）；也可以在网址后加 `?theme=teal` 临时预览，不用改文件。
- **深色模式**：默认跟随系统，右上角按钮可手动切换，选择会被记住。
- **手机 / 平板**：布局自动变成单列，无需额外设置。

---

## 7. 图片、附件和链接

- 把图片、PDF 等文件放进项目目录（例如 `files/`、`images/`），在 `content.json` 里写**相对路径**，
  如 `"files/cv.pdf"`、`"images/highlight-01.jpg"`。这两个目录按需自己创建。
- 站内文件链接会自查：文件不存在时该链接自动隐藏，不会点出 404；文件放进去后重新加载就出现。
- 以 `http(s)://` 开头的外链会自动在新窗口打开，并带上安全属性；`mailto:` 可直接用于邮箱。
- 富文本只放行少量标签和安全的链接协议，不会把脚本写进页面。

---

## 8. 发布到网上

以 GitHub Pages 为例：

1. 新建公开仓库。命名为 `你的用户名.github.io` 时网址是 `https://你的用户名.github.io/`；
   用其它名字则网址会多一段 `/仓库名`。
2. 上传文件清单里标「是」的文件，`assets/` 作为**整个目录**上传，不要多套一层文件夹；
   别忘了隐藏文件 `.nojekyll`。
3. 仓库 Settings → Pages → Deploy from a branch → `main` / `/(root)` → Save。
4. 等一两分钟，打开 Pages 给出的网址即可。

也可以放到任何静态托管（Netlify、Vercel、自己的服务器）：把这些文件放到网站根目录即可，
不需要安装依赖，也不需要运行构建命令。网页标题、分享描述、规范链接等由 `app.js` 按当前网址自动生成。

线上不会每 1.2 秒轮询 JSON：内容随重新发布而更新，这样能正常利用静态托管的缓存。
仓库里已移除 `robots.txt` 与 `sitemap.xml`；GitHub Pages 默认允许抓取，单页站点通常不需要站点地图。

---

## 9. 常见问题

| 现象 | 原因与解决 |
| --- | --- |
| 直接双击 `index.html` 打开是空的 / 提示读取失败 | 浏览器禁止 `file://` 读 JSON，请用 `preview.bat` 或 `python -m http.server` |
| 改了 `content.json` 页面没变 | 确认是通过 `http://127.0.0.1:8000/` 打开的（只有本地预览会自动刷新）且文件已保存；线上需重新发布 |
| 页面顶部出现红条，说 JSON 有语法错误 | 多半是少了/多了逗号、引号没配对；提示会给出行列，改好保存后自动恢复，已渲染的内容不会被清掉 |
| 图片没显示，只有一个带序号的色块 | 图片路径写错或文件没上传；放对文件后自动显示 |
| 端口被占用 | 用 `preview.bat 8080`，或关掉占用 8000 端口的程序 |
| 某个板块不见了 | 检查 `sections` 里是不是设了 `"hide": true`，或内容被清空 |
| 禁用 JavaScript 时看不到正文 | 页面内容由 JS 渲染，需要开启 JS；普通浏览器默认都是开启的 |
| 分享到社交平台时预览卡片没有正文 | 不执行 JS 的抓取器只能看到通用标题；普通访客用浏览器访问不受影响 |

---

## 10. 上线前检查清单

目前仓库里仍是**模板示例内容**，发布前请逐项替换：

- [ ] `profile` 的姓名、简介正文、引言、关键词与统计数字
- [ ] `heroInfo` 里的职务、单位、实验室、邮箱和三个学术链接
- [ ] `site` 的网页标题、描述、页脚文字与年份
- [ ] 各段经历、研究动态、代表性研究、论文、招生与联系方式
- [ ] 示例 DOI、示例图片、示例外链（ResearchGate / ORCID / 个人博客）
- [ ] 照片、简历 PDF 等附件文件，并确认相对路径写法正确
- [ ] 统计数字与真实论文数量一致；各 `hide` 设置符合预期
- [ ] 用 `preview.bat` 在电脑宽度和手机宽度下各看一遍
