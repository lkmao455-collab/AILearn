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

// CNN 知识点列表
const cnnTopics = [
  '卷积层原理与计算',
  '卷积核/滤波器设计',
  '感受野计算',
  '特征图尺寸计算',
  '填充(Padding)策略',
  '步长(Stride)设置',
  '池化层(Max/Avg Pooling)',
  '全连接层',
  '激活函数(ReLU/Sigmoid/Tanh)',
  '批归一化(Batch Normalization)',
  'Dropout正则化',
  'LeNet架构',
  'AlexNet架构',
  'VGGNet架构',
  'ResNet残差网络',
  'Inception网络',
  'GoogLeNet架构',
  'MobileNet轻量级网络',
  'EfficientNet网络',
  'DenseNet密集连接网络',
  'SqueezeNet网络',
  'ShuffleNet网络',
  'SE-Net注意力机制',
  'CBAM注意力机制',
  '空间金字塔池化(SPP)',
  '空洞卷积(Dilated Convolution)',
  '转置卷积/反卷积',
  '可分离卷积(Depthwise Separable)',
  '分组卷积(Group Convolution)',
  '空洞空间金字塔池化(ASPP)',
  '特征金字塔网络(FPN)',
  'U-Net图像分割',
  'FCN全卷积网络',
  'SegNet分割网络',
  'DeepLab分割网络',
  'Mask R-CNN实例分割',
  'YOLO目标检测',
  'SSD目标检测',
  'R-CNN系列检测',
  'Anchor生成策略',
  'NMS非极大值抑制',
  'IoU交并比计算',
  'mAP评估指标',
  '精确率与召回率',
  'F1-Score',
  'ROC曲线与AUC',
  '混淆矩阵',
  '过拟合与欠拟合',
  '数据增强技术',
  '迁移学习',
  '微调(Fine-tuning)',
  '学习率调度',
  '优化器(SGD/Adam/RMSprop)',
  '损失函数(交叉熵/MSE)',
  '权重初始化',
  '梯度消失与爆炸',
  '残差连接',
  '跳跃连接',
  '多尺度特征融合',
  '特征提取与可视化',
  '卷积神经网络训练',
  '模型压缩与剪枝',
  '知识蒸馏',
  '量化技术',
  '神经网络架构搜索(NAS)',
  '对抗样本与防御',
  '生成对抗网络(GAN)',
  '风格迁移',
  '图像超分辨率',
  '图像去噪',
  '图像修复',
  '目标跟踪',
  '人脸识别',
  '姿态估计',
  '语义分割',
  '实例分割',
  '全景分割',
  '关键点检测',
  'OCR文字识别',
  '图像分类',
  '细粒度图像分类',
  '零样本学习',
  '少样本学习',
  '自监督学习',
  '对比学习',
  'Transformer在CV中的应用',
  'Vision Transformer(ViT)',
  'Swin Transformer',
  'DETR目标检测',
  'MAE自编码器',
  'CLIP多模态模型',
  '扩散模型(Diffusion)',
  'Stable Diffusion',
  'ControlNet',
  'LoRA微调技术'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位深度学习领域的专家教师。请生成一道${diffLabel}关于"CNN卷积神经网络 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察CNN的实际应用和理论知识
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际深度学习开发场景

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
        model: 'qwen3.5-plus',
        messages: [
          { role: 'system', content: '你是一位专业的深度学习教师，擅长出高质量的CNN选择题。' },
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
      'CNN',
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
  console.log('开始生成 100 道 CNN 题目...\n');
  
  const totalQuestions = 100;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = cnnTopics[Math.floor(Math.random() * cnnTopics.length)];
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