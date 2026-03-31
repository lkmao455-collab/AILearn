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

// 机器学习知识点列表
const mlTopics = [
  '机器学习基础概念',
  '监督学习',
  '无监督学习',
  '半监督学习',
  '强化学习',
  '自监督学习',
  '迁移学习',
  '联邦学习',
  '集成学习',
  '多任务学习',
  '元学习',
  '小样本学习',
  '零样本学习',
  '特征工程',
  '特征选择',
  '特征提取',
  '特征缩放',
  '标准化',
  '归一化',
  '数据预处理',
  '数据清洗',
  '数据增强',
  '数据采样',
  '过采样',
  '欠采样',
  'SMOTE',
  '数据划分',
  '训练集',
  '验证集',
  '测试集',
  '交叉验证',
  'K折交叉验证',
  '留一法',
  '模型评估',
  '准确率',
  '精确率',
  '召回率',
  'F1分数',
  'ROC曲线',
  'AUC',
  '混淆矩阵',
  '均方误差',
  '均方根误差',
  '平均绝对误差',
  'R²分数',
  '对数损失',
  'Hinge损失',
  '过拟合',
  '欠拟合',
  '偏差-方差权衡',
  '正则化',
  'L1正则化',
  'L2正则化',
  '弹性网络',
  'Dropout',
  '早停法',
  '数据增强',
  '模型选择',
  '超参数调优',
  '网格搜索',
  '随机搜索',
  '贝叶斯优化',
  '遗传算法',
  '梯度下降',
  '批量梯度下降',
  '随机梯度下降',
  '小批量梯度下降',
  '动量法',
  'AdaGrad',
  'RMSprop',
  'Adam',
  'AdamW',
  '学习率调度',
  '学习率衰减',
  '余弦退火',
  '线性回归',
  '多项式回归',
  '岭回归',
  'Lasso回归',
  '弹性网络回归',
  '逻辑回归',
  'Softmax回归',
  '支持向量机',
  'SVM',
  '核函数',
  '线性核',
  '多项式核',
  'RBF核',
  '决策树',
  'ID3算法',
  'C4.5算法',
  'CART算法',
  '信息增益',
  '信息增益比',
  '基尼指数',
  '剪枝',
  '预剪枝',
  '后剪枝',
  '随机森林',
  'Bagging',
  'Boosting',
  'AdaBoost',
  'GBDT',
  'XGBoost',
  'LightGBM',
  'CatBoost',
  'K近邻算法',
  'KNN',
  '距离度量',
  '欧氏距离',
  '曼哈顿距离',
  '闵可夫斯基距离',
  '余弦相似度',
  '马氏距离',
  '朴素贝叶斯',
  '高斯朴素贝叶斯',
  '多项式朴素贝叶斯',
  '伯努利朴素贝叶斯',
  '贝叶斯定理',
  '先验概率',
  '后验概率',
  '似然函数',
  'K均值聚类',
  'K-Means',
  'K-Means++',
  '层次聚类',
  '凝聚聚类',
  '分裂聚类',
  'DBSCAN',
  '密度聚类',
  'OPTICS',
  '高斯混合模型',
  'GMM',
  'EM算法',
  '期望最大化',
  '主成分分析',
  'PCA',
  '线性判别分析',
  'LDA',
  't-SNE',
  'UMAP',
  '流形学习',
  'Isomap',
  'LLE',
  '谱聚类',
  '关联规则',
  'Apriori算法',
  'FP-Growth',
  '支持度',
  '置信度',
  '提升度',
  '神经网络基础',
  '感知机',
  '多层感知机',
  'MLP',
  '前馈神经网络',
  '反向传播',
  '激活函数',
  'Sigmoid',
  'Tanh',
  'ReLU',
  'Leaky ReLU',
  'PReLU',
  'ELU',
  'SELU',
  'Softmax',
  'Swish',
  'GELU',
  '损失函数',
  '均方误差',
  '交叉熵',
  '二元交叉熵',
  '分类交叉熵',
  'Hinge损失',
  'Huber损失',
  'KL散度',
  '卷积神经网络',
  'CNN',
  '卷积层',
  '池化层',
  '全连接层',
  '批归一化',
  '残差连接',
  'LeNet',
  'AlexNet',
  'VGGNet',
  'ResNet',
  'Inception',
  'MobileNet',
  'EfficientNet',
  '循环神经网络',
  'RNN',
  'LSTM',
  'GRU',
  '双向RNN',
  '序列到序列',
  'Seq2Seq',
  '注意力机制',
  '自注意力',
  '多头注意力',
  'Transformer',
  'BERT',
  'GPT',
  'T5',
  '生成对抗网络',
  'GAN',
  '生成器',
  '判别器',
  'DCGAN',
  'CGAN',
  'CycleGAN',
  'StyleGAN',
  'WGAN',
  '变分自编码器',
  'VAE',
  '自编码器',
  '去噪自编码器',
  '稀疏自编码器',
  '时间序列分析',
  'ARIMA',
  '指数平滑',
  'Prophet',
  '异常检测',
  '孤立森林',
  'One-Class SVM',
  '局部异常因子',
  '推荐系统',
  '协同过滤',
  '基于内容的推荐',
  '矩阵分解',
  'SVD',
  'NMF',
  '深度学习推荐',
  'Wide&Deep',
  'DeepFM',
  '文本分类',
  '情感分析',
  '命名实体识别',
  '词性标注',
  '机器翻译',
  '文本摘要',
  '问答系统',
  '词嵌入',
  'Word2Vec',
  'GloVe',
  'FastText',
  'ELMo',
  '模型部署',
  '模型优化',
  '模型压缩',
  '知识蒸馏',
  '模型量化',
  '模型剪枝',
  'ONNX',
  'TensorRT',
  'OpenVINO',
  'AutoML',
  '神经架构搜索',
  'NAS',
  '超参数优化',
  'Auto-sklearn',
  'TPOT',
  'H2O',
  '可解释机器学习',
  'LIME',
  'SHAP',
  '特征重要性',
  '部分依赖图',
  '累积局部效应',
  '因果推断',
  '因果发现',
  '因果效应估计',
  '工具变量',
  '双重差分',
  '倾向得分匹配',
  '图神经网络',
  'GNN',
  'GCN',
  'GAT',
  'GraphSAGE',
  '强化学习基础',
  '马尔可夫决策过程',
  'MDP',
  '策略',
  '价值函数',
  'Q函数',
  'V函数',
  '贝尔曼方程',
  '动态规划',
  '蒙特卡洛方法',
  '时序差分',
  'SARSA',
  'Q-Learning',
  'DQN',
  '策略梯度',
  'REINFORCE',
  'Actor-Critic',
  'A3C',
  'PPO',
  'TRPO',
  '多智能体强化学习',
  '模仿学习',
  '逆强化学习',
  '分层强化学习',
  '模型预测控制',
  'MPC',
  '贝叶斯机器学习',
  '高斯过程',
  '贝叶斯优化',
  '变分推断',
  'MCMC',
  '概率图模型',
  '隐马尔可夫模型',
  'HMM',
  '条件随机场',
  'CRF',
  '主题模型',
  'LDA',
  '概率PCA',
  '因子分析',
  '独立成分分析',
  'ICA',
  '非负矩阵分解',
  '度量学习',
  '对比学习',
  '孪生网络',
  'Triplet Loss',
  '原型学习',
  '度量嵌入',
  '多标签学习',
  '多类别学习',
  '类别不平衡',
  '代价敏感学习',
  '排序学习',
  'Learning to Rank',
  'Pointwise',
  'Pairwise',
  'Listwise',
  '在线学习',
  '增量学习',
  '持续学习',
  '终身学习',
  '灾难性遗忘',
  '知识蒸馏',
  '网络压缩',
  '参数共享',
  '网络剪枝',
  '量化感知训练',
  '后训练量化',
  '混合精度训练',
  '分布式训练',
  '数据并行',
  '模型并行',
  '流水线并行',
  'ZeRO',
  'DeepSpeed',
  'Horovod',
  'Ray',
  '特征哈希',
  '特征交叉',
  'FM',
  'FFM',
  '特征选择方法',
  '过滤法',
  '包装法',
  '嵌入法',
  '递归特征消除',
  '稳定性选择',
  'L1正则化选择',
  '树模型重要性',
  '排列重要性',
  'SHAP重要性',
  '模型融合',
  '投票法',
  '平均法',
  '加权平均',
  '堆叠法',
  'Blending',
  'Snapshot Ensembles',
  'Monte Carlo Dropout',
  '测试时增强',
  '伪标签',
  '自训练',
  '协同训练',
  '多视图学习',
  '多实例学习',
  '弱监督学习',
  '噪声标签学习',
  '置信学习',
  '课程学习',
  '自步学习',
  '对抗训练',
  '对抗样本',
  '对抗防御',
  'FGSM',
  'PGD',
  'CW攻击',
  'DeepFool',
  '模型鲁棒性',
  '认证防御',
  '随机平滑',
  '差分隐私',
  '联邦学习隐私',
  '安全聚合',
  '同态加密',
  '安全多方计算',
  '可信执行环境',
  '模型可解释性',
  '概念激活向量',
  'TCAV',
  '概念瓶颈模型',
  '原型网络',
  '注意力可视化',
  'Grad-CAM',
  'LRP',
  'Integrated Gradients',
  'SmoothGrad',
  'NoiseGrad',
  '特征归因',
  'Shapley值',
  '核SHAP',
  '树SHAP',
  'DeepSHAP',
  '模型蒸馏',
  '教师模型',
  '学生模型',
  '软标签',
  '温度缩放',
  '注意力迁移',
  '特征迁移',
  '关系迁移',
  '响应蒸馏',
  '特征蒸馏',
  '自蒸馏',
  '在线蒸馏',
  '互学习',
  '深度互学习',
  ' born-again网络',
  '序列蒸馏',
  '任务特定蒸馏',
  '层自适应蒸馏',
  '自适应蒸馏',
  '渐进式蒸馏',
  '多教师蒸馏',
  '跨模态蒸馏',
  '跨任务蒸馏',
  '跨域蒸馏',
  '零样本蒸馏',
  '数据-free蒸馏',
  '生成式蒸馏',
  '对抗蒸馏',
  '互蒸馏',
  '自监督蒸馏',
  '对比蒸馏',
  '图蒸馏',
  '知识图谱蒸馏',
  '神经架构搜索蒸馏',
  '自动化机器学习',
  '神经架构搜索',
  '超参数优化',
  '元学习',
  '学习优化器',
  '权重初始化',
  'Xavier初始化',
  'He初始化',
  '正交初始化',
  '批归一化初始化',
  '层归一化',
  '组归一化',
  '实例归一化',
  '谱归一化',
  '权重标准化',
  '梯度裁剪',
  '梯度累积',
  '混合精度',
  'FP16',
  'BF16',
  '自动混合精度',
  '分布式数据并行',
  '分布式模型并行',
  '流水线并行',
  '张量并行',
  '序列并行',
  '3D并行',
  'ZeRO优化',
  'ZeRO-1',
  'ZeRO-2',
  'ZeRO-3',
  'ZeRO-Infinity',
  'Offload',
  'Checkpoint',
  'Activation Checkpoint',
  'Gradient Checkpoint',
  '内存优化',
  '计算图优化',
  '算子融合',
  'Kernel优化',
  '编译优化',
  'XLA',
  'TVM',
  'MLIR',
  'ONNX Runtime',
  'TensorRT',
  'OpenVINO',
  'Core ML',
  '模型服务',
  '模型版本管理',
  '模型监控',
  '模型漂移',
  '数据漂移',
  '概念漂移',
  'A/B测试',
  '影子部署',
  '金丝雀发布',
  '蓝绿部署',
  '模型回滚',
  '模型热更新',
  '模型缓存',
  '模型预热',
  '批处理推理',
  '流式推理',
  '异步推理',
  '实时推理',
  '边缘推理',
  '移动端推理',
  'Web推理',
  '模型量化部署',
  'INT8推理',
  'INT4推理',
  'FP16推理',
  '动态量化',
  '静态量化',
  '感知量化',
  '量化感知训练',
  '后训练量化',
  'KL散度量化',
  '最小最大值量化',
  '对称量化',
  '非对称量化',
  '逐层量化',
  '逐通道量化',
  '逐张量量化',
  '混合精度量化',
  '自适应量化',
  '学习量化',
  '可微量化',
  '量化误差补偿',
  '量化校准',
  '量化感知微调',
  '量化感知蒸馏',
  '量化感知剪枝',
  '量化感知NAS',
  '硬件感知量化',
  '硬件感知剪枝',
  '硬件感知NAS',
  '硬件感知蒸馏',
  '硬件感知训练',
  '硬件感知部署',
  '硬件感知优化',
  '硬件感知设计',
  '硬件感知架构',
  '硬件感知调度',
  '硬件感知分配',
  '硬件感知路由',
  '硬件感知负载均衡',
  '硬件感知弹性伸缩',
  '硬件感知容错',
  '硬件感知高可用',
  '硬件感知监控',
  '硬件感知告警',
  '硬件感知日志',
  '硬件感知追踪',
  '硬件感知分析',
  '硬件感知诊断',
  '硬件感知预测',
  '硬件感知决策',
  '硬件感知控制',
  '硬件感知执行',
  '硬件感知反馈',
  '硬件感知学习',
  '硬件感知适应',
  '硬件感知进化',
  '硬件感知优化',
  '硬件感知调优',
  '硬件感知配置',
  '硬件感知管理',
  '硬件感知运维',
  '硬件感知DevOps',
  '硬件感知MLOps',
  '硬件感知AIOps',
  '硬件感知DataOps',
  '硬件感知ModelOps',
  '硬件感知FeatureOps',
  '硬件感知DataEng',
  '硬件感知MLEng',
  '硬件感知AIEng',
  '硬件感知PlatformEng',
  '硬件感知InfraEng',
  '硬件感知SRE',
  '硬件感知DevSecOps',
  '硬件感知MLOpsSec',
  '硬件感知AIOpsSec',
  '硬件感知DataSecOps',
  '硬件感知ModelSecOps',
  '硬件感知FeatureSecOps',
  '硬件感知DataEngSec',
  '硬件感知MLEngSec',
  '硬件感知AIEngSec',
  '硬件感知PlatformEngSec',
  '硬件感知InfraEngSec',
  '硬件感知SRESec',
  '硬件感知DevSecOpsSec',
  '硬件感知MLOpsSecSec',
  '硬件感知AIOpsSecSec',
  '硬件感知DataSecOpsSec',
  '硬件感知ModelSecOpsSec',
  '硬件感知FeatureSecOpsSec',
  '硬件感知DataEngSecSec',
  '硬件感知MLEngSecSec',
  '硬件感知AIEngSecSec',
  '硬件感知PlatformEngSecSec',
  '硬件感知InfraEngSecSec',
  '硬件感知SRESecSec',
  '硬件感知DevSecOpsSecSec'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位机器学习领域的专家教师。请生成一道${diffLabel}关于"机器学习 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察机器学习的实际知识和理论概念
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际机器学习应用场景
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
          { role: 'system', content: '你是一位专业的机器学习教师，擅长出高质量的选择题。' },
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
      '机器学习',
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
  console.log('开始生成 200 道机器学习题目...\n');
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
      const topic = mlTopics[Math.floor(Math.random() * mlTopics.length)];
      
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