import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

function QuizCard({ question, selectedIndex, result, onSelect, onSubmit, onAIExplain, onNext }) {
  const [copied, setCopied] = useState(false)
  const [explanationFontSize, setExplanationFontSize] = useState(14) // 默认14px

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
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <p className="text-slate-500">加载中...</p>
      </div>
    )
  }

  const difficultyColors = {
    easy: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    hard: 'bg-red-100 text-red-700 border-red-200'
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
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
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
          <h2 className="text-xl font-semibold text-slate-800 leading-relaxed flex-1">
            {question.question}
          </h2>
          <button
            onClick={handleCopy}
            className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-1 ${
              copied
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200 hover:text-slate-800'
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
            let buttonClass = 'border-slate-200 hover:border-blue-400 hover:bg-blue-50'

            if (result) {
              if (optionLabel === result.correctAnswer) {
                buttonClass = 'bg-green-100 border-green-500 text-green-800'
              } else if (optionLabel === ['A', 'B', 'C', 'D'][selectedIndex] && !result.isCorrect) {
                buttonClass = 'bg-red-100 border-red-500 text-red-800'
              } else {
                buttonClass = 'border-slate-200 opacity-50'
              }
            } else if (selectedIndex === index) {
              buttonClass = 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
            }

            return (
              <button
                key={index}
                onClick={() => onSelect(index)}
                disabled={result !== null}
                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-200 ${buttonClass}`}
              >
                <span className="font-medium">{optionLabel}. </span>
                <span className="text-slate-700">{option.substring(3)}</span>
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
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
          <div className={`p-4 rounded-xl border-2 mb-6 ${
            result.isCorrect
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center space-x-2 mb-2">
              {result.isCorrect ? (
                <>
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold text-green-800">回答正确！</span>
                </>
              ) : (
                <>
                  <span className="text-2xl">❌</span>
                  <span className="font-semibold text-red-800">回答错误</span>
                </>
              )}
            </div>
            <p className="text-slate-700 mb-2">
              正确答案：<span className="font-bold">{result.correctAnswer}</span>
            </p>
            <div className="bg-white/70 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-700">📖 解析：</span>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">{explanationFontSize}px</span>
                  <button
                    onClick={decreaseFontSize}
                    disabled={explanationFontSize <= 10}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="缩小文字"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <button
                    onClick={increaseFontSize}
                    disabled={explanationFontSize >= 24}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="放大文字"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-slate-600" style={{ fontSize: `${explanationFontSize}px`, lineHeight: '1.6' }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '')
                      return inline ? (
                        <code className={`${className} bg-slate-100 px-1.5 py-0.5 rounded font-mono text-pink-600`} style={{ fontSize: `${explanationFontSize}px` }} {...props}>
                          {children}
                        </code>
                      ) : (
                        <div className="my-3 rounded-lg overflow-hidden border border-slate-200">
                          <div className="bg-slate-100 px-3 py-1.5 text-xs text-slate-600 font-mono border-b border-slate-200 flex justify-between items-center">
                            <span>{match?.[1] || 'code'}</span>
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
                      return <p className="mb-3 text-slate-700 leading-relaxed" style={{ fontSize: `${explanationFontSize}px` }}>{children}</p>
                    },
                    h1({ children }) {
                      return <h1 className="font-bold text-slate-900 mb-3 mt-4" style={{ fontSize: `${explanationFontSize + 4}px` }}>{children}</h1>
                    },
                    h2({ children }) {
                      return <h2 className="font-bold text-slate-900 mb-3 mt-4" style={{ fontSize: `${explanationFontSize + 2}px` }}>{children}</h2>
                    },
                    h3({ children }) {
                      return <h3 className="font-bold text-slate-800 mb-2 mt-3" style={{ fontSize: `${explanationFontSize + 1}px` }}>{children}</h3>
                    },
                    ul({ children }) {
                      return <ul className="mb-3 list-disc list-inside space-y-1 text-slate-700" style={{ fontSize: `${explanationFontSize}px` }}>{children}</ul>
                    },
                    ol({ children }) {
                      return <ol className="mb-3 list-decimal list-inside space-y-1 text-slate-700" style={{ fontSize: `${explanationFontSize}px` }}>{children}</ol>
                    },
                    li({ children }) {
                      return <li className="pl-1" style={{ fontSize: `${explanationFontSize}px` }}>{children}</li>
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-blue-500 pl-3 py-2 my-3 bg-blue-50 rounded-r" style={{ fontSize: `${explanationFontSize}px` }}>
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
        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm text-slate-500 flex-wrap gap-2">
            <span>📌 知识点：{question.topic} {question.subtopic && `· ${question.subtopic}`}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizCard
