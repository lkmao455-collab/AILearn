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

// C++ 知识点列表
const cppTopics = [
  'C++基础语法',
  '变量与数据类型',
  '运算符与表达式',
  '输入输出流',
  '条件语句(if/else)',
  '循环语句(for/while/do-while)',
  'switch语句',
  'break与continue',
  '数组基础',
  '多维数组',
  '字符串处理',
  '指针基础',
  '指针与数组',
  '指针与函数',
  '引用',
  '函数定义与调用',
  '函数参数传递',
  '函数重载',
  '函数默认参数',
  '函数模板',
  '递归函数',
  '内联函数',
  'Lambda表达式',
  '结构体',
  '联合体',
  '枚举类型',
  'typedef与using',
  '动态内存分配',
  'new与delete',
  '内存泄漏',
  '智能指针',
  'unique_ptr',
  'shared_ptr',
  'weak_ptr',
  '类与对象',
  '构造函数',
  '析构函数',
  '拷贝构造函数',
  '赋值运算符',
  '成员变量与成员函数',
  '访问修饰符',
  '封装',
  '继承',
  '多继承',
  '虚继承',
  '多态',
  '虚函数',
  '纯虚函数',
  '抽象类',
  '虚函数表',
  '运算符重载',
  '友元函数',
  '友元类',
  '静态成员',
  '常量成员',
  'this指针',
  'const关键字',
  'static关键字',
  'extern关键字',
  'volatile关键字',
  '类型转换',
  'RTTI',
  'typeid',
  'dynamic_cast',
  'static_cast',
  'const_cast',
  'reinterpret_cast',
  '异常处理',
  'try-catch',
  'throw',
  '标准异常类',
  '文件操作',
  '文件读写',
  '二进制文件',
  '文本文件',
  '流操作',
  'stringstream',
  'STL容器',
  'vector',
  'list',
  'deque',
  'stack',
  'queue',
  'priority_queue',
  'set',
  'map',
  'unordered_set',
  'unordered_map',
  'multiset',
  'multimap',
  '迭代器',
  '算法库',
  'sort',
  'find',
  'binary_search',
  'lower_bound',
  'upper_bound',
  'copy',
  'transform',
  'accumulate',
  '函数对象',
  '谓词',
  '适配器',
  '绑定器',
  '命名空间',
  '命名空间别名',
  'using声明',
  '头文件',
  '预处理器',
  '宏定义',
  '条件编译',
  '多文件编程',
  '链接',
  '编译',
  '调试技巧',
  'C++11新特性',
  'auto关键字',
  'decltype',
  '范围for循环',
  '初始化列表',
  'nullptr',
  'constexpr',
  '委托构造函数',
  '继承构造函数',
  '移动语义',
  '右值引用',
  '完美转发',
  '变参模板',
  '模板元编程',
  'SFINAE',
  '类型萃取',
  '线程',
  'thread',
  'mutex',
  'lock_guard',
  'unique_lock',
  'condition_variable',
  'future与promise',
  'async',
  '原子操作',
  '内存模型',
  '并发编程',
  '正则表达式',
  '随机数生成',
  '时间库',
  'chrono',
  '智能指针工厂函数',
  'make_unique',
  'make_shared',
  '结构化绑定',
  'if constexpr',
  '折叠表达式',
  '概念(Concepts)',
  '模块(Modules)',
  '协程(Coroutines)',
  '三路比较运算符',
  '指定初始化',
  'C++20新特性'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位C++编程领域的专家教师。请生成一道${diffLabel}关于"C++ - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察C++的实际编程知识和理论概念
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际C++开发场景
5. 代码示例要符合C++11/14/17/20标准

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
          { role: 'system', content: '你是一位专业的C++编程教师，擅长出高质量的选择题。' },
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
      'C++',
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
  console.log('开始生成 200 道 C++ 题目...\n');
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
      const topic = cppTopics[Math.floor(Math.random() * cppTopics.length)];
      
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