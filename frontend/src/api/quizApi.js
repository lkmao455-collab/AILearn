import axios from 'axios'

const API_BASE_URL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000
})

// 请求拦截器 - 自动添加 token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // 添加 API Key（如果设置了）
    const apiKey = localStorage.getItem('dashscope_api_key')
    if (apiKey && (config.url.includes('/ai/') || config.url.includes('/questions/test-connection') || config.url.includes('/questions/ai-explain'))) {
      config.headers['X-API-Key'] = apiKey
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 创建一个不使用拦截器的 axios 实例用于测试 API Key 连接
const testApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 响应拦截器 - 处理未登录
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 用户认证
export const register = async (username, password) => {
  const response = await api.post('/auth/register', { username, password })
  return response.data
}

export const login = async (username, password) => {
  const response = await api.post('/auth/login', { username, password })
  return response.data
}

export const getProfile = async () => {
  const response = await api.get('/auth/profile')
  return response.data
}

export const logout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

// 题目相关
export const getAllQuestions = async () => {
  const response = await api.get('/questions')
  return response.data
}

export const getRandomQuestion = async () => {
  const response = await api.get('/questions/random')
  return response.data
}

export const getCategories = async () => {
  const response = await api.get('/questions/categories')
  return response.data
}

export const getQuestionsByCategory = async (topic, difficulty) => {
  const params = {}
  if (topic) params.topic = topic
  if (difficulty) params.difficulty = difficulty
  const response = await api.get('/questions/filter', { params })
  return response.data
}

export const checkAnswer = async (questionId, userAnswer) => {
  const response = await api.post('/questions/check', { questionId, userAnswer })
  return response.data
}

export const getAIExplanation = async (questionId, apiKey) => {
  const response = await testApi.post('/questions/ai-explain', { questionId }, {
    headers: { 'X-API-Key': apiKey }
  })
  return response.data
}

export const testApiKeyConnection = async (apiKey) => {
  const response = await testApi.post('/questions/test-connection', {}, {
    headers: { 'X-API-Key': apiKey }
  })
  return response.data
}

// 错题本
export const getWrongQuestions = async () => {
  const response = await api.get('/wrong-questions')
  return response.data
}

export const addWrongQuestion = async (questionId, userAnswer) => {
  const response = await api.post('/wrong-questions', { questionId, userAnswer })
  return response.data
}

export const removeWrongQuestion = async (questionId) => {
  const response = await api.delete(`/wrong-questions/${questionId}`)
  return response.data
}

export const clearWrongQuestions = async () => {
  const response = await api.delete('/wrong-questions/clear/all')
  return response.data
}

// AI 出题
export const generateQuestionByAI = async (topic, difficulty, apiKey, count = 1) => {
  const response = await testApi.post('/ai/generate', { topic, difficulty, count }, {
    headers: { 'X-API-Key': apiKey }
  })
  return response.data
}

// 排行榜
export const getRanking = async () => {
  const response = await api.get('/rank')
  return response.data
}

export const getMyRank = async () => {
  const response = await api.get('/rank/my-rank')
  return response.data
}

export default {
  register,
  login,
  getProfile,
  logout,
  getAllQuestions,
  getRandomQuestion,
  getCategories,
  getQuestionsByCategory,
  checkAnswer,
  getAIExplanation,
  testApiKeyConnection,
  getWrongQuestions,
  addWrongQuestion,
  removeWrongQuestion,
  clearWrongQuestions,
  generateQuestionByAI,
  getRanking,
  getMyRank
}
