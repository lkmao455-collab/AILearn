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

// Java知识点列表（400个知识点）
const javaTopics = [
  // Java基础语法
  'Java程序结构',
  'Java注释',
  'Java标识符与关键字',
  'Java数据类型（基本类型）',
  'Java数据类型（引用类型）',
  'Java变量声明',
  'Java常量',
  'Java类型转换',
  'Java自动类型转换',
  'Java强制类型转换',
  'Java运算符（算术）',
  'Java运算符（关系）',
  'Java运算符（逻辑）',
  'Java运算符（位运算）',
  'Java运算符（赋值）',
  'Java运算符优先级',
  'Java条件语句（if）',
  'Java条件语句（switch）',
  'Java循环语句（for）',
  'Java循环语句（while）',
  'Java循环语句（do-while）',
  'Java循环控制（break）',
  'Java循环控制（continue）',
  'Java循环控制（return）',
  'Java数组声明',
  'Java数组初始化',
  'Java多维数组',
  'Java数组遍历',
  'Java数组排序',
  'Java数组查找',
  'Java数组拷贝',
  'Java数组扩容',
  'Java数组工具类（Arrays）',
  'Java字符串（String）',
  'Java字符串（StringBuilder）',
  'Java字符串（StringBuffer）',
  'Java字符串拼接',
  'Java字符串比较',
  'Java字符串分割',
  'Java字符串替换',
  'Java字符串格式化',
  'Java正则表达式',
  'Java输入输出（Scanner）',
  'Java输入输出（BufferedReader）',
  'Java输入输出（PrintStream）',
  'Java命令行参数',
  'Java文档注释（Javadoc）',
  'Java编码规范',
  'Java命名规范',
  'Java代码风格',
  
  // 面向对象基础
  'Java类与对象',
  'Java类的定义',
  'Java对象的创建',
  'Java构造方法',
  'Java构造方法重载',
  'Java this关键字',
  'Java成员变量',
  'Java局部变量',
  'Java成员方法',
  'Java方法重载',
  'Java方法参数传递',
  'Java可变参数',
  'Java访问修饰符（public）',
  'Java访问修饰符（private）',
  'Java访问修饰符（protected）',
  'Java访问修饰符（default）',
  'Java封装',
  'Java getter/setter',
  'Java继承',
  'Java super关键字',
  'Java方法重写',
  'Java @Override注解',
  'Java多态',
  'Java向上转型',
  'Java向下转型',
  'Java instanceof',
  'Java抽象类',
  'Java抽象方法',
  'Java接口',
  'Java接口默认方法',
  'Java接口静态方法',
  'Java接口私有方法',
  'Java函数式接口',
  'Java @FunctionalInterface',
  'Java包（package）',
  'Java导入（import）',
  'Java静态导入',
  'Java final类',
  'Java final方法',
  'Java final变量',
  'Java常量类设计',
  'Java工具类设计',
  'Java单例模式',
  'Java工厂模式',
  'Java建造者模式',
  'Java原型模式',
  
  // 面向对象进阶
  'Java内部类（成员内部类）',
  'Java内部类（静态内部类）',
  'Java内部类（局部内部类）',
  'Java匿名内部类',
  'Java Lambda表达式',
  'Java方法引用',
  'Java构造器引用',
  'Java数组引用',
  'Java枚举（Enum）',
  'Java枚举构造方法',
  'Java枚举方法',
  'Java注解（Annotation）',
  'Java元注解',
  'Java自定义注解',
  'Java注解处理器',
  'Java反射（Class类）',
  'Java反射（Field）',
  'Java反射（Method）',
  'Java反射（Constructor）',
  'Java反射调用方法',
  'Java反射修改字段',
  'Java反射创建对象',
  'Java反射获取注解',
  'Java反射性能优化',
  'Java动态代理（JDK）',
  'Java动态代理（CGLIB）',
  'Java代理模式',
  'Java装饰器模式',
  'Java适配器模式',
  'Java观察者模式',
  'Java策略模式',
  'Java模板方法模式',
  'Java责任链模式',
  'Java状态模式',
  'Java命令模式',
  
  // 异常处理
  'Java异常体系',
  'Java受检异常',
  'Java非受检异常',
  'Java try-catch',
  'Java多重catch',
  'Java try-catch-finally',
  'Java try-with-resources',
  'Java throw',
  'Java throws',
  'Java自定义异常',
  'Java异常链',
  'Java异常处理最佳实践',
  'Java异常性能',
  'Java断言（assert）',
  'Java错误（Error）',
  
  // 集合框架
  'Java集合框架概述',
  'Java Collection接口',
  'Java List接口',
  'Java ArrayList',
  'Java LinkedList',
  'Java Vector',
  'Java Stack',
  'Java Set接口',
  'Java HashSet',
  'Java LinkedHashSet',
  'Java TreeSet',
  'Java Queue接口',
  'Java PriorityQueue',
  'Java Deque接口',
  'Java ArrayDeque',
  'Java Map接口',
  'Java HashMap',
  'Java LinkedHashMap',
  'Java TreeMap',
  'Java Hashtable',
  'Java Properties',
  'Java ConcurrentHashMap',
  'Java CopyOnWriteArrayList',
  'Java CopyOnWriteArraySet',
  'Java BlockingQueue',
  'Java ArrayBlockingQueue',
  'Java LinkedBlockingQueue',
  'Java PriorityBlockingQueue',
  'Java SynchronousQueue',
  'Java DelayQueue',
  'Java集合遍历（for-each）',
  'Java集合遍历（Iterator）',
  'Java集合遍历（ListIterator）',
  'Java集合遍历（Stream）',
  'Java集合排序（Comparable）',
  'Java集合排序（Comparator）',
  'Java Collections工具类',
  'Java集合转换',
  'Java集合过滤',
  'Java集合去重',
  'Java集合分组',
  'Java集合分区',
  'Java集合归约',
  'Java集合性能比较',
  'Java集合线程安全',
  
  // 泛型
  'Java泛型概述',
  'Java泛型类',
  'Java泛型接口',
  'Java泛型方法',
  'Java泛型边界（extends）',
  'Java泛型边界（super）',
  'Java通配符（?）',
  'Java泛型擦除',
  'Java泛型数组',
  'Java泛型与反射',
  'Java泛型最佳实践',
  
  // IO与NIO
  'Java IO流概述',
  'Java字节流（InputStream）',
  'Java字节流（OutputStream）',
  'Java字符流（Reader）',
  'Java字符流（Writer）',
  'Java文件流（FileInputStream）',
  'Java文件流（FileOutputStream）',
  'Java缓冲流（BufferedInputStream）',
  'Java缓冲流（BufferedOutputStream）',
  'Java缓冲流（BufferedReader）',
  'Java缓冲流（BufferedWriter）',
  'Java转换流（InputStreamReader）',
  'Java转换流（OutputStreamWriter）',
  'Java数据流（DataInputStream）',
  'Java数据流（DataOutputStream）',
  'Java对象流（ObjectInputStream）',
  'Java对象流（ObjectOutputStream）',
  'Java序列化',
  'Java反序列化',
  'Java transient',
  'Java serialVersionUID',
  'Java Externalizable',
  'Java打印流（PrintStream）',
  'Java打印流（PrintWriter）',
  'Java随机访问文件（RandomAccessFile）',
  'Java内存流（ByteArrayInputStream）',
  'Java内存流（ByteArrayOutputStream）',
  'Java文件类（File）',
  'Java文件路径（Path）',
  'Java文件操作（Files）',
  'Java目录遍历',
  'Java文件过滤',
  'Java文件监听（WatchService）',
  'Java NIO概述',
  'Java NIO Buffer',
  'Java NIO Channel',
  'Java NIO Selector',
  'Java NIO非阻塞IO',
  'Java NIO2（Path）',
  'Java NIO2（Files）',
  'Java NIO2（WatchService）',
  'Java内存映射文件',
  'Java文件锁',
  'Java零拷贝',
  
  // 多线程与并发
  'Java线程基础',
  'Java创建线程（Thread）',
  'Java创建线程（Runnable）',
  'Java创建线程（Callable）',
  'Java线程状态',
  'Java线程启动（start）',
  'Java线程休眠（sleep）',
  'Java线程让步（yield）',
  'Java线程加入（join）',
  'Java线程中断（interrupt）',
  'Java线程优先级',
  'Java守护线程',
  'Java线程组',
  'Java线程本地变量（ThreadLocal）',
  'Java线程同步（synchronized）',
  'Java同步代码块',
  'Java同步方法',
  'Java对象锁',
  'Java类锁',
  'Java可重入锁（ReentrantLock）',
  'Java读写锁（ReadWriteLock）',
  'Java stampedLock',
  'Java条件变量（Condition）',
  'Java锁优化（偏向锁）',
  'Java锁优化（轻量级锁）',
  'Java锁优化（重量级锁）',
  'Java volatile',
  'Java原子类（AtomicInteger）',
  'Java原子类（AtomicLong）',
  'Java原子类（AtomicReference）',
  'Java原子类（AtomicStampedReference）',
  'Java CAS操作',
  'Java ABA问题',
  'Java线程池（Executor）',
  'Java线程池（ThreadPoolExecutor）',
  'Java线程池参数',
  'Java线程池拒绝策略',
  'Java线程池关闭',
  'Java固定线程池',
  'Java缓存线程池',
  'Java单线程池',
  'Java定时线程池',
  'Java Fork/Join框架',
  'Java CompletableFuture',
  'Java并发工具（CountDownLatch）',
  'Java并发工具（CyclicBarrier）',
  'Java并发工具（Semaphore）',
  'Java并发工具（Exchanger）',
  'Java并发工具（Phaser）',
  'Java并发集合',
  'Java阻塞队列',
  'Java并发Map',
  'Java死锁',
  'Java死锁检测',
  'Java死锁预防',
  'Java活锁',
  'Java饥饿',
  'Java线程安全',
  'Java不可变对象',
  'Java并发最佳实践',
  'Java内存模型（JMM）',
  'Java happens-before',
  'Java指令重排序',
  'Java可见性',
  'Java有序性',
  'Java原子性',
  
  // JVM
  'JVM概述',
  'JVM内存结构',
  'JVM程序计数器',
  'JVM虚拟机栈',
  'JVM本地方法栈',
  'JVM堆内存',
  'JVM方法区',
  'JVM运行时常量池',
  'JVM直接内存',
  'JVM对象创建',
  'JVM对象内存布局',
  'JVM对象访问定位',
  'JVM垃圾回收',
  'JVM垃圾回收算法（标记-清除）',
  'JVM垃圾回收算法（复制）',
  'JVM垃圾回收算法（标记-整理）',
  'JVM垃圾回收算法（分代收集）',
  'JVM垃圾收集器（Serial）',
  'JVM垃圾收集器（ParNew）',
  'JVM垃圾收集器（Parallel Scavenge）',
  'JVM垃圾收集器（Serial Old）',
  'JVM垃圾收集器（Parallel Old）',
  'JVM垃圾收集器（CMS）',
  'JVM垃圾收集器（G1）',
  'JVM垃圾收集器（ZGC）',
  'JVM垃圾收集器（Shenandoah）',
  'JVM垃圾回收调优',
  'JVM内存分配策略',
  'JVM对象晋升',
  'JVM大对象分配',
  'JVM TLAB',
  'JVM类加载机制',
  'JVM类加载器（Bootstrap）',
  'JVM类加载器（Extension）',
  'JVM类加载器（Application）',
  'JVM类加载器（Custom）',
  'JVM双亲委派模型',
  'JVM打破双亲委派',
  'JVM类加载过程',
  'JVM字节码',
  'JVM字节码指令',
  'JVM JIT编译器',
  'JVM解释器',
  'JVM性能监控',
  'JVM参数配置',
  'JVM调优工具（jps）',
  'JVM调优工具（jstat）',
  'JVM调优工具（jmap）',
  'JVM调优工具（jhat）',
  'JVM调优工具（jstack）',
  'JVM调优工具（jconsole）',
  'JVM调优工具（jvisualvm）',
  'JVM调优工具（arthas）',
  'JVM OOM分析',
  'JVM内存泄漏',
  'JVM性能优化',
  
  // Java 8+新特性
  'Java 8新特性概述',
  'Java 8 Lambda表达式',
  'Java 8 函数式接口',
  'Java 8 方法引用',
  'Java 8 Stream API',
  'Java 8 Stream创建',
  'Java 8 Stream中间操作',
  'Java 8 Stream终止操作',
  'Java 8 Stream并行流',
  'Java 8 Optional',
  'Java 8 接口默认方法',
  'Java 8 接口静态方法',
  'Java 8 新日期时间API',
  'Java 8 LocalDate',
  'Java 8 LocalTime',
  'Java 8 LocalDateTime',
  'Java 8 Instant',
  'Java 8 Duration',
  'Java 8 Period',
  'Java 8 DateTimeFormatter',
  'Java 8 时间戳转换',
  'Java 8 时区处理',
  'Java 8 Base64',
  'Java 8 重复注解',
  'Java 8 类型注解',
  'Java 8 Nashorn JavaScript',
  'Java 9新特性',
  'Java 9 模块系统（Jigsaw）',
  'Java 9 JShell',
  'Java 9 改进的Stream',
  'Java 9 改进的Optional',
  'Java 9 私有接口方法',
  'Java 9 改进的Process API',
  'Java 9 改进的HTTP Client',
  'Java 9 多版本JAR',
  'Java 10新特性',
  'Java 10 局部变量类型推断（var）',
  'Java 11新特性',
  'Java 11 新HTTP Client',
  'Java 11 字符串新方法',
  'Java 11 ZGC',
  'Java 12新特性',
  'Java 12 Switch表达式',
  'Java 13新特性',
  'Java 13 文本块',
  'Java 14新特性',
  'Java 14 instanceof模式匹配',
  'Java 14 Record',
  'Java 15新特性',
  'Java 15 密封类',
  'Java 16新特性',
  'Java 17新特性',
  'Java 17 密封类正式版',
  'Java 17 强封装JDK内部',
  
  // 数据库编程
  'Java JDBC概述',
  'Java JDBC驱动加载',
  'Java JDBC连接数据库',
  'Java JDBC执行SQL',
  'Java JDBC查询结果集',
  'Java JDBC预处理语句',
  'Java JDBC事务管理',
  'Java JDBC批处理',
  'Java JDBC连接池',
  'Java JDBC连接池（HikariCP）',
  'Java JDBC连接池（Druid）',
  'Java JDBC连接池（C3P0）',
  'Java JDBC连接池（DBCP）',
  'Java ORM框架（MyBatis）',
  'Java ORM框架（Hibernate）',
  'Java ORM框架（JPA）',
  'Java ORM框架（Spring Data JPA）',
  'Java数据库连接优化',
  'Java SQL注入防护',
  
  // 网络编程
  'Java网络编程概述',
  'Java InetAddress',
  'Java URL',
  'Java URLConnection',
  'Java Socket编程',
  'Java ServerSocket',
  'Java TCP编程',
  'Java UDP编程',
  'Java DatagramSocket',
  'Java NIO网络编程',
  'Java NIO Selector',
  'Java NIO Channel',
  'Java NIO Buffer',
  'Java AIO网络编程',
  'Java HTTP编程',
  'Java HTTP Client',
  'Java WebSocket',
  'Java网络编程优化',
  
  // Web开发
  'Java Servlet',
  'Java Servlet生命周期',
  'Java Servlet配置',
  'Java Servlet请求处理',
  'Java Servlet响应处理',
  'Java Servlet过滤器',
  'Java Servlet监听器',
  'Java JSP',
  'Java JSP生命周期',
  'Java JSP指令',
  'Java JSP脚本元素',
  'Java JSP内置对象',
  'Java JSP EL表达式',
  'Java JSP JSTL',
  'Java MVC模式',
  'Java Spring框架',
  'Java Spring IOC',
  'Java Spring DI',
  'Java Spring Bean',
  'Java Spring Bean作用域',
  'Java Spring Bean生命周期',
  'Java Spring AOP',
  'Java Spring事务管理',
  'Java Spring MVC',
  'Java Spring Boot',
  'Java Spring Boot自动配置',
  'Java Spring Boot Starter',
  'Java Spring Boot Actuator',
  'Java Spring Security',
  'Java Spring Cloud',
  'Java Spring Cloud Eureka',
  'Java Spring Cloud Ribbon',
  'Java Spring Cloud Feign',
  'Java Spring Cloud Hystrix',
  'Java Spring Cloud Gateway',
  'Java Spring Cloud Config',
  'Java Spring Cloud Bus',
  'Java Spring Cloud Sleuth',
  'Java Spring Cloud Zipkin',
  'Java Spring Cloud Alibaba',
  'Java Spring Cloud Nacos',
  'Java Spring Cloud Sentinel',
  'Java Spring Cloud Seata',
  'Java Spring Cloud RocketMQ',
  'Java Spring Cloud Dubbo',
  
  // 设计模式
  'Java单例模式（饿汉式）',
  'Java单例模式（懒汉式）',
  'Java单例模式（双重检查）',
  'Java单例模式（静态内部类）',
  'Java单例模式（枚举）',
  'Java工厂方法模式',
  'Java抽象工厂模式',
  'Java建造者模式',
  'Java原型模式',
  'Java适配器模式',
  'Java桥接模式',
  'Java组合模式',
  'Java装饰器模式',
  'Java外观模式',
  'Java享元模式',
  'Java代理模式（静态）',
  'Java代理模式（动态JDK）',
  'Java代理模式（CGLIB）',
  'Java责任链模式',
  'Java命令模式',
  'Java解释器模式',
  'Java迭代器模式',
  'Java中介者模式',
  'Java备忘录模式',
  'Java观察者模式',
  'Java状态模式',
  'Java策略模式',
  'Java模板方法模式',
  'Java访问者模式',
  
  // 测试
  'Java单元测试（JUnit4）',
  'Java单元测试（JUnit5）',
  'Java单元测试（TestNG）',
  'Java测试断言',
  'Java测试异常',
  'Java测试超时',
  'Java测试参数化',
  'Java测试套件',
  'Java测试生命周期',
  'Java Mock测试（Mockito）',
  'Java Mock测试（PowerMock）',
  'Java Mock测试（EasyMock）',
  'Java集成测试',
  'Java性能测试（JMH）',
  'Java代码覆盖率（JaCoCo）',
  'Java测试驱动开发（TDD）',
  'Java行为驱动开发（BDD）',
  
  // 构建工具
  'Java构建工具（Maven）',
  'Java Maven生命周期',
  'Java Maven坐标',
  'Java Maven依赖管理',
  'Java Maven依赖传递',
  'Java Maven依赖冲突',
  'Java Maven依赖排除',
  'Java Maven依赖范围',
  'Java Maven仓库',
  'Java Maven插件',
  'Java Maven多模块',
  'Java Maven Profile',
  'Java构建工具（Gradle）',
  'Java Gradle构建脚本',
  'Java Gradle任务',
  'Java Gradle依赖管理',
  'Java Gradle插件',
  'Java Gradle多项目',
  'Java构建工具（Ant）',
  'Java构建工具对比',
  
  // 日志
  'Java日志框架（JUL）',
  'Java日志框架（Log4j）',
  'Java日志框架（Log4j2）',
  'Java日志框架（Logback）',
  'Java日志框架（SLF4J）',
  'Java日志级别',
  'Java日志配置',
  'Java日志格式化',
  'Java日志异步',
  'Java日志性能',
  'Java日志最佳实践',
  
  // 安全
  'Java安全概述',
  'Java加密（对称加密）',
  'Java加密（非对称加密）',
  'Java加密（哈希）',
  'Java加密（数字签名）',
  'Java加密（数字证书）',
  'Java密钥管理',
  'Java SSL/TLS',
  'Java HTTPS',
  'Java安全编码',
  'Java防止SQL注入',
  'Java防止XSS攻击',
  'Java防止CSRF攻击',
  'Java安全框架（Spring Security）',
  'Java安全框架（Shiro）',
  'Java安全框架（JAAS）',
  
  // 性能优化
  'Java性能优化概述',
  'Java代码优化',
  'Java算法优化',
  'Java数据结构优化',
  'Java集合优化',
  'Java字符串优化',
  'Java IO优化',
  'Java并发优化',
  'Java内存优化',
  'Java GC优化',
  'Java JVM参数优化',
  'Java数据库优化',
  'Java缓存优化',
  'Java网络优化',
  'Java性能分析工具',
  'Java性能监控',
  'Java性能测试',
  'Java性能调优案例',
  
  // 分布式系统
  'Java分布式系统概述',
  'Java分布式事务',
  'Java分布式锁',
  'Java分布式缓存（Redis）',
  'Java分布式缓存（Memcached）',
  'Java分布式消息（Kafka）',
  'Java分布式消息（RabbitMQ）',
  'Java分布式消息（RocketMQ）',
  'Java分布式消息（ActiveMQ）',
  'Java分布式搜索（Elasticsearch）',
  'Java分布式协调（ZooKeeper）',
  'Java分布式配置（Apollo）',
  'Java分布式配置（Nacos）',
  'Java分布式任务调度（Quartz）',
  'Java分布式任务调度（XXL-JOB）',
  'Java分布式任务调度（Elastic-Job）',
  'Java分布式ID生成',
  'Java分布式限流',
  'Java分布式降级',
  'Java分布式熔断',
  'Java分布式链路追踪',
  'Java分布式会话',
  'Java分布式文件存储',
  'Java微服务架构',
  'Java服务注册发现',
  'Java服务配置中心',
  'Java服务网关',
  'Java服务熔断降级',
  'Java服务限流',
  'Java服务监控',
  
  // 其他
  'Java国际化（i18n）',
  'Java本地化（l10n）',
  'Java资源文件',
  'Java消息格式化',
  'Java日期格式化',
  'Java数字格式化',
  'Java货币格式化',
  'Java XML处理（DOM）',
  'Java XML处理（SAX）',
  'Java XML处理（JAXB）',
  'Java JSON处理（Jackson）',
  'Java JSON处理（Gson）',
  'Java JSON处理（Fastjson）',
  'Java Properties文件',
  'Java YAML文件',
  'Java INI文件',
  'Java CSV文件',
  'Java Excel处理（POI）',
  'Java Excel处理（EasyExcel）',
  'Java PDF处理（iText）',
  'Java PDF处理（Apache PDFBox）',
  'Java Word处理（POI）',
  'Java邮件发送（JavaMail）',
  'Java模板引擎（Thymeleaf）',
  'Java模板引擎（FreeMarker）',
  'Java模板引擎（Velocity）',
  'Java二维码生成',
  'Java条形码生成',
  'Java图片处理',
  'Java文件上传下载',
  'Java大文件处理',
  'Java压缩文件处理',
  'Java定时任务（Timer）',
  'Java定时任务（ScheduledExecutor）',
  'Java定时任务（Spring Scheduler）',
  'Java定时任务（Quartz）',
  'Java异步编程（Future）',
  'Java异步编程（CompletableFuture）',
  'Java响应式编程（RxJava）',
  'Java响应式编程（Project Reactor）',
  'Java响应式编程（Spring WebFlux）',
  'Java函数式编程',
  'Java流式编程',
  'Java链式编程',
  'Java Builder模式',
  'Java链式调用',
  'Java方法链',
  'Java流式API设计',
  'Java DSL设计',
  'Java API设计最佳实践',
  'Java代码重构',
  'Java代码审查',
  'Java代码质量',
  'Java代码规范（阿里巴巴）',
  'Java代码规范（Google）',
  'Java代码规范（Oracle）',
  'Java代码静态分析',
  'Java代码复杂度',
  'Java代码覆盖率',
  'Java持续集成（Jenkins）',
  'Java持续集成（GitLab CI）',
  'Java持续集成（GitHub Actions）',
  'Java容器化（Docker）',
  'Java容器化（Kubernetes）',
  'Java云原生',
  'Java Serverless',
  'Java GraalVM',
  'Java Native Image',
  'Java Quarkus',
  'Java Micronaut',
  'Java Helidon',
  'Java Vert.x',
  'Java Akka',
  'Java Disruptor',
  'Java Netty',
  'Java Mina',
  'Java Grizzly',
  'Java Jetty',
  'Java Undertow',
  'Java Tomcat',
  'Java Tomcat配置',
  'Java Tomcat优化',
  'Java Tomcat集群',
  'Java Tomcat安全',
  'Java Nginx',
  'Java Nginx负载均衡',
  'Java Nginx反向代理',
  'Java Nginx缓存',
  'Java Nginx SSL',
  'Java Apache',
  'Java Apache配置',
  'Java Apache优化',
  'Java Apache安全'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位Java开发领域的专家教师。请生成一道${diffLabel}关于"Java - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察Java的实际应用
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际开发场景
5. 代码示例使用Java语言风格

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
          { role: 'system', content: '你是一位专业的Java开发教师，擅长出高质量的选择题。' },
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
      'Java',
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
  console.log('开始生成 400 道 Java 题目...\n');
  
  const totalQuestions = 400;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = javaTopics[Math.floor(Math.random() * javaTopics.length)];
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
