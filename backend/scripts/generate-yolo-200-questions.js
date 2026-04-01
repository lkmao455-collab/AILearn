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

// YOLO 知识点列表
const yoloTopics = [
  'YOLOv1 基础原理',
  'YOLOv2 改进特性',
  'YOLOv3 多尺度检测',
  'YOLOv4 优化技术',
  'YOLOv5 架构设计',
  'YOLOv6 工业部署',
  'YOLOv7 训练技巧',
  'YOLOv8 新特性',
  'YOLOv9 可编程梯度信息',
  'YOLOv10 实时检测',
  'YOLOv11 最新进展',
  'YOLO 网格预测机制',
  'YOLO 边界框回归',
  'YOLO 置信度计算',
  'YOLO 类别概率预测',
  'YOLO 非极大值抑制 NMS',
  'YOLO 损失函数设计',
  'YOLO 锚框 Anchor 机制',
  'YOLO 多尺度特征融合',
  'YOLO FPN 特征金字塔',
  'YOLO PANet 结构',
  'YOLO CSPDarknet 骨干网络',
  'YOLO Focus 切片操作',
  'YOLO SPP 空间金字塔池化',
  'YOLO SPPF 快速空间金字塔',
  'YOLO CIoU 损失函数',
  'YOLO DIoU 损失函数',
  'YOLO GIoU 损失函数',
  'YOLO EIoU 损失函数',
  'YOLO 数据增强 Mosaic',
  'YOLO 数据增强 MixUp',
  'YOLO 数据增强 CutMix',
  'YOLO 数据增强 CopyPaste',
  'YOLO 随机擦除 Random Erasing',
  'YOLO 标签平滑 Label Smoothing',
  'YOLO 焦点损失 Focal Loss',
  'YOLO 变分损失 VariFocal Loss',
  'YOLO 知识蒸馏',
  'YOLO 模型量化',
  'YOLO 模型剪枝',
  'YOLO TensorRT 加速',
  'YOLO ONNX 导出',
  'YOLO OpenVINO 部署',
  'YOLO 小目标检测优化',
  'YOLO 密集目标检测',
  'YOLO 遮挡目标检测',
  'YOLO 实时视频检测',
  'YOLO 多类别检测',
  'YOLO 单阶段检测优势',
  'YOLO 与两阶段检测对比',
  'YOLO 与 R-CNN 系列对比',
  'YOLO 与 SSD 对比',
  'YOLO 与 RetinaNet 对比',
  'YOLO 与 DETR 对比',
  'YOLO 训练超参数设置',
  'YOLO 学习率调度策略',
  'YOLO 优化器选择',
  'YOLO 批量大小设置',
  'YOLO 图像尺寸配置',
  'YOLO 预训练权重使用',
  'YOLO 迁移学习',
  'YOLO 微调 Fine-tuning',
  'YOLO 自定义数据集训练',
  'YOLO 标注格式转换',
  'YOLO 数据集划分',
  'YOLO 验证集评估',
  'YOLO mAP 指标计算',
  'YOLO Precision 精确率',
  'YOLO Recall 召回率',
  'YOLO F1-Score',
  'YOLO IoU 阈值设置',
  'YOLO 置信度阈值',
  'YOLO 检测速度 FPS',
  'YOLO 模型参数量',
  'YOLO 计算量 FLOPs',
  'YOLO 内存占用优化',
  'YOLO 批处理推理',
  'YOLO 动态输入尺寸',
  'YOLO 半精度推理 FP16',
  'YOLO INT8 量化推理',
  'YOLO 多 GPU 训练',
  'YOLO 分布式训练',
  'YOLO 同步批归一化',
  'YOLO 指数移动平均 EMA',
  'YOLO 早停 Early Stopping',
  'YOLO 模型集成',
  'YOLO Test Time Augmentation',
  'YOLO Soft-NMS',
  'YOLO DIoU-NMS',
  'YOLO 旋转目标检测',
  'YOLO 实例分割',
  'YOLO 姿态估计',
  'YOLO 目标跟踪',
  'YOLO DeepSORT 集成',
  'YOLO ByteTrack 集成',
  'YOLO 多目标跟踪',
  'YOLO 跨摄像头跟踪',
  'YOLO 行人重识别',
  'YOLO 车辆检测',
  'YOLO 车牌识别',
  'YOLO 人脸检测',
  'YOLO 安全帽检测',
  'YOLO 工业缺陷检测',
  'YOLO 医学影像检测',
  'YOLO 卫星图像检测',
  'YOLO 无人机视角检测',
  'YOLO 夜间低光检测',
  'YOLO 红外图像检测',
  'YOLO 热成像检测',
  'YOLO 3D 目标检测',
  'YOLO 点云检测',
  'YOLO 多模态融合',
  'YOLO 注意力机制',
  'YOLO Transformer 结构',
  'YOLO 自注意力模块',
  'YOLO 通道注意力',
  'YOLO 空间注意力',
  'YOLO 解耦头设计',
  'YOLO 动态标签分配',
  'YOLO SimOTA 标签分配',
  'YOLO TaskAlignedAssigner',
  'YOLO 端到端检测',
  'YOLO 无锚框检测',
  'YOLO Anchor-free 设计',
  'YOLO 自适应锚框计算',
  'YOLO 自动网络架构搜索',
  'YOLO 神经架构搜索 NAS',
  'YOLO 轻量化设计',
  'YOLO 移动端部署',
  'YOLO 边缘设备部署',
  'YOLO Jetson 部署',
  'YOLO Raspberry Pi 部署',
  'YOLO Android 部署',
  'YOLO iOS 部署',
  'YOLO Web 部署',
  'YOLO 浏览器推理',
  'YOLO ONNX Runtime',
  'YOLO OpenCV DNN 推理',
  'YOLO LibTorch 推理',
  'YOLO 自定义层实现',
  'YOLO 插件开发',
  'YOLO 后处理优化',
  'YOLO 预处理优化',
  'YOLO 图像归一化',
  'YOLO 颜色空间转换',
  'YOLO 图像填充 Letterbox',
  'YOLO 批量归一化',
  'YOLO 激活函数选择',
  'YOLO SiLU 激活函数',
  'YOLO Mish 激活函数',
  'YOLO Swish 激活函数',
  'YOLO ReLU 变体',
  'YOLO 残差连接',
  'YOLO 跳跃连接',
  'YOLO 特征重用',
  'YOLO 梯度流优化',
  'YOLO 梯度截断',
  'YOLO 权重初始化',
  'YOLO 批归一化初始化',
  'YOLO 学习率预热',
  'YOLO 余弦退火调度',
  'YOLO 多项式衰减',
  'YOLO 指数衰减',
  'YOLO 阶梯衰减',
  'YOLO 权重衰减',
  'YOLO Dropout 正则化',
  'YOLO DropBlock 正则化',
  'YOLO 随机深度',
  'YOLO 随机宽度',
  'YOLO 模型融合',
  'YOLO 模型压缩',
  'YOLO 知识迁移',
  'YOLO 域自适应',
  'YOLO 对抗训练',
  'YOLO 对比学习',
  'YOLO 自监督学习',
  'YOLO 半监督学习',
  'YOLO 弱监督学习',
  'YOLO 主动学习',
  'YOLO 持续学习',
  'YOLO 联邦学习',
  'YOLO 隐私保护',
  'YOLO 差分隐私',
  'YOLO 模型可解释性',
  'YOLO 注意力可视化',
  'YOLO 特征可视化',
  'YOLO 错误分析',
  'YOLO 混淆矩阵分析',
  'YOLO PR 曲线分析',
  'YOLO ROC 曲线分析',
  'YOLO 检测头设计',
  'YOLO 解耦检测头',
  'YOLO 共享检测头',
  'YOLO 动态检测头',
  'YOLO 级联检测头',
  'YOLO 多任务学习',
  'YOLO 多尺度训练',
  'YOLO 多尺度测试',
  'YOLO 输入分辨率选择',
  'YOLO 输出步长设置',
  'YOLO 下采样策略',
  'YOLO 上采样方法',
  'YOLO 最近邻上采样',
  'YOLO 双线性上采样',
  'YOLO 转置卷积',
  'YOLO 亚像素卷积',
  'YOLO 空洞卷积',
  'YOLO 可变形卷积',
  'YOLO 深度可分离卷积',
  'YOLO 分组卷积',
  'YOLO 通道混洗',
  'YOLO 瓶颈结构',
  'YOLO 倒置残差',
  'YOLO 线性瓶颈',
  'YOLO SE 注意力模块',
  'YOLO CBAM 注意力模块',
  'YOLO ECA 注意力模块',
  'YOLO CA 坐标注意力',
  'YOLO SA 自注意力',
  'YOLO 非局部神经网络',
  'YOLO GCNet 全局上下文',
  'YOLO CCNet 交叉注意力',
  'YOLO 动态卷积',
  'YOLO 条件卷积',
  'YOLO 神经架构优化',
  'YOLO 网络宽度调整',
  'YOLO 网络深度调整',
  'YOLO 分辨率调整',
  'YOLO 复合缩放',
  'YOLO EfficientDet 缩放',
  'YOLO RegNet 设计',
  'YOLO ResNet 骨干',
  'YOLO DenseNet 骨干',
  'YOLO MobileNet 骨干',
  'YOLO EfficientNet 骨干',
  'YOLO ShuffleNet 骨干',
  'YOLO GhostNet 骨干',
  'YOLO RepVGG 结构',
  'YOLO Reparameterization',
  'YOLO 结构重参数化',
  'YOLO 多分支训练',
  'YOLO 单分支推理',
  'YOLO 模型转换',
  'YOLO 格式转换',
  'YOLO 权重转换',
  'YOLO PyTorch 转 TensorFlow',
  'YOLO TensorFlow 转 PyTorch',
  'YOLO 模型版本兼容',
  'YOLO 配置文件解析',
  'YOLO YAML 配置',
  'YOLO 超参数配置',
  'YOLO 数据配置',
  'YOLO 模型配置',
  'YOLO 训练配置',
  'YOLO 验证配置',
  'YOLO 测试配置',
  'YOLO 导出配置',
  'YOLO 推理配置',
  'YOLO 日志记录',
  'YOLO 训练可视化',
  'YOLO TensorBoard',
  'YOLO WandB 集成',
  'YOLO MLflow 集成',
  'YOLO 实验管理',
  'YOLO 超参数调优',
  'YOLO 网格搜索',
  'YOLO 随机搜索',
  'YOLO 贝叶斯优化',
  'YOLO 遗传算法优化',
  'YOLO 超参数重要性分析',
  'YOLO 消融实验',
  'YOLO 对比实验',
  'YOLO 基准测试',
  'YOLO 性能分析',
  'YOLO 瓶颈分析',
  'YOLO 内存分析',
  'YOLO 计算图优化',
  'YOLO 算子融合',
  'YOLO 常量折叠',
  'YOLO 死代码消除',
  'YOLO 内存优化',
  'YOLO 显存优化',
  'YOLO 缓存优化',
  'YOLO 数据加载优化',
  'YOLO 多线程数据加载',
  'YOLO 预读取数据',
  'YOLO 数据流水线',
  'YOLO 数据缓存',
  'YOLO 数据增强策略',
  'YOLO AutoAugment',
  'YOLO RandAugment',
  'YOLO AugMix',
  'YOLO 自动数据增强',
  'YOLO 领域特定增强',
  'YOLO 几何变换',
  'YOLO 颜色变换',
  'YOLO 噪声注入',
  'YOLO 模糊处理',
  'YOLO 锐化处理',
  'YOLO 对比度调整',
  'YOLO 亮度调整',
  'YOLO 饱和度调整',
  'YOLO 色调调整',
  'YOLO 直方图均衡化',
  'YOLO CLAHE 增强',
  'YOLO 伽马校正',
  'YOLO 白平衡调整',
  'YOLO 去雾处理',
  'YOLO 超分辨率',
  'YOLO 图像修复',
  'YOLO 图像去噪',
  'YOLO 风格迁移',
  'YOLO 对抗样本',
  'YOLO 模型鲁棒性',
  'YOLO 对抗防御',
  'YOLO 输入验证',
  'YOLO 输出验证',
  'YOLO 安全检测',
  'YOLO 公平性检测',
  'YOLO 偏见检测',
  'YOLO 模型审计',
  'YOLO 合规性检查',
  'YOLO 伦理审查',
  'YOLO 社会影响评估',
  'YOLO 环境影响评估',
  'YOLO 碳足迹计算',
  'YOLO 绿色AI',
  'YOLO 可持续AI',
  'YOLO 模型卡片',
  'YOLO 数据表',
  'YOLO 文档化',
  'YOLO 版本控制',
  'YOLO 模型注册',
  'YOLO 模型仓库',
  'YOLO 模型服务',
  'YOLO API 设计',
  'YOLO 微服务架构',
  'YOLO 容器化部署',
  'YOLO Docker 部署',
  'YOLO Kubernetes 部署',
  'YOLO 服务网格',
  'YOLO 负载均衡',
  'YOLO 自动扩缩容',
  'YOLO 监控告警',
  'YOLO 日志分析',
  'YOLO 性能监控',
  'YOLO 错误追踪',
  'YOLO A/B 测试',
  'YOLO 灰度发布',
  'YOLO 蓝绿部署',
  'YOLO 金丝雀发布',
  'YOLO 回滚策略',
  'YOLO 灾难恢复',
  'YOLO 备份策略',
  'YOLO 数据备份',
  'YOLO 模型备份',
  'YOLO 配置备份',
  'YOLO 灾难演练',
  'YOLO 业务连续性',
  'YOLO 高可用设计',
  'YOLO 容错处理',
  'YOLO 降级策略',
  'YOLO 限流策略',
  'YOLO 熔断策略',
  'YOLO 重试机制',
  'YOLO 超时处理',
  'YOLO 幂等设计',
  'YOLO 事务处理',
  'YOLO 一致性保证',
  'YOLO 分布式事务',
  'YOLO 最终一致性',
  'YOLO 强一致性',
  'YOLO 因果一致性',
  'YOLO 会话一致性',
  'YOLO 单调读一致性',
  'YOLO 单调写一致性',
  'YOLO 读写一致性',
  'YOLO 写读一致性'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位目标检测领域的专家教师。请生成一道${diffLabel}关于"YOLO - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察 YOLO 目标检测的实际应用和原理
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际开发和算法理解
5. 可以涉及 YOLO 的架构、训练、推理、优化、部署等方面

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
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: '你是一位专业的目标检测教师，擅长出高质量的选择题。' },
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
      'YOLO',
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
  console.log('开始生成 200 道 YOLO 题目...\n');
  
  const totalQuestions = 200;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = yoloTopics[Math.floor(Math.random() * yoloTopics.length)];
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
