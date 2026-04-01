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

// Linux系统知识点列表（200个知识点）
const linuxTopics = [
  // Linux基础
  'Linux操作系统概述',
  'Linux发行版介绍',
  'Linux内核架构',
  'Linux系统启动流程',
  'Linux运行级别',
  'Linux系统目录结构',
  'Linux文件系统层次标准（FHS）',
  'Linux文件类型',
  'Linux文件权限基础',
  'Linux文件权限高级',
  'Linux特殊权限（SUID/SGID/Sticky）',
  'Linux ACL访问控制列表',
  'Linux文件属性（chattr/lsattr）',
  'Linux硬链接与软链接',
  'Linux文件查找（find）',
  'Linux文件查找（locate）',
  'Linux文件压缩与解压',
  'Linux文件归档（tar）',
  'Linux文件系统类型',
  'Linux文件系统挂载',
  
  // 用户与权限管理
  'Linux用户管理',
  'Linux用户组管理',
  'Linux用户配置文件',
  'Linux密码管理',
  'Linux用户切换（su/sudo）',
  'Linux sudoers配置',
  'Linux PAM认证机制',
  'Linux用户环境变量',
  'Linux用户资源限制',
  'Linux用户审计',
  'Linux用户登录管理',
  'Linux用户注销管理',
  'Linux用户会话管理',
  'Linux用户权限委派',
  'Linux用户组策略',
  'Linux用户配额管理',
  'Linux用户家目录管理',
  'Linux用户Shell管理',
  'Linux用户密码策略',
  'Linux用户安全策略',
  
  // 文件系统管理
  'Linux ext4文件系统',
  'Linux XFS文件系统',
  'Linux Btrfs文件系统',
  'Linux文件系统创建',
  'Linux文件系统检查',
  'Linux文件系统修复',
  'Linux文件系统扩容',
  'Linux文件系统缩容',
  'Linux LVM逻辑卷管理',
  'Linux LVM物理卷',
  'Linux LVM卷组',
  'Linux LVM逻辑卷',
  'Linux LVM快照',
  'Linux RAID技术',
  'Linux RAID 0',
  'Linux RAID 1',
  'Linux RAID 5',
  'Linux RAID 6',
  'Linux RAID 10',
  'Linux磁盘分区（fdisk）',
  'Linux磁盘分区（parted）',
  'Linux磁盘分区（gdisk）',
  'Linux磁盘格式化',
  'Linux磁盘配额',
  'Linux磁盘I/O调度',
  'Linux磁盘性能监控',
  'Linux磁盘坏块检测',
  'Linux磁盘加密（LUKS）',
  'Linux交换分区管理',
  'Linux交换文件管理',
  'Linux内存文件系统（tmpfs）',
  
  // 进程管理
  'Linux进程基础',
  'Linux进程状态',
  'Linux进程查看（ps）',
  'Linux进程查看（top）',
  'Linux进程查看（htop）',
  'Linux进程查看（pgrep）',
  'Linux进程终止（kill）',
  'Linux进程终止（killall）',
  'Linux进程终止（pkill）',
  'Linux进程优先级（nice/renice）',
  'Linux后台进程管理',
  'Linux前台进程管理',
  'Linux守护进程',
  'Linux服务管理（systemd）',
  'Linux服务管理（SysVinit）',
  'Linux定时任务（cron）',
  'Linux定时任务（at）',
  'Linux定时任务（anacron）',
  'Linux进程间通信（IPC）',
  'Linux信号机制',
  'Linux进程监控',
  'Linux进程资源限制',
  'Linux进程审计',
  'Linux进程调试',
  'Linux进程性能分析',
  'Linux僵尸进程处理',
  'Linux孤儿进程处理',
  'Linux进程树查看',
  'Linux进程线程关系',
  'Linux进程命名空间',
  
  // 内存管理
  'Linux内存管理基础',
  'Linux物理内存查看',
  'Linux虚拟内存',
  'Linux内存分配机制',
  'Linux内存回收机制',
  'Linux内存碎片整理',
  'Linux内存映射（mmap）',
  'Linux共享内存',
  'Linux内存缓存（buffer/cache）',
  'Linux内存清理',
  'Linux内存泄漏检测',
  'Linux内存性能优化',
  'Linux OOM机制',
  'Linux内存 cgroup',
  'Linux大页内存',
  'Linux透明大页',
  'Linux内存压缩',
  'Linux内存交换策略',
  'Linux内存统计（/proc/meminfo）',
  'Linux内存监控工具',
  'Linux内存调优参数',
  
  // 网络管理
  'Linux网络基础',
  'Linux网络接口配置',
  'Linux IP地址配置',
  'Linux子网掩码配置',
  'Linux网关配置',
  'Linux DNS配置',
  'Linux主机名配置',
  'Linux网络路由表',
  'Linux静态路由',
  'Linux动态路由',
  'Linux网络诊断（ping）',
  'Linux网络诊断（traceroute）',
  'Linux网络诊断（netstat）',
  'Linux网络诊断（ss）',
  'Linux网络诊断（lsof）',
  'Linux网络诊断（tcpdump）',
  'Linux网络诊断（wireshark）',
  'Linux网络诊断（nmap）',
  'Linux网络诊断（curl）',
  'Linux网络诊断（wget）',
  'Linux防火墙（iptables）',
  'Linux防火墙（firewalld）',
  'Linux防火墙（ufw）',
  'Linux NAT配置',
  'Linux端口转发',
  'Linux网络命名空间',
  'Linux虚拟网桥',
  'Linux VLAN配置',
  'Linux Bonding配置',
  'Linux网络性能优化',
  'Linux网络流量控制（tc）',
  'Linux网络QoS',
  'Linux网络负载均衡',
  'Linux网络高可用',
  'Linux网络监控',
  'Linux网络抓包分析',
  'Linux网络连接跟踪',
  'Linux网络内核参数',
  'Linux网络安全配置',
  'Linux网络故障排查',
  
  // Shell编程
  'Bash Shell基础',
  'Bash变量',
  'Bash环境变量',
  'Bash位置参数',
  'Bash特殊变量',
  'Bash字符串操作',
  'Bash数组',
  'Bash算术运算',
  'Bash条件判断',
  'Bash if语句',
  'Bash case语句',
  'Bash for循环',
  'Bash while循环',
  'Bash until循环',
  'Bash函数定义',
  'Bash函数参数',
  'Bash函数返回值',
  'Bash输入输出重定向',
  'Bash管道',
  'Bash命令替换',
  'Bash进程替换',
  'Bash here文档',
  'Bash正则表达式',
  'Bash模式匹配',
  'Bash通配符',
  'Bash引号使用',
  'Bash转义字符',
  'Bash别名',
  'Bash历史命令',
  'Bash命令补全',
  'Bash快捷键',
  'Bash配置文件',
  'Bash调试',
  'Bash错误处理',
  'Bash信号捕获',
  'Bash脚本优化',
  'Bash脚本安全',
  'Bash脚本规范',
  'Bash脚本测试',
  'Bash脚本文档',
  
  // 软件包管理
  'RPM包管理',
  'YUM包管理',
  'DNF包管理',
  'DEB包管理',
  'APT包管理',
  '源码编译安装',
  '软件包依赖解决',
  '软件包仓库配置',
  '软件包签名验证',
  '软件包查询',
  '软件包安装',
  '软件包卸载',
  '软件包升级',
  '软件包降级',
  '软件包清理',
  '软件包缓存管理',
  '软件包组管理',
  '软件包版本锁定',
  '软件包冲突解决',
  '软件包漏洞修复',
  
  // 系统监控
  'Linux系统监控概述',
  'Linux CPU监控',
  'Linux内存监控',
  'Linux磁盘监控',
  'Linux网络监控',
  'Linux进程监控',
  'Linux系统负载',
  'Linux系统日志',
  'Linux系统日志（rsyslog）',
  'Linux系统日志（journald）',
  'Linux日志轮转',
  'Linux日志分析',
  'Linux性能监控（sar）',
  'Linux性能监控（vmstat）',
  'Linux性能监控（iostat）',
  'Linux性能监控（mpstat）',
  'Linux性能监控（pidstat）',
  'Linux性能监控（dstat）',
  'Linux性能监控（nmon）',
  'Linux性能监控（glances）',
  'Linux性能监控（Prometheus）',
  'Linux性能监控（Grafana）',
  'Linux性能监控（Zabbix）',
  'Linux性能监控（Nagios）',
  'Linux系统告警',
  'Linux系统基准测试',
  'Linux系统压力测试',
  'Linux系统容量规划',
  'Linux系统健康检查',
  'Linux系统故障诊断',
  
  // 安全管理
  'Linux安全基础',
  'Linux用户认证',
  'Linux访问控制',
  'Linux SELinux',
  'Linux AppArmor',
  'Linux安全审计',
  'Linux入侵检测',
  'Linux漏洞扫描',
  'Linux恶意软件防护',
  'Linux Rootkit检测',
  'Linux文件完整性检查',
  'Linux安全加固',
  'Linux安全策略',
  'Linux安全合规',
  'Linux数据加密',
  'Linux SSL/TLS',
  'Linux SSH安全',
  'Linux密钥管理',
  'Linux证书管理',
  'Linux安全日志分析',
  
  // 容器与虚拟化
  'Linux容器基础',
  'Docker基础',
  'Docker镜像',
  'Docker容器',
  'Docker网络',
  'Docker存储',
  'Docker Compose',
  'Dockerfile编写',
  'Docker镜像构建',
  'Docker镜像优化',
  'Docker容器编排',
  'Docker安全',
  'Docker监控',
  'Kubernetes基础',
  'Kubernetes Pod',
  'Kubernetes Deployment',
  'Kubernetes Service',
  'Kubernetes ConfigMap',
  'Kubernetes Secret',
  'Kubernetes Volume',
  'Kubernetes Namespace',
  'Kubernetes RBAC',
  'Kubernetes网络',
  'Kubernetes存储',
  'Kubernetes调度',
  'Kubernetes监控',
  'Linux KVM虚拟化',
  'Linux QEMU虚拟化',
  'Linux LXC容器',
  'Linux容器运行时',
  'Linux容器网络',
  'Linux容器存储',
  'Linux容器安全',
  'Linux容器监控',
  'Linux容器日志',
  'Linux容器资源限制',
  'Linux容器镜像仓库',
  'Linux容器镜像扫描',
  
  // 内核与驱动
  'Linux内核架构',
  'Linux内核编译',
  'Linux内核模块',
  'Linux内核参数',
  'Linux内核升级',
  'Linux内核调试',
  'Linux内核性能调优',
  'Linux设备驱动',
  'Linux字符设备',
  'Linux块设备',
  'Linux网络设备',
  'Linux设备树',
  'Linux sysfs',
  'Linux procfs',
  'Linux debugfs',
  'Linux内核日志',
  'Linux内核崩溃分析',
  'Linux内核热补丁',
  'Linux内核安全',
  'Linux内核 namespaces',
  'Linux内核 cgroups',
  'Linux内核 seccomp',
  'Linux内核 capabilities',
  'Linux内核审计',
  'Linux内核网络栈',
  'Linux内核调度器',
  'Linux内核内存管理',
  'Linux内核文件系统',
  'Linux内核同步机制',
  'Linux内核中断处理',
  'Linux内核定时器',
  
  // 高可用与集群
  'Linux高可用架构',
  'Linux负载均衡',
  'Linux集群基础',
  'Linux Pacemaker',
  'Linux Corosync',
  'Linux DRBD',
  'Linux Heartbeat',
  'Linux Keepalived',
  'Linux HAProxy',
  'Linux Nginx负载均衡',
  'Linux LVS负载均衡',
  'Linux集群文件系统',
  'Linux集群存储',
  'Linux集群网络',
  'Linux集群监控',
  'Linux集群故障转移',
  'Linux集群脑裂处理',
  'Linux集群性能优化',
  'Linux集群安全',
  'Linux集群备份恢复',
  
  // 备份与恢复
  'Linux备份策略',
  'Linux完整备份',
  'Linux增量备份',
  'Linux差异备份',
  'Linux文件备份（rsync）',
  'Linux文件备份（tar）',
  'Linux磁盘备份（dd）',
  'Linux系统备份',
  'Linux数据库备份',
  'Linux备份自动化',
  'Linux备份验证',
  'Linux备份加密',
  'Linux备份压缩',
  'Linux备份存储',
  'Linux备份监控',
  'Linux系统恢复',
  'Linux文件恢复',
  'Linux引导修复',
  'Linux灾难恢复',
  'Linux备份最佳实践',
  
  // 系统调优
  'Linux性能调优概述',
  'Linux CPU调优',
  'Linux内存调优',
  'Linux磁盘I/O调优',
  'Linux网络调优',
  'Linux文件系统调优',
  'Linux内核参数调优',
  'Linux服务调优',
  'Linux数据库调优',
  'Linux Web服务器调优',
  'Linux应用服务器调优',
  'Linux缓存优化',
  'Linux连接优化',
  'Linux超时优化',
  'Linux资源限制调优',
  'Linux调度策略调优',
  'Linux NUMA优化',
  'Linux HugePages优化',
  'Linux透明大页优化',
  'Linux调优工具',
  
  // 故障排查
  'Linux故障排查方法论',
  'Linux启动故障',
  'Linux登录故障',
  'Linux网络故障',
  'Linux磁盘故障',
  'Linux内存故障',
  'Linux CPU故障',
  'Linux进程故障',
  'Linux服务故障',
  'Linux内核故障',
  'Linux文件系统故障',
  'Linux权限故障',
  'Linux软件包故障',
  'Linux性能故障',
  'Linux安全故障',
  'Linux日志分析',
  'Linux核心转储分析',
  'Linux系统追踪',
  'Linux动态追踪（DTrace）',
  'Linux动态追踪（SystemTap）',
  'Linux动态追踪（BPF/BCC）',
  'Linux故障案例',
  'Linux应急响应',
  'Linux故障预防',
  'Linux监控告警',
  'Linux自动化运维',
  'Linux配置管理（Ansible）',
  'Linux配置管理（Puppet）',
  'Linux配置管理（Chef）',
  'Linux配置管理（SaltStack）',
  'Linux基础设施即代码'
];

// 生成单道题目
async function generateSingleQuestion(topic, difficulty) {
  const diffLabel = difficulty === 'easy' ? '简单的' : difficulty === 'medium' ? '中等难度的' : '困难的';
  
  const prompt = `你是一位Linux系统管理领域的专家教师。请生成一道${diffLabel}关于"Linux系统 - ${topic}"的选择题。

要求：
1. 题目内容专业、准确，考察Linux系统的实际应用
2. 4 个选项（A/B/C/D），只有一个正确答案
3. 提供详细解析，解释为什么正确答案是正确的，其他选项为什么错误
4. 题目要实用，贴近实际运维和开发场景
5. 命令示例使用Linux Shell风格

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
          { role: 'system', content: '你是一位专业的Linux系统管理教师，擅长出高质量的选择题。' },
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
      'Linux系统',
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
  console.log('开始生成 200 道 Linux系统 题目...\n');
  
  const totalQuestions = 200;
  let successCount = 0;
  let failCount = 0;
  
  // 随机选择知识点和难度
  for (let i = 0; i < totalQuestions; i++) {
    const topic = linuxTopics[Math.floor(Math.random() * linuxTopics.length)];
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
