# Investigation Assistant

研判助手全量前端交互原型。项目采用原生 HTML、CSS 和 JavaScript ES Modules，可直接作为静态网站部署到 Cloudflare Workers Static Assets。

> 所有演示数据均为合成数据。请勿录入真实案件、身份信息、凭据或其他敏感内容。

## 本地运行

需要 Node.js 18 或更高版本：

```sh
cd prototype
./start.sh
```

打开 <http://127.0.0.1:4186>。

详细的页面、交互和测试说明见 [`prototype/README.md`](prototype/README.md)。

## 测试

启动本地服务后执行：

```sh
cd prototype
npm test
npm run test:regression
npm run test:smoke
npm run test:case-workflow
```

## Cloudflare 部署

项目使用根目录的 `wrangler.jsonc`，静态资源目录为 `prototype/`：

```sh
npx wrangler@latest deploy
```

`prototype/.assetsignore` 会排除本地服务器、测试和开发说明；`prototype/_headers` 定义生产环境安全响应头。

## 仓库边界

此仓库为公开仓库，仅包含运行、测试和部署所需文件。内部 PRD、技术文档、Figma 审计记录、截图、请求响应和本地生成物不会提交。
