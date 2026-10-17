# BrainFunction

**脑图、范式故事与论文。** 以交互脑图连接认知范式、通俗故事和研究来源，供教学与理解使用。

维护者：[lizhenglei0906-design](https://github.com/lizhenglei0906-design) · 版本 v0.1.0。

这是准备首发的独立核心源码。目标仓库为 `lizhenglei0906-design/brainfunction-vision`，目标项目站为 https://lizhenglei0906-design.github.io/brainfunction-vision/ 。目标地址在实际创建、推送、启用 Pages 和部署成功前不代表线上服务已经存在。

## 可以查看什么

- 200 个 Schaefer 功能分区、7 个网络、小脑及教学示意脑干。
- 57 个范式故事及 57 张配图，260 个区域/结构示意节点。
- 72 个论文报告点的教学近似位置，保留原文坐标、转换方法、出处和不确定性；它们与示意节点身份分开。
- 214 个论文入口：9 篇许可明确的纯文字阅读版随包提供，其余205篇连接原始来源。

这是教学展示。分区体积表面不是精细皮层重建，平滑形态不能用于跨结构距离测量。论文点是明确标注的近似对照，既有精确定位状态保持未建立；没有个体定位或逐点误差上限承诺。零皮层标签点保留实际位置，不吸附到相邻分区。故事提供理解线索，不能单凭某一区域活动推断因果机制或诊断个人。

## 本地运行

使用 Node.js 24 和随附 npm 锁文件；依赖版本由 `package-lock.json` 固定。

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:4197/brainfunction-vision/ 。`?view=teaching-points` 查看近似论文点；证据页面位于 `/brainfunction-vision/docs/`。浏览入口采用查询参数，刷新这些入口不依赖服务端重写。

```sh
npm run validate
npm run validate:spatial
npm run validate:coordinates
npm run validate:teaching
npm run build
npm run validate:pages
npm run preview
```

默认 Vite base 为 `/brainfunction-vision/`；更换仓库名或使用根域名时相应修改 `vite.config.ts` 并重跑 Pages 检查。开发/预览服务器只用于本地查看。构建输出在 `dist/`，不将 `node_modules/`、缓存或本地研发资料提交到公开仓库。

## 许可与引用

原创代码采用 [MIT](LICENSE)，Copyright (c) 2026 lizhenglei0906-design。项目有权授权的原创故事、配图与教学说明采用 [CC BY 4.0](CONTENT_LICENSE.md)。第三方素材保留原许可，科学事实与坐标不被冒称项目排他版权。

- [逐文件授权范围](docs/license-map.json)、[第三方许可与来源](THIRD_PARTY_NOTICES.md)。
- [模型固定版本和哈希](docs/model-provenance.json)、[九篇全文逐篇许可](docs/paper-redistribution-records.json)。
- [项目引用](CITATION.cff)。研究使用另请引用实际采用的原论文、Schaefer2018、Yeo2011及小脑来源。

## 首次发布

[首发说明](RELEASE_NOTES.md)和[首次发布步骤](docs/FIRST_RELEASE.md)给出具体动作。`.github/workflows/pages.yml`在 Linux runner 依锁文件安装、验证和构建，再发布 Pages artifact。工作流已配置，尚未在远端运行；创建仓库、推送及启用 Pages 等待本地最终材料确认。无需付费服务或自定义域名。

本目录仅核心阅读与教学路径。内部论文库、原MRI/图谱输入、通信记录、工作日志、研发历史、训练游戏、家长入口和治理工具不在首发范围。
