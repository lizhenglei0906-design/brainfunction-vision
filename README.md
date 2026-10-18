# BrainFunction

**从脑图和实验故事，走进认知科学。**

BrainFunction 是一个中文认知科学学习与教学项目。它把交互脑图、认知实验的故事和研究论文放在同一个界面里。你可以从注意力、记忆或阅读等感兴趣的能力出发，了解研究者怎样设计实验，再查看相关脑区与论文依据。

[在线体验](https://lizhenglei0906-design.github.io/brainfunction-vision/) · [GitHub 仓库](https://github.com/lizhenglei0906-design/brainfunction-vision)

当前公开版本为 v0.1.0，由 [lizhenglei0906-design](https://github.com/lizhenglei0906-design) 维护。

## 为什么做这个项目

认知科学里有很多熟悉的词。注意力、记忆、推理，听起来都容易理解。再往下追问一步，问题就具体了。怎样观察注意力的不同环节？一个记忆任务里的表现，能说明哪一种记忆能力？论文中出现的脑区，又与实验里的哪一步有关？

BrainFunction 把这些问题接到具体实验上。读者可以先看实验要求参与者做什么，再理解研究者为什么比较这些条件，随后找到脑图中的相关位置和原始研究。项目希望让学习者看懂认知科学怎样提出问题，以及一项研究能支持多大的结论。

## 项目里有什么

公开版本围绕脑图、范式故事和论文展开。

| 内容 | 可以做什么 |
| --- | --- |
| 交互脑图 | 从九项功能入口探索相关区域与连接，旋转、缩放脑模型，查看分区和节点。 |
| 范式故事 | 阅读 57 个实验范式的故事及配图，了解任务规则、研究背景和证据。 |
| 论文阅读 | 浏览 214 个论文入口，其中 9 篇提供可再分发的纯文字阅读版，其余 205 篇链接到原始来源。 |
| 论文点位 | 查看 72 个论文报告点的教学近似位置，并追溯原文坐标、转换方法和不确定性。 |

“范式”可以理解为研究者围绕一个问题设计的实验任务。例如，Stroop 任务让参与者在词义与字色发生冲突时按规则作答；N-back 任务要求参与者一边接收新信息，一边记住前面出现过的内容。故事从这些具体任务讲起，再介绍研究发现。

脑图采用 Schaefer 200 个功能分区和 Yeo 7 网络，保留小脑模型，并提供教学示意脑干。页面中的 260 个区域或结构示意节点，用来帮助理解功能关系；它们与论文实际报告的坐标点分别标注。

## 第一次怎样使用

可以从“注意力”开始，选择“ANT 注意网络测试”。

1. 先看任务说明，了解提示、目标和干扰信息怎样出现，参与者需要作出什么反应。
2. 打开范式故事和配图，理解实验怎样分别观察警觉、定向和执行控制。
3. 配合脑图查看相关区域与连接，尝试旋转和缩放，观察它们的大致空间关系。
4. 沿论文入口回到研究来源，进一步阅读方法、结果和解释范围。

熟悉这条路径后，可以换一个感兴趣的能力，比较不同实验各自测到了什么。同一个任务往往需要多种能力共同参与；查看它与其他功能的关联，也是一种使用方式。

## 怎样理解脑图和证据

页面中的功能分类用于组织教学内容，一项能力通常涉及多个区域和网络。脑区活动与某个任务同时出现，也不能单凭这一点确定它承担了全部机制。

脑图中的几类标记需要分别理解。

- **功能分区**来自公开图谱，模型表面由分区体积生成，用于展示分区与网络关系。
- **示意节点和连线**用于讲解区域位置及功能联系；连线不能直接当作实测神经纤维。
- **论文报告点**保留原文坐标和转换记录，在当前模型上作近似教学展示。

论文点位的精确定位尚未建立。模板差异、原始记录不足等问题会在证据说明中保留；没有对应皮层标签的点也保留其位置，不强行移动到附近分区。小脑保留已核对的群体参考关系与粗解剖摆放，脑干明确标为教学示意。

范式故事帮助读者理解研究。涉及训练或学习启发时，需要结合原研究的对象、任务和随访范围判断，不能把实验任务上的进步直接等同于课堂成绩提高。

## 适合怎样使用

初学者可以从故事进入认知科学，逐步接触实验设计和论文。教师或科普创作者可以用脑图与配图辅助讲解，并沿来源检查具体说法。对研究感兴趣的读者，可以把项目当作查找范式和论文的起点，再回到原文核实研究细节。

## 本地运行

直接学习和浏览可使用[在线版本](https://lizhenglei0906-design.github.io/brainfunction-vision/)。需要在本地运行或修改时，准备 Node.js 24，然后执行以下命令。

```sh
git clone https://github.com/lizhenglei0906-design/brainfunction-vision.git
cd brainfunction-vision
npm ci
npm run dev
```

在浏览器打开 [本地项目页面](http://127.0.0.1:4197/brainfunction-vision/)。

修改后可运行项目已有检查，再构建网站。

```sh
npm run validate
npm run validate:spatial
npm run validate:coordinates
npm run validate:teaching
npm run build
npm run validate:pages
```

网站由 GitHub Pages 托管，构建输出位于 `dist/`。默认访问路径为 `/brainfunction-vision/`；调整仓库名或部署路径时，需要同步修改 `vite.config.ts` 并重新检查。

## 许可、引用与参与

原创代码采用 [MIT 许可](https://github.com/lizhenglei0906-design/brainfunction-vision/blob/main/LICENSE)。项目有权授权的原创故事、配图和教学说明采用 [CC BY 4.0](https://github.com/lizhenglei0906-design/brainfunction-vision/blob/main/CONTENT_LICENSE.md)。论文、模型、字体等第三方材料继续适用各自的许可，具体范围见[逐文件许可记录](https://github.com/lizhenglei0906-design/brainfunction-vision/blob/main/docs/license-map.json)和[第三方说明](https://github.com/lizhenglei0906-design/brainfunction-vision/blob/main/THIRD_PARTY_NOTICES.md)。

使用本项目时，可参考 [CITATION.cff](https://github.com/lizhenglei0906-design/brainfunction-vision/blob/main/CITATION.cff) 引用项目。使用具体研究结论、图谱或论文内容时，也请保留相应原作者的引用与署名。

欢迎通过 [Issues](https://github.com/lizhenglei0906-design/brainfunction-vision/issues) 反馈内容错误、失效链接或使用问题。涉及科学解释的修订，请附上对应论文和具体位置；新增第三方材料时，请同时提供来源与许可依据。
