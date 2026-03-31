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

// HALCON 知识点列表（扩展版）
const halconTopics = [
  // 基础操作
  'HALCON安装与配置',
  'HALCON开发环境(HDevelop)',
  '图像读取与显示',
  '图像格式转换',
  '图像保存与导出',
  '图像属性获取',
  '图像通道操作',
  '图像类型转换',
  '图像ROI设置',
  '图像坐标系统',
  '图像金字塔',
  '图像缩放与变换',
  '图像裁剪与拼接',
  '图像镜像与旋转',
  '图像数组操作',
  
  // 图像预处理
  '图像灰度化',
  '图像滤波（均值）',
  '图像滤波（高斯）',
  '图像滤波（中值）',
  '图像边缘保持滤波',
  '图像高斯金字塔',
  '图像拉普拉斯金字塔',
  '图像形态学（腐蚀）',
  '图像形态学（膨胀）',
  '图像形态学（开运算）',
  '图像形态学（闭运算）',
  '图像形态学（顶帽）',
  '图像形态学（黑帽）',
  '图像形态学（击中击不中）',
  '图像形态学（骨架提取）',
  '图像形态学（边界提取）',
  '图像形态学（区域填充）',
  '图像距离变换',
  '图像距离计算',
  '图像二值化（全局阈值）',
  '图像二值化（自动阈值）',
  '图像二值化（局部阈值）',
  '图像二值化（多阈值）',
  '图像直方图均衡化',
  '图像对比度增强',
  '图像亮度调整',
  '图像伽马校正',
  '图像对数变换',
  '图像归一化',
  '图像去噪',
  '图像锐化',
  '图像平滑',
  
  // 边缘检测与轮廓
  'Sobel边缘检测',
  'Laplacian边缘检测',
  'Canny边缘检测',
  'Deriche边缘检测',
  'Shen边缘检测',
  'Frei边缘检测',
  'Kirsch边缘检测',
  'Roberts边缘检测',
  'Prewitt边缘检测',
  '边缘检测参数调优',
  '边缘连接',
  '边缘细化',
  '轮廓提取',
  '轮廓逼近',
  '轮廓特征计算',
  '轮廓长度与面积',
  '轮廓中心点计算',
  '轮廓方向计算',
  '轮廓圆度计算',
  '轮廓矩形度计算',
  '轮廓凸包计算',
  '轮廓凸性检测',
  '轮廓凹陷检测',
  '轮廓分割',
  '轮廓合并',
  '轮廓选择',
  '轮廓排序',
  '轮廓变换',
  '轮廓匹配',
  '轮廓相似度计算',
  
  // 区域处理
  '区域生成',
  '区域连接',
  '区域联合',
  '区域交集',
  '区域差集',
  '区域补集',
  '区域选择',
  '区域排序',
  '区域变换',
  '区域仿射变换',
  '区域透视变换',
  '区域极坐标变换',
  '区域形状特征',
  '区域面积计算',
  '区域中心计算',
  '区域方向计算',
  '区域椭圆拟合',
  '区域圆拟合',
  '区域矩形拟合',
  '区域凸包',
  '区域骨架',
  '区域边界',
  '区域孔洞填充',
  '区域分割',
  '区域生长',
  '区域分裂合并',
  '区域标记',
  '区域连通域分析',
  '区域距离计算',
  '区域访问',
  '区域特征提取',
  
  // 特征提取
  '灰度特征（均值）',
  '灰度特征（方差）',
  '灰度特征（标准差）',
  '灰度特征（最小值）',
  '灰度特征（最大值）',
  '灰度特征（中位数）',
  '灰度直方图特征',
  '灰度共生矩阵（GLCM）',
  '灰度游程矩阵（GLRLM）',
  '局部二值模式（LBP）',
  'Haar-like特征',
  'HOG特征提取',
  'SIFT特征提取',
  'SURF特征提取',
  'ORB特征提取',
  '形状特征（Hu矩）',
  '形状特征（Zernike矩）',
  '形状特征（傅里叶描述子）',
  '纹理特征（Laws纹理）',
  '纹理特征（Tamura）',
  '颜色特征（直方图）',
  '颜色特征（矩）',
  '颜色特征（主成分）',
  '几何特征（面积）',
  '几何特征（周长）',
  '几何特征（圆形度）',
  '几何特征（矩形度）',
  '几何特征（伸长度）',
  '几何特征（紧凑度）',
  '几何特征（凸性）',
  '几何特征（偏心距）',
  
  // 模板匹配
  '基于灰度的模板匹配',
  '基于形状的模板匹配',
  '基于组件的模板匹配',
  '基于相关性的模板匹配',
  '模板创建与训练',
  '模板参数设置',
  '多模板匹配',
  '多尺度模板匹配',
  '旋转不变模板匹配',
  '缩放不变模板匹配',
  '模板匹配优化',
  '模板匹配速度优化',
  '模板匹配精度优化',
  '模板匹配结果解析',
  '模板匹配分数阈值',
  '模板匹配重叠处理',
  
  // 测量与标定
  '相机标定基础',
  '相机内参标定',
  '相机外参标定',
  '畸变校正',
  '立体标定',
  '手眼标定',
  '测量标定',
  '像素尺寸转换',
  '世界坐标转换',
  '1D测量',
  '2D测量',
  '圆测量',
  '椭圆测量',
  '矩形测量',
  '线测量',
  '弧测量',
  '边缘对测量',
  '测量工具配置',
  '测量结果分析',
  '测量精度评估',
  '测量重复性',
  '亚像素精度测量',
  
  //  Blob分析
  'Blob分析基础',
  'Blob特征提取',
  'Blob筛选',
  'Blob分类',
  'Blob跟踪',
  'Blob选择',
  'Blob变换',
  'Blob几何特征',
  'Blob灰度特征',
  'Blob形状特征',
  'Blob纹理特征',
  'Blob颜色特征',
  
  //  OCR识别
  'OCR基础',
  '字符分割',
  '字符训练',
  '字体训练',
  'OCR读取',
  'OCR识别优化',
  '点阵字符识别',
  '工业字符识别',
  '手写字符识别',
  'OCR结果验证',
  'OCR置信度评估',
  
  //  条码与二维码
  '一维码识别',
  '二维码识别（QR）',
  '二维码识别（DataMatrix）',
  '二维码识别（PDF417）',
  '条码质量评估',
  '条码定位',
  '条码解码',
  '条码参数设置',
  '多角度条码识别',
  '损坏条码识别',
  
  //  3D视觉
  '3D相机标定',
  '立体视觉基础',
  '双目立体匹配',
  '视差图计算',
  '深度图生成',
  '点云生成',
  '点云处理',
  '点云滤波',
  '点云分割',
  '点云配准',
  '3D匹配',
  '3D测量',
  '3D表面检测',
  '3D物体识别',
  '3D位姿估计',
  '结构光3D',
  'ToF相机处理',
  '激光三角测量',
  
  //  颜色处理
  '颜色空间转换',
  'RGB颜色处理',
  'HSV颜色处理',
  'Lab颜色处理',
  'YUV颜色处理',
  '颜色阈值分割',
  '颜色分类',
  '颜色识别',
  '颜色校正',
  '白平衡',
  '颜色恒常性',
  '多光谱图像处理',
  
  //  缺陷检测
  '表面缺陷检测',
  '划痕检测',
  '污点检测',
  '气泡检测',
  '裂纹检测',
  '异物检测',
  '缺失检测',
  '变形检测',
  '颜色缺陷检测',
  '纹理缺陷检测',
  '形状缺陷检测',
  '尺寸缺陷检测',
  '缺陷分类',
  '缺陷测量',
  '缺陷统计',
  
  //  图像配准与拼接
  '图像配准基础',
  '基于特征的配准',
  '基于灰度的配准',
  '图像拼接',
  '全景图像生成',
  '图像融合',
  '配准精度评估',
  
  //  运动分析
  '光流法',
  '运动检测',
  '背景建模',
  '前景提取',
  '运动跟踪',
  '多目标跟踪',
  '轨迹分析',
  '速度测量',
  '加速度测量',
  
  //  深度学习模块
  'HALCON深度学习基础',
  '图像分类',
  '目标检测',
  '语义分割',
  '实例分割',
  '异常检测',
  '边缘检测（深度学习）',
  'OCR（深度学习）',
  '深度学习模型训练',
  '数据预处理',
  '数据增强',
  '模型评估',
  '模型优化',
  '模型导出',
  '模型推理',
  'GPU加速',
  
  //  并行与性能优化
  '多线程处理',
  '并行计算',
  'GPU加速',
  '性能优化策略',
  '内存管理',
  '图像缓存',
  '算法优化',
  '代码优化',
  
  //  与其他系统集成
  'C++接口开发',
  'C#接口开发',
  'Python接口开发',
  'VB.NET接口开发',
  'COM接口',
  '图像采集接口',
  'PLC通信',
  '机器人通信',
  'MES系统集成',
  '数据库集成',
  '文件I/O操作',
  '网络通信',
  
  //  实际应用
  '定位引导',
  '尺寸测量应用',
  '缺陷检测应用',
  '识别验证应用',
  '机器人视觉引导',
  '自动光学检测（AOI）',
  '质量检测系统',
  '视觉对位系统',
  '视觉分拣系统',
  '视觉跟踪系统',
  '视觉标定系统',
  '视觉测量系统'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位机器视觉领域的专家教师，精通HALCON软件。请生成一道${diffLabel}关于"HALCON - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察 HALCON 的实际应用和理论知识
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际工业视觉开发场景
5. 代码示例使用HDevelop语法风格

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
          { role: 'system', content: '你是一位专业的HALCON机器视觉教师，擅长出高质量的选择题。' },
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
      'HALCON',
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
  console.log('开始生成 200 道 HALCON 题目...\n');
  
  const totalQuestions = 200;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = halconTopics[Math.floor(Math.random() * halconTopics.length)];
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
