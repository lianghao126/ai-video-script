# 项目开发约定

## 项目与技术栈

- 项目：爆款视频脚本AI。通过表单和本地规则生成中文分镜脚本，支持编辑、复制、导出 XLSX；不自动分析或剪辑视频。
- 使用原生 HTML、CSS、JavaScript，无框架、第三方运行依赖或后端。源码直接位于根目录。
- `index.html` 管产品介绍首页，`workspace.html` 管独立工作台；首页不加载生成业务脚本。`style.css` 管组件视觉，`app-shell.css` 管页面骨架；`app.js` 包含 ScriptEngine 和业务交互；`xlsx-export.js` 管导出；`select-ui.js` 管菜单；`button-glow.js` 管光效。
- `history.html` / `history.js` 管历史页面，`history-store.js` 用 localStorage 保存最近 20 份脚本；不保存视频，不跨浏览器同步。
- `office-zip.js` 为 `xlsx-export.js` / `docx-export.js` 提供本地封装；导出入口包含 Excel 表格与 Word 文档。
- 没有 `package.json`、TypeScript、Lint、构建流程、测试框架或 CI。不要虚构或直接运行不存在的 npm 脚本。

## 开发方式与修改边界

- 先查看 Git 状态和任务涉及的代码，保留已有未提交内容；只修改本次范围，不顺便重构或增加功能。
- 小修改只阅读相关代码。需要启动说明或规则细节时，再查 `README.md` / `DEVELOPMENT.md` 对应章节，不要求每次通读全部文档。
- 保持当前技术栈、简体中文界面和少依赖实现；不为普通样式调整安装框架或组件库。
- 视觉任务保持生成规则、表单字段与选项、校验、视频预览、编辑、复制、重新生成和导出不变。保留被 JavaScript 使用的 ID、脚本加载顺序及可访问性标签。
- 修改生成规则须在任务范围内；分镜时间必须连续，总和等于目标时长，缺少的素材或录音标待补充。不得编造视频分析结论、用户素材或事实。
- 用户输入按普通文本处理，不拼入可执行 HTML；XLSX 用户文本不得作为公式执行。
- 视频只在本地预览。保留替换、移除、错误及离开页面时的 Object URL 释放逻辑；重新生成会覆盖结果编辑，不能擅自改变该行为。
- 保持自定义菜单与原生 select 同步，保留键盘操作、手机可用性和减少动画的系统偏好支持。

## 本地运行与实际检查

在项目根目录使用 PowerShell。若已有可用 Python：

```powershell
python -m http.server 8765 --bind 127.0.0.1
```

访问 `http://127.0.0.1:8765/`，`Ctrl+C` 停止。Python 命令不可用时，仅查阅 `DEVELOPMENT.md` 的本地启动章节，其中有本机随附解释器方式。无需安装 npm 依赖或执行构建。

修改 JavaScript 后，对相关文件执行语法检查；下列是全部现有 JS 的检查命令（需要 Node.js）：

```powershell
node --check .\app.js
node --check .\xlsx-export.js
node --check .\select-ui.js
node --check .\button-glow.js
node --check .\history-store.js
node --check .\history.js
node --check .\office-zip.js
node --check .\docx-export.js
```

交付前检查差异；纯文档修改只需检查文档和差异，不要求重跑无关业务测试：

```powershell
git diff --check
git diff --cached --check
git status --short
```

- 无已配置的 Build、Lint、TypeScript 或自动化测试命令，报告时标为“未配置”，不能冒称通过。语法检查不等于功能测试。
- 修改生成规则时，执行 `DEVELOPMENT.md` 检查章节中的 Node.js 临时回归命令，覆盖五类内容、5—600 秒、两套结构，共 5,960 组；它不是仓库已有的测试框架。
- 页面或交互修改后，用浏览器验证受影响流程；布局修改检查 1440px 和 375px，页面无横向溢出，表格内部可滚动。导出修改需实际下载并核对文件；视频修改需实际预览、替换、移除。
- 如使用 HTTP 预览，可用 `(Invoke-WebRequest -Uri 'http://127.0.0.1:8765/' -Method Head -UseBasicParsing).StatusCode` 检查服务；返回 200 不代表交互已通过。
- 区分实际执行、未执行和失败的检查；真机、其他浏览器及桌面 Excel/WPS 未验证时如实说明。只在用户要求时提交或推送 Git。

## 敏感信息与数据库

- 不将真实密码、API Key、令牌、私钥、个人视频或私密测试数据写入代码、文档、日志或提交；前端不能安全保存服务端密钥。
- 当前没有数据库、迁移工具或数据库操作命令，不执行或编造 SQL、迁移、清库、重置步骤。若后续任务引入数据库，先明确目标环境和任务范围；破坏性操作前确认授权并准备备份。
