# SLLYING

个人技术博客。首页使用一屏二次元落地页：10 张新绘的东方与 Neuro / Evil 角色同人插画淡入淡出轮播，包含月夜、秋日书屋、星空、雨城、钟楼、工作台、海边、Q 版花园、街机房和冬日茶屋，配合动态光轨、星粒、空间倾斜与鼠标视差。封面默认每 6.5 秒切换，支持按钮、键盘和手机左右滑动；页面隐藏、离开视口、悬停或聚焦时暂停，减少动画模式下仅手动切换。23 篇文章的分享封面也使用同一套新图。页面和图片均保存在本地，阅读不依赖第三方 CDN。

## 阅读与预览

直接用浏览器打开项目根目录的 `index.html` 即可浏览，包括文章、分类和归档。禁用 JavaScript 时仍可阅读全部内容。

需要 HTTP 预览时，使用 Node.js 22 或更新版本运行：

```sh
npm run dev
```

默认地址为 `http://127.0.0.1:4173/`。端口占用时会自动选择下一个端口，实际地址显示在终端中。服务仅绑定本机，并限制公开目录。

## 修改和构建

- `js/content.js`：公开文章数据，正文使用 HTML；每篇文章有独立 ID、分类、标签、插画、来源说明和日期。
- `scripts/templates.mjs`：首页、文章、归档、分类、标签和关于页面的统一模板。
- `css/main.css`：响应式样式和明暗主题。
- `js/main.js`：渐进增强，包括落地页视差、滚动导航、全文搜索、分类过滤、每页 8 篇的分页、可折叠目录、阅读进度和复制操作。系统设置减少动画时关闭视差与装饰动效，落地页离开视口后暂停动效。
- `js/landing.js`：首页光轨与星粒绘制，限制为每秒 30 帧并控制渲染分辨率。页面隐藏或场景离开视口时暂停；系统设置减少动画时绘制静态场景。
- `images/SOURCES.md`：新插画的原作链接及来源说明。
- `images/generated/`：10 张新绘场景的 PNG 原图、网页与手机 WebP；`manifest.json` 保存角色、画风、生成日期与原图哈希，`overview.jpg` 为图库总览。
- `images/neuro-chibi-avatar-original.png`：按用户参考风格绘制的 Neuro Q 版头像原图；`images/neuro-chibi-avatar.webp` 用于导航和关于页，`images/neuro-chibi-favicon.png` 用于浏览器图标。

更新内容或模板后运行：

```sh
npm run build
npm test
```

构建使用 Node.js 标准库，不需要安装依赖。HTML 直接生成到项目根目录及 `posts/`、`archives/`、`categories/`、`tags/`、`about/`，适配原有静态站点部署结构。不要手改生成的 HTML，下一次构建会覆盖它。

旧文章路径和旧版 `index.html?post=...` 均兼容；旧月归档转向对应年份。文章 URL 为 `posts/<id>/index.html`。搜索索引、RSS 和 Sitemap 从同一份文章数据生成。

## 内容来源

23 篇文章保留原来的 18 个 ID，并新增 Nginx 子路径、同步游标、数据库结构指纹、调度抖动和 Excel 枚举导出等复盘。其中 9 篇基于已核实的真实 Codex / Claude Code 执行或审查记录；其余根据任务摘要、历史主题或基础知识整理，正文分别说明事实与示例边界。

仅替换账号、令牌、内部域名、个人绝对路径、私有项目标识等关键信息，保留具体技术问题与推理。原始会话没有写入仓库。阅读时长按正文长度计算。

## 发布

发布前通过 `SITE_URL` 配置实际站点地址，RSS、Sitemap 和页面元数据会使用此地址；也支持带子路径的地址。

```powershell
$env:SITE_URL = 'https://your-domain.example/blog/'
npm run build
```

未配置时使用明确的本地预览地址，并在构建输出中提示。不要将本地预览地址用于线上订阅。

部署生成的 HTML、CSS、JavaScript、图片、`feed.xml`、`sitemap.xml`、`robots.txt` 和 `.nojekyll`。开发脚本、测试、`.git`、`.test-output`、预览日志和构建清单无需公开。

站点图片为 ImageGen 新绘的角色同人作品和派生版本，旧第三方图片已从项目目录移走并备份到项目外。重新绘图不等同于取得角色授权，不能据此宣称完全没有版权风险。图标使用随项目保存的 Lucide，许可证见 `js/lib/lucide.LICENSE`。
