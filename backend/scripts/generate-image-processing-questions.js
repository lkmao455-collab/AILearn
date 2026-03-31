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

// 图像处理知识点列表
const imageProcessingTopics = [
  '数字图像基础概念',
  '图像采样与量化',
  '图像分辨率与质量',
  '灰度图像与彩色图像',
  'RGB色彩模型',
  'HSV/HSI色彩空间',
  'YCbCr色彩空间',
  'CMYK色彩模型',
  '图像直方图均衡化',
  '图像对比度拉伸',
  '图像对数变换',
  '图像幂律变换',
  '图像灰度级分层',
  '图像位平面分层',
  '图像算术运算',
  '图像逻辑运算',
  '图像几何变换基础',
  '图像平移变换',
  '图像缩放变换',
  '图像旋转变换',
  '图像镜像变换',
  '图像剪切变换',
  '图像插值方法',
  '最近邻插值',
  '双线性插值',
  '双三次插值',
  '图像卷积运算',
  '图像平滑滤波',
  '均值滤波器',
  '加权平均滤波',
  '高斯低通滤波',
  '图像锐化滤波',
  '拉普拉斯算子',
  'Sobel算子',
  'Prewitt算子',
  'Roberts算子',
  'Kirsch算子',
  '图像边缘检测',
  'Canny边缘检测算法',
  'LoG算子',
  'DoG算子',
  '图像噪声模型',
  '椒盐噪声',
  '高斯噪声',
  '均匀噪声',
  '指数噪声',
  '瑞利噪声',
  '图像去噪方法',
  '均值滤波去噪',
  '中值滤波去噪',
  '自适应滤波',
  '维纳滤波',
  '图像频域处理',
  '傅里叶变换基础',
  '离散傅里叶变换DFT',
  '快速傅里叶变换FFT',
  '频域滤波器设计',
  '理想低通滤波',
  '巴特沃斯滤波',
  '高斯频域滤波',
  '同态滤波',
  '图像形态学基础',
  '二值图像腐蚀',
  '二值图像膨胀',
  '开运算与闭运算',
  '击中击不中变换',
  '形态学骨架提取',
  '形态学边界提取',
  '灰度形态学',
  '图像分割基础',
  '阈值分割方法',
  '全局阈值分割',
  '自适应阈值分割',
  'Otsu自动阈值',
  '迭代阈值分割',
  '区域生长分割',
  '分裂合并分割',
  '分水岭分割算法',
  '边缘检测分割',
  '霍夫变换检测',
  '图像特征提取',
  '图像纹理特征',
  '灰度共生矩阵',
  '图像形状特征',
  '图像矩特征',
  '图像颜色特征',
  '图像颜色直方图',
  '图像颜色矩',
  '图像颜色聚合向量',
  '图像表示与描述',
  '链码表示',
  '多边形近似',
  '标记图表示',
  '边界特征描述',
  '区域特征描述',
  '图像压缩基础',
  '无损压缩',
  '有损压缩',
  '霍夫曼编码',
  '算术编码',
  '行程编码',
  'JPEG压缩标准',
  '图像质量评价',
  '主观评价方法',
  '客观评价指标',
  'PSNR峰值信噪比',
  'SSIM结构相似性'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位数字图像处理领域的专家教师。请生成一道${diffLabel}关于"图像处理 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察图像处理的理论知识和实际应用
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际图像处理开发场景

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
          { role: 'system', content: '你是一位专业的数字图像处理教师，擅长出高质量的选择题。' },
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
      '图像处理',
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
  console.log('开始生成 100 道图像处理题目...\n');
  
  const totalQuestions = 100;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = imageProcessingTopics[Math.floor(Math.random() * imageProcessingTopics.length)];
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