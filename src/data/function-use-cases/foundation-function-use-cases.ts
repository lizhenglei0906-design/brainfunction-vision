import learningFunctionData from "../learning-functions/bnu-learning-foundations.json";
import paradigmLibraryData from "../paradigm-library/foundational-paradigms.seed.json";
import type { LearningFunctionCatalog, LearningFunctionDefinition } from "../../types/learningFunction";
import type { CognitiveParadigm, ParadigmLibrary } from "../../types/paradigmLibrary";

export type FunctionUseCaseRole = "anchor" | "core" | "supporting" | "related" | "context";

export interface FunctionUseCaseSummary {
  functionId: string;
  anchorParadigmId: string;
  title: string;
  summary: string;
  networkSummary: string;
  consultationCue: string;
}

export interface ParadigmUseCase {
  id: string;
  functionId: string;
  paradigmId: string;
  role: FunctionUseCaseRole;
  mechanismTitle: string;
  featureDescription: string;
  commonPresentation: string;
  dailyPresentations: string[];
  academicPresentations: string[];
  parentPhrases: string[];
  keywords: string[];
  clarifyingQuestions: string[];
  trainingEntry: {
    status: "placeholder" | "ready";
    href: string;
    note: string;
  };
}

export interface FunctionUseCaseRegistry {
  functions: FunctionUseCaseSummary[];
  paradigms: ParadigmUseCase[];
}

function trainingPlaceholderHref(functionId: string, paradigmId: string, phenomenonId: string) {
  const searchParams = new URLSearchParams({
    view: "training-design",
    function: functionId,
    paradigm: paradigmId,
    phenomenon: phenomenonId,
  });
  return `/?${searchParams.toString()}`;
}

const shortTermTrainingNote = "已保留训练入口；后续会从这个表现进入具体训练目标、训练方式和频次安排。";
const genericTrainingNote = "已保留训练入口；后续会从这个表现进入具体训练目标、训练方式和频次安排。";

const learningFunctionCatalog = learningFunctionData as LearningFunctionCatalog;
const paradigmLibrary = paradigmLibraryData as ParadigmLibrary;

const handcraftedUseCaseRegistry: FunctionUseCaseRegistry = {
  functions: [
    {
      functionId: "short_term_memory",
      anchorParadigmId: "n-back",
      title: "短时记忆：中央调度 + 内容保持通道",
      summary:
        "短时记忆力不是单个记忆仓库，而是把当前目标、刚输入的信息和正在操作的中间结果暂时保持在线。N-back 更适合做中央调度和更新的锚点；数字、空间和物体广度分别展示言语、空间和视觉物体材料的保持通道。",
      networkSummary:
        "功能级讲解以额顶控制和顶叶容量系统为主线：前额叶/额顶系统负责目标维持、更新和抗干扰，顶内沟和后顶叶承接空间/数量/序列负荷，语言和视觉物体通路根据材料类型参与。",
      consultationCue:
        "咨询时先区分“马上听完就忘”“做到一半丢条件”“空间位置记不住”“图形细节保不住”。这些线索分别指向言语保持、中央更新、空间保持和视觉物体保持。",
    },
  ],
  paradigms: [
    {
      id: "short-term-memory-n-back",
      functionId: "short_term_memory",
      paradigmId: "n-back",
      role: "anchor",
      mechanismTitle: "中央调度 / 更新保持",
      featureDescription:
        "N-back 要孩子持续保持最近输入、不断更新当前目标，并判断新信息是否和前面某个位置的信息匹配。它适合解释“工作记忆调度系统”而不是某一种材料记忆。",
      commonPresentation:
        "信息不是完全没进来，而是进入任务后无法稳定更新：刚才的规则、目标或中间结果会被新信息挤掉。",
      dailyPresentations: [
        "多步口头指令做到一半忘掉前面一步。",
        "刚被提醒过规则，换一个题或换一个步骤又回到旧习惯。",
        "边听边做时容易丢掉当前目标，需要反复提示。",
      ],
      academicPresentations: [
        "心算时中间数丢失，算到后面忘了前面结果。",
        "应用题读完后只记住熟悉数字，关键限定词在线保持不足。",
        "课堂跟随老师步骤时，前一步和下一步衔接不上。",
      ],
      parentPhrases: ["刚讲完就忘", "做到一半忘了要干什么", "脑子里留不住步骤", "提醒了也保持不住"],
      keywords: ["刚讲完就忘", "做到一半", "多步", "步骤", "中间数", "保持不住", "更新", "规则忘", "听完就忘"],
      clarifyingQuestions: [
        "忘的是刚输入的信息，还是任务做久之后才掉线？",
        "提示一次后能不能保持到任务结束？",
        "问题更常出现在多步骤任务，还是单步任务也明显？",
      ],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "n-back", "short-term-memory-n-back"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-digit-span",
      functionId: "short_term_memory",
      paradigmId: "digit-span",
      role: "core",
      mechanismTitle: "言语/听觉顺序保持",
      featureDescription:
        "数字广度强调短时间保持听到的数字或语言序列，并按原顺序或倒序复述。它更贴近音韵环路和语言顺序保持。",
      commonPresentation:
        "短句、数字、口头要求能听见，但序列长度稍长就漏项、换顺序或只记住最后几个。",
      dailyPresentations: [
        "口头交代两三件事只能记住最后一件。",
        "电话号码、门牌号、验证码容易听完就漏。",
        "复述别人说的话时漏词、换顺序。",
      ],
      academicPresentations: [
        "听写、背诵短句、口算听题时容易漏数字。",
        "老师口头布置作业时记不全要求。",
        "英语/语文中需要短时保持音节或词序的任务吃力。",
      ],
      parentPhrases: ["口头说不住", "听完只记住后半句", "数字一长就乱", "复述漏字漏项"],
      keywords: ["口头", "听写", "复述", "数字", "顺序", "漏项", "验证码", "电话号码", "背诵"],
      clarifyingQuestions: [
        "把要求写下来以后表现是否明显变好？",
        "数字、词语、句子哪一种最容易漏？",
        "倒着说或换顺序时是否明显更困难？",
      ],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "digit-span", "short-term-memory-digit-span"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-grid-span",
      functionId: "short_term_memory",
      paradigmId: "grid-span",
      role: "core",
      mechanismTitle: "空间位置保持",
      featureDescription:
        "空间广度强调短时间保持位置、路线或格子顺序。它更贴近视觉空间模板和顶叶空间保持系统。",
      commonPresentation:
        "孩子不是完全看不见，而是位置关系在脑中保持不稳：刚看过的方位、路线、格子顺序很快散掉。",
      dailyPresentations: [
        "找东西时刚说的位置很快忘。",
        "玩棋盘、拼图、路线任务时容易丢位置。",
        "按空间顺序摆放物品或走路线时需要反复看提示。",
      ],
      academicPresentations: [
        "几何图形、坐标、版面位置记不住。",
        "抄写或看黑板时容易丢行、找不到刚才看到的位置。",
        "数学竖式、表格、图形题中空间对齐困难。",
      ],
      parentPhrases: ["位置记不住", "刚看过又找不到", "图形一复杂就乱", "路线记不住"],
      keywords: ["位置", "路线", "格子", "空间", "图形", "几何", "坐标", "丢行", "找不到位置", "对齐"],
      clarifyingQuestions: [
        "如果把信息改成口头序列，是否比空间位置更容易？",
        "问题是否集中在图形、表格、路线、版面位置？",
        "看一眼后遮住，能保持多久？",
      ],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "grid-span", "short-term-memory-grid-span"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-object-span",
      functionId: "short_term_memory",
      paradigmId: "object-span",
      role: "core",
      mechanismTitle: "视觉物体保持",
      featureDescription:
        "物体广度强调短时间保持物体形状、颜色、类别或细节，不等同于空间位置记忆。它适合解释视觉细节在线保持。",
      commonPresentation:
        "看过的东西很快模糊，只剩大概印象，细节、类别或形状特征保持不住。",
      dailyPresentations: [
        "刚看过的图案、颜色、形状细节很快忘。",
        "找相同物品时只记住大概样子，细节对不上。",
        "复杂图片观察后复述不出关键细节。",
      ],
      academicPresentations: [
        "图形辨认、图像材料、自然科学图示记忆吃力。",
        "阅读图表时看完图例或符号后很快忘掉对应关系。",
        "美术、几何、图形推理中视觉细节保持不足。",
      ],
      parentPhrases: ["看过也记不住样子", "图形细节丢得快", "只记得大概", "颜色形状容易混"],
      keywords: ["图案", "颜色", "形状", "细节", "物体", "图像", "图表", "符号", "样子", "视觉"],
      clarifyingQuestions: [
        "孩子是位置记不住，还是物体本身的样子记不住？",
        "给更多观察时间是否改善明显？",
        "用语言描述物体特征后是否更容易保持？",
      ],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "object-span", "short-term-memory-object-span"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-keep-track",
      functionId: "short_term_memory",
      paradigmId: "keep-track",
      role: "supporting",
      mechanismTitle: "更新监控 / 目标类别保持",
      featureDescription:
        "Keep-track 更偏执行功能中的更新监控：持续跟踪多个类别的最新项目。它能解释孩子在多条线索并行时为什么容易丢当前目标。",
      commonPresentation: "信息量不一定大，但类别多、目标多时，孩子会丢掉正在跟踪的那条线。",
      dailyPresentations: ["同时记多个要求时漏掉其中一类。", "做任务时无法持续检查自己是否还在目标上。"],
      academicPresentations: ["多条件应用题、分类整理、实验步骤记录时漏条件。", "阅读长题时无法持续跟踪人物、数量或限制条件。"],
      parentPhrases: ["一多就乱", "顾了这个忘了那个", "条件多就漏", "不能同时盯住几件事"],
      keywords: ["多个要求", "条件多", "分类", "跟踪", "监控", "顾此失彼", "多线索", "漏条件"],
      clarifyingQuestions: ["单一要求是否还可以？", "任务变成多条件时错误是否明显增加？"],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "keep-track", "short-term-memory-keep-track"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-dual-task",
      functionId: "short_term_memory",
      paradigmId: "dual-task",
      role: "related",
      mechanismTitle: "双任务负荷 / 资源分配",
      featureDescription:
        "双任务不是短时记忆的主测量，但能显示在同时处理两个任务时，保持资源和注意资源如何被竞争。",
      commonPresentation: "单独做还行，一边听一边写、一边算一边记时明显崩。",
      dailyPresentations: ["边听边收拾、边走边记任务时容易漏。", "有干扰时刚记住的信息被打断。"],
      academicPresentations: ["听讲同时记笔记困难。", "做题时一边读条件一边计算导致条件丢失。"],
      parentPhrases: ["不能一心二用", "一打断就忘", "边听边做就乱", "有干扰就记不住"],
      keywords: ["一心二用", "边听边写", "干扰", "打断", "双任务", "同时", "边算边记"],
      clarifyingQuestions: ["单任务下是否明显好转？", "干扰消失后能否自己恢复？"],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "dual-task", "short-term-memory-dual-task"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-multiple-object-tracking",
      functionId: "short_term_memory",
      paradigmId: "multiple-object-tracking",
      role: "related",
      mechanismTitle: "动态目标保持",
      featureDescription:
        "多目标追踪以注意为主，但也需要持续保持多个目标身份和位置，因此可作为空间短时保持的动态场景。",
      commonPresentation: "静态位置还能记，目标一移动或多个目标同时变化就跟丢。",
      dailyPresentations: ["球类、多人活动或动态画面中容易跟丢目标。", "多个移动物体里不知道刚才该盯哪个。"],
      academicPresentations: ["动态几何、实验变化、图表趋势追踪时吃力。", "课堂上板书和老师讲解同时变化时跟不上。"],
      parentPhrases: ["动起来就跟丢", "多个东西一起变就乱", "看着看着不知道盯哪个"],
      keywords: ["追踪", "移动", "多个目标", "动态", "跟丢", "变化", "趋势", "同时变化"],
      clarifyingQuestions: ["静态材料和动态材料差异大不大？", "目标数量增加时是否突然变差？"],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "multiple-object-tracking", "short-term-memory-multiple-object-tracking"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-mental-arithmetic",
      functionId: "short_term_memory",
      paradigmId: "mental-arithmetic",
      role: "context",
      mechanismTitle: "心算中间结果保持",
      featureDescription:
        "心算以计算能力为主，但短时记忆负责暂存中间结果、当前运算规则和下一步计划。",
      commonPresentation: "会算，但中间结果留不住，导致步骤断掉或回头重算。",
      dailyPresentations: ["日常口算、找零、估算时中间数丢失。"],
      academicPresentations: ["口算和多步运算中丢中间结果。", "应用题中刚算出的数无法接到下一步。"],
      parentPhrases: ["不是不会算，是算着算着忘了", "中间数丢了", "老要从头算"],
      keywords: ["心算", "口算", "中间数", "从头算", "多步运算", "算着忘了"],
      clarifyingQuestions: ["写下来后是否明显好转？", "错误来自概念不会，还是中间结果丢失？"],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "mental-arithmetic", "short-term-memory-mental-arithmetic"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-algebra-equation-solving",
      functionId: "short_term_memory",
      paradigmId: "algebra-equation-solving",
      role: "context",
      mechanismTitle: "符号变换中间状态保持",
      featureDescription:
        "代数方程以计算和推理为主，但每一步符号变换都需要保持中间状态和规则约束。",
      commonPresentation: "知道规则，但变形步骤多时容易丢符号、漏条件或把上一步状态记错。",
      dailyPresentations: ["多步骤规则任务中容易漏掉前一条件。"],
      academicPresentations: ["解方程移项、化简、代入时漏符号或忘条件。", "几步之后不知道当前式子从哪来。"],
      parentPhrases: ["步骤一多就乱", "符号老丢", "会规则但做不稳", "变形到后面忘前面"],
      keywords: ["代数", "方程", "符号", "移项", "化简", "代入", "漏条件", "步骤多"],
      clarifyingQuestions: ["把每一步写清楚后是否减少错误？", "错在规则理解还是当前状态保持？"],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "algebra-equation-solving", "short-term-memory-algebra-equation-solving"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-tower-of-london",
      functionId: "short_term_memory",
      paradigmId: "tower-of-london",
      role: "context",
      mechanismTitle: "计划中间状态保持",
      featureDescription:
        "伦敦塔以执行功能和计划为主，但短时记忆参与保持中间状态、目标状态和已经尝试过的步骤。",
      commonPresentation: "不是完全不会计划，而是计划到中间忘了目标状态或已走路径。",
      dailyPresentations: ["整理书包、安排顺序、收拾步骤时做到一半乱。"],
      academicPresentations: ["复杂题规划步骤时，目标和中间状态连接不上。", "作文、实验、解题计划中漏步骤。"],
      parentPhrases: ["计划到一半就乱", "做着做着忘了目标", "不知道下一步该干什么"],
      keywords: ["计划", "步骤安排", "目标状态", "伦敦塔", "做到一半乱", "下一步", "路径"],
      clarifyingQuestions: ["给出外部步骤表后是否能完成？", "是想不到计划，还是计划保持不住？"],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "tower-of-london", "short-term-memory-tower-of-london"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-word-list-learning",
      functionId: "short_term_memory",
      paradigmId: "word-list-learning",
      role: "related",
      mechanismTitle: "编码前的短时保持",
      featureDescription:
        "词表学习主要属于长时记忆，但信息进入长时记忆前，需要先短时保持和组织。",
      commonPresentation: "不是完全不能记，而是材料刚进入时保持和组织不稳，后续编码质量下降。",
      dailyPresentations: ["刚听到一串词很快散掉，难以组织成组。"],
      academicPresentations: ["背词、背概念、背课文时前几项和后几项互相干扰。", "需要先短时保持再长期记住的材料效率低。"],
      parentPhrases: ["背东西进不去", "词一多就散", "前面背后面忘"],
      keywords: ["背词", "词表", "背诵", "编码", "前面忘", "词一多", "长期记忆前"],
      clarifyingQuestions: ["重复次数增加后是否能进长时记忆？", "问题出在刚输入阶段还是隔天提取阶段？"],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref("short_term_memory", "word-list-learning", "short-term-memory-word-list-learning"),
        note: shortTermTrainingNote,
      },
    },
    {
      id: "short-term-memory-phonological-decoding",
      functionId: "short_term_memory",
      paradigmId: "phonological-decoding",
      role: "related",
      mechanismTitle: "音韵信息短时保持",
      featureDescription:
        "音韵解码主属阅读，但把字形转成音节、押韵或发音规则时，需要短暂保持语音片段和音韵顺序。",
      commonPresentation: "读音、押韵或拼读规则刚加工出来就散掉，导致读得慢、读不稳或需要反复回看。",
      dailyPresentations: ["新词、新名字、顺口令或押韵材料听过后保持不稳。", "需要跟读或复述音节时容易漏音、换顺序。"],
      academicPresentations: [
        "拼音、英语自然拼读、押韵判断或伪词阅读时吃力。",
        "读长词、陌生词时，前面的音节保持不住，影响整体读出。",
      ],
      parentPhrases: ["拼读一长就乱", "刚读过的音留不住", "读陌生词特别慢", "押韵和音节容易混"],
      keywords: ["拼读", "押韵", "音节", "发音", "伪词", "自然拼读", "陌生词", "读音", "跟读", "漏音"],
      clarifyingQuestions: [
        "孩子是认字形困难，还是字形转成读音后保持不住？",
        "熟词和陌生词的差异是否明显？",
        "把词拆成短音节后是否改善？",
      ],
      trainingEntry: {
        status: "placeholder",
        href: trainingPlaceholderHref(
          "short_term_memory",
          "phonological-decoding",
          "short-term-memory-phonological-decoding",
        ),
        note: shortTermTrainingNote,
      },
    },
  ],
};

interface FunctionUseCaseProfile {
  anchorParadigmId: string;
  title: string;
  summary: string;
  networkSummary: string;
  consultationCue: string;
  commonPattern: string;
  dailyPresentations: string[];
  academicPresentations: string[];
  parentPhrases: string[];
  keywords: string[];
  clarifyingQuestions: string[];
}

const functionUseCaseProfiles: Record<string, FunctionUseCaseProfile> = {
  attention: {
    anchorParadigmId: "attention-network-test",
    title: "注意力：警觉、定向和执行控制",
    summary:
      "注意力不是单纯坐得住，而是能把警觉水平、空间定向、目标选择和抗干扰稳定组织起来。ANT 适合作为总入口，Stroop、Flanker、Posner 和 CPT 分别拆解冲突、旁侧干扰、空间线索和持续保持。",
    networkSummary:
      "功能级讲解以背侧注意、腹侧注意/显著性和额顶控制为主线：背侧注意负责目标定向，显著性系统捕捉需要重定向的刺激，额顶系统维持任务规则和抑制干扰。",
    consultationCue:
      "咨询时先区分“不进入状态”“容易被外界带走”“看漏目标”“有干扰就错”“坚持一会儿就掉线”。这些线索分别指向警觉、定向、选择、冲突控制和持续注意。",
    commonPattern: "在{paradigm}相关任务里，常见问题是目标能看见，但注意资源不能稳定分配到真正该处理的信息上。",
    dailyPresentations: [
      "需要提醒后才能进入任务状态，环境一复杂就分神。",
      "能听懂要求，但容易被旁边声音、画面或新刺激带走。",
      "做事开头还可以，持续一段时间后漏看、漏听或反应变慢。",
    ],
    academicPresentations: [
      "听课或写作业时目标保持不稳，常常做到一半偏离任务。",
      "阅读题干、抄写、计算检查时漏字、漏条件或漏步骤。",
      "限时任务中容易为了快而牺牲准确性，有干扰时错误明显增加。",
    ],
    parentPhrases: ["坐不住", "很容易分心", "一有声音就跑神", "看题不仔细", "明明会但老漏"],
    keywords: ["注意", "分心", "跑神", "干扰", "漏看", "漏听", "坐不住", "目标", "专注", "持续"],
    clarifyingQuestions: [
      "问题更像进不了状态，还是进入后维持不住？",
      "外界干扰和题目内部干扰，哪一种影响更大？",
      "提醒后能短时间改善，还是提醒也拉不回来？",
    ],
  },
  short_term_memory: {
    anchorParadigmId: "n-back",
    title: "短时记忆：中央调度 + 内容保持通道",
    summary:
      "短时记忆力不是单个记忆仓库，而是把当前目标、刚输入的信息和正在操作的中间结果暂时保持在线。N-back 更适合做中央调度和更新的锚点；数字、空间和物体广度分别展示言语、空间和视觉物体材料的保持通道。",
    networkSummary:
      "功能级讲解以额顶控制和顶叶容量系统为主线：前额叶/额顶系统负责目标维持、更新和抗干扰，顶内沟和后顶叶承接空间/数量/序列负荷，语言和视觉物体通路根据材料类型参与。",
    consultationCue:
      "咨询时先区分“马上听完就忘”“做到一半丢条件”“空间位置记不住”“图形细节保不住”。这些线索分别指向言语保持、中央更新、空间保持和视觉物体保持。",
    commonPattern: "在{paradigm}相关任务里，常见问题是信息已经进入任务，但保持和更新不稳。",
    dailyPresentations: ["多步口头要求容易漏项。", "任务被打断后难以接回刚才的步骤。"],
    academicPresentations: ["心算、听写、阅读题干和多步骤解题时容易丢中间信息。"],
    parentPhrases: ["刚讲完就忘", "做到一半忘了", "脑子里留不住", "步骤一多就乱"],
    keywords: ["短时", "工作记忆", "刚讲完就忘", "保持", "更新", "步骤", "中间数"],
    clarifyingQuestions: ["忘的是刚输入的信息，还是隔天提取的信息？", "写下来以后是否明显改善？"],
  },
  reading: {
    anchorParadigmId: "word-pseudoword-reading",
    title: "阅读能力：字形、音韵和语义整合",
    summary:
      "阅读能力从视觉字形进入音韵、词义、句意和篇章理解。字词/伪词阅读适合作为主入口，正字法、音韵解码、词汇判断、语义任务和句子理解分别展示阅读链条的不同环节。",
    networkSummary:
      "功能级讲解以视觉词形加工、左侧额颞语言通路、顶叶音韵支持和默认模式/语义系统整合为主线；Schaefer/Yeo 不是语言专用图谱，因此具体脑区仍以范式证据为准。",
    consultationCue:
      "咨询时先区分“看字形慢”“拼读转换慢”“词义取不出来”“句子读完不理解”“长文本抓不住主线”。这些线索分别指向字形、音韵、词汇语义、句法语义和篇章整合。",
    commonPattern: "在{paradigm}相关任务里，常见问题是文字看到了，但字形、读音和意义之间的转换不够顺。",
    dailyPresentations: [
      "读新词、陌生词或长句时速度明显下降。",
      "能逐字读，但读完整句后不容易把意思连起来。",
      "需要反复回读才能确认刚才读到什么。",
    ],
    academicPresentations: [
      "语文、英语阅读中错读、漏读、回读多。",
      "题干读完后抓不住关键词、逻辑关系或中心意思。",
      "阅读速度慢，影响后续理解和答题时间。",
    ],
    parentPhrases: ["读得慢", "读完不懂", "老回读", "漏字错字", "陌生词卡住"],
    keywords: ["阅读", "读得慢", "理解", "字词", "拼读", "音韵", "句子", "语义", "回读", "漏读"],
    clarifyingQuestions: [
      "孩子是认字慢，还是认完字以后理解慢？",
      "熟悉词和陌生词差异是否明显？",
      "朗读和默读哪个问题更明显？",
    ],
  },
  calculation: {
    anchorParadigmId: "approximate-number-sense",
    title: "计算能力：从数量理解到数学建模",
    summary:
      "计算能力先从理解多少、大小、顺序和数字意义开始，再进入精确计数、算术事实、在线运算、符号规则和数学建模。数量理解是基础入口，数学应用题则是语言、数量、推理和执行控制共同参与的综合任务。",
    networkSummary:
      "功能级讲解先看数字、点阵和数轴输入如何进入顶叶数量/空间系统，再看下顶叶怎样连接符号与数量意义；只有进入计数、运算和复杂建模后，额顶规则控制、语言语义和冲突监控才逐步加强。",
    consultationCue:
      "咨询时先区分“多少没有概念”“数字和实物对不上”“小数量也要逐个数”“数序或数轴位置不稳”，再继续判断算术事实、心算步骤、符号规则和应用题建模。",
    commonPattern: "在{paradigm}相关任务里，常见问题可能发生在数量意义、数字形式、数序空间、运算步骤或逻辑结构中的某一层。",
    dailyPresentations: [
      "遇到数量、比例、找零或估算时反应慢。",
      "熟悉答案容易先冲出来，但不一定符合题目限制。",
      "多步骤计算时需要反复回头确认当前算到哪一步。",
    ],
    academicPresentations: [
      "口算、笔算、应用题、代数和几何中错误类型不一样。",
      "会做简单算式，但题干一长或条件一绕就失误。",
      "限时计算容易快慢失衡，要么慢，要么快但错。",
    ],
    parentPhrases: ["计算慢", "应用题读不明白", "会算但总错", "一看到数字就乱算", "步骤多就错"],
    keywords: ["计算", "数学", "数量", "数感", "口算", "应用题", "代数", "几何", "统计", "符号", "步骤"],
    clarifyingQuestions: [
      "错误更常出现在基础运算，还是题干理解和建模？",
      "孩子是算得慢，还是算得快但冲动？",
      "写步骤后是否明显减少错误？",
    ],
  },
  reaction_speed: {
    anchorParadigmId: "choice-reaction-time",
    title: "反应速度：刺激识别、选择和动作输出",
    summary:
      "反应速度不是单纯手快，而是刺激出现后能否迅速完成警觉、辨别、规则匹配和动作输出。选择反应时适合作为主入口，简单反应时、符号搜索、视觉搜索和知觉辨别分别拆解不同速度瓶颈。",
    networkSummary:
      "功能级讲解以警觉/显著性系统、感觉辨别通路和躯体运动输出为主线；需要区分基础警觉速度、选择速度、扫描速度和动作执行速度。",
    consultationCue:
      "咨询时先区分“启动慢”“看见了但辨别慢”“选反应慢”“动作输出慢”“速度一快就错”。这些线索对应不同反应时环节。",
    commonPattern: "在{paradigm}相关任务里，常见问题是刺激已经出现，但识别、选择或输出中的某一环拖慢。",
    dailyPresentations: [
      "别人已经反应了，孩子还在启动或确认。",
      "需要快速找目标、按规则匹配或切换动作时变慢。",
      "一追求速度就容易错，一追求准确就明显慢。",
    ],
    academicPresentations: [
      "限时测验、抄写、口算、查找符号和阅读定位中速度不足。",
      "会做但做不完，或做得快时错漏明显增多。",
      "需要快速辨别相似符号、数字或图形时吃力。",
    ],
    parentPhrases: ["反应慢", "做题慢", "写得慢", "看到了也慢", "会但来不及"],
    keywords: ["反应", "速度", "慢", "限时", "做不完", "扫描", "查找", "匹配", "辨别", "按键"],
    clarifyingQuestions: [
      "慢在看见刺激、理解规则、选择答案，还是动作输出？",
      "不限时是否能做对？",
      "速度提高后错误是否明显增加？",
    ],
  },
  mental_imagery_operation: {
    anchorParadigmId: "mental-rotation",
    title: "表象操作：内部图像生成、保持和变换",
    summary:
      "表象操作能力是在没有完整外部图像时，在头脑中保持、旋转、展开、分离和比较图形。心理旋转适合作为主入口，视觉表象、空间展开/折叠、嵌入图形和几何推理分别展示生成、变换和匹配。",
    networkSummary:
      "功能级讲解以视觉表象系统、后顶叶空间操作和额顶控制为主线：视觉系统承接图像内容，顶叶参与空间变换，额顶系统维持目标和规则。",
    consultationCue:
      "咨询时先区分“脑中想不出图”“图像保持不住”“旋转变换困难”“复杂背景里分不出目标”“几何空间关系乱”。",
    commonPattern: "在{paradigm}相关任务里，常见问题是外部图像一离开视野，内部图像就不够稳定或不能顺利变换。",
    dailyPresentations: [
      "拼图、积木、路线、方向和空间摆放任务吃力。",
      "需要在脑中想象物体转向、展开或变化时容易卡住。",
      "复杂画面里找目标或分离图形比较慢。",
    ],
    academicPresentations: [
      "几何、图形推理、立体图、坐标和物理示意图理解困难。",
      "看到步骤能跟，闭眼想或换角度想就乱。",
      "画图辅助后表现明显好于纯脑内想象。",
    ],
    parentPhrases: ["空间感差", "脑子里想不出来", "图形一转就乱", "几何看不懂", "找图形慢"],
    keywords: ["表象", "空间", "图形", "旋转", "几何", "想象", "折叠", "展开", "拼图", "方向"],
    clarifyingQuestions: [
      "有图可看和必须脑内想象，差异大不大？",
      "困难更像生成图像、保持图像，还是变换图像？",
      "画辅助图以后是否明显改善？",
    ],
  },
  reasoning: {
    anchorParadigmId: "ravens-matrices",
    title: "推理能力：关系发现、规则整合和结论生成",
    summary:
      "推理能力是在已有信息之间发现关系、整合规则，并推出新结论。瑞文矩阵适合作为图形抽象推理主入口，类比、关系整合、归纳和演绎分别展示迁移、复杂关系、规则发现和逻辑约束。",
    networkSummary:
      "功能级讲解以额顶控制、顶叶关系操作和语义/背景知识整合为主线：额顶系统维持规则与目标，顶叶支持关系结构，默认模式/语义系统参与知识背景和意义整合。",
    consultationCue:
      "咨询时先区分“找不到规律”“关系一多就乱”“只能套熟题”“条件推不出结论”“知道知识但不会迁移”。",
    commonPattern: "在{paradigm}相关任务里，常见问题是单个信息能理解，但关系、规则或条件整合不到一起。",
    dailyPresentations: [
      "遇到新情境时不会从旧经验迁移。",
      "能说出局部信息，但说不清它们之间的关系。",
      "复杂规则任务中需要大人提示关键关系。",
    ],
    academicPresentations: [
      "奥数、应用题、科学推理、阅读推断和图形规律题吃力。",
      "会背公式或知识点，但换题型后不会用。",
      "条件一多就漏关系，结论跳得太快或推不出来。",
    ],
    parentPhrases: ["不会举一反三", "找不到规律", "条件一多就乱", "不会推", "只会套题"],
    keywords: ["推理", "规律", "关系", "类比", "归纳", "演绎", "矩阵", "条件", "迁移", "举一反三"],
    clarifyingQuestions: [
      "孩子是看不懂条件，还是条件懂但整合不起来？",
      "熟题和新题差异是否很大？",
      "给出中间关系提示后能不能继续推？",
    ],
  },
  long_term_memory: {
    anchorParadigmId: "word-list-learning",
    title: "长时记忆：编码、绑定和提取",
    summary:
      "长时记忆包括把信息编码进去、把项目和情境绑定起来，并在之后按线索提取。词表学习适合作为主入口，联想记忆、来源记忆、再认、面孔姓名、事件顺序和视觉延迟记忆分别展示不同材料和提取方式。",
    networkSummary:
      "功能级讲解以海马/内侧颞叶绑定、默认模式语义整合和额顶提取策略为主线；皮层图谱负责外侧皮层表达，海马、丘脑和边缘系统通过辅助结构层展示。",
    consultationCue:
      "咨询时先区分“背不进去”“当时会隔天忘”“看见熟但想不起”“来源混”“顺序乱”“图像材料记不住”。",
    commonPattern: "在{paradigm}相关任务里，常见问题是材料能短暂处理，但长期编码、绑定或提取不稳。",
    dailyPresentations: [
      "学过的内容过一会儿或隔天就想不起来。",
      "能觉得熟悉，但说不出具体在哪里见过或怎么用。",
      "人物、地点、顺序、来源和细节容易混。",
    ],
    academicPresentations: [
      "背词、背课文、记公式、记概念和复习提取效率低。",
      "考试时看到题觉得学过，但想不起关键细节。",
      "知识点孤立，不能稳定绑定到情境和用法。",
    ],
    parentPhrases: ["背不住", "隔天就忘", "学过想不起来", "熟但说不出", "记混了"],
    keywords: ["长时记忆", "背诵", "隔天忘", "提取", "编码", "来源", "再认", "联想", "面孔姓名", "顺序"],
    clarifyingQuestions: [
      "问题发生在刚学进去，还是隔一段时间提取？",
      "提示线索后能不能想起来？",
      "孩子更容易忘内容、来源、顺序还是视觉细节？",
    ],
  },
  executive_function: {
    anchorParadigmId: "go-no-go",
    title: "执行功能：抑制、切换、计划和监控",
    summary:
      "执行功能是把冲动反应压住、按规则切换、规划步骤并监控错误的控制系统。Go/No-Go 和 Stop-signal 适合讲抑制，任务切换讲灵活性，伦敦塔讲计划，Keep-track 讲更新监控。",
    networkSummary:
      "功能级讲解以额顶控制、显著性/前岛-扣带系统、运动抑制和基底神经节/丘脑回路为主线；需要把皮层控制和皮层下刹车环路一起表达。",
    consultationCue:
      "咨询时先区分“冲动停不住”“规则换不过来”“计划不了步骤”“做事不检查”“反馈后不调整”。",
    commonPattern: "在{paradigm}相关任务里，常见问题是知道规则，但不能稳定用规则控制当前行为。",
    dailyPresentations: [
      "明知道不该做还是先做了，事后才反应过来。",
      "换规则、换任务或计划多步骤事情时卡住。",
      "出错后不容易停下来检查和调整。",
    ],
    academicPresentations: [
      "审题、检查、改错、规划作文或解题步骤时控制不足。",
      "遇到诱导项、陷阱题或旧规则时容易冲动作答。",
      "任务切换、限时安排和多步骤项目完成度不稳定。",
    ],
    parentPhrases: ["冲动", "管不住自己", "知道但做不到", "不检查", "计划差", "换不过来"],
    keywords: ["执行功能", "抑制", "冲动", "切换", "计划", "监控", "检查", "停不住", "规则", "反馈"],
    clarifyingQuestions: [
      "孩子是不会规则，还是知道规则但用不上？",
      "问题更像停不住、换不过来、计划不了，还是不检查？",
      "外部提醒能否让他立刻调整？",
    ],
  },
};

function uniqueStrings(values: Array<string | undefined>) {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

function useCaseKey(functionId: string, paradigmId: string) {
  return `${functionId}::${paradigmId}`;
}

function functionSlug(functionId: string) {
  return functionId.replace(/_/g, "-");
}

function inferGeneratedRole(functionId: string, paradigm: CognitiveParadigm): FunctionUseCaseRole {
  const profile = functionUseCaseProfiles[functionId];
  if (profile?.anchorParadigmId === paradigm.id) {
    return "anchor";
  }
  if (paradigm.primaryFunctionId === functionId) {
    return "core";
  }
  if (
    functionId === "calculation" ||
    (functionId === "reasoning" && paradigm.primaryFunctionId === "calculation") ||
    (functionId === "executive_function" && paradigm.primaryFunctionId === "calculation")
  ) {
    return "context";
  }
  return "related";
}

function buildFunctionSummary(functionDef: LearningFunctionDefinition): FunctionUseCaseSummary {
  const profile = functionUseCaseProfiles[functionDef.id];
  return {
    functionId: functionDef.id,
    anchorParadigmId: profile?.anchorParadigmId ?? functionDef.paradigmExamples[0]?.id ?? "",
    title: profile?.title ?? functionDef.label,
    summary: profile?.summary ?? functionDef.description,
    networkSummary: profile?.networkSummary ?? functionDef.networkMappingNote,
    consultationCue:
      profile?.consultationCue ??
      `咨询时先根据家长描述判断问题是否落在${functionDef.label}，再进入具体范式拆解。`,
  };
}

function buildGenericUseCase(functionDef: LearningFunctionDefinition, paradigm: CognitiveParadigm): ParadigmUseCase {
  const profile = functionUseCaseProfiles[functionDef.id];
  const role = inferGeneratedRole(functionDef.id, paradigm);
  const useCaseId = `${functionSlug(functionDef.id)}-${paradigm.id}`;
  const relationText =
    paradigm.primaryFunctionId === functionDef.id
      ? `它是${functionDef.label}的核心观察入口。`
      : `它主属其他能力，但在${functionDef.label}里提供重要参与线索。`;

  return {
    id: useCaseId,
    functionId: functionDef.id,
    paradigmId: paradigm.id,
    role,
    mechanismTitle: `${paradigm.label}：${functionDef.label}观察`,
    featureDescription: `${paradigm.description}${relationText}`,
    commonPresentation:
      profile?.commonPattern.replace("{paradigm}", paradigm.label) ??
      `在${paradigm.label}相关任务里，常见问题会表现为${functionDef.label}调动不稳。`,
    dailyPresentations:
      profile?.dailyPresentations.map((item) => item.replace("{paradigm}", paradigm.label)) ?? [
        `日常任务中，只要接近${paradigm.label}所代表的加工要求，就容易出现不稳定。`,
      ],
    academicPresentations:
      profile?.academicPresentations.map((item) => item.replace("{paradigm}", paradigm.label)) ?? [
        `学科学习中，${paradigm.label}相关负荷升高时，速度、准确性或稳定性会下降。`,
      ],
    parentPhrases: profile?.parentPhrases ?? [`${functionDef.label}不稳`, "会但做不出来", "状态起伏大"],
    keywords: uniqueStrings([
      functionDef.label,
      functionDef.englishLabel,
      paradigm.label,
      paradigm.englishLabel,
      ...functionDef.tags,
      ...paradigm.factorIds,
      ...paradigm.heatmapVariables,
      ...(profile?.keywords ?? []),
    ]),
    clarifyingQuestions: profile?.clarifyingQuestions ?? [
      `这个问题是否只在${paradigm.label}类似任务里出现？`,
      "降低速度或外部提示后是否明显改善？",
    ],
    trainingEntry: {
      status: "placeholder",
      href: trainingPlaceholderHref(functionDef.id, paradigm.id, useCaseId),
      note: genericTrainingNote,
    },
  };
}

const handcraftedUseCaseByKey = new Map(
  handcraftedUseCaseRegistry.paradigms.map((useCase) => [useCaseKey(useCase.functionId, useCase.paradigmId), useCase]),
);

const generatedParadigmUseCases = paradigmLibrary.paradigms.flatMap((paradigm) =>
  paradigm.functionIds
    .filter((functionId) => !handcraftedUseCaseByKey.has(useCaseKey(functionId, paradigm.id)))
    .map((functionId) => {
      const functionDef = learningFunctionCatalog.functions.find((item) => item.id === functionId);
      return functionDef ? buildGenericUseCase(functionDef, paradigm) : null;
    })
    .filter((useCase): useCase is ParadigmUseCase => Boolean(useCase)),
);

const functionOrderById = new Map(learningFunctionCatalog.functions.map((functionDef) => [functionDef.id, functionDef.order]));

export const functionUseCaseRegistry: FunctionUseCaseRegistry = {
  functions: learningFunctionCatalog.functions.map(buildFunctionSummary),
  paradigms: [...handcraftedUseCaseRegistry.paradigms, ...generatedParadigmUseCases].sort(
    (first, second) =>
      (functionOrderById.get(first.functionId) ?? 999) - (functionOrderById.get(second.functionId) ?? 999) ||
      first.functionId.localeCompare(second.functionId) ||
      first.paradigmId.localeCompare(second.paradigmId),
  ),
};
