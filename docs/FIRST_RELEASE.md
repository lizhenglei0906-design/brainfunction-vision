# 首次公开动作待执行

本目录准备公开到 `lizhenglei0906-design/brainfunction-vision`，分支 `main`，版本 `v0.1.0`。当前仅本地准备，以下步骤没有执行。最终确认必须针对同一源码/网页清单与独立验收结果；一旦上传即成为公开材料。

1. 重新核对连接账号是 lizhenglei0906-design，目标仓库名仍可用；仅从本目录源码白名单建立独立干净历史，不添加原研发仓库 `.git`、outputs、备份或内部材料。
2. 创建独立公开仓库 `brainfunction-vision`，默认分支 main；导入本地已审源码。不要把本地研发目录设为推送源。
3. 仓库 Settings → Pages → Build and deployment 选择 GitHub Actions。工作流只用锁文件依赖和标准 Linux runner，不需本地字体/模型绝对路径。
4. 推送 main 会触发 pages.yml；核对远端验证、构建、artifact、Pages部署实际成功，再测试项目站、教学点深链接、故事、全文、许可页及证据页。准备本地配置不等于 Linux 远端运行成功。
5. 从同一审核提交创建 `v0.1.0` 标签与首发说明。若建立GitHub Release，上传的源码/网页归档必须与当次冻结清单逐项一致。

目标网址：https://lizhenglei0906-design.github.io/brainfunction-vision/ 。回退时用上一个已审提交/标签重建部署；第一次尚无线上的旧版本，不虚构可回退状态。公开后删除分支或标签不能保证消除已公开副本，应在首次上传前检查白名单。

参考：[Vite Pages base与工作流](https://vite.dev/guide/static-deploy.html#github-pages)、[GitHub自定义Pages工作流](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。当前配置仅在本地落文件，没有调用远端创建、推送或部署。
