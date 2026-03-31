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

// C语言知识点列表
const cTopics = [
  'C语言基础语法',
  '数据类型',
  '整型',
  '浮点型',
  '字符型',
  '布尔型',
  '变量定义',
  '常量定义',
  '类型转换',
  '隐式转换',
  '显式转换',
  '运算符',
  '算术运算符',
  '关系运算符',
  '逻辑运算符',
  '位运算符',
  '赋值运算符',
  '条件运算符',
  'sizeof运算符',
  '运算符优先级',
  '控制结构',
  'if语句',
  'if-else语句',
  'switch语句',
  'for循环',
  'while循环',
  'do-while循环',
  'break语句',
  'continue语句',
  'goto语句',
  '嵌套循环',
  '数组',
  '一维数组',
  '二维数组',
  '多维数组',
  '数组初始化',
  '数组遍历',
  '字符数组',
  '字符串处理',
  'strcpy',
  'strncpy',
  'strcat',
  'strncat',
  'strcmp',
  'strncmp',
  'strlen',
  'strchr',
  'strstr',
  'strtok',
  'sprintf',
  'sscanf',
  '指针',
  '指针基础',
  '指针运算',
  '指针与数组',
  '指针与字符串',
  '指针与函数',
  '函数指针',
  '指针数组',
  '数组指针',
  '二级指针',
  '多级指针',
  '空指针',
  '野指针',
  '内存管理',
  'malloc',
  'calloc',
  'realloc',
  'free',
  '内存泄漏',
  '内存越界',
  '栈内存',
  '堆内存',
  '静态内存',
  '动态内存',
  '结构体',
  '结构体定义',
  '结构体初始化',
  '结构体数组',
  '结构体指针',
  '结构体嵌套',
  '结构体与函数',
  'typedef',
  '联合体',
  '枚举类型',
  '位域',
  '文件操作',
  '文件打开',
  '文件关闭',
  '文件读取',
  '文件写入',
  'fread',
  'fwrite',
  'fscanf',
  'fprintf',
  'fgets',
  'fputs',
  'fgetc',
  'fputc',
  'feof',
  'fseek',
  'ftell',
  'rewind',
  '二进制文件',
  '文本文件',
  '函数',
  '函数定义',
  '函数声明',
  '函数调用',
  '参数传递',
  '值传递',
  '指针传递',
  '数组参数',
  '返回值',
  '递归函数',
  '内联函数',
  '宏定义',
  '预处理指令',
  '#include',
  '#define',
  '#ifdef',
  '#ifndef',
  '#endif',
  '#if',
  '#else',
  '#elif',
  '#pragma',
  '条件编译',
  '头文件',
  '源文件',
  '多文件编程',
  'extern',
  'static',
  'const',
  'volatile',
  'register',
  'auto',
  '作用域',
  '生命周期',
  '链接属性',
  '内部链接',
  '外部链接',
  '无链接',
  '编译过程',
  '预处理',
  '编译',
  '汇编',
  '链接',
  'Makefile',
  'CMake',
  'GCC编译器',
  'Clang编译器',
  'MSVC编译器',
  '调试技巧',
  'GDB调试',
  '断点',
  '单步执行',
  '变量查看',
  '堆栈跟踪',
  '核心转储',
  'Valgrind',
  '内存检测',
  '性能分析',
  '算法',
  '排序算法',
  '冒泡排序',
  '选择排序',
  '插入排序',
  '快速排序',
  '归并排序',
  '堆排序',
  '希尔排序',
  '查找算法',
  '顺序查找',
  '二分查找',
  '哈希查找',
  '二叉搜索树',
  '链表',
  '单链表',
  '双链表',
  '循环链表',
  '链表操作',
  '创建链表',
  '插入节点',
  '删除节点',
  '遍历链表',
  '反转链表',
  '合并链表',
  '栈',
  '栈的实现',
  '入栈',
  '出栈',
  '栈顶元素',
  '栈的应用',
  '队列',
  '队列的实现',
  '入队',
  '出队',
  '队首元素',
  '队尾元素',
  '循环队列',
  '优先队列',
  '树',
  '二叉树',
  '二叉树遍历',
  '前序遍历',
  '中序遍历',
  '后序遍历',
  '层序遍历',
  '二叉搜索树',
  '平衡二叉树',
  'AVL树',
  '红黑树',
  'B树',
  'B+树',
  '堆',
  '最大堆',
  '最小堆',
  '堆操作',
  '建堆',
  '调整堆',
  '图',
  '图的表示',
  '邻接矩阵',
  '邻接表',
  '图的遍历',
  '深度优先搜索',
  '广度优先搜索',
  '最短路径',
  'Dijkstra算法',
  'Floyd算法',
  '最小生成树',
  'Prim算法',
  'Kruskal算法',
  '拓扑排序',
  '关键路径',
  '动态规划',
  '贪心算法',
  '分治算法',
  '回溯算法',
  '递归',
  '尾递归',
  '递归优化',
  '迭代',
  '位运算',
  '位操作',
  '移位运算',
  '位掩码',
  '位域',
  '大小端',
  '字节序',
  '网络编程',
  'Socket编程',
  'TCP编程',
  'UDP编程',
  '客户端',
  '服务器',
  'bind',
  'listen',
  'accept',
  'connect',
  'send',
  'recv',
  'select',
  'poll',
  'epoll',
  '多线程',
  'pthread',
  '线程创建',
  '线程同步',
  '互斥锁',
  '条件变量',
  '信号量',
  '读写锁',
  '线程池',
  '进程',
  '进程创建',
  '进程通信',
  '管道',
  '消息队列',
  '共享内存',
  '信号量',
  '信号',
  'fork',
  'exec',
  'wait',
  '僵尸进程',
  '孤儿进程',
  '进程调度',
  '标准库',
  'stdio.h',
  'stdlib.h',
  'string.h',
  'math.h',
  'time.h',
  'ctype.h',
  'assert.h',
  'errno.h',
  'limits.h',
  'float.h',
  'stddef.h',
  'stdint.h',
  'stdbool.h',
  '复杂声明',
  '函数指针数组',
  '指针函数',
  '回调函数',
  '可变参数',
  'va_list',
  'va_start',
  'va_arg',
  'va_end',
  '命令行参数',
  'argc',
  'argv',
  '环境变量',
  'getenv',
  'setenv',
  '系统调用',
  'open',
  'read',
  'write',
  'close',
  'lseek',
  'stat',
  'fork',
  'execve',
  'waitpid',
  '信号处理',
  'signal',
  'sigaction',
  'kill',
  'alarm',
  '定时器',
  'setitimer',
  'getitimer',
  '时间处理',
  'time',
  'gettimeofday',
  'clock',
  'strftime',
  'localtime',
  'gmtime',
  'mktime',
  'difftime',
  '随机数',
  'rand',
  'srand',
  '数学函数',
  'sin',
  'cos',
  'tan',
  'sqrt',
  'pow',
  'log',
  'exp',
  'fabs',
  'ceil',
  'floor',
  'round',
  '字符串处理',
  '字符判断',
  'isalpha',
  'isdigit',
  'isalnum',
  'isspace',
  'isupper',
  'islower',
  'toupper',
  'tolower',
  '内存操作',
  'memcpy',
  'memmove',
  'memset',
  'memcmp',
  'memchr',
  '错误处理',
  'perror',
  'strerror',
  'errno',
  '断言',
  'assert',
  '静态断言',
  'Static_assert',
  '泛型编程',
  '泛型选择',
  '_Generic',
  '原子操作',
  'stdatomic.h',
  '原子类型',
  '内存顺序',
  '线程局部存储',
  '_Thread_local',
  '复杂数',
  'complex.h',
  '复数运算',
  '宽字符',
  'wchar.h',
  '多字节字符',
  '本地化',
  'locale.h',
  'setlocale',
  '国际化',
  '编码转换',
  'UTF-8',
  'GBK',
  'Unicode',
  '安全编程',
  '缓冲区溢出',
  '格式化字符串',
  '整数溢出',
  '安全函数',
  'strlcpy',
  'strlcat',
  '代码规范',
  '命名规范',
  '注释规范',
  '缩进规范',
  '代码风格',
  'Linux编程',
  '系统编程',
  '设备驱动',
  '内核模块',
  '嵌入式C',
  '单片机',
  'ARM',
  '寄存器操作',
  '中断处理',
  'DMA',
  '定时器',
  'GPIO',
  'UART',
  'SPI',
  'I2C',
  'ADC',
  'DAC',
  'PWM',
  '看门狗',
  '低功耗',
  'Bootloader',
  '固件开发',
  '实时操作系统',
  'FreeRTOS',
  'RT-Thread',
  '任务调度',
  '信号量',
  '互斥量',
  '事件组',
  '消息队列',
  '内存管理',
  '堆管理',
  '栈管理',
  '静态分配',
  '动态分配',
  '内存池',
  '性能优化',
  '循环展开',
  '循环优化',
  '分支预测',
  '缓存优化',
  'SIMD',
  '向量化',
  '编译优化',
  'O0优化',
  'O1优化',
  'O2优化',
  'O3优化',
  'Os优化',
  '链接优化',
  'LTO',
  '代码生成',
  '汇编嵌入',
  '内联汇编',
  '汇编指令',
  'x86汇编',
  'ARM汇编',
  '调用约定',
  'cdecl',
  'stdcall',
  'fastcall',
  'thiscall',
  'ABI',
  'API',
  '库开发',
  '静态库',
  '动态库',
  '共享库',
  '库链接',
  '运行时库',
  '标准C库',
  'POSIX',
  'C99标准',
  'C11标准',
  'C17标准',
  'C23标准',
  'GNU扩展',
  'Clang扩展',
  'MSVC扩展',
  '可移植性',
  '跨平台开发',
  '条件编译',
  '平台检测',
  '字节对齐',
  '结构体对齐',
  '内存对齐',
  'pack指令',
  '位域对齐',
  '联合体大小',
  '枚举大小',
  '指针大小',
  '整数大小',
  '浮点精度',
  'double精度',
  'long double',
  '浮点比较',
  '浮点误差',
  '数值稳定性',
  '大数运算',
  '高精度计算',
  '任意精度',
  'GMP库',
  'MPFR库',
  '科学计算',
  '矩阵运算',
  '向量运算',
  '线性代数',
  '数值分析',
  '插值',
  '拟合',
  '积分',
  '微分',
  'FFT',
  '快速傅里叶变换',
  '信号处理',
  '滤波器',
  '卷积',
  '相关',
  '图像处理',
  '像素操作',
  '颜色空间',
  '图像格式',
  'BMP',
  'PNG',
  'JPEG',
  '文件解析',
  '数据序列化',
  'JSON解析',
  'XML解析',
  'INI解析',
  'CSV解析',
  '二进制协议',
  '网络协议',
  'HTTP协议',
  'FTP协议',
  'SMTP协议',
  'DNS协议',
  '加密算法',
  '哈希算法',
  'MD5',
  'SHA1',
  'SHA256',
  '对称加密',
  'AES',
  'DES',
  '非对称加密',
  'RSA',
  'ECC',
  '数字签名',
  '证书',
  'SSL',
  'TLS',
  'OpenSSL',
  '数据库编程',
  'SQLite',
  'MySQL',
  'PostgreSQL',
  'SQL语句',
  '连接池',
  '事务',
  '锁机制',
  '日志系统',
  '配置文件',
  'INI文件',
  'XML文件',
  'JSON文件',
  'YAML文件',
  '命令解析',
  '参数解析',
  'getopt',
  'argp',
  '正则表达式',
  'regex.h',
  '模式匹配',
  '状态机',
  '有限状态机',
  '解析器',
  '词法分析',
  '语法分析',
  '编译器原理',
  '解释器',
  '虚拟机',
  '字节码',
  '垃圾回收',
  '引用计数',
  '标记清除',
  '复制算法',
  '分代收集',
  '内存碎片',
  '内存整理',
  '对象池',
  '资源管理',
  'RAII',
  '智能指针',
  '引用语义',
  '值语义',
  '移动语义',
  '完美转发',
  '模板元编程',
  'SFINAE',
  '概念',
  '约束',
  '协程',
  '异步编程',
  'Promise',
  'Future',
  '事件循环',
  '反应式编程',
  '函数式编程',
  'Lambda',
  '闭包',
  '高阶函数',
  '纯函数',
  '不可变性',
  '单子',
  '函子',
  '应用函子',
  '设计模式',
  '单例模式',
  '工厂模式',
  '抽象工厂',
  '建造者模式',
  '原型模式',
  '适配器模式',
  '桥接模式',
  '组合模式',
  '装饰器模式',
  '外观模式',
  '享元模式',
  '代理模式',
  '责任链模式',
  '命令模式',
  '解释器模式',
  '迭代器模式',
  '中介者模式',
  '备忘录模式',
  '观察者模式',
  '状态模式',
  '策略模式',
  '模板方法',
  '访问者模式',
  '单元测试',
  '测试框架',
  '断言',
  'Mock',
  'Stub',
  '代码覆盖率',
  'TDD',
  'BDD',
  '持续集成',
  '版本控制',
  'Git',
  'SVN',
  '代码审查',
  '文档生成',
  'Doxygen',
  '代码质量',
  '静态分析',
  '动态分析',
  '性能分析',
  '内存分析',
  '代码重构',
  '设计原则',
  'SOLID',
  'DRY',
  'KISS',
  'YAGNI',
  '开闭原则',
  '单一职责',
  '依赖倒置',
  '接口隔离',
  '里氏替换',
  '组合优于继承',
  '迪米特法则'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位C语言编程领域的专家教师。请生成一道${diffLabel}关于"C语言 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察C语言的实际知识和编程技能
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际C语言编程场景
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
        model: 'qwen-vl-plus',
        messages: [
          { role: 'system', content: '你是一位专业的C语言编程教师，擅长出高质量的选择题。' },
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
      'C语言',
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
  console.log('开始生成 200 道C语言题目...\n');
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
      const topic = cTopics[Math.floor(Math.random() * cTopics.length)];
      
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