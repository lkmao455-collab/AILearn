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

// 深度学习知识点列表（扩展版）
const deepLearningTopics = [
  // 基础概念
  '人工神经元与感知机',
  '多层感知机(MLP)',
  '前向传播算法',
  '反向传播算法',
  '梯度下降算法',
  '随机梯度下降(SGD)',
  '小批量梯度下降',
  '动量优化(Momentum)',
  'Nesterov加速梯度',
  '学习率与衰减策略',
  '学习率预热',
  '学习率循环调度',
  '自适应学习率算法',
  '参数初始化方法',
  'Xavier初始化',
  'He初始化',
  '正交初始化',
  
  // 激活函数
  'Sigmoid激活函数',
  'Tanh激活函数',
  'ReLU激活函数',
  'Leaky ReLU',
  'PReLU参数化ReLU',
  'ELU指数线性单元',
  'SELU自归一化ELU',
  'GELU高斯误差线性单元',
  'Swish激活函数',
  'Mish激活函数',
  'Softmax函数',
  'Softplus函数',
  'Maxout单元',
  '激活函数选择策略',
  
  // 损失函数
  '均方误差(MSE)',
  '平均绝对误差(MAE)',
  'Huber损失',
  '交叉熵损失',
  '二元交叉熵',
  '分类交叉熵',
  '稀疏分类交叉熵',
  'Focal Loss',
  'Dice Loss',
  'IoU Loss',
  '对比损失(Contrastive Loss)',
  '三元组损失(Triplet Loss)',
  '中心损失(Center Loss)',
  'ArcFace损失',
  '标签平滑',
  '损失函数加权',
  
  // 正则化技术
  'L1正则化(Lasso)',
  'L2正则化(Ridge)',
  '弹性网络正则化',
  'Dropout正则化',
  'DropConnect',
  'DropBlock',
  '空间Dropout',
  '高斯Dropout',
  '早停法(Early Stopping)',
  '权重衰减',
  '梯度裁剪',
  '批量归一化(BatchNorm)',
  '层归一化(LayerNorm)',
  '实例归一化(InstanceNorm)',
  '组归一化(GroupNorm)',
  '开关归一化(SwitchableNorm)',
  '谱归一化',
  '权重标准化',
  
  // 优化器
  'AdaGrad优化器',
  'RMSprop优化器',
  'Adam优化器',
  'AdamW优化器',
  'Adamax优化器',
  'Nadam优化器',
  'AMSGrad优化器',
  'RAdam优化器',
  'Lookahead优化器',
  'LARS优化器',
  'LAMB优化器',
  '二阶优化方法',
  'L-BFGS算法',
  '优化器选择策略',
  '优化器超参数调优',
  
  // 卷积神经网络
  '卷积操作原理',
  '卷积核与滤波器',
  '感受野计算',
  '特征图尺寸计算',
  '填充(Padding)策略',
  '步长(Stride)设置',
  '膨胀卷积(Dilated Conv)',
  '转置卷积(Transposed Conv)',
  '可分离卷积(Depthwise Separable)',
  '分组卷积(Group Conv)',
  '空洞空间金字塔池化(ASPP)',
  '空间金字塔池化(SPP)',
  '全局平均池化(GAP)',
  '池化层设计',
  '最大池化与平均池化',
  '随机池化',
  '分数最大池化',
  
  // 经典CNN架构
  'LeNet-5架构',
  'AlexNet架构',
  'VGGNet架构',
  'ResNet残差网络',
  'ResNet变体(ResNeXt等)',
  'Inception网络',
  'GoogLeNet架构',
  'Xception网络',
  'MobileNet系列',
  'EfficientNet系列',
  'DenseNet密集连接',
  'SqueezeNet',
  'ShuffleNet',
  'GhostNet',
  'RegNet',
  'NFNet',
  'ConvNeXt',
  
  // 注意力机制
  '注意力机制基础',
  'SENet通道注意力',
  'CBAM混合注意力',
  'ECA高效通道注意力',
  'SKNet选择性核',
  'Non-local神经网络',
  '自注意力机制',
  '多头注意力',
  '空间注意力',
  '通道注意力',
  '坐标注意力',
  '双重注意力',
  '交叉注意力',
  '注意力可视化',
  
  // 循环神经网络
  'RNN基础结构',
  'LSTM长短期记忆',
  'GRU门控循环单元',
  '双向RNN',
  '深层RNN',
  'RNN梯度问题',
  '序列到序列模型',
  '注意力Seq2Seq',
  'RNN应用：文本生成',
  'RNN应用：机器翻译',
  'RNN应用：语音识别',
  
  // Transformer架构
  'Transformer基础',
  '自注意力机制详解',
  '位置编码',
  '多头注意力机制',
  '前馈神经网络',
  '残差连接与层归一化',
  'Transformer编码器',
  'Transformer解码器',
  '掩码注意力',
  'Transformer训练技巧',
  'Vision Transformer(ViT)',
  'Swin Transformer',
  'DeiT数据高效Transformer',
  'PVT金字塔视觉Transformer',
  'Twins-SVT',
  'CSWin Transformer',
  'MaxViT',
  'EfficientFormer',
  
  // 目标检测
  '目标检测概述',
  'R-CNN系列',
  'Fast R-CNN',
  'Faster R-CNN',
  'Mask R-CNN',
  'Cascade R-CNN',
  'YOLO系列(v1-v8)',
  'SSD单发多框检测',
  'RetinaNet',
  'FCOS无锚点检测',
  'CenterNet',
  'DETR检测Transformer',
  'Deformable DETR',
  'DINO检测器',
  'RT-DETR',
  'YOLOX',
  'YOLO-NAS',
  '检测头设计',
  '特征金字塔网络(FPN)',
  'PANet路径聚合',
  'BiFPN双向FPN',
  'NAS-FPN',
  'Anchor生成策略',
  'Anchor-free方法',
  'IoU与GIoU',
  'DIoU与CIoU',
  'EIoU与SIoU',
  'NMS非极大值抑制',
  'Soft-NMS',
  'DIoU-NMS',
  
  // 图像分割
  '语义分割概述',
  'FCN全卷积网络',
  'U-Net架构',
  'U-Net++',
  'U-Net 3+',
  'SegNet',
  'DeepLab系列',
  'PSPNet',
  'HRNet高分辨率网络',
  'OCRNet',
  'SegFormer',
  'Mask2Former',
  'SAM分割一切模型',
  '实例分割概述',
  'Mask R-CNN实例分割',
  'SOLO实例分割',
  'CondInst',
  'BlendMask',
  '全景分割',
  'Panoptic FPN',
  'UPSNet',
  
  // 生成模型
  '生成模型概述',
  '自编码器(AE)',
  '变分自编码器(VAE)',
  'VAE变体(β-VAE等)',
  '生成对抗网络(GAN)',
  'DCGAN深度卷积GAN',
  'CGAN条件GAN',
  'WGAN与WGAN-GP',
  'LSGAN',
  'CycleGAN',
  'StyleGAN系列',
  'BigGAN',
  'ProGAN渐进GAN',
  'SAGAN自注意力GAN',
  'GAN训练技巧',
  'GAN评估指标',
  '扩散模型基础',
  'DDPM去噪扩散模型',
  'DDIM加速采样',
  'Stable Diffusion',
  'Latent Diffusion',
  'ControlNet条件控制',
  'LoRA低秩适应',
  'DreamBooth',
  'Textual Inversion',
  '图像超分辨率',
  'SRGAN',
  'ESRGAN',
  'Real-ESRGAN',
  '图像去噪',
  '图像修复',
  '图像着色',
  '风格迁移',
  '神经风格迁移',
  '快速风格迁移',
  '任意风格迁移',
  
  // 自监督学习
  '自监督学习概述',
  '对比学习基础',
  'SimCLR',
  'MoCo动量对比',
  'BYOL自举学习',
  'SimSiam',
  'Barlow Twins',
  'DINO自蒸馏',
  'MAE掩码自编码器',
  'BEiT',
  'iBOT',
  '数据增强对比学习',
  '多视图学习',
  '预训练任务设计',
  
  // 多模态学习
  '多模态学习概述',
  'CLIP对比语言图像预训练',
  'ALIGN',
  'BLIP',
  'BLIP-2',
  'LLaVA',
  'MiniGPT-4',
  '视觉问答(VQA)',
  '图像描述生成',
  '图文检索',
  '多模态融合策略',
  '跨模态注意力',
  
  // 神经网络架构搜索
  'NAS概述',
  '基于强化学习的NAS',
  '基于梯度的NAS(DARTS)',
  'ENAS高效NAS',
  'Once-for-All网络',
  'BigNAS',
  '权重共享策略',
  '搜索空间设计',
  '硬件感知NAS',
  'ProxylessNAS',
  'FBNet',
  'EfficientNet的NAS',
  
  // 模型压缩与加速
  '模型剪枝',
  '非结构化剪枝',
  '结构化剪枝',
  '迭代剪枝',
  '彩票假说',
  '知识蒸馏',
  '软标签蒸馏',
  '特征蒸馏',
  '关系蒸馏',
  '自蒸馏',
  '量化基础',
  '权重量化',
  '激活量化',
  '混合精度量化',
  '量化感知训练',
  '二值神经网络',
  '三值神经网络',
  '神经网络编译优化',
  'TensorRT优化',
  'ONNX Runtime',
  'OpenVINO',
  '移动端部署',
  '边缘设备部署',
  
  // 训练技巧与策略
  '数据增强基础',
  '几何变换增强',
  '颜色变换增强',
  '随机擦除',
  'Mixup混合',
  'Cutout与CutMix',
  'AutoAugment',
  'RandAugment',
  'TrivialAugment',
  'AugMix',
  '特征增强',
  '标签平滑',
  '知识蒸馏训练',
  '渐进式训练',
  '课程学习',
  '多任务学习',
  '多尺度训练',
  '测试时增强(TTA)',
  '模型集成',
  '快照集成',
  '随机深度',
  'DropPath',
  '随机宽度',
  'Mixup与CutMix组合',
  'EMA指数移动平均',
  'SWA随机权重平均',
  'FGSM对抗训练',
  'PGD对抗训练',
  
  // 评估与调试
  '模型评估指标',
  '准确率与错误率',
  '精确率与召回率',
  'F1-Score',
  'ROC曲线与AUC',
  'PR曲线',
  '混淆矩阵',
  'Cohen Kappa',
  'mAP平均精度均值',
  'COCO评估指标',
  '模型可解释性',
  '特征可视化',
  'Grad-CAM',
  'LIME解释',
  'SHAP值',
  '注意力可视化',
  '模型调试技巧',
  '梯度检查',
  '损失曲线分析',
  '学习曲线分析',
  '过拟合诊断',
  '欠拟合诊断',
  '梯度消失检测',
  '梯度爆炸检测',
  '死亡ReLU问题',
  '模式崩溃检测',
  
  // 框架与工具
  'PyTorch基础',
  'TensorFlow基础',
  'Keras高级API',
  'JAX与Flax',
  'PaddlePaddle',
  'MindSpore',
  'OneFlow',
  '分布式训练',
  '数据并行',
  '模型并行',
  '流水线并行',
  '混合并行',
  'DeepSpeed',
  'FairScale',
  'Horovod',
  '混合精度训练',
  '自动混合精度(AMP)',
  '梯度累积',
  '梯度检查点',
  '零冗余优化器(ZeRO)',
  '激活重计算',
  '模型并行策略',
  '张量并行',
  '序列并行',
  '3D并行',
  
  // 前沿方向
  '神经辐射场(NeRF)',
  'Instant-NGP',
  '3D高斯溅射',
  '视觉语言模型',
  'GPT-4V',
  'Gemini',
  '多模态大模型',
  '指令微调',
  'RLHF人类反馈强化学习',
  '提示工程',
  '上下文学习',
  '思维链推理',
  '视觉提示',
  '连续学习',
  '联邦学习',
  '隐私保护深度学习',
  '可解释AI',
  '因果推断',
  '神经架构的生物学启发',
  '脉冲神经网络',
  '神经形态计算'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位深度学习领域的专家教师。请生成一道${diffLabel}关于"深度学习 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察深度学习的理论知识和实际应用
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际深度学习开发场景
5. 可以包含PyTorch/TensorFlow代码示例

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
          { role: 'system', content: '你是一位专业的深度学习教师，擅长出高质量的选择题。' },
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
      'DeepLearning',
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
  console.log('开始生成 200 道深度学习题目...\n');
  
  const totalQuestions = 200;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = deepLearningTopics[Math.floor(Math.random() * deepLearningTopics.length)];
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
