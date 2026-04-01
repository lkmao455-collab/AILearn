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

// 阿里云人工智能工程师ACA认证知识点列表（500个知识点）
const aliyunAcaAiTopics = [
  // 人工智能基础
  '人工智能概述',
  '人工智能发展历程',
  '人工智能应用领域',
  '机器学习基础',
  '监督学习',
  '无监督学习',
  '强化学习',
  '深度学习基础',
  '神经网络基础',
  '感知机',
  '多层感知机',
  '激活函数',
  '损失函数',
  '优化算法',
  '梯度下降',
  '随机梯度下降',
  '反向传播算法',
  '过拟合与欠拟合',
  '正则化技术',
  '交叉验证',
  '模型评估指标',
  '混淆矩阵',
  '准确率',
  '精确率',
  '召回率',
  'F1分数',
  'ROC曲线',
  'AUC值',
  '特征工程',
  '特征选择',
  '特征提取',
  '数据预处理',
  '数据清洗',
  '数据归一化',
  '数据标准化',
  '数据增强',
  '数据标注',
  '数据集划分',
  '训练集',
  '验证集',
  '测试集',
  
  // 阿里云AI平台PAI
  '阿里云PAI概述',
  'PAI-Studio可视化建模',
  'PAI-DSW交互式建模',
  'PAI-DLC深度学习训练',
  'PAI-EAS模型在线服务',
  'PAI-AutoLearning自动学习',
  'PAI-FeatureStore特征平台',
  'PAI-Alink算法平台',
  'PAI-Blade模型推理加速',
  'PAI工作空间',
  'PAI项目创建',
  'PAI数据集管理',
  'PAI实验管理',
  'PAI模型管理',
  'PAI服务部署',
  'PAI资源组管理',
  'PAI计费方式',
  'PAI权限管理',
  'PAI与OSS集成',
  'PAI与MaxCompute集成',
  'PAI与DataWorks集成',
  
  // 阿里云机器学习平台
  '阿里云机器学习平台概述',
  'MaxCompute机器学习',
  'MaxCompute SQL ML',
  'MaxCompute PyODPS',
  'MaxCompute Mars',
  'DataWorks机器学习',
  'DataWorks数据开发',
  'DataWorks数据集成',
  'DataWorks数据治理',
  'DataWorks数据服务',
  '阿里云机器学习PAI-DSW',
  'PAI-DSW Notebook',
  'PAI-DSW Terminal',
  'PAI-DSW 环境配置',
  'PAI-DSW 资源管理',
  'PAI-DSW 镜像管理',
  'PAI-DSW 数据挂载',
  'PAI-DSW 代码版本控制',
  
  // 深度学习框架
  'TensorFlow基础',
  'TensorFlow架构',
  'TensorFlow计算图',
  'TensorFlow会话',
  'TensorFlow变量',
  'TensorFlow占位符',
  'TensorFlow张量',
  'TensorFlow Keras',
  'TensorFlow 2.x特性',
  'TensorFlow模型保存',
  'TensorFlow模型加载',
  'TensorFlow模型部署',
  'PyTorch基础',
  'PyTorch张量',
  'PyTorch自动求导',
  'PyTorch神经网络',
  'PyTorch优化器',
  'PyTorch数据加载',
  'PyTorch模型保存',
  'PyTorch模型加载',
  'PyTorch模型部署',
  'PyTorch与ONNX',
  'MXNet基础',
  'Caffe基础',
  'PaddlePaddle基础',
  'MindSpore基础',
  '深度学习框架对比',
  '框架选择指南',
  
  // 计算机视觉
  '计算机视觉概述',
  '图像分类',
  '目标检测',
  '图像分割',
  '语义分割',
  '实例分割',
  '全景分割',
  '图像识别',
  '人脸识别',
  '人脸检测',
  '人脸关键点',
  '人脸属性',
  '人脸比对',
  '人脸搜索',
  '活体检测',
  'OCR文字识别',
  '通用文字识别',
  '表格识别',
  '卡证识别',
  '票据识别',
  '车牌识别',
  '驾驶证识别',
  '行驶证识别',
  '身份证识别',
  '营业执照识别',
  '银行卡识别',
  '护照识别',
  '发票识别',
  '文档结构化',
  '图像增强',
  '图像去噪',
  '图像超分',
  '图像修复',
  '图像风格迁移',
  '图像生成',
  'GAN生成对抗网络',
  '图像检索',
  '以图搜图',
  '视频分析',
  '视频分类',
  '视频目标检测',
  '视频跟踪',
  '行为识别',
  '姿态估计',
  '人体关键点',
  '手势识别',
  '阿里云视觉智能',
  '阿里云图像识别',
  '阿里云人脸识别',
  '阿里云OCR',
  '阿里云视频分析',
  
  // 自然语言处理
  '自然语言处理概述',
  '文本分类',
  '情感分析',
  '命名实体识别',
  '词性标注',
  '分词',
  '关键词提取',
  '文本摘要',
  '机器翻译',
  '问答系统',
  '对话系统',
  '聊天机器人',
  '文本生成',
  '语言模型',
  'N-gram模型',
  'Word2Vec',
  'GloVe',
  'FastText',
  'BERT模型',
  'GPT模型',
  'Transformer架构',
  '注意力机制',
  '自注意力机制',
  '多头注意力',
  '位置编码',
  '预训练模型',
  '微调技术',
  'Prompt工程',
  'Few-shot学习',
  'Zero-shot学习',
  '文本相似度',
  '语义匹配',
  '文本聚类',
  '主题模型',
  'LDA主题模型',
  '知识图谱',
  '实体链接',
  '关系抽取',
  '事件抽取',
  '阿里云NLP',
  '阿里云文本分析',
  '阿里云机器翻译',
  '阿里云智能客服',
  
  // 语音识别与合成
  '语音识别概述',
  '语音合成概述',
  'ASR自动语音识别',
  'TTS文本转语音',
  '声纹识别',
  '语音唤醒',
  '语音合成标记语言',
  '语音合成音色',
  '语音合成情感',
  '实时语音识别',
  '一句话识别',
  '录音文件识别',
  '语音合成长文本',
  '语音合成流式播放',
  '语音合成自定义词库',
  '阿里云智能语音',
  '阿里云语音识别',
  '阿里云语音合成',
  '阿里云声纹识别',
  
  // 大模型与AIGC
  '大语言模型概述',
  '大模型训练',
  '大模型微调',
  '大模型推理',
  '大模型部署',
  '大模型量化',
  '大模型蒸馏',
  '大模型评估',
  '大模型安全',
  '大模型伦理',
  'AIGC概述',
  '文本生成',
  '图像生成',
  '代码生成',
  '音乐生成',
  '视频生成',
  '多模态生成',
  'Stable Diffusion',
  'Midjourney',
  'DALL-E',
  'ChatGPT',
  'GPT-4',
  'Claude',
  '文心一言',
  '通义千问',
  '通义千问API',
  '通义千问应用',
  '通义万相',
  '通义听悟',
  '通义灵码',
  '阿里云百炼',
  '阿里云大模型服务',
  '阿里云模型广场',
  '阿里云Agent服务',
  'RAG检索增强生成',
  '向量数据库',
  'Embedding向量',
  '语义搜索',
  '知识库构建',
  '智能文档处理',
  
  // 阿里云AI产品
  '阿里云AI产品体系',
  '阿里云机器学习PAI',
  '阿里云视觉智能',
  '阿里云智能语音交互',
  '阿里云自然语言处理',
  '阿里云大模型服务',
  '阿里云智能客服',
  '阿里云智能推荐',
  '阿里云图像搜索',
  '阿里云视频内容理解',
  '阿里云内容安全',
  '阿里云数据智能',
  '阿里云DataV数据可视化',
  '阿里云Quick BI',
  '阿里云OpenSearch',
  '阿里云Elasticsearch',
  '阿里云实时计算Flink',
  '阿里云数据湖分析',
  '阿里云Hologres',
  '阿里云AnalyticDB',
  '阿里云ClickHouse',
  '阿里云图数据库',
  '阿里云知识图谱',
  
  // MLOps与模型管理
  'MLOps概述',
  '机器学习生命周期',
  '模型版本管理',
  '模型实验跟踪',
  '模型注册中心',
  '模型部署策略',
  'A/B测试',
  '模型监控',
  '模型漂移检测',
  '模型性能监控',
  '模型自动更新',
  'CI/CD for ML',
  '特征存储',
  '特征工程自动化',
  'AutoML自动机器学习',
  '超参数优化',
  '神经网络架构搜索',
  '模型压缩',
  '模型剪枝',
  '模型量化',
  '知识蒸馏',
  '模型解释性',
  'SHAP值',
  'LIME解释',
  '特征重要性',
  '阿里云MLOps',
  'PAI模型管理',
  'PAI模型监控',
  
  // 数据智能与大数据
  '大数据概述',
  '阿里云大数据平台',
  'MaxCompute',
  'MaxCompute SQL',
  'MaxCompute Tunnel',
  'MaxCompute Graph',
  'DataWorks',
  'DataWorks数据开发',
  'DataWorks数据集成',
  'DataWorks数据治理',
  'DataWorks数据质量',
  'DataWorks数据服务',
  'DataWorks调度',
  'DataWorks运维',
  'OSS对象存储',
  'OSS数据湖',
  'OSS生命周期管理',
  'OSS数据迁移',
  'TableStore',
  'HBase',
  'RDS',
  'PolarDB',
  'AnalyticDB',
  'Hologres',
  'Flink',
  'Flink SQL',
  'Flink DataStream',
  'Flink Table API',
  'Flink窗口',
  'Flink状态',
  'Flink Checkpoint',
  'Flink Savepoint',
  'Blink',
  '实时计算',
  '离线计算',
  '流批一体',
  '数据仓库',
  '数据湖',
  '湖仓一体',
  '数据治理',
  '数据质量',
  '数据安全',
  '数据脱敏',
  '数据权限',
  '数据血缘',
  '数据资产',
  
  // 云原生与部署
  '阿里云ECS',
  '阿里云容器服务ACK',
  'Kubernetes基础',
  'Docker容器',
  '容器镜像',
  '容器编排',
  'Serverless',
  '函数计算FC',
  'SAEServerless应用引擎',
  '阿里云API网关',
  '阿里云SLB',
  '阿里云OSS',
  '阿里云CDN',
  '阿里云WAF',
  '阿里云DDoS防护',
  '阿里云云监控',
  '阿里云日志服务SLS',
  '阿里云ARMS应用监控',
  '阿里云Prometheus',
  '阿里云Grafana',
  '模型服务部署',
  '模型在线推理',
  '模型离线推理',
  '模型弹性伸缩',
  '模型灰度发布',
  '模型蓝绿部署',
  '模型金丝雀发布',
  
  // AI工程实践
  'AI项目流程',
  '需求分析',
  '数据收集',
  '数据标注',
  '模型选型',
  '模型训练',
  '模型调优',
  '模型评估',
  '模型部署',
  '模型运维',
  'AI产品化',
  'AI解决方案',
  '行业AI应用',
  '金融AI',
  '医疗AI',
  '零售AI',
  '制造AI',
  '教育AI',
  '政务AI',
  '交通AI',
  '物流AI',
  '安防AI',
  '内容AI',
  '智能客服',
  '智能推荐',
  '智能搜索',
  '智能营销',
  '智能风控',
  '智能运维',
  '智能办公',
  'AI伦理',
  'AI安全',
  'AI合规',
  'AI可解释性',
  'AI偏见',
  'AI隐私保护',
  '联邦学习',
  '差分隐私',
  '安全多方计算',
  '可信AI',
  '负责任AI',
  
  // 阿里云认证相关
  '阿里云认证体系',
  '阿里云ACA认证',
  '阿里云ACP认证',
  '阿里云ACE认证',
  '人工智能工程师认证',
  '机器学习工程师认证',
  '大数据工程师认证',
  '云计算工程师认证',
  '认证考试大纲',
  '认证考试题型',
  '认证考试准备',
  '认证考试技巧',
  '阿里云官方文档',
  '阿里云最佳实践',
  '阿里云解决方案',
  '阿里云案例学习',
  '阿里云产品更新',
  '阿里云新特性',
  '阿里云定价',
  '阿里云计费',
  '阿里云配额',
  '阿里云限制',
  '阿里云SLA',
  '阿里云技术支持',
  '阿里云社区',
  '阿里云开发者中心',
  '阿里云学习路径',
  '阿里云培训课程',
  '阿里云实验环境',
  '阿里云沙箱环境',
  '阿里云免费试用',
  '阿里云学生优惠',
  '阿里云企业支持'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位阿里云人工智能工程师ACA认证培训专家。请生成一道${diffLabel}关于"阿里云人工智能工程师ACA认证 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，符合阿里云ACA认证考试标准
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近阿里云AI产品实际应用场景
5. 涉及阿里云产品时，使用准确的产品名称和功能描述

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
        model: 'qwen-max',
        messages: [
          { role: 'system', content: '你是一位专业的阿里云人工智能工程师ACA认证培训讲师，擅长出高质量的认证考试题目。' },
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
      '阿里云ACA-AI',
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
  console.log('开始生成 500 道 阿里云人工智能工程师ACA认证 题目...\n');
  
  const totalQuestions = 500;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = aliyunAcaAiTopics[Math.floor(Math.random() * aliyunAcaAiTopics.length)];
    const difficulties = ['easy', 'medium', 'hard'];
    const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    
    console.log(`[${i + 1}/${totalQuestions}] 生成题目: ${topic} (${difficulty})`);
    
    const question = await generateSingleQuestion(topic, difficulty);
    
    if (question) {
      const id = saveQuestion(question, topic, difficulty);
      if (id) {
        console.log(`  ✓ 保存成功，ID: ${id}`);
        successCount++;
      } else {
        console.log(`  ✗ 保存失败`);
        failCount++;
      }
    } else {
      console.log(`  ✗ 生成失败`);
      failCount++;
    }
    
    // 添加延迟避免请求过快
    if (i < totalQuestions - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n========================================');
  console.log('生成完成！');
  console.log(`成功: ${successCount} 道`);
  console.log(`失败: ${failCount} 道`);
  console.log('========================================');
}

// 运行
main().catch(console.error);
