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

// 前端开发知识点列表（200个知识点）
const frontendTopics = [
  // HTML基础
  'HTML5语义化标签',
  'HTML5表单元素',
  'HTML5音频视频',
  'HTML5 Canvas基础',
  'HTML5 SVG基础',
  'HTML5本地存储',
  'HTML5 Web Storage',
  'HTML5 IndexedDB',
  'HTML5 Web Workers',
  'HTML5 WebSocket',
  'HTML5 Geolocation',
  'HTML5 Drag and Drop',
  'HTML5 File API',
  'HTML5 History API',
  'HTML5 Custom Elements',
  'HTML5 Shadow DOM',
  'HTML5 Template标签',
  'HTML5 Slot插槽',
  'HTML5 响应式图片',
  'HTML5 懒加载',
  
  // CSS基础
  'CSS选择器',
  'CSS盒模型',
  'CSS Flexbox布局',
  'CSS Grid布局',
  'CSS定位（position）',
  'CSS浮动（float）',
  'CSS层叠与继承',
  'CSS优先级',
  'CSS伪类与伪元素',
  'CSS动画（animation）',
  'CSS过渡（transition）',
  'CSS变换（transform）',
  'CSS变量（CSS Variables）',
  'CSS媒体查询',
  'CSS响应式设计',
  'CSS预处理器（Sass/SCSS）',
  'CSS预处理器（Less）',
  'CSS预处理器（Stylus）',
  'CSS后处理器（PostCSS）',
  'CSS模块化（CSS Modules）',
  
  // CSS进阶
  'CSS BEM命名规范',
  'CSS-in-JS',
  'Styled Components',
  'Emotion CSS',
  'Tailwind CSS',
  'Bootstrap框架',
  'Bulma框架',
  'Foundation框架',
  'CSS架构（OOCSS）',
  'CSS架构（SMACSS）',
  'CSS架构（ITCSS）',
  'CSS性能优化',
  'CSS渲染性能',
  'CSS硬件加速',
  'CSS will-change',
  'CSS contain',
  'CSS Houdini',
  'CSS Paint API',
  'CSS Layout API',
  'CSS Typed OM',
  
  // JavaScript基础
  'JavaScript数据类型',
  'JavaScript变量声明',
  'JavaScript作用域',
  'JavaScript闭包',
  'JavaScript原型链',
  'JavaScript继承',
  'JavaScript this指向',
  'JavaScript事件循环',
  'JavaScript异步编程',
  'JavaScript Promise',
  'JavaScript async/await',
  'JavaScript Generator',
  'JavaScript Iterator',
  'JavaScript 解构赋值',
  'JavaScript 展开运算符',
  'JavaScript 模板字符串',
  'JavaScript 箭头函数',
  'JavaScript 类（Class）',
  'JavaScript 模块（Module）',
  'JavaScript 严格模式',
  
  // JavaScript进阶
  'JavaScript 深拷贝与浅拷贝',
  'JavaScript 防抖与节流',
  'JavaScript 函数柯里化',
  'JavaScript 函数组合',
  'JavaScript 高阶函数',
  'JavaScript 函数式编程',
  'JavaScript 面向对象编程',
  'JavaScript 设计模式',
  'JavaScript 单例模式',
  'JavaScript 工厂模式',
  'JavaScript 观察者模式',
  'JavaScript 发布订阅模式',
  'JavaScript 代理模式',
  'JavaScript 策略模式',
  'JavaScript 装饰器模式',
  'JavaScript 模块化规范（CommonJS）',
  'JavaScript 模块化规范（ES Module）',
  'JavaScript 模块化规范（AMD）',
  'JavaScript 模块化规范（UMD）',
  'JavaScript 内存管理',
  
  // DOM操作
  'DOM选择器',
  'DOM操作与修改',
  'DOM事件处理',
  'DOM事件委托',
  'DOM事件冒泡与捕获',
  'DOM自定义事件',
  'DOM属性操作',
  'DOM样式操作',
  'DOM节点遍历',
  'DOM节点创建与删除',
  'DOM文档片段（DocumentFragment）',
  'DOM Shadow DOM',
  'DOM MutationObserver',
  'DOM ResizeObserver',
  'DOM IntersectionObserver',
  'DOM 虚拟DOM原理',
  'DOM Diff算法',
  'DOM 重绘与回流',
  'DOM 性能优化',
  'DOM 事件性能优化',
  
  // BOM操作
  'Window对象',
  'Location对象',
  'History对象',
  'Navigator对象',
  'Screen对象',
  'Document对象',
  'Cookie操作',
  'LocalStorage',
  'SessionStorage',
  '浏览器缓存机制',
  '浏览器渲染原理',
  '浏览器事件机制',
  '浏览器跨域问题',
  'CORS跨域',
  'JSONP跨域',
  'PostMessage跨域',
  '浏览器安全（XSS）',
  '浏览器安全（CSRF）',
  '浏览器安全（CSP）',
  '浏览器性能监控',
  
  // React基础
  'React组件',
  'React JSX',
  'React Props',
  'React State',
  'React 生命周期',
  'React Hooks（useState）',
  'React Hooks（useEffect）',
  'React Hooks（useContext）',
  'React Hooks（useRef）',
  'React Hooks（useMemo）',
  'React Hooks（useCallback）',
  'React Hooks（useReducer）',
  'React Hooks（useLayoutEffect）',
  'React Hooks（自定义Hooks）',
  'React 条件渲染',
  'React 列表渲染',
  'React 事件处理',
  'React 表单处理',
  'React 受控组件',
  'React 非受控组件',
  
  // React进阶
  'React Context',
  'React Refs',
  'React Forwarding Refs',
  'React Portals',
  'React Error Boundaries',
  'React 高阶组件（HOC）',
  'React Render Props',
  'React 代码分割',
  'React Lazy Loading',
  'React Suspense',
  'React 并发模式',
  'React Fiber架构',
  'React 虚拟DOM',
  'React Diff算法',
  'React 协调（Reconciliation）',
  'React 性能优化',
  'React.memo',
  'React.PureComponent',
  'React 不可变数据',
  'React 状态管理',
  
  // Vue基础
  'Vue实例',
  'Vue模板语法',
  'Vue计算属性',
  'Vue侦听器',
  'Vue Class与Style绑定',
  'Vue条件渲染',
  'Vue列表渲染',
  'Vue事件处理',
  'Vue表单输入绑定',
  'Vue组件基础',
  'Vue Props',
  'Vue 自定义事件',
  'Vue 插槽（Slot）',
  'Vue 动态组件',
  'Vue 异步组件',
  'Vue 生命周期钩子',
  'Vue 过渡动画',
  'Vue 列表过渡',
  'Vue 状态过渡',
  'Vue 混入（Mixin）',
  
  // Vue进阶
  'Vue 自定义指令',
  'Vue 渲染函数',
  'Vue JSX',
  'Vue 函数式组件',
  'Vue 插件开发',
  'Vue 过滤器',
  'Vue 响应式原理',
  'Vue 依赖收集',
  'Vue 虚拟DOM',
  'Vue Diff算法',
  'Vue 性能优化',
  'Vue 服务端渲染（SSR）',
  'Vue 静态站点生成（SSG）',
  'Vue 组合式API（Composition API）',
  'Vue setup函数',
  'Vue 响应式引用（ref）',
  'Vue 响应式对象（reactive）',
  'Vue 计算属性（computed）',
  'Vue 侦听器（watch/watchEffect）',
  'Vue 生命周期钩子（Composition API）',
  
  // 状态管理
  'Redux基础',
  'Redux中间件',
  'Redux Thunk',
  'Redux Saga',
  'Redux Toolkit',
  'React-Redux',
  'Vuex基础',
  'Vuex模块',
  'Pinia状态管理',
  'MobX状态管理',
  'Zustand状态管理',
  'Recoil状态管理',
  'Jotai状态管理',
  'Context API状态管理',
  '状态管理最佳实践',
  '状态管理性能优化',
  '状态管理持久化',
  '状态管理规范化',
  '状态管理选择指南',
  '状态管理架构设计',
  
  // 路由
  'React Router基础',
  'React Router动态路由',
  'React Router嵌套路由',
  'React Router路由守卫',
  'React Router懒加载',
  'Vue Router基础',
  'Vue Router动态路由',
  'Vue Router嵌套路由',
  'Vue Router导航守卫',
  'Vue Router懒加载',
  '前端路由原理',
  'Hash路由',
  'History路由',
  '路由参数传递',
  '路由状态管理',
  '路由动画过渡',
  '路由权限控制',
  '路由懒加载实现',
  '路由预加载',
  '路由缓存策略',
  
  // 构建工具
  'Webpack基础配置',
  'Webpack Loader',
  'Webpack Plugin',
  'Webpack 代码分割',
  'Webpack 懒加载',
  'Webpack 缓存',
  'Webpack 性能优化',
  'Vite基础',
  'Vite配置',
  'Vite插件',
  'Vite与Webpack对比',
  'Rollup打包工具',
  'Parcel打包工具',
  'esbuild打包工具',
  'SWC编译器',
  'Babel转译器',
  'Babel配置',
  'Babel插件开发',
  '前端工程化',
  'Monorepo架构',
  
  // 包管理
  'npm基础',
  'npm脚本',
  'npm包发布',
  'npm版本管理',
  'npm依赖管理',
  'yarn包管理器',
  'pnpm包管理器',
  'package.json配置',
  'package-lock.json',
  '语义化版本控制',
  '依赖冲突解决',
  '依赖安全审计',
  '私有npm仓库',
  'npx工具',
  'nvm版本管理',
  'fnm版本管理',
  'Volta版本管理',
  'Corepack',
  'Workspace工作区',
  '包管理最佳实践',
  
  // 测试
  'Jest测试框架',
  'Vitest测试框架',
  'Mocha测试框架',
  'Chai断言库',
  'Testing Library',
  'React Testing Library',
  'Vue Testing Library',
  'Cypress E2E测试',
  'Playwright E2E测试',
  'Puppeteer自动化测试',
  '单元测试',
  '集成测试',
  'E2E测试',
  '快照测试',
  'Mock与Stub',
  '测试覆盖率',
  'TDD测试驱动开发',
  'BDD行为驱动开发',
  '测试最佳实践',
  '测试性能优化',
  
  // TypeScript
  'TypeScript基础类型',
  'TypeScript接口',
  'TypeScript类型别名',
  'TypeScript联合类型',
  'TypeScript交叉类型',
  'TypeScript泛型',
  'TypeScript枚举',
  'TypeScript元组',
  'TypeScript类型推断',
  'TypeScript类型断言',
  'TypeScript类型守卫',
  'TypeScript映射类型',
  'TypeScript条件类型',
  'TypeScript工具类型',
  'TypeScript装饰器',
  'TypeScript命名空间',
  'TypeScript模块',
  'TypeScript配置（tsconfig）',
  'TypeScript与React',
  'TypeScript与Vue',
  
  // 网络请求
  'Fetch API',
  'XMLHttpRequest',
  'Axios库',
  'Axios拦截器',
  'Axios取消请求',
  'Axios配置',
  'Axios封装',
  'RESTful API',
  'GraphQL基础',
  'GraphQL查询',
  'GraphQL变更',
  'GraphQL订阅',
  'Apollo Client',
  'URQL',
  'React Query',
  'SWR数据获取',
  'RPC调用',
  'WebSocket通信',
  'SSE服务器推送',
  'HTTP缓存策略',
  
  // 性能优化
  '前端性能指标',
  'Lighthouse性能分析',
  'Chrome DevTools性能分析',
  'Web Vitals',
  'CLS累积布局偏移',
  'LCP最大内容绘制',
  'FID首次输入延迟',
  'FCP首次内容绘制',
  'TTFB首字节时间',
  '资源加载优化',
  '图片优化',
  '懒加载实现',
  '预加载策略',
  '代码分割',
  'Tree Shaking',
  'Scope Hoisting',
  'Gzip/Brotli压缩',
  'CDN加速',
  'Service Worker缓存',
  'PWA离线应用',
  
  // 安全
  'XSS攻击防护',
  'CSRF攻击防护',
  'Clickjacking防护',
  'Content Security Policy',
  'HTTPS安全传输',
  'JWT认证',
  'OAuth认证',
  'SSO单点登录',
  '密码安全存储',
  '前端加密',
  '安全头部配置',
  '依赖安全检查',
  'npm audit',
  'Snyk安全扫描',
  '代码安全审计',
  '安全最佳实践',
  'Web安全标准',
  'CORS安全配置',
  'Cookie安全属性',
  'Session安全',
  
  // 工程化
  'Git版本控制',
  'Git工作流',
  'Git分支策略',
  'Git提交规范',
  'Git Hooks',
  'ESLint代码检查',
  'Prettier代码格式化',
  'Husky Git钩子',
  'lint-staged',
  'Commitizen提交规范',
  'Conventional Commits',
  'Semantic Release',
  'CI/CD持续集成',
  'GitHub Actions',
  'GitLab CI',
  'Jenkins',
  'Docker容器化',
  'Nginx配置',
  '前端监控',
  '错误追踪',
  
  // 移动端
  '移动端适配',
  'Viewport设置',
  'Rem适配方案',
  'Vw/Vh适配方案',
  'Flexible适配方案',
  '移动端触摸事件',
  '移动端手势',
  'FastClick',
  'iOS兼容性',
  'Android兼容性',
  'Hybrid App开发',
  'Cordova/PhoneGap',
  'Ionic框架',
  'React Native',
  'Flutter跨平台',
  'Uni-app',
  'Taro跨端框架',
  '小程序开发',
  '微信小程序',
  'PWA渐进式应用',
  
  // 微前端
  '微前端架构',
  'Module Federation',
  'Single-SPA',
  'Qiankun微前端',
  'Micro-app',
  'Garfish微前端',
  '微前端通信',
  '微前端路由',
  '微前端样式隔离',
  '微前端沙箱',
  '微前端加载策略',
  '微前端性能优化',
  '微前端最佳实践',
  '微前端与Monorepo',
  '微前端部署策略',
  '微前端版本管理',
  '微前端错误处理',
  '微前端状态共享',
  '微前端组件共享',
  '微前端架构选型',
  
  // 新兴技术
  'WebAssembly',
  'WebGL图形编程',
  'Three.js 3D开发',
  'D3.js数据可视化',
  'ECharts图表库',
  'Canvas高级应用',
  'WebRTC实时通信',
  'WebSocket实时推送',
  'Server-Sent Events',
  'Web Workers多线程',
  'Service Worker',
  'Push Notification',
  'Web Share API',
  'Web Payment API',
  'Web Authentication API',
  'Credential Management',
  'Payment Request API',
  'Web Bluetooth',
  'Web USB',
  'Web Serial'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位前端开发领域的专家教师。请生成一道${diffLabel}关于"前端开发 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察前端开发的实际应用
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际开发场景
5. 代码示例使用现代前端技术（ES6+、React/Vue等）

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
          { role: 'system', content: '你是一位专业的前端开发教师，擅长出高质量的选择题。' },
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
      '前端开发',
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
  console.log('开始生成 200 道前端开发题目...\n');
  
  const totalQuestions = 200;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = frontendTopics[Math.floor(Math.random() * frontendTopics.length)];
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
