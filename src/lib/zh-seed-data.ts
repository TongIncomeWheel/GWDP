import type { OralExercise } from "./types";

export function getSeedZhExercises(): Omit<OralExercise, "id">[] {
  return [
    // ─── PAIR 1: 爱护环境与可持续发展 ────────────────────────────────────────
    {
      type: "READING",
      title: "我们的绿色家园",
      topic: "爱护环境与可持续发展",
      difficulty: "Foundation",
      isDaily: true,
      preambleText: "请朗读以下短文，读得清楚又有感情。",
      passageText:
        "Tan老师带着同学们来到学校的小菜园。“今天，我们要亲手种蔬菜，”她笑着说，“每一棵小苗都需要我们用心照顾。”小明认真地松土，小华小心地把菜苗放进坑里，轻轻覆上泥土。每天放学后，大家都会来浇水、除草。几周后，菜园里长出了绿油油的蔬菜。同学们把收获的蔬菜送给学校食堂，心里美滋滋的。Tan老师欣慰地说：“你们用自己的双手，让校园变得更绿更美！”小明抬头望着蓝天，心想：原来保护环境，就从这一小块菜园开始。只要每个人都出一份力，我们的地球就会越来越美好。",
      posterImageResName: "",
      posterDescription: "",
      photographDescription: "",
      question1: "",
      question2: "",
      question3: "",
      preamblePact: JSON.stringify({
        目的: "复述环保故事",
        听众: "同学与老师",
        场景: "新加坡学校",
        语气: "温暖、积极",
      }),
      readingTips:
        "注意'环境'、'垃圾'等词语的声调。朗读对话时要有感情变化。在句号和逗号处适当停顿。",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "爱护环境 (看图说话)",
      topic: "爱护环境与可持续发展",
      difficulty: "Foundation",
      isDaily: true,
      preambleText: "请看图后回答问题。",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "一张在新加坡组屋区拍摄的照片。几位穿着校服的小学生正在清理组屋旁的小花园。一个男孩正在浇水，一个女孩弯腰把杂草拔起来，另一个同学把垃圾装进可降解袋里。旁边的告示板上贴着一张写有“爱护我们的家园”的手绘海报。背景中有组屋楼栋和绿色植物。阳光明媚，小朋友们脸上都带着笑容。",
      photographDescription:
        "一张在新加坡组屋区拍摄的照片。几位穿着校服的小学生正在清理组屋旁的小花园。一个男孩正在浇水，一个女孩弯腰把杂草拔起来，另一个同学把垃圾装进可降解袋里。旁边的告示板上贴着一张写有“爱护我们的家园”的手绘海报。背景中有组屋楼栋和绿色植物。阳光明媚，小朋友们脸上都带着笑容。",
      question1: "请你描述一下图片里发生了什么事？这些小朋友为什么要这么做？",
      question2: "你有没有参加过环保活动？请告诉我你是怎么保护环境的。",
      question3: "你认为我们应该怎样做才能让新加坡的环境更美好？",
      preamblePact: "",
      readingTips: "",
      imageSearchSuggestion:
        "Singapore primary school students garden community cleanup",
      sbcQ1Type: "description",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ─── PAIR 2: 家庭与孝顺 ──────────────────────────────────────────────────
    {
      type: "READING",
      title: "妈妈的爱",
      topic: "家庭与孝顺",
      difficulty: "Intermediate",
      isDaily: false,
      preambleText: "请朗读以下短文，读得清楚又有感情。",
      passageText:
        "每天清晨，妈妈总是第一个起床，为全家准备早餐。小雯有一次问：“妈妈，你不累吗？”妈妈笑着说：“看到你们吃饱上学，我就不觉得累了。”那天放学后，小雯偷偷学着妈妈的样子，把家里打扫干净，还折好了衣服。妈妈回家看见整洁的客厅，眼眶湿润了。“谢谢你，小雯。”她轻声说。小雯这才明白，妈妈每天的辛苦，都是深深的爱。从那以后，小雯每天都会帮忙做家务，用行动报答妈妈的养育之恩。",
      posterImageResName: "",
      posterDescription: "",
      photographDescription: "",
      question1: "",
      question2: "",
      question3: "",
      preamblePact: JSON.stringify({
        目的: "表达对母亲的感恩",
        听众: "同学与老师",
        场景: "家庭生活",
        语气: "温馨、感动",
      }),
      readingTips:
        "朗读妈妈说话的部分时要用温柔的语气。'辛苦'、'感谢'等词要读得有感情。注意句子节奏，不要太快。",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "家庭温情 (看图说话)",
      topic: "家庭与孝顺",
      difficulty: "Intermediate",
      isDaily: false,
      preambleText: "请看图后回答问题。",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "一张家庭温馨时光的照片。一个小女孩正在帮妈妈洗碗，妈妈站在旁边微笑着教她正确的方法。餐桌上还有没收拾完的碗碟，墙上挂着全家福照片。爸爸在客厅里看报纸，弟弟在角落里做作业。整个家里干净整洁，阳光从窗户透进来，气氛非常温馨。",
      photographDescription:
        "一张家庭温馨时光的照片。一个小女孩正在帮妈妈洗碗，妈妈站在旁边微笑着教她正确的方法。餐桌上还有没收拾完的碗碟，墙上挂着全家福照片。爸爸在客厅里看报纸，弟弟在角落里做作业。整个家里干净整洁，阳光从窗户透进来，气氛非常温馨。",
      question1: "请描述这张图片里的情景。这个家庭正在做什么？",
      question2: "你在家里会帮父母做什么家务吗？请举例说明。",
      question3: "你认为孩子应该怎样报答父母的养育之恩？",
      preamblePact: "",
      readingTips: "",
      imageSearchSuggestion:
        "Asian family helping mother kitchen Singapore home",
      sbcQ1Type: "description",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },

    // ─── PAIR 3: 友谊与合作 ──────────────────────────────────────────────────
    {
      type: "READING",
      title: "真正的朋友",
      topic: "友谊与合作",
      difficulty: "Intermediate",
      isDaily: false,
      preambleText: "请朗读以下短文，读得清楚又有感情。",
      passageText:
        "期末考试前两天，小伟突然发高烧，只能在家休息。好朋友阿强得知消息后，放学后立刻赶去探望。他带来了课堂笔记，还耐心地为小伟讲解不明白的题目。“你别担心，”阿强说，“我们一起复习，你一定可以的！”小伟感动地点点头，心里涌起一股暖流。考试结束后，两人都取得了好成绩。小伟笑着说：“有你这个朋友，真好！”阿强摆摆手：“朋友嘛，就是要互相帮助。”那一刻，小伟明白了：真正的友谊，不是锦上添花，而是雪中送炭。",
      posterImageResName: "",
      posterDescription: "",
      photographDescription: "",
      question1: "",
      question2: "",
      question3: "",
      preamblePact: JSON.stringify({
        目的: "分享友谊故事",
        听众: "同学",
        场景: "学校生活",
        语气: "真诚、积极",
      }),
      readingTips:
        "读到朋友生病的段落时语气要关切。'友谊'、'帮助'等关键词要清楚发音。结尾要读出温暖与希望的感觉。",
      imageSearchSuggestion: "",
      sbcQ1Type: "",
      sbcQ2Type: "",
      sbcQ3Type: "",
      generatedImageUrl: null,
    },
    {
      type: "STIMULUS",
      title: "携手合作 (看图说话)",
      topic: "友谊与合作",
      difficulty: "Intermediate",
      isDaily: false,
      preambleText: "请看图后回答问题。",
      passageText: "",
      posterImageResName: "",
      posterDescription:
        "一张拍摄于新加坡小学操场的照片。一群穿着蓝白校服的同学正在进行团队接力比赛。跑在最前面的男孩摔倒了，他的两个同伴立刻跑过去扶他起来。旁边的同学们都在加油鼓励。远处的老师也在微笑地观看。照片展现了团结合作和互相关心的精神。",
      photographDescription:
        "一张拍摄于新加坡小学操场的照片。一群穿着蓝白校服的同学正在进行团队接力比赛。跑在最前面的男孩摔倒了，他的两个同伴立刻跑过去扶他起来。旁边的同学们都在加油鼓励。远处的老师也在微笑地观看。照片展现了团结合作和互相关心的精神。",
      question1: "请描述图片里发生了什么事？这些同学表现出了什么精神？",
      question2: "你有没有遇到过需要同学帮助的情况？当时发生了什么事？",
      question3: "你认为合作精神为什么在学习和生活中都很重要？",
      preamblePact: "",
      readingTips: "",
      imageSearchSuggestion:
        "Singapore primary school teamwork relay race students helping",
      sbcQ1Type: "inference",
      sbcQ2Type: "experience",
      sbcQ3Type: "opinion",
      generatedImageUrl: null,
    },
  ];
}
