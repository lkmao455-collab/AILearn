import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function AIExplanationPage() {
  const [searchParams] = useSearchParams()
  const questionId = searchParams.get('id')
  
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState(null)
  const [questionInfo, setQuestionInfo] = useState(null)
  const [aiExplanation, setAiExplanation] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  
  // 聊天相关状态
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isChatGenerating, setIsChatGenerating] = useState(false)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // 加载 API Key
  useEffect(() => {
    const storedApiKey = localStorage.getItem('dashscope_api_key')
    if (storedApiKey) {
      setApiKey(storedApiKey)
    }
  }, [])

  // 获取题目信息
  useEffect(() => {
    if (questionId) {
      fetch(`http://localhost:3001/api/questions/${questionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setQuestionInfo(data.data)
          }
        })
        .catch(err => console.error('获取题目失败:', err))
    }
  }, [questionId])

  // 计时器
  useEffect(() => {
    let interval
    if (isGenerating || isChatGenerating) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isGenerating, isChatGenerating])

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isChatGenerating])

  // 自动生成提示词并发送请求
  useEffect(() => {
    if (!apiKey || !questionId || !questionInfo) return

    setElapsedTime(0)
    setIsGenerating(true)
    setError(null)

    // 构建用户提示词
    const userPrompt = `请详细解析这道题目：\n\n题目：${questionInfo.question}\n\n选项：\n${questionInfo.options.map((opt, i) => `${['A', 'B', 'C', 'D'][i]}. ${opt}`).join('\n')}\n\n正确答案：${questionInfo.answer}\n\n解析：${questionInfo.explanation || '无'}`

    const fetchAIExplanation = async () => {
      try {
        // 先添加用户提示词到消息列表
        setMessages([
          {
            role: 'user',
            content: userPrompt,
            timestamp: new Date()
          }
        ])

        const response = await fetch('http://localhost:3001/api/questions/ai-explain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
          },
          body: JSON.stringify({ questionId: parseInt(questionId) })
        })

        const data = await response.json()

        if (data.success) {
          setAiExplanation(data.data.aiExplanation)
          setIsGenerating(false)
          
          // 添加 AI 回复到消息列表
          setMessages([
            {
              role: 'user',
              content: userPrompt,
              timestamp: new Date()
            },
            {
              role: 'assistant',
              content: data.data.aiExplanation,
              timestamp: new Date()
            }
          ])
        } else {
          setError(data.message || '生成解析时出错')
          setIsGenerating(false)
        }
      } catch (error) {
        setError(`网络错误：${error.message}`)
        setIsGenerating(false)
      }
    }

    fetchAIExplanation()
  }, [apiKey, questionId, questionInfo])

  // 格式化代码块
  const renderMarkdown = (markdown) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            return inline ? (
              <code className={`${className} bg-slate-100 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600`} {...props}>
                {children}
              </code>
            ) : (
              <div className="my-4 rounded-lg overflow-hidden border border-slate-200">
                <div className="bg-slate-100 px-4 py-2 text-xs text-slate-600 font-mono border-b border-slate-200 flex justify-between items-center">
                  <span>{match?.[1] || 'code'}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(String(children))}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    title="复制代码"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <SyntaxHighlighter
                    language={match?.[1] || 'text'}
                    style={atomDark}
                    PreTag="div"
                    className="!m-0 !p-4"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                </div>
              </div>
            )
          },
          p({ children }) {
            return <p className="mb-4 text-slate-700 leading-relaxed">{children}</p>
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-6">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold text-slate-900 mb-3 mt-5">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-lg font-bold text-slate-800 mb-2 mt-4">{children}</h3>
          },
          ul({ children }) {
            return <ul className="mb-4 list-disc list-inside space-y-1 text-slate-700">{children}</ul>
          },
          ol({ children }) {
            return <ol className="mb-4 list-decimal list-inside space-y-1 text-slate-700">{children}</ol>
          },
          li({ children }) {
            return <li className="pl-1">{children}</li>
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 rounded-r">
                {children}
              </blockquote>
            )
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-300 text-sm">{children}</table>
              </div>
            )
          },
          th({ children }) {
            return <th className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold">{children}</th>
          },
          td({ children }) {
            return <td className="border border-slate-300 px-3 py-2">{children}</td>
          },
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {children}
              </a>
            )
          }
        }}
      >
        {markdown}
      </ReactMarkdown>
    )
  }

  const handleRegenerate = () => {
    setAiExplanation('')
    setMessages([])
    setIsGenerating(true)
    setError(null)
  }

  const handleSendMessage = async () => {
    if (!input.trim()) return
    if (!apiKey) {
      alert('请先在设置中配置 DashScope API Key')
      return
    }

    const newMessages = [...messages, { role: 'user', content: input, timestamp: new Date() }]
    setMessages(newMessages)
    setInput('')
    setIsChatGenerating(true)

    try {
      const context = `
题目：${questionInfo?.question}
选项：${questionInfo?.options?.map((opt, i) => `${['A', 'B', 'C', 'D'][i]}. ${opt}`).join('\n')}
正确答案：${questionInfo?.answer}
已讨论的内容：${messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n\n')}
      `.trim()

      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          question: context,
          followUp: input,
          topic: questionInfo?.topic,
          subtopic: questionInfo?.subtopic
        })
      })

      if (!response.ok) {
        setMessages([...newMessages, { role: 'assistant', content: '抱歉，生成回复时出错', timestamp: new Date() }])
        setIsChatGenerating(false)
        return
      }

      const data = await response.json()

      if (data.success) {
        setMessages([...newMessages, { role: 'assistant', content: data.data.aiExplanation || data.message, timestamp: new Date() }])
      } else {
        setMessages([...newMessages, { role: 'assistant', content: data.message || '抱歉，生成回复时出错', timestamp: new Date() }])
      }
    } catch (error) {
      setMessages([...newMessages, { role: 'assistant', content: `网络错误：${error.message}`, timestamp: new Date() }])
    } finally {
      setIsChatGenerating(false)
    }
  }

  return (
    <div className="flex h-screen bg-white">
      {/* 侧边栏 - DeepSeek 风格 */}
      <div className="hidden md:flex flex-col w-56 bg-[#1a1a2e] text-white">
        {/* Logo */}
        <div className="h-14 flex items-center px-4 border-b border-white/10">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-semibold text-lg">AI 解析</span>
          </div>
        </div>
        
        {/* 新对话按钮 */}
        <div className="p-3">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>新对话</span>
          </button>
        </div>

        {/* 题目信息 */}
        <div className="px-3 py-2">
          <div className="text-xs text-white/40 mb-2 uppercase tracking-wider">当前题目</div>
          {questionInfo && (
            <div className="p-2.5 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-white/80 line-clamp-2 mb-2">{questionInfo.question}</p>
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>#{questionInfo.id}</span>
                <span className="px-1.5 py-0.5 bg-white/10 rounded">{questionInfo.difficulty || '中等'}</span>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="mt-auto p-3 border-t border-white/10">
          <button
            onClick={() => window.print()}
            className="w-full flex items-center space-x-2 px-3 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>打印</span>
          </button>
        </div>
      </div>

      {/* 主内容区 - DeepSeek 风格 */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        {/* 顶部导航 */}
        <div className="h-14 border-b border-slate-100 px-4 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            <a href="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors" title="返回">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div>
              <h1 className="text-base font-semibold text-slate-900">AI 详细解析</h1>
              {(isGenerating || isChatGenerating) && (
                <span className="text-xs text-blue-600 flex items-center">
                  <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  思考中... {elapsedTime}s
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 聊天内容框 */}
        <div className="flex-1 overflow-y-auto bg-white">
          {(isGenerating || isChatGenerating) && messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">AI 正在思考中...</h2>
              <p className="text-slate-400 text-sm">正在为您生成详细的题目解析</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">生成失败</h2>
              <p className="text-slate-400 text-sm mb-4">{error}</p>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
              >
                重试
              </button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* 消息列表 */}
              <div className="py-6 space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`px-4 ${message.role === 'user' ? 'bg-slate-50' : 'bg-white'}`}
                  >
                    <div className="max-w-3xl mx-auto flex space-x-4">
                      {/* 头像 */}
                      <div className="flex-shrink-0">
                        {message.role === 'user' ? (
                          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      
                      {/* 内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-slate-900">
                            {message.role === 'user' ? '你' : 'AI 助手'}
                          </span>
                          <span className="text-xs text-slate-400">
                            {message.timestamp?.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-slate-700 leading-relaxed">
                          {message.role === 'assistant' ? renderMarkdown(message.content) : (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 加载中 */}
                {isChatGenerating && (
                  <div className="px-4 bg-white">
                    <div className="max-w-3xl mx-auto flex space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-slate-900">AI 助手</span>
                        </div>
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* 输入框 - DeepSeek 风格 */}
        <div className="border-t border-slate-100 bg-white p-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end space-x-2 bg-slate-50 rounded-2xl border border-slate-200 p-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                placeholder="输入消息..."
                disabled={isChatGenerating}
                rows={1}
                className="flex-1 px-3 py-2 bg-transparent border-0 focus:ring-0 resize-none max-h-32 text-slate-700 placeholder-slate-400"
                style={{ minHeight: '24px' }}
              />
              <button
                onClick={handleSendMessage}
                disabled={isChatGenerating || !input.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-xs text-slate-400">按 Enter 发送，Shift+Enter 换行</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIExplanationPage