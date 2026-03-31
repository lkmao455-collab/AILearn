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

// OpenCV 知识点列表
const opencvTopics = [
  '图像读取与显示',
  '图像色彩空间转换',
  '图像缩放与裁剪',
  '图像旋转与翻转',
  '图像滤波与平滑',
  '边缘检测（Canny、Sobel、Laplacian）',
  '图像二值化',
  '形态学操作（腐蚀、膨胀、开闭运算）',
  '图像轮廓检测',
  '图像直方图',
  '模板匹配',
  '图像金字塔',
  '霍夫变换（直线、圆检测）',
  '图像傅里叶变换',
  '图像特征点检测（SIFT、SURF、ORB）',
  '特征描述与匹配',
  '图像拼接',
  '视频读取与处理',
  '光流法',
  '背景减除',
  '目标跟踪',
  '人脸识别',
  '人脸检测',
  '图像分割（分水岭、GrabCut）',
  '图像修复',
  '图像去噪',
  '图像锐化',
  '图像对比度增强',
  '图像亮度调整',
  '图像混合与叠加',
  '图像掩膜操作',
  '图像 ROI 操作',
  '图像通道分离与合并',
  '图像位运算',
  '图像几何变换（仿射、透视）',
  '图像插值算法',
  '图像卷积操作',
  '图像梯度计算',
  '图像拉普拉斯金字塔',
  '图像高斯金字塔',
  '图像差分',
  '图像阈值处理（自适应、Otsu）',
  '图像连通域分析',
  '图像凸包检测',
  '图像最小外接矩形',
  '图像最小外接圆',
  '图像矩',
  '图像 Hu 矩',
  '图像轮廓逼近',
  '图像轮廓凸缺陷',
  '图像形状匹配',
  '图像距离变换',
  '图像积分图',
  '图像 Box Filter',
  '图像双边滤波',
  '图像中值滤波',
  '图像高斯滤波',
  '图像均值滤波',
  '图像方框滤波',
  '图像腐蚀与膨胀',
  '图像开运算与闭运算',
  '图像顶帽与黑帽',
  '图像形态学梯度',
  '图像击中击不中',
  '图像细化',
  '图像骨架提取',
  '图像轮廓层次',
  '图像轮廓面积与周长',
  '图像轮廓拟合',
  '图像轮廓方向',
  '图像轮廓极值点',
  '图像轮廓多边形逼近',
  '图像轮廓凸包',
  '图像轮廓缺陷',
  '图像轮廓匹配',
  '图像霍夫直线检测',
  '图像霍夫圆检测',
  '图像广义霍夫变换',
  '图像概率霍夫变换',
  '图像直线拟合',
  '图像圆拟合',
  '图像椭圆拟合',
  '图像角点检测（Harris、Shi-Tomasi）',
  '图像 FAST 角点检测',
  '图像 BRIEF 描述子',
  '图像 ORB 特征',
  '图像 AKAZE 特征',
  '图像 KAZE 特征',
  '图像 BRISK 特征',
  '图像 FREAK 描述子',
  '图像 LUCID 描述子',
  '图像 LATCH 描述子',
  '图像 DAISY 描述子',
  '图像 MSER 区域检测',
  '图像 KNN 匹配',
  '图像 FLANN 匹配',
  '图像 RANSAC 几何验证',
  '图像单应性矩阵估计',
  '图像相机标定',
  '图像畸变校正',
  '图像立体匹配',
  '图像深度估计',
  '图像三维重建'
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
  console.log('开始生成 100 道 OpenCV 题目...\n');
  
  const totalQuestions = 100;
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