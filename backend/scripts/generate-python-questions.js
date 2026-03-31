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

// Python 知识点列表
const pythonTopics = [
  'Python基础语法',
  '变量与数据类型',
  '数字类型',
  '字符串类型',
  '列表(list)',
  '元组(tuple)',
  '字典(dict)',
  '集合(set)',
  '条件语句(if/elif/else)',
  'for循环',
  'while循环',
  '循环控制(break/continue)',
  '列表推导式',
  '字典推导式',
  '生成器表达式',
  '函数定义',
  '函数参数',
  '默认参数',
  '可变参数(*args)',
  '关键字参数(**kwargs)',
  'Lambda表达式',
  '递归函数',
  '装饰器',
  '闭包',
  '作用域与命名空间',
  '模块与包',
  'import语句',
  '__name__与__main__',
  '内置函数',
  'map/filter/reduce',
  'zip函数',
  'enumerate函数',
  '文件操作',
  '文件读写',
  'with语句',
  '异常处理',
  'try/except/finally',
  '自定义异常',
  '类与对象',
  '类属性与方法',
  '构造函数(__init__)',
  '析构函数(__del__)',
  '继承',
  '多继承',
  '方法重写',
  'super()函数',
  '类方法与静态方法',
  '属性装饰器(@property)',
  '魔术方法',
  '运算符重载',
  '封装',
  '多态',
  '抽象基类',
  '迭代器',
  '生成器',
  'yield关键字',
  '生成器函数',
  '迭代器协议',
  '可迭代对象',
  '正则表达式',
  're模块',
  '字符串匹配',
  '字符串替换',
  '字符串分割',
  '日期与时间',
  'datetime模块',
  'time模块',
  '时间格式化',
  'JSON处理',
  'json模块',
  'XML处理',
  'CSV处理',
  '数据库操作',
  'SQLite',
  'MySQL',
  '网络编程',
  'socket编程',
  'HTTP请求',
  'requests库',
  'urllib库',
  'Web开发',
  'Flask框架',
  'Django框架',
  'FastAPI框架',
  '模板引擎',
  '路由',
  '中间件',
  '数据科学',
  'NumPy',
  '数组操作',
  '矩阵运算',
  '广播机制',
  'Pandas',
  'DataFrame',
  'Series',
  '数据清洗',
  '数据聚合',
  '数据可视化',
  'Matplotlib',
  'Seaborn',
  '机器学习',
  'Scikit-learn',
  '监督学习',
  '无监督学习',
  '模型评估',
  '深度学习',
  'TensorFlow',
  'PyTorch',
  '神经网络',
  '卷积神经网络',
  '循环神经网络',
  '并发编程',
  '多线程',
  '多进程',
  '线程池',
  '进程池',
  '异步编程',
  'asyncio',
  'async/await',
  '协程',
  '并发与并行',
  'GIL全局解释器锁',
  '测试',
  '单元测试',
  'unittest',
  'pytest',
  'Mock测试',
  '代码调试',
  'pdb调试器',
  '日志记录',
  'logging模块',
  '性能优化',
  '性能分析',
  '内存管理',
  '垃圾回收',
  '引用计数',
  '循环引用',
  '弱引用',
  '上下文管理器',
  '__enter__与__exit__',
  '描述符',
  '元类',
  'type函数',
  '动态类创建',
  '反射与内省',
  'getattr/setattr',
  'hasattr',
  'type与isinstance',
  '鸭子类型',
  '猴子补丁',
  '单例模式',
  '工厂模式',
  '装饰器模式',
  '观察者模式',
  'Pythonic编程',
  'PEP8规范',
  '代码风格',
  '文档字符串',
  '类型注解',
  'typing模块',
  '泛型',
  'Optional',
  'Union',
  'List/Dict类型',
  '虚拟环境',
  'venv',
  'conda',
  'pip包管理',
  'requirements.txt',
  'setup.py',
  'PyPI发布',
  'Jupyter Notebook',
  'IPython',
  '命令行参数',
  'argparse',
  '环境变量',
  '配置文件',
  'YAML处理',
  'INI处理',
  '加密与安全',
  'hashlib',
  'base64',
  '密码学',
  '图像处理',
  'PIL/Pillow',
  'OpenCV',
  '音频处理',
  '视频处理',
  'GUI开发',
  'Tkinter',
  'PyQt',
  'PySide',
  '游戏开发',
  'Pygame',
  '自动化办公',
  'Excel处理',
  'Word处理',
  'PDF处理',
  '邮件发送',
  '爬虫开发',
  'BeautifulSoup',
  'Scrapy',
  'Selenium',
  '数据解析',
  'API开发',
  'RESTful API',
  'GraphQL',
  'WebSocket',
  '消息队列',
  'Redis',
  'RabbitMQ',
  'Kafka',
  '缓存技术',
  'Docker部署',
  'CI/CD',
  'Git版本控制',
  '代码质量',
  '代码覆盖率',
  '静态类型检查',
  'mypy',
  '代码格式化',
  'black',
  'isort',
  'Python 2与3差异',
  'Python新版本特性',
  'Python 3.8+特性',
  '海象运算符',
  '位置参数',
  '仅关键字参数',
  'f-string高级用法',
  'walrus operator'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位Python编程领域的专家教师。请生成一道${diffLabel}关于"Python - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察Python的实际编程知识和理论概念
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际Python开发场景
5. 代码示例要符合Python 3.6+标准

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
          { role: 'system', content: '你是一位专业的Python编程教师，擅长出高质量的选择题。' },
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
      'Python',
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
  console.log('开始生成 200 道 Python 题目...\n');
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
      const topic = pythonTopics[Math.floor(Math.random() * pythonTopics.length)];
      
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