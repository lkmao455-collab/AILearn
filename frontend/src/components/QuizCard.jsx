import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from '../contexts/ThemeContext'
import 'katex/dist/katex.min.css'

function QuizCard({ question, selectedIndex, result, onSelect, onSubmit, onAIExplain, onNext }) {
  const [copied, setCopied] = useState(false)
  // 从 localStorage 读取字体大小，默认 18px
  const [explanationFontSize, setExplanationFontSize] = useState(() => {
    const saved = localStorage.getItem('quiz_explanation_font_size')
    return saved ? parseInt(saved, 10) : 18
  })
  const { appliedTheme } = useTheme()
  const isDark = appliedTheme === 'dark'

  // 字体大小变化时保存到 localStorage
  useEffect(() => {
    localStorage.setItem('quiz_explanation_font_size', explanationFontSize.toString())
  }, [explanationFontSize])

  // 放大文字
  const increaseFontSize = () => {
    setExplanationFontSize(prev => Math.min(prev + 2, 24))
  }

  // 缩小文字
  const decreaseFontSize = () => {
    setExplanationFontSize(prev => Math.max(prev - 2, 10))
  }

  if (!question) {
    return (
      <div className={`rounded-2xl shadow-lg p-8 text-center transition-colors duration-300 ${
        isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500'
      }`}>
        <p>加载中...</p>
      </div>
    )
  }

  const difficultyColors = {
    easy: isDark ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-green-100 text-green-700 border-green-200',
    medium: isDark ? 'bg-yellow-900/40 text-yellow-300 border-yellow-700' : 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hard: isDark ? 'bg-red-900/40 text-red-300 border-red-700' : 'bg-red-100 text-red-700 border-red-200'
  }

  const difficultyLabels = {
    easy: '简单',
    medium: '中等',
    hard: '困难'
  }

  // 复制题目和选项到剪贴板
  const handleCopy = async () => {
    const optionLabels = ['A', 'B', 'C', 'D']
    const optionsText = question.options.map((option, index) => {
      return `${optionLabels[index]}. ${option.substring(3)}`
    }).join('\n')

    const textToCopy = `--- 题目：${question.question}

选项：
${optionsText}`

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }

  return (
    <div className={`rounded-2xl shadow-lg overflow-hidden border transition-colors duration-300 ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      {/* 题目标题区 */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-white/90 text-sm font-medium">题目 #{question.id}</span>
          <div className="flex items-center space-x-2 flex-wrap">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${difficultyColors[question.difficulty]}`}>
              {difficultyLabels[question.difficulty]}
            </span>
            <span className="text-white/90 text-sm bg-white/20 px-3 py-1 rounded-full">
              {question.topic}
            </span>
            {question.subtopic && (
              <span className="text-white/80 text-xs bg-white/10 px-2 py-1 rounded-full">
                {question.subtopic}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 题目内容 */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <h2 className={`text-xl font-semibold leading-relaxed flex-1 transition-colors duration-300 ${
            isDark ? 'text-slate-100' : 'text-slate-800'
          }`}>
            {question.question}
          </h2>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 border ${
              copied
                ? (isDark ? 'bg-green-900/40 text-green-300 border-green-700' : 'bg-green-100 text-green-700 border-green-300')
                : (isDark ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 hover:text-slate-200' : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200 hover:text-slate-800')
            }`}
            title="复制题目和选项"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>已复制</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>复制</span>
              </>
            )}
          </button>
        </div>

        {/* 选项 */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => {
            const optionLabel = ['A', 'B', 'C', 'D'][index]
            let buttonClass = isDark
              ? 'border-slate-600 hover:border-blue-400 hover:bg-blue-900/20 text-slate-200'
              : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'

            if (result) {
              if (optionLabel === result.correctAnswer) {
                buttonClass = isDark
                  ? 'bg-green-900/40 border-green-500 text-green-200'
                  : 'bg-green-100 border-green-500 text-green-800'
              } else if (optionLabel === ['A', 'B', 'C', 'D'][selectedIndex] && !result.isCorrect) {
                buttonClass = isDark
                  ? 'bg-red-900/40 border-red-500 text-red-200'
                  : 'bg-red-100 border-red-500 text-red-800'
              } else {
                buttonClass = isDark
                  ? 'border-slate-600 opacity-50'
                  : 'border-slate-200 opacity-50'
              }
            } else if (selectedIndex === index) {
              buttonClass = isDark
                ? 'border-blue-400 bg-blue-900/30 ring-2 ring-blue-500/50'
                : 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            }

            return (
              <button
                key={index}
                onClick={() => onSelect(index)}
                disabled={result !== null}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${buttonClass}`}
              >
                <span className="font-medium">{optionLabel}. </span>
                <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{option.substring(3)}</span>
              </button>
            )
          })}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-4 mb-6 flex-wrap gap-3">
          {!result ? (
            <button
              onClick={onSubmit}
              disabled={selectedIndex === null}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                selectedIndex === null
                  ? (isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed')
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-md hover:shadow-lg'
              }`}
            >
              提交答案
            </button>
          ) : (
            <>
              <button
                onClick={onNext}
                className="px-6 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                → 下一题
              </button>
              <button
                onClick={onAIExplain}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI 详细解析
                </span>
              </button>
            </>
          )}
        </div>

        {/* 结果展示 */}
        {result && (
          <div className={`p-4 rounded-xl border-2 mb-6 transition-colors duration-300 ${
            result.isCorrect
              ? (isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200')
              : (isDark ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200')
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {result.isCorrect ? (
                <>
                  <span className="text-2xl">✅</span>
                  <span className={`font-semibold ${isDark ? 'text-green-300' : 'text-green-800'}`}>回答正确！</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">❌</span>
                  <span className={`font-semibold ${isDark ? 'text-red-300' : 'text-red-800'}`}>回答错误</span>
                </>
              )}
            </div>
            <p className={`mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              正确答案：<span className="font-bold">{result.correctAnswer}</span>
            </p>
              <div className={`rounded-lg p-3 transition-colors duration-300 ${
              isDark ? 'bg-slate-800/70' : 'bg-white/70'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>📖 解析：</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{explanationFontSize}px</span>
                  <button
                    onClick={decreaseFontSize}
                    disabled={explanationFontSize <= 10}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="缩小文字"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={increaseFontSize}
                    disabled={explanationFontSize >= 24}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                      isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="放大文字"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(result.explanation).then(() => {
                        const btn = document.activeElement
                        const originalText = btn.innerHTML
                        btn.innerHTML = '<span>✅</span>'
                        setTimeout(() => {
                          btn.innerHTML = originalText
                        }, 1500)
                      }).catch(err => {
                        console.error('复制失败:', err)
                      })
                    }}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      isDark
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                    title="复制全部解析"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className={isDark ? 'text-slate-400' : 'text-slate-600'} style={{ fontSize: `${explanationFontSize}px`, lineHeight: '1.6' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return inline ? (
                        <code className={`${className} px-1.5 py-0.5 rounded font-mono ${
                          isDark ? 'bg-slate-700 text-pink-300' : 'bg-slate-100 text-pink-600'
                        }`} style={{ fontSize: `${explanationFontSize}px` }} {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className={`my-3 rounded-lg overflow-hidden border ${
                          isDark ? 'border-slate-600' : 'border-slate-200'
                        }`}>
                          <div className={`px-3 py-1.5 text-xs font-mono border-b flex justify-between items-center ${
                            isDark ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            <span>{match?.[1] || 'code'}</span>
                            <button
                              onClick={() => {
                                const codeText = String(children).replace(/\n$/, '')
                                navigator.clipboard.writeText(codeText).then(() => {
                                  // 临时显示复制成功提示
                                  const btn = document.activeElement
                                  const originalText = btn.innerHTML
                                  btn.innerHTML = '<span>✅ 已复制</span>'
                                  setTimeout(() => {
                                    btn.innerHTML = originalText
                                  }, 1500)
                                }).catch(err => {
                                  console.error('复制失败:', err)
                                })
                              }}
                              className={`px-2 py-0.5 rounded text-xs transition-colors ${
                                isDark
                                  ? 'hover:bg-slate-600 text-slate-400 hover:text-slate-200'
                                  : 'hover:bg-slate-200 text-slate-500 hover:text-slate-700'
                              }`}
                              title="复制代码"
                            >
                              <span>📋 复制</span>
                            </button>
                          </div>
                          <SyntaxHighlighter
                            language={match?.[1] || 'text'}
                            style={atomDark}
                            PreTag="div"
                            className="!m-0 !p-3"
                            {...props}
                          >
                            {String(children).replace(/\n$/, '')}
                          </SyntaxHighlighter>
                        </div>
                      )
                    },
                    p({ children }) {
                      return <div className={`mb-3 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontSize: `${explanationFontSize}px` }}>{children}</div>
                    },
                    h1({ children }) {
                      return <h1 className={`font-bold mb-3 mt-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} style={{ fontSize: `${explanationFontSize + 4}px` }}>{children}</h1>
                    },
                    h2({ children }) {
                      return <h2 className={`font-bold mb-3 mt-4 ${isDark ? 'text-slate-100' : 'text-slate-900'}`} style={{ fontSize: `${explanationFontSize + 2}px` }}>{children}</h2>
                    },
                    h3({ children }) {
                      return <h3 className={`font-bold mb-2 mt-3 ${isDark ? 'text-slate-200' : 'text-slate-800'}`} style={{ fontSize: `${explanationFontSize + 1}px` }}>{children}</h3>
                    },
                    ul({ children }) {
                      return <ul className={`mb-3 list-disc list-inside space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontSize: `${explanationFontSize}px` }}>{children}</ul>
                    },
                    ol({ children }) {
                      return <ol className={`mb-3 list-decimal list-inside space-y-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} style={{ fontSize: `${explanationFontSize}px` }}>{children}</ol>
                    },
                    li({ children }) {
                      return <li className="pl-1" style={{ fontSize: `${explanationFontSize}px` }}>{children}</li>
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className={`border-l-4 pl-3 py-2 my-3 rounded-r ${
                          isDark ? 'border-blue-400 bg-blue-900/20' : 'border-blue-500 bg-blue-50'
                        }`} style={{ fontSize: `${explanationFontSize}px` }}>
                          {children}
                        </blockquote>
                      )
                    },
                    pre({ children }) {
                      return <pre className="m-0">{children}</pre>
                    }
                  }}
                >
                  {result.explanation}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        {/* 题目信息 */}
        <div className={`mt-6 pt-6 border-t transition-colors duration-300 ${
          isDark ? 'border-slate-700' : 'border-slate-200'
        }`}>
          <div className={`flex items-center justify-between text-sm flex-wrap gap-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            <span>📌 知识点：{question.topic} {question.subtopic && `· ${question.subtopic}`}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizCard
