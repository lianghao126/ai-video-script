# 爆款视频脚本AI · 开发说明

更新日期：2026-10-17。依据：当前源码、README.md、实际检查结果及 Git 版本 `9564c9f`。

## 1. 项目名称及用途

项目名称：**爆款视频脚本AI**。

帮助内容创作者把目标视频需求整理成中文分镜脚本。用户可选择对标视频在本地预览，手动描述参考特点，再填写自己的主题、素材和文案，生成按时间排列的画面、旁白、字幕与剪辑说明，支持编辑、复制及导出 Excel。

当前是本地规则演示版本。名称中的“AI”不代表已接入模型；网站不会自动分析视频，不剪辑、渲染或导出视频。当前主要输出是分镜脚本，不是独立的标题列表。

## 2. 当前技术栈和配置

| 项目 | 实际使用情况 |
| --- | --- |
| 页面 | 原生 HTML5，单页，通过锚点切换到页面各区域 |
| 样式 | 原生 CSS，Grid / Flex 响应式布局、深色玻璃材质、背景模糊 |
| 交互与生成 | 原生 JavaScript，浏览器直接执行，无框架 |
| 视频预览 | 浏览器 File、Object URL 和 HTML video |
| 复制与下载 | Clipboard API、兼容复制、Blob 和 Object URL |
| Office 导出 | `xlsx-export.js` / `docx-export.js` 本地生成 XLSX / DOCX，共用 `office-zip.js`，无第三方运行依赖 |
| 本地 HTTP 服务 | 可选 Python 标准库 `http.server`，只提供静态文件 |
| 开发检查 | Node.js 执行语法检查和临时规则断言；Git 检查差异 |
| 版本管理 | Git，当前分支 `master` |

没有 `package.json`、npm scripts、TypeScript、Lint 配置、打包工具、测试框架或 CI 配置。没有后端服务、数据库、登录、支付、API Key 和线上视频上传。Node.js 仅用于开发检查，不是网页运行依赖；Python 仅在使用本地 HTTP 预览时需要。

## 3. 重要项目目录和文件

当前项目根目录为 `D:\xiaohonshu`。源码直接放在根目录，没有 `src`、`public`、`dist` 或 `tests` 目录。

```text
D:\xiaohonshu\
├── index.html        页面结构、导航、Hero、视频区、表单、结果表格、使用说明
├── style.css         全站样式、玻璃材质、菜单与光效、桌面和手机布局
├── app.js            ScriptEngine 规则引擎、表单校验、预览、结果编辑、复制和下载交互
├── xlsx-export.js    XLSX 文件生成、表格排版、长文本续行
├── docx-export.js    DOCX 逐镜排版、A4 页面、重复表头与页码
├── office-zip.js     两种 Office 导出共用的 ZIP 封装
├── select-ui.js      自定义下拉菜单，保留原生 select 作为数据源
├── button-glow.js    鼠标接近按钮时的光效
├── history.html      历史记录页面
├── history-store.js  本机最近 20 份脚本的保存与读取
├── history.js        历史列表、分镜展开及复制
├── README.md         使用、启动和历史验证说明
├── DEVELOPMENT.md    本开发说明
└── .git\             Git 历史和配置，由 Git 管理，不手工修改
```

脚本由 `index.html` 使用 `defer` 按顺序加载：`office-zip.js` → `xlsx-export.js` → `docx-export.js` → `history-store.js` → `app.js` → `select-ui.js` → `button-glow.js`。历史页加载 `history-store.js`、`history.js` 和 `button-glow.js`。保留依赖顺序；样式和脚本引用中的查询参数用于区分资源版本。

生成规则集中在 `app.js` 的 `ScriptEngine`：`validate` 校验输入，`timing` 分配时间，`generate` 组织分镜，`serialize` 输出完整文字。浏览器交互在同一文件后半部分。该引擎也通过 `module.exports` 暴露，可由 Node.js 直接检查。

## 4. Windows 本地启动

无需 `npm install`，也没有 `npm run dev` 或 `npm run build`。

### 推荐：本地 HTTP 预览

在 PowerShell 中执行。当前电脑已确认存在下列随附 Python；命令通过环境变量定位，不写入个人用户名：

```powershell
cd D:\xiaohonshu
$projectPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $projectPython -m http.server 8765 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8765/`。在运行服务的终端按 `Ctrl+C` 停止，以后重新执行相同命令即可启动。

其他电脑若已安装可用的 Python，也可以在项目目录执行：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

当前电脑的 `python` 命令指向 WindowsApps 别名，其能否直接运行 Python待确认；本机优先使用上面的随附解释器。随附解释器路径不保证在其他电脑存在。若 8765 被占用，先确认是否已有本项目服务；确需换端口时，将命令中的 8765 改为 8766，并使用对应地址。

该服务不接收上传、不分析视频、不保存表单。编辑源码后刷新浏览器查看。

### 可选：直接打开文件

```powershell
cd D:\xiaohonshu
Start-Process .\index.html
```

此方式通过 `file:` 地址打开，不使用端口。工具未实测文件协议下的完整交互，浏览器的复制权限行为也可能不同；以 HTTP 模式验收为准。

## 5. 已经完成的功能

- 首页导航、Hero、工作台和三步使用说明；“首页”“开始生成”“使用说明”锚点导航。
- 可选本地 MP4 预览，最大 200 MB；显示名称、大小和载入后的时长；支持替换、移除、格式/大小/播放错误提示，清理本地预览资源。视频不上传。
- 主题必填、最长 120 字符；五种类型（口播、产品展示、探店、知识分享、生活记录）；三种平台（小红书、抖音、视频号）；5—600 整数秒，默认 30 秒；9:16、16:9、1:1 三种比例。
- 自有素材、旁白或口播文案、手动参考特点、其他要求；表单按基本需求、素材与文案、参考与补充分组。
- 一键填入示例；清空五个文字字段，保留类型、平台、比例、时长及已有生成结果。
- 五类内容各两套规则结构，按开头、主体、结尾拆成连续镜头，时长合计等于目标时长；支持部分明确分段要求和冲突提示。
- 根据素材描述估算使用片段，缺失或不足部分标待补充；根据已有旁白分配文案，无文案不编造对白。规则可识别部分禁止音乐、人声、字幕等要求。
- 五列表格展示镜头/时间、画面、旁白、字幕、剪辑说明；后四列可编辑，时间只读；可展开查看创作依据、配乐与待补充信息。
- 复制当前编辑后的完整脚本，显示反馈；复制受限时尝试兼容方式，仍失败则提供手动复制。
- 重新生成保留需求，切换两套结构；覆盖当前表格编辑，不承诺无限随机版本。
- 导出当前结果为 XLSX：九列明细、列宽、按内容估算行高、自动换行、表头与隔行样式、筛选、冻结前五行和镜头列、横向打印；超长文本拆续行，时长不重复累计。
- “导出”带动画展开 Excel / Word 两个选项，支持键盘切换、Escape 收起、点击外部收起。DOCX 使用 A4 纵向、逐镜两列表格、重复镜头表头、允许内容跨页，包含完整创作说明及页码；两种导出都使用当前结果编辑。
- 黑色背景和深蓝视觉、玻璃卡片、滚动导航背景模糊、自定义下拉菜单展开动画、鼠标接近按钮光效；支持键盘操作及减少动画/透明效果的系统偏好。
- 桌面双栏、手机单栏；窄屏结果表格内部滚动。首页视觉优化已完成并提交。
- 示例按钮下方提供历史记录入口；生成和结果编辑后使用 localStorage 保存本机最近 20 份脚本，历史页支持展开分镜和复制，不保存视频。存储受限或空间不足会提示失败。

## 6. 当前正在开发的功能

- 暂无已经确认但尚未完成的新功能开发任务。
- 首页视觉优化已验收并提交为 `9564c9f`。其后新增了本机历史记录及紧凑操作区；该批变更尚未提交。
- 后续功能的范围、优先级和排期：**待确认**。不能将下面的建议任务描述成已经在开发。

## 7. 主要技术约束

- 保持纯前端、少依赖；普通视觉调整不引入框架或组件库。
- 演示结果来自表单和规则，不得声称已经自动识别上传视频的镜头、字幕、音乐或内容。
- 默认使用用户自有素材；未知信息使用条件式建议或标记待补充，不编造用户已有的素材、事实或录音。
- 用户要求原文保留；复杂自然语言不能保证被规则完整理解，执行前须人工核对。修改生成规则须明确授权并验证时间连续、总时长正确。
- 用户输入通过普通文本和表单值处理，避免用 `innerHTML` 执行输入；XLSX 文本使用字符串单元格，不作为公式执行。
- 替换、移除、播放失败和离开页面时释放预览资源；下载资源在下载触发后释放。保留页面往返缓存时采用代码中的特殊处理。
- 不加入真实密码、令牌、API Key 或个人测试视频到源码、文档和 Git。
- 视觉调整需保留校验、菜单、复制、导出、无障碍标签和现有全部功能，同时检查 1440px 与 375px。
- 表单选择由原生 select 保存；填入示例后的 change 事件用于同步自定义菜单，不是修改生成规则。

## 8. 已知问题、限制和待确认事项

- 模板只能简单解析描述，不能验证实际素材长度、事实或口播速度；某些主题与素材不匹配时仍需人工修改。
- 仅有两套结构。重新生成会覆盖工作台手动编辑；刷新不恢复工作台表单和视频，已保存的脚本可在历史页查看，没有输入草稿存储。历史只属于当前浏览器和访问地址；清除网站数据会丢失记录。
- 修改左侧需求不会自动更新右侧已生成结果或导出元信息，需要重新生成。
- MP4 容器不保证编码可播放；浏览器不支持或文件损坏时会报错。
- 复制依赖浏览器权限与环境；玻璃模糊依赖浏览器 CSS 支持，代码提供部分降级样式。
- XLSX 行高按字符估算，不能保证每种字体及所有 Excel/WPS 版本显示完全一致。桌面 Excel/WPS 打开效果、实际打印效果仍待确认。
- DOCX 已通过实际下载、包结构解析和长文本完整性检查；本机没有 LibreOffice，文档技能渲染器无法运行。Word/WPS 中的字体、分页及打印视觉效果尚待确认，不得报告为已完成渲染验收。
- 真机触控、软键盘及不同浏览器的完整兼容性待确认；375px 模拟视口不等于真机验证。
- 未配置可持续执行的测试脚本、Lint、类型检查或 CI；已有大量临时断言的检查记录，但不能将其说成仓库已有测试体系。
- 最近一轮已执行检查未发现失败项，不代表所有浏览器、编码和输入组合均已验证。README 中部分验证属于历史记录，应保留其验证范围和时间语境。

## 9. 下一步开发任务（建议，待确认）

1. 在真实手机和常用 Edge/Chrome 上完成手动回归，并在 Excel/WPS 检查导出布局。
2. 确认是否将已执行的临时规则断言保存为可重复运行的测试脚本；需要时再决定是否配置轻量 Lint/CI，不为检查引入大型 UI 依赖。
3. 根据真实使用反馈确认下一轮功能需求，例如是否需要草稿保存；这些功能当前未实现，也未排期。
4. 若决定接入真实视频分析模型，另行确认模型/服务商、后端代理与凭据保护、视频上传同意及保存/删除策略、大小/格式限制、费用、错误处理和结构化分析结果校验。当前均未实现，方案待确认；不要直接将密钥放在前端。

## 10. 必须执行的检查命令和验收步骤

以下命令在 PowerShell、项目根目录执行。Node.js 与 Git 需可用；当前电脑已确认可用。不存在的 npm 脚本不要执行，也不要报告为通过。

### 每次提交前：语法与差异

```powershell
cd D:\xiaohonshu
node --check .\app.js
node --check .\xlsx-export.js
node --check .\select-ui.js
node --check .\button-glow.js
node --check .\history-store.js
node --check .\history.js
node --check .\office-zip.js
node --check .\docx-export.js
git diff --check
git diff --cached --check
git status --short
```

逐条核对退出码；任何错误都要先修复。`node --check` 只检查语法，不等于 Lint、类型检查、构建或浏览器功能测试。`git diff --check` 不包含未跟踪文件的检查。

### 修改生成规则时：分镜时长回归

下列命令直接检查现有引擎，不需要安装依赖，不创建测试文件；它不是已经配置的测试框架。覆盖五种类型、5—600 秒、两套版本，共 5,960 组，核对连续时间和必需字段。

```powershell
@'
const assert = require('node:assert/strict');
const engine = require('./app.js');
const types = ['口播', '产品展示', '探店', '知识分享', '生活记录'];
const base = {
  topic: '回归检查', platform: '小红书', aspect: '9:16',
  materials: '', narration: '', references: '', additional: ''
};
let count = 0;
for (const contentType of types) {
  for (let duration = 5; duration <= 600; duration++) {
    for (const version of [0, 1]) {
      const result = engine.generate({...base, contentType, duration: String(duration)}, version);
      assert.equal(result.plan.opening + result.plan.body + result.plan.ending, duration);
      let cursor = 0;
      for (const shot of result.shots) {
        assert.equal(shot.start, cursor);
        assert.ok(shot.duration > 0);
        assert.equal(shot.end - shot.start, shot.duration);
        for (const key of ['visual', 'voice', 'subtitle', 'editing']) {
          assert.ok(typeof shot[key] === 'string' && shot[key].length > 0);
        }
        cursor = shot.end;
      }
      assert.equal(cursor, duration);
      count++;
    }
  }
}
console.log('PASS: ' + count + ' cases');
'@ | node
```

### 页面改动时：启动与浏览器回归

先按第 4 节启动服务，再在另一个终端检查：

```powershell
(Invoke-WebRequest -Uri 'http://127.0.0.1:8765/' -Method Head -UseBasicParsing).StatusCode
```

预期为 `200`。HTTP 成功不等于功能通过，还必须在浏览器检查：

1. 首页及三个导航锚点正常；控制台无相关错误，资源加载成功。
2. 空主题、无效时长有明确提示；可正常输入、选择类型/平台/比例。
3. 填入示例 → 清空输入 → 选项保留 → 重新输入 → 生成成功。
4. 修改主题、类型和时长后重新生成，结果相应变化，分镜时间连续且总时长一致。
5. 编辑单元格后复制并粘贴验证；重新生成保留需求并替换结果；复制失败时检查手动复制入口。
6. 下载 XLSX，核对编辑内容、时长合计、换行和冻结表头；导出相关修改需实际打开文件复核。
7. 视频相关修改需实际测试选择、播放、替换、移除及无效文件提示。
8. 检查 1440px 桌面与 375px 手机视口：无页面横向溢出，表格内部可滚动，最右列可编辑，按钮可点击；必要时补充真实手机验证。

### 当前检查配置与已执行范围

| 检查 | 配置状态 / 最近结果 |
| --- | --- |
| TypeScript | 未配置，未执行 |
| Lint | 未配置，未执行 |
| Build | 未配置，无构建流程 |
| 仓库自动化测试命令 | 未配置；没有 `npm test` 或测试脚本文件 |
| JavaScript 语法与 Git 差异 | 最近检查通过 |
| 临时规则断言 | 最近检查 5,960 组时长组合及 17 项额外断言通过；不等于已有测试体系 |
| HTTP 与浏览器交互 | 最近检查通过：首页和资源、校验、选择、清空、生成、编辑、复制、重新生成及 XLSX 下载 |
| 响应式与控制台 | 最近检查 1440px、375px 无明显布局问题，未发现控制台错误或警告 |
| 真机、其他浏览器、Excel/WPS 桌面与打印 | 未完成完整验证，待确认 |

记录后续验收时分别标明“通过、失败、未执行”，不能用历史结果代替修改后的新一轮检查。
