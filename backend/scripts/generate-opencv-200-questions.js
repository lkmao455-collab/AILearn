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

// OpenCV 知识点列表（扩展版）
const opencvTopics = [
  // 基础操作
  '图像读取与显示',
  '图像保存与格式转换',
  '图像色彩空间转换（BGR/RGB/HSV/Lab）',
  '图像缩放与插值算法',
  '图像裁剪与ROI提取',
  '图像旋转与翻转',
  '图像平移变换',
  '图像通道分离与合并',
  '图像像素访问与修改',
  '图像位运算（与、或、非、异或）',
  '图像掩膜操作',
  '图像ROI操作与复制',
  '图像填充与边界扩展',
  '图像类型转换',
  '图像归一化',
  
  // 图像滤波
  '图像均值滤波',
  '图像高斯滤波',
  '图像中值滤波',
  '图像双边滤波',
  '图像方框滤波',
  '图像卷积操作',
  '自定义卷积核',
  '图像可分离滤波',
  '图像导向滤波',
  '图像非局部均值去噪',
  '图像快速去噪',
  
  // 边缘检测与梯度
  '图像梯度计算（Sobel算子）',
  '图像梯度计算（Scharr算子）',
  '图像拉普拉斯算子',
  'Canny边缘检测',
  '图像边缘细化',
  '图像轮廓提取',
  '图像轮廓层次分析',
  '图像轮廓逼近',
  '图像轮廓凸包检测',
  '图像轮廓凸缺陷检测',
  '图像最小外接矩形',
  '图像最小外接圆',
  '图像最小外接椭圆',
  '图像轮廓拟合',
  '图像轮廓匹配',
  '图像形状匹配',
  '图像矩与中心矩',
  '图像Hu矩不变量',
  '图像Zernike矩',
  
  // 二值化与形态学
  '图像二值化（全局阈值）',
  '图像自适应阈值',
  '图像Otsu自动阈值',
  '图像多阈值分割',
  '图像腐蚀操作',
  '图像膨胀操作',
  '图像开运算',
  '图像闭运算',
  '图像形态学梯度',
  '图像顶帽运算',
  '图像黑帽运算',
  '图像击中击不中变换',
  '图像骨架提取',
  '图像细化算法',
  '图像连通域分析',
  '图像连通域标记',
  '图像距离变换',
  '图像分水岭分割',
  '图像GrabCut分割',
  
  // 直方图
  '图像直方图计算',
  '图像直方图均衡化',
  '图像自适应直方图均衡化（CLAHE）',
  '图像直方图匹配',
  '图像直方图反向投影',
  '图像二维直方图',
  '图像直方图比较',
  
  // 几何变换
  '图像仿射变换',
  '图像透视变换',
  '图像旋转矩阵计算',
  '图像平移变换',
  '图像缩放变换',
  '图像错切变换',
  '图像极坐标变换',
  '图像对数极坐标变换',
  '图像重映射',
  '图像插值方法（最近邻、双线性、双三次）',
  
  // 金字塔与多尺度
  '图像高斯金字塔',
  '图像拉普拉斯金字塔',
  '图像金字塔融合',
  '图像多尺度分析',
  '图像尺度空间',
  
  // 特征检测
  'Harris角点检测',
  'Shi-Tomasi角点检测',
  'FAST角点检测',
  'ORB特征检测',
  'SIFT特征检测',
  'SURF特征检测',
  'AKAZE特征检测',
  'KAZE特征检测',
  'BRISK特征检测',
  'MSER区域检测',
  'GFTT角点检测',
  'SimpleBlobDetector',
  '图像斑点检测',
  '图像脊线检测',
  
  // 特征描述与匹配
  'SIFT特征描述',
  'SURF特征描述',
  'ORB特征描述',
  'BRIEF描述子',
  'FREAK描述子',
  'LUCID描述子',
  'LATCH描述子',
  'DAISY描述子',
  '特征点匹配',
  '暴力匹配（BFMatcher）',
  'FLANN快速匹配',
  'KNN匹配',
  'RANSAC几何验证',
  '单应性矩阵估计',
  '本质矩阵估计',
  '基础矩阵估计',
  '图像配准',
  '图像拼接',
  '特征点筛选与优化',
  
  // 模板匹配
  '模板匹配（平方差）',
  '模板匹配（归一化平方差）',
  '模板匹配（互相关）',
  '模板匹配（归一化互相关）',
  '模板匹配（相关系数）',
  '多尺度模板匹配',
  '旋转不变模板匹配',
  
  // 霍夫变换
  '标准霍夫直线检测',
  '概率霍夫直线检测',
  '霍夫圆检测',
  '广义霍夫变换',
  '累计概率霍夫变换',
  '霍夫变换参数空间',
  
  // 频域处理
  '图像傅里叶变换',
  '图像离散余弦变换（DCT）',
  '图像离散沃尔什变换',
  '图像频域滤波',
  '图像低通滤波',
  '图像高通滤波',
  '图像带通滤波',
  '图像同态滤波',
  '图像频谱分析',
  '图像相位相关',
  
  // 图像增强
  '图像对比度增强',
  '图像亮度调整',
  '图像伽马校正',
  '图像对数变换',
  '图像指数变换',
  '图像锐化',
  '图像Unsharp Masking',
  '图像高提升滤波',
  '图像Retinex增强',
  '图像去雾',
  '图像去噪',
  '图像修复（Inpainting）',
  '图像超分辨率',
  
  // 颜色处理
  '颜色空间转换',
  '肤色检测',
  '颜色直方图',
  '颜色量化',
  '颜色聚类',
  '颜色平衡',
  '白平衡校正',
  '自动色彩增强',
  
  // 视频处理
  '视频读取与解码',
  '视频写入与编码',
  '视频帧提取',
  '视频帧率控制',
  '视频分辨率调整',
  '视频裁剪',
  '视频拼接',
  '视频转图片序列',
  '图片序列转视频',
  
  // 运动分析
  '帧差法运动检测',
  '背景减除（BackgroundSubtractorMOG）',
  '背景减除（BackgroundSubtractorMOG2）',
  '背景减除（BackgroundSubtractorKNN）',
  '背景减除（BackgroundSubtractorGMG）',
  '光流法（Lucas-Kanade）',
  '稠密光流法（Farneback）',
  '光流法（SimpleFlow）',
  '光流法（DeepFlow）',
  '运动目标检测',
  '运动轨迹跟踪',
  '卡尔曼滤波跟踪',
  '粒子滤波跟踪',
  'MeanShift跟踪',
  'CamShift跟踪',
  '多目标跟踪',
  
  // 机器学习相关
  'OpenCV中的KNN算法',
  'OpenCV中的SVM分类',
  'OpenCV中的决策树',
  'OpenCV中的随机森林',
  'OpenCV中的KMeans聚类',
  'OpenCV中的神经网络（dnn模块）',
  'OpenCV中的级联分类器',
  'OpenCV中的HOG特征',
  'OpenCV中的LBP特征',
  'OpenCV中的Haar特征',
  'OpenCV中的BOW词袋模型',
  
  // 深度学习模块
  'OpenCV DNN模块加载模型',
  'OpenCV DNN图像分类',
  'OpenCV DNN目标检测',
  'OpenCV DNN语义分割',
  'OpenCV DNN人脸检测',
  'OpenCV DNN推理优化',
  'OpenCV DNN后端配置',
  'OpenCV DNN模型转换',
  
  // 相机标定与三维重建
  '相机标定（单目）',
  '相机标定（双目）',
  '相机内参矩阵',
  '相机畸变系数',
  '畸变校正',
  '立体校正',
  '立体匹配（BM算法）',
  '立体匹配（SGBM算法）',
  '视差图计算',
  '深度图生成',
  '点云生成',
  '三维重建基础',
  '相机位姿估计',
  'PnP问题求解',
  '对极几何',
  '本质矩阵分解',
  '三角测量',
  
  // 图像分割
  '图像阈值分割',
  '图像区域生长',
  '图像分裂合并',
  '图像边缘分割',
  '图像聚类分割',
  '图像图割（Graph Cut）',
  '图像超像素分割',
  '图像语义分割基础',
  
  // 特殊应用
  '二维码检测与识别',
  '条形码检测与识别',
  '文字检测与识别（OCR）',
  '人脸检测（Haar）',
  '人脸检测（LBP）',
  '人脸检测（DNN）',
  '人脸识别（LBPH）',
  '人脸识别（EigenFaces）',
  '人脸识别（FisherFaces）',
  '人眼检测',
  '微笑检测',
  '手势识别',
  '手部分割',
  '人体姿态估计',
  '人体检测（HOG+SVM）',
  '车辆检测',
  '车牌识别',
  '交通标志识别',
  
  // 性能优化
  'OpenCV并行处理',
  'OpenCV GPU加速（CUDA）',
  'OpenCV OpenCL加速',
  'OpenCV SIMD优化',
  'OpenCV图像批量处理',
  'OpenCV内存管理',
  'OpenCV Mat数据结构',
  'OpenCV UMat使用',
  
  // 图像格式与编码
  '图像编码格式（JPEG/PNG/TIFF）',
  '图像压缩质量设置',
  '图像EXIF信息读取',
  '图像元数据处理',
  'RAW图像处理',
  'HDR图像处理',
  '全景图像生成',
  '图像水印添加',
  '图像透明度处理'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位机器视觉领域的专家教师。请生成一道${diffLabel}关于"OpenCV - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察 OpenCV 的实际应用
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际开发场景
5. 代码示例使用Python+OpenCV风格

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
          { role: 'system', content: '你是一位专业的机器视觉教师，擅长出高质量的选择题。' },
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
      'OpenCV',
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
  console.log('开始生成 200 道 OpenCV 题目...\n');
  
  const totalQuestions = 200;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = opencvTopics[Math.floor(Math.random() * opencvTopics.length)];
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
