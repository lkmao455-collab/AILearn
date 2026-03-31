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

// 大模型应用开发知识点列表
const llmTopics = [
  '大模型基础概念',
  'Transformer架构',
  '注意力机制',
  '自注意力机制',
  '多头注意力',
  '位置编码',
  '词嵌入',
  'Tokenization',
  'BPE算法',
  'GPT模型系列',
  'GPT-1/2/3/4',
  'ChatGPT',
  'BERT模型',
  'BERT系列变体',
  'RoBERTa',
  'ALBERT',
  'DistilBERT',
  'T5模型',
  'BART模型',
  'LLaMA模型',
  'LLaMA 2/3',
  'Alpaca',
  'Vicuna',
  'Claude模型',
  'Gemini模型',
  '文心一言',
  '通义千问',
  '讯飞星火',
  '模型参数与规模',
  '参数量',
  '上下文窗口',
  'Token限制',
  '模型量化',
  'INT8量化',
  'INT4量化',
  '模型蒸馏',
  '模型剪枝',
  '模型压缩',
  'Prompt工程',
  '零样本学习',
  '少样本学习',
  '思维链(CoT)',
  '自一致性',
  '提示模板',
  '系统提示',
  '角色扮演',
  'Few-shot Prompting',
  'Zero-shot Prompting',
  'Chain-of-Thought',
  'Tree of Thoughts',
  'ReAct框架',
  'RAG技术',
  '检索增强生成',
  '向量数据库',
  'Embedding模型',
  '文本向量化',
  '相似度计算',
  '余弦相似度',
  'FAISS',
  'Milvus',
  'Chroma',
  'Pinecone',
  '文档切分',
  '文本分块',
  '重排序',
  'Reranker',
  'Agent开发',
  'AI Agent',
  'ReAct Agent',
  'Plan-and-Execute',
  '工具调用',
  'Function Calling',
  '工具使用',
  '多Agent协作',
  'AutoGPT',
  'LangChain',
  'LangChain核心概念',
  'Chains',
  'Agents',
  'Memory',
  'Callbacks',
  'LangChain表达式',
  'LCEL',
  'LangServe',
  'LangSmith',
  'LlamaIndex',
  '文档加载',
  '索引构建',
  '查询引擎',
  'OpenAI API',
  'ChatCompletion API',
  'Completion API',
  'Embedding API',
  'API参数设置',
  'Temperature',
  'Top-p',
  'Max tokens',
  '流式输出',
  'SSE',
  '模型微调',
  'Fine-tuning',
  'LoRA',
  'QLoRA',
  'Prefix Tuning',
  'P-Tuning',
  'Adapter',
  '训练数据准备',
  'SFT',
  'RLHF',
  'PPO',
  'DPO',
  '模型评估',
  'BLEU',
  'ROUGE',
  'Perplexity',
  'HumanEval',
  '模型部署',
  'vLLM',
  'Text Generation Inference',
  'FastChat',
  '模型服务化',
  'API部署',
  '容器化部署',
  'Docker',
  'Kubernetes',
  'GPU推理',
  '批处理推理',
  '流式推理',
  '模型安全',
  '提示注入',
  'Prompt Injection',
  '越狱攻击',
  'Jailbreaking',
  '内容过滤',
  '安全对齐',
  '红队测试',
  '模型幻觉',
  'Hallucination',
  '事实性检查',
  '引用溯源',
  '多模态大模型',
  'GPT-4V',
  'CLIP',
  '视觉语言模型',
  '图像理解',
  '多模态Embedding',
  '代码大模型',
  'GitHub Copilot',
  'CodeLlama',
  'StarCoder',
  '代码生成',
  '代码补全',
  '代码解释',
  '大模型应用架构',
  '前端集成',
  '后端服务',
  '数据库设计',
  '缓存策略',
  '限流控制',
  '成本控制',
  'Token计费',
  '模型选择策略',
  'Fallback机制',
  'A/B测试',
  '模型路由',
  '负载均衡',
  '长文本处理',
  '文本摘要',
  '对话历史管理',
  '会话状态',
  '上下文压缩',
  '滑动窗口',
  '大模型伦理',
  'AI伦理',
  '偏见与公平',
  '隐私保护',
  '数据安全',
  '知识产权',
  '开源模型许可',
  '商业使用',
  '模型可解释性',
  '注意力可视化',
  'Token重要性',
  '大模型趋势',
  'MoE架构',
  '混合专家模型',
  '长上下文模型',
  '多Agent系统',
  '具身智能',
  'AI原生应用'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位大模型应用开发领域的专家教师。请生成一道${diffLabel}关于"大模型应用开发 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察大模型应用开发的实际知识和理论概念
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际大模型应用开发场景
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
        model: 'qwen3.5-plus',
        messages: [
          { role: 'system', content: '你是一位专业的大模型应用开发教师，擅长出高质量的选择题。' },
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
      '大模型应用开发',
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
  console.log('开始生成 200 道大模型应用开发题目...\n');
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
      const topic = llmTopics[Math.floor(Math.random() * llmTopics.length)];
      
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