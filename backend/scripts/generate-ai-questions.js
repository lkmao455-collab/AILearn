const axios = require('axios');
const path = require('path');
const fs = require('fs');

// 加载环境变量
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const db = require('../config/database');

// DashScope API URL
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

// 获取 API Key
const apiKey = process.env.DASHSCOPE_API_KEY;

if (!apiKey) {
  console.error('错误：请设置 DASHSCOPE_API_KEY 环境变量或在 .env 文件中配置');
  process.exit(1);
}

// 人工智能知识点列表
const aiTopics = [
  '人工智能基础概念',
  '人工智能发展史',
  '图灵测试',
  '弱人工智能',
  '强人工智能',
  '超人工智能',
  '人工智能三大学派',
  '符号主义',
  '连接主义',
  '行为主义',
  '机器学习基础',
  '监督学习',
  '无监督学习',
  '强化学习',
  '半监督学习',
  '自监督学习',
  '迁移学习',
  '联邦学习',
  '集成学习',
  '深度学习基础',
  '神经网络基础',
  '感知机',
  '多层感知机',
  '反向传播算法',
  '激活函数',
  'Sigmoid',
  'ReLU',
  'Tanh',
  'Softmax',
  '损失函数',
  '均方误差',
  '交叉熵',
  '优化算法',
  '梯度下降',
  '随机梯度下降',
  'Adam优化器',
  '学习率',
  '学习率调度',
  '批量归一化',
  'Dropout',
  '正则化',
  'L1正则化',
  'L2正则化',
  '早停法',
  '卷积神经网络',
  '卷积层',
  '池化层',
  '全连接层',
  'CNN架构',
  'LeNet',
  'AlexNet',
  'VGGNet',
  'ResNet',
  'Inception',
  'MobileNet',
  'EfficientNet',
  '目标检测',
  'R-CNN',
  'Fast R-CNN',
  'Faster R-CNN',
  'YOLO',
  'SSD',
  '图像分割',
  '语义分割',
  '实例分割',
  'U-Net',
  'Mask R-CNN',
  '循环神经网络',
  'RNN基础',
  'LSTM',
  'GRU',
  '序列到序列',
  '注意力机制',
  '自注意力',
  '多头注意力',
  'Transformer架构',
  'BERT',
  'GPT',
  'T5',
  'ViT',
  '生成模型',
  '生成对抗网络',
  'GAN基础',
  'DCGAN',
  'StyleGAN',
  'CycleGAN',
  '变分自编码器',
  'VAE',
  '扩散模型',
  'Stable Diffusion',
  'DALL-E',
  'Midjourney',
  '自然语言处理',
  'NLP基础',
  '词袋模型',
  'TF-IDF',
  'Word2Vec',
  'GloVe',
  'FastText',
  '词嵌入',
  '词向量',
  '句向量',
  '文档向量',
  '文本分类',
  '情感分析',
  '命名实体识别',
  'NER',
  '词性标注',
  '依存句法分析',
  '语义角色标注',
  '关系抽取',
  '事件抽取',
  '知识图谱',
  '知识表示',
  '知识推理',
  '知识融合',
  '机器翻译',
  '神经机器翻译',
  '文本摘要',
  '抽取式摘要',
  '生成式摘要',
  '问答系统',
  '阅读理解',
  '对话系统',
  '聊天机器人',
  '语音识别',
  '声学模型',
  '语言模型',
  '语音合成',
  'TTS',
  '声纹识别',
  '计算机视觉',
  '图像分类',
  '图像检索',
  '图像生成',
  '图像修复',
  '图像超分辨率',
  '风格迁移',
  '人脸识别',
  '人脸检测',
  '人脸对齐',
  '人脸属性',
  '行人重识别',
  '姿态估计',
  '人体关键点检测',
  '动作识别',
  '视频分析',
  '视频理解',
  '视频生成',
  '多模态学习',
  '视觉语言模型',
  'CLIP',
  '多模态融合',
  '跨模态检索',
  '推荐系统',
  '协同过滤',
  '基于内容的推荐',
  '矩阵分解',
  '深度学习推荐',
  '强化学习基础',
  '马尔可夫决策过程',
  'Q学习',
  'SARSA',
  '策略梯度',
  'Actor-Critic',
  'PPO',
  'DQN',
  'A3C',
  '蒙特卡洛树搜索',
  '博弈论',
  '多智能体系统',
  '自动驾驶',
  '感知系统',
  '决策规划',
  '控制执行',
  '机器人学',
  '运动规划',
  '路径规划',
  'SLAM',
  '机器人视觉',
  '医疗AI',
  '医学影像分析',
  '疾病诊断',
  '药物发现',
  '金融AI',
  '量化交易',
  '风险管理',
  '欺诈检测',
  '信用评估',
  '智能制造',
  '预测性维护',
  '质量检测',
  '工艺优化',
  'AI伦理',
  '算法公平性',
  '数据隐私',
  '模型可解释性',
  'AI安全',
  '对抗攻击',
  '对抗样本',
  '模型鲁棒性',
  'AI治理',
  'AI法规',
  'AI标准',
  '模型部署',
  '模型优化',
  '模型压缩',
  '知识蒸馏',
  '模型量化',
  '模型剪枝',
  '边缘AI',
  'AI芯片',
  'GPU加速',
  'TPU',
  'NPU',
  'CUDA编程',
  '并行计算',
  '分布式训练',
  '数据并行',
  '模型并行',
  '流水线并行',
  '混合精度训练',
  '大模型训练',
  '预训练模型',
  '微调技术',
  '提示工程',
  '零样本学习',
  '少样本学习',
  '上下文学习',
  '思维链',
  'RAG',
  '检索增强生成',
  'AI Agent',
  '智能体',
  '多智能体协作',
  '工具使用',
  'AutoML',
  '神经架构搜索',
  '超参数优化',
  '元学习',
  '小样本学习',
  '持续学习',
  '增量学习',
  '灾难性遗忘',
  '可解释AI',
  'LIME',
  'SHAP',
  '注意力可视化',
  '特征重要性',
  '因果推断',
  '因果发现',
  '因果效应估计',
  '图神经网络',
  'GNN基础',
  '图卷积网络',
  '图注意力网络',
  '图自编码器',
  '时序分析',
  '时间序列预测',
  '异常检测',
  '聚类分析',
  '降维技术',
  'PCA',
  't-SNE',
  'UMAP',
  '异常值检测',
  '数据增强',
  '合成数据',
  '数据标注',
  '主动学习',
  '弱监督学习',
  '噪声标签学习',
  '长尾分布',
  '类别不平衡',
  '采样策略',
  '集成策略',
  '模型融合',
  '投票机制',
  '堆叠泛化',
  '贝叶斯优化',
  '高斯过程',
  '概率图模型',
  '隐马尔可夫模型',
  '条件随机场',
  '主题模型',
  'LDA',
  '词主题模型',
  '文档主题模型',
  '情感计算',
  '多模态情感分析',
  '面部表情识别',
  '语音情感识别',
  '文本情感分析',
  '生物特征识别',
  '指纹识别',
  '虹膜识别',
  '掌纹识别',
  '步态识别',
  '智能搜索',
  '语义搜索',
  '向量搜索',
  '智能问答',
  '开放域问答',
  '知识库问答',
  '社区问答',
  '视觉问答',
  '文档智能',
  'OCR',
  '文档理解',
  '表格识别',
  '版面分析',
  '智能客服',
  '智能外呼',
  '智能质检',
  '智能营销',
  '个性化推荐',
  '用户画像',
  '行为分析',
  'A/B测试',
  '因果推断',
  ' uplift建模',
  '智能运维',
  'AIOps',
  '异常检测',
  '根因分析',
  '容量预测',
  '智能安防',
  '行为识别',
  '入侵检测',
  '人群计数',
  '智能交通',
  '车牌识别',
  '交通流量分析',
  '智能停车',
  '智能零售',
  '商品识别',
  '货架分析',
  '智能试衣',
  '智能物流',
  '路径优化',
  '仓储机器人',
  '无人配送',
  '智能农业',
  '作物识别',
  '病虫害检测',
  '产量预测',
  '智能灌溉',
  '智能教育',
  '自适应学习',
  '知识追踪',
  '自动批改',
  '智能内容生成',
  'AI写作',
  'AI绘画',
  'AI音乐',
  'AI视频',
  '数字人',
  '虚拟主播',
  '元宇宙',
  '数字孪生',
  '仿真技术',
  '科学计算',
  '分子模拟',
  '气候模拟',
  '物理模拟',
  '量子机器学习',
  '神经符号AI',
  '混合智能',
  '类脑计算',
  '神经形态计算',
  '脉冲神经网络',
  '具身智能',
  '机器人学习',
  '模仿学习',
  '逆强化学习',
  '分层强化学习',
  '多任务学习',
  '领域自适应',
  '域泛化',
  '开放集识别',
  '零样本识别',
  '开放词汇识别',
  '视觉语言预训练',
  '对比学习',
  '掩码自编码',
  '数据高效学习',
  '自训练',
  '协同训练',
  '多视图学习',
  '多实例学习',
  '排序学习',
  '学习排序',
  '序列标注',
  '结构化预测',
  '图生成',
  '图匹配',
  '图分类',
  '链接预测',
  '节点分类',
  '社区发现',
  '网络嵌入',
  '动态图学习',
  '时空图学习',
  '超图学习',
  '异构图学习',
  '知识图谱嵌入',
  '知识图谱补全',
  '实体对齐',
  '关系预测',
  '时序知识图谱',
  '多模态知识图谱',
  '神经定理证明',
  '神经程序合成',
  '神经代码生成',
  '程序分析',
  '漏洞检测',
  '软件测试',
  '测试用例生成',
  '缺陷预测',
  '代码克隆检测',
  '代码摘要',
  '代码搜索',
  'API推荐',
  '类型推断',
  '程序修复',
  '自动调试',
  '智能合约安全',
  '区块链分析',
  '加密货币预测',
  'NFT分析',
  'DeFi协议',
  'DAO治理',
  'AI for Science',
  '蛋白质结构预测',
  'AlphaFold',
  '药物分子生成',
  '材料发现',
  '气候建模',
  '天气预报',
  '地震预测',
  '天文数据分析',
  '高能物理',
  '量子化学',
  '计算生物学',
  '系统生物学',
  '合成生物学',
  '基因编辑',
  '单细胞分析',
  '空间转录组',
  '医学影像分割',
  '病灶检测',
  '生存分析',
  '临床决策支持',
  '电子病历分析',
  '医学知识图谱',
  '药物相互作用',
  '不良反应预测',
  '临床试验优化',
  '精准医疗',
  '个性化治疗',
  '基因组学',
  '蛋白质组学',
  '代谢组学',
  '多组学整合',
  '健康监测',
  '可穿戴设备',
  '远程医疗',
  '心理健康AI',
  '认知评估',
  '康复机器人',
  '手术机器人',
  '护理机器人',
  '陪伴机器人',
  '服务机器人',
  '工业机器人',
  '协作机器人',
  '无人机',
  '无人车',
  '无人船',
  '智能传感器',
  '边缘计算',
  '雾计算',
  '云边协同',
  '端侧智能',
  'TinyML',
  '模型轻量化',
  '神经网络架构',
  'MobileNet系列',
  'ShuffleNet',
  'SqueezeNet',
  'EfficientNet系列',
  'Transformer变体',
  'Vision Transformer',
  'Swin Transformer',
  'DETR',
  'DeiT',
  'BEiT',
  'MAE',
  'CLIP变体',
  'ALIGN',
  'BLIP',
  'LLaVA',
  'MiniGPT-4',
  '多模态大模型',
  'GPT-4V',
  'Gemini',
  'Qwen-VL',
  'Yi-VL',
  'InternVL',
  '语音大模型',
  'Whisper',
  '语音合成大模型',
  '音乐生成',
  'Mubert',
  'Suno',
  'Udio',
  '视频生成',
  'Sora',
  'Pika',
  'Runway',
  '视频理解',
  '视频大模型',
  '3D生成',
  'NeRF',
  'Gaussian Splatting',
  '3D重建',
  '点云处理',
  '网格生成',
  '纹理合成',
  '数字人生成',
  'Talking Head',
  '动作生成',
  '手势生成',
  '表情生成',
  '虚拟试衣',
  '虚拟化妆',
  'AI换脸',
  'Deepfake检测',
  '生成内容检测',
  'AI水印',
  '内容溯源',
  '模型水印',
  '模型指纹',
  '模型所有权验证',
  '模型窃取检测',
  '模型逆向防御',
  '隐私保护机器学习',
  '差分隐私',
  '同态加密',
  '安全多方计算',
  '可信执行环境',
  '联邦学习隐私',
  '模型可审计性',
  'AI透明度',
  'AI问责制',
  'AI影响评估',
  'AI风险评估',
  'AI红队测试',
  'AI蓝队防御',
  'AI安全框架',
  'AI伦理框架',
  'AI治理框架',
  '负责任AI',
  '可持续AI',
  '绿色AI',
  'AI碳足迹',
  '高效AI',
  '硬件感知神经网络设计',
  '神经架构搜索硬件优化',
  '动态神经网络',
  '条件计算',
  '早退机制',
  '自适应计算',
  '神经渲染',
  '神经辐射场',
  '神经纹理',
  '神经材质',
  '神经光照',
  '神经反射',
  '神经阴影',
  '神经去噪',
  '神经超采样',
  '神经风格迁移',
  '神经图像编辑',
  '神经图像修复',
  '神经图像增强',
  '神经视频处理',
  '神经视频压缩',
  '神经视频插帧',
  '神经视频稳定',
  '神经音频处理',
  '神经音频增强',
  '神经音频分离',
  '神经音频合成',
  '神经音乐生成',
  '神经语音转换',
  '神经语音克隆',
  '神经文本到语音',
  '神经语音到文本',
  '神经机器翻译',
  '神经文本摘要',
  '神经文本生成',
  '神经对话生成',
  '神经故事生成',
  '神经诗歌生成',
  '神经代码生成',
  '神经程序合成',
  '神经定理证明',
  '神经符号推理',
  '神经逻辑推理',
  '神经常识推理',
  '神经因果推理',
  '神经数学推理',
  '神经科学推理',
  '神经法律推理',
  '神经医疗推理',
  '神经金融推理',
  '神经教育推理',
  '神经创意生成',
  '神经设计生成',
  '神经建筑生成',
  '神经时尚生成',
  '神经游戏生成',
  '神经关卡生成',
  '神经角色生成',
  '神经剧情生成',
  '神经对话树生成',
  '神经任务生成',
  '神经谜题生成',
  '神经测试生成',
  '神经数据生成',
  '神经合成数据',
  '神经数据增强',
  '神经数据清洗',
  '神经数据标注',
  '神经数据验证',
  '神经数据融合',
  '神经数据挖掘',
  '神经知识发现',
  '神经模式识别',
  '神经异常检测',
  '神经预测分析',
  '神经决策支持',
  '神经优化求解',
  '神经组合优化',
  '神经约束满足',
  '神经规划求解',
  '神经调度优化',
  '神经资源分配',
  '神经路由优化',
  '神经负载均衡',
  '神经缓存优化',
  '神经内存优化',
  '神经存储优化',
  '神经网络优化',
  '神经计算优化',
  '神经能耗优化',
  '神经延迟优化',
  '神经吞吐量优化',
  '神经可靠性优化',
  '神经安全性优化',
  '神经隐私优化',
  '神经公平性优化',
  '神经可解释性优化',
  '神经鲁棒性优化',
  '神经泛化性优化',
  '神经效率优化',
  '神经效果优化',
  '神经性能优化',
  '神经质量优化',
  '神经用户体验优化',
  '神经商业价值优化',
  '神经社会影响优化',
  '神经环境影响优化',
  '神经伦理合规优化',
  '神经可持续发展优化',
  '神经未来适应性优化'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位人工智能领域的专家教师。请生成一道${diffLabel}关于"人工智能 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察人工智能的实际知识和理论概念
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际AI应用场景
5. 可以包含代码示例或实际应用场景

请严格按照以下 JSON 格式返回（不要包含其他内容）：
{
  "question": "题目内容",
  "options": ["A. 选项内容", "B. 选项内容", "C. 选项内容", "D. 选项内容"],
  "answer": "正确答案（A/B/C/D）",
  "explanation": "详细解析"
}`;

  try {
    const response = await axios.post(
      `${DASHSCOPE_API_URL}/chat/completions`,
      {
        model: 'qwen-vl-plus',
        messages: [
          { role: 'system', content: '你是一位专业的人工智能教师，擅长出高质量的选择题。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );

    const aiContent = response.data.choices[0].message.content;

    // 解析 JSON
    let generatedQuestion;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedQuestion = JSON.parse(jsonMatch[0]);
      } else {
        generatedQuestion = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error('解析 JSON 失败:', parseError);
      return null;
    }

    // 验证格式
    if (!generatedQuestion.question || !generatedQuestion.options || 
        !generatedQuestion.answer || !generatedQuestion.explanation) {
      console.error('题目格式不完整');
      return null;
    }

    return generatedQuestion;
  } catch (error) {
    console.error('生成题目失败:', error.message);
    return null;
  }
}

// 保存题目到数据库
function saveQuestion(question, topic, difficulty) {
  try {
    // 获取最大 ID
    const maxId = db.prepare('SELECT MAX(id) as maxId FROM questions').get().maxId || 0;
    const newId = maxId + 1;

    db.prepare(`
      INSERT INTO questions (id, topic, subtopic, difficulty, question, options, answer, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      '人工智能',
      topic,
      difficulty,
      question.question,
      JSON.stringify(question.options),
      question.answer,
      question.explanation
    );

    return newId;
  } catch (error) {
    console.error('保存题目失败:', error);
    return null;
  }
}

// 主函数
async function main() {
  console.log('开始生成 200 道人工智能题目...\n');
  console.log('难度分布：简单 100 道，中等 50 道，困难 50 道\n');
  
  const distribution = [
    { difficulty: 'easy', count: 100, label: '简单' },
    { difficulty: 'medium', count: 50, label: '中等' },
    { difficulty: 'hard', count: 50, label: '困难' }
  ];
  
  let totalSuccess = 0;
  let totalFail = 0;
  
  for (const config of distribution) {
    console.log(`\n========== 开始生成 ${config.label} 题目 (${config.count} 道) ==========\n`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < config.count; i++) {
      const topic = aiTopics[Math.floor(Math.random() * aiTopics.length)];
      
      console.log(`[${i + 1}/${config.count}] 生成${config.label}题目: ${topic}`);
      
      const question = await generateSingleQuestion(topic, config.difficulty);
      
      if (question) {
        const id = saveQuestion(question, topic, config.difficulty);
        if (id) {
          console.log(`  ✓ 保存成功，ID: ${id}`);
          successCount++;
          totalSuccess++;
        } else {
          console.log(`  ✗ 保存失败`);
          failCount++;
          totalFail++;
        }
      } else {
        console.log(`  ✗ 生成失败`);
        failCount++;
        totalFail++;
      }
      
      // 添加延迟避免请求过快
      if (i < config.count - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`\n${config.label}题目完成：成功 ${successCount} 道，失败 ${failCount} 道`);
  }
  
  console.log('\n========================================');
  console.log('生成完成！');
  console.log(`总计成功: ${totalSuccess} 道`);
  console.log(`总计失败: ${totalFail} 道`);
  console.log('========================================');
}

// 运行
main().catch(console.error);