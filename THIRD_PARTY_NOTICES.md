# 第三方素材、归属与分发条件

当前候选的脑图使用作者发布的 Schaefer 功能分区标签体积生成可视化边界。模型许可与原创代码/故事的开放许可分别处理。

## 功能分区表面与名称

来源：ThomasYeoLab/CBIG 固定提交 `634f676630929a71297852d01dd92a287103e861`，Schaefer2018 `200Parcels_7Networks_order_FSLMNI152_1mm.nii.gz`。作者将脑分区纳入其 MIT 包发布；保留 [CBIG MIT 全文](LICENSES/CBIG.txt)。源文件 SHA256：`a47808f907f175f2e83f2c941bc68a766a8991b238e98457e9d27a8760ea21ec`。

本项目修改：以 2mm 采样生成标签体积等值表面，保留源体素标签；另提供局部平滑展示，共同变换至显示坐标。该模型不是标准 pial 皮层重建，没有测得沟深或标准膨胀形态。200 个官方编号、七网络及原有代表坐标保留，名称重新从这些字段生成。模型资产及哈希见 [来源记录](docs/model-provenance.json)。

作者数据与许可：
- https://github.com/ThomasYeoLab/CBIG/blob/634f676630929a71297852d01dd92a287103e861/README.md
- https://github.com/ThomasYeoLab/CBIG/blob/634f676630929a71297852d01dd92a287103e861/LICENSE.md
- https://github.com/ThomasYeoLab/CBIG/tree/634f676630929a71297852d01dd92a287103e861/stable_projects/brain_parcellation/Schaefer2018_LocalGlobal/Parcellations/MNI

引用：Schaefer et al. (2018), doi:10.1093/cercor/bhx179；Yeo et al. (2011), doi:10.1152/jn.00338.2011。

## 小脑与脑干

小脑输入为 SUITPy `16ccf3b16a977417cd24cbf3950c7755e98e85eb` 的上游文件 `SUITPy/surfaces/PIAL_FSL.surf.gii`（本地改名为 `SUIT_PIAL_FSL.surf.gii`，文件字节相同），适用该固定快照的 Copyright (c) 2020 Maedbh King [MIT 许可](LICENSES/SUITPy.txt)。移除 101 个未被面引用的零坐标点，保留上游全部 28,834 个有效顶点及 56,588 个三角面，恢复旧截面规则误删的 12 个顶点和 35 个面；原坐标及共同 RAS 显示变换不变。这一授权不泛指全部 SUIT 素材。已核对 FSL 群体参考对应和粗解剖摆放；个体、细叶及论文峰值精确定位未验证。核验参考体积和内部切面图不随候选分发。

脑干是项目程序化教学示意，透视显示不代表真实遮挡或已完成解剖配准。引用：Diedrichsen & Zotow (2015), doi:10.1371/journal.pone.0133402。

## 论文、故事与运行依赖

随附 9 篇文章的纯文字阅读版，各自 CC BY 版本、作者、来源和修改说明见 `docs/paper-redistribution-records.json` 与文章开头；205 条其他论文仅提供来源链接。57 篇故事及配图沿用已核对库存。用户已确认配图为项目自行创作或生成；原创代码采用 MIT；项目有权授权的原创故事、配图和教学说明采用 CC BY 4.0，署名 lizhenglei0906-design。第三方作品及原始科学事实不被重新许可；逐文件边界见 docs/license-map.json 和 CONTENT_LICENSE.md。

React、ReactDOM、Three.js 的 MIT 与 IBM Plex Sans 的 SIL OFL 声明保留在 `LICENSES/`。依赖盘点见 `docs/npm-dependency-license-inventory.json`。本地候选的许可依据不等于公开部署已经完成。
