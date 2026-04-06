/**
 * Model Manager - 多模型轮询管理模块
 * 
 * 功能：
 * 1. 从本地文件加载模型列表
 * 2. 管理模型状态（可用、已失败）
 * 3. 实现轮询策略：按顺序使用模型，每个模型失败1次就跳过
 * 4. 实现批量策略：一批10个都失败就获取下一批10个（排除已使用的）
 * 5. 提供统一的API调用接口
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 模型列表文件路径
const MODELS_FILE = path.join(__dirname, '..', 'data', 'available-models.json');
const FREE_MODELS_FILE = path.join(__dirname, '..', 'scripts', 'free_models.txt');

// DashScope API URL
const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

class ModelManager {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.batchSize = options.batchSize || 10; // 每批模型数量
    this.maxRetriesPerModel = options.maxRetriesPerModel || 1; // 每个模型最大重试次数
    this.timeout = options.timeout || 60000; // API调用超时时间
    this.useFreeModelsOnly = options.useFreeModelsOnly !== false; // 默认只使用免费模型
    
    // 模型状态管理
    this.allModels = []; // 所有可用模型
    this.currentBatch = []; // 当前批次模型
    this.failedModels = new Set(); // 已失败的模型（连续失败10次）
    this.modelFailureCounts = new Map(); // 模型失败次数计数器
    this.usedModels = new Set(); // 已使用的模型
    this.currentModelIndex = 0; // 当前模型索引
    
    // 统计信息
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      currentBatchNumber: 0
    };
  }

  /**
   * 初始化模型管理器
   * 从本地文件加载模型列表
   */
  async initialize() {
    try {
      // 如果使用免费模型，从 free_models.txt 读取
      if (this.useFreeModelsOnly) {
        if (!fs.existsSync(FREE_MODELS_FILE)) {
          throw new Error(`免费模型列表文件不存在: ${FREE_MODELS_FILE}`);
        }

        const freeModelsContent = fs.readFileSync(FREE_MODELS_FILE, 'utf8');
        const freeModelIds = freeModelsContent
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        
        this.allModels = freeModelIds.map(id => ({ id }));
        
        console.log(`✓ 成功加载 ${this.allModels.length} 个免费模型`);
        console.log('免费模型列表:', freeModelIds.join(', '));
      } else {
        // 从 available-models.json 读取所有模型
        if (!fs.existsSync(MODELS_FILE)) {
          throw new Error(`模型列表文件不存在: ${MODELS_FILE}，请先运行 fetch-models.js 获取模型列表`);
        }

        const data = JSON.parse(fs.readFileSync(MODELS_FILE, 'utf8'));
        this.allModels = data.models || [];
        
        console.log(`✓ 成功加载 ${this.allModels.length} 个模型`);
      }
      
      if (this.allModels.length === 0) {
        throw new Error('模型列表为空');
      }
      
      // 加载第一批模型
      this.loadNextBatch();
      
      return true;
    } catch (error) {
      console.error('初始化模型管理器失败:', error.message);
      throw error;
    }
  }

  /**
   * 加载下一批模型
   * 排除已使用和已失败的模型
   */
  loadNextBatch() {
    // 获取未使用的模型
    const availableModels = this.allModels.filter(model => {
      return !this.usedModels.has(model.id) && !this.failedModels.has(model.id);
    });

    if (availableModels.length === 0) {
      console.warn('警告：所有模型都已使用或失败');
      // 重置已使用集合，但保留失败模型
      this.usedModels.clear();
      this.stats.currentBatchNumber = 0;
      
      // 再次尝试获取可用模型
      const remainingModels = this.allModels.filter(model => {
        return !this.failedModels.has(model.id);
      });
      
      if (remainingModels.length === 0) {
        throw new Error('所有模型都已失败，无法继续');
      }
      
      this.currentBatch = remainingModels.slice(0, this.batchSize);
    } else {
      this.currentBatch = availableModels.slice(0, this.batchSize);
    }

    this.stats.currentBatchNumber++;
    this.currentModelIndex = 0;
    
    console.log(`\n加载第 ${this.stats.currentBatchNumber} 批模型 (${this.currentBatch.length} 个):`);
    this.currentBatch.forEach((model, index) => {
      console.log(`  ${index + 1}. ${model.id}`);
    });
  }

  /**
   * 获取当前要使用的模型
   */
  getCurrentModel() {
    if (this.currentBatch.length === 0) {
      return null;
    }
    return this.currentBatch[this.currentModelIndex];
  }

  /**
   * 移动到下一个模型
   * @returns {boolean} 是否成功移动到下一个模型
   */
  moveToNextModel() {
    this.currentModelIndex++;
    
    // 如果当前批次用完，加载下一批
    if (this.currentModelIndex >= this.currentBatch.length) {
      console.log(`\n当前批次所有模型都已尝试，加载下一批...`);
      this.loadNextBatch();
      return this.currentBatch.length > 0;
    }
    
    return true;
  }

  /**
   * 标记模型为失败
   * 连续失败10次才标记为永久失败
   */
  markModelFailed(modelId) {
    const currentCount = this.modelFailureCounts.get(modelId) || 0;
    const newCount = currentCount + 1;
    this.modelFailureCounts.set(modelId, newCount);
    
    console.log(`  模型 ${modelId} 失败次数: ${newCount}/10`);
    
    if (newCount >= 10) {
      this.failedModels.add(modelId);
      console.log(`  模型 ${modelId} 已连续失败10次，标记为永久失败`);
    }
  }

  /**
   * 重置模型失败计数
   * 当模型成功时调用
   */
  resetModelFailureCount(modelId) {
    if (this.modelFailureCounts.has(modelId)) {
      this.modelFailureCounts.delete(modelId);
      console.log(`  模型 ${modelId} 失败计数已重置`);
    }
  }

  /**
   * 重新加载模型列表
   * 当所有模型都失败时调用
   */
  async reloadModels() {
    console.log('\n========== 重新加载模型列表 ==========');
    
    // 清空所有状态
    this.failedModels.clear();
    this.modelFailureCounts.clear();
    this.usedModels.clear();
    this.currentModelIndex = 0;
    this.currentBatch = [];
    
    // 重新初始化
    await this.initialize();
    
    console.log('========== 模型列表重新加载完成 ==========\n');
  }

  /**
   * 标记模型为已使用
   */
  markModelUsed(modelId) {
    this.usedModels.add(modelId);
  }

  /**
   * 调用 DashScope API
   * @param {string} modelId - 模型ID
   * @param {Array} messages - 消息列表
   * @returns {Promise<Object>} API响应
   */
  async callDashScopeAPI(modelId, messages) {
    const response = await axios.post(
      `${DASHSCOPE_API_URL}/chat/completions`,
      {
        model: modelId,
        messages: messages,
        temperature: 0.7,
        max_tokens: 4096
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: this.timeout
      }
    );

    return response.data;
  }

  /**
   * 执行API调用，自动处理模型切换
   * @param {Array} messages - 消息列表
   * @param {Object} options - 可选参数
   * @returns {Promise<Object>} API响应
   */
  async callWithFallback(messages, options = {}) {
    const maxTotalAttempts = options.maxTotalAttempts || 100; // 最大总尝试次数
    let attempts = 0;
    
    while (attempts < maxTotalAttempts) {
      const model = this.getCurrentModel();
      
      if (!model) {
        throw new Error('没有可用的模型');
      }

      const modelId = model.id;
      attempts++;
      this.stats.totalCalls++;
      
      console.log(`\n[尝试 ${attempts}] 使用模型: ${modelId}`);
      
      try {
        const startTime = Date.now();
        const response = await this.callDashScopeAPI(modelId, messages);
        const duration = Date.now() - startTime;
        
        // 检查响应内容是否为空
        if (!response || !response.choices || !response.choices[0] || 
            !response.choices[0].message || !response.choices[0].message.content) {
          console.error(`  ✗ 失败: 模型返回空内容`);
          this.stats.failedCalls++;
          this.markModelFailed(modelId);
          
          // 移动到下一个模型
          const hasMoreModels = this.moveToNextModel();
          
          if (!hasMoreModels) {
            throw new Error('所有模型都已失败，无法继续');
          }
          continue;
        }
        
        // 标记为已使用
        this.markModelUsed(modelId);
        this.stats.successfulCalls++;
        
        // 成功时重置该模型的失败计数
        this.resetModelFailureCount(modelId);
        
        console.log(`  ✓ 成功 (${duration}ms)`);
        
        return {
          success: true,
          model: modelId,
          response: response,
          duration: duration,
          attempts: attempts
        };
        
      } catch (error) {
        this.stats.failedCalls++;
        console.error(`  ✗ 失败: ${error.message}`);
        
        // 标记为失败
        this.markModelFailed(modelId);
        
        // 移动到下一个模型
        const hasMoreModels = this.moveToNextModel();
        
        if (!hasMoreModels) {
          // 所有模型都失败，重新加载模型列表
          console.log('\n所有模型都已失败，尝试重新加载模型列表...');
          try {
            await this.reloadModels();
            // 重新加载后继续循环
            continue;
          } catch (reloadError) {
            throw new Error('所有模型都已失败，重新加载也失败: ' + reloadError.message);
          }
        }
      }
    }
    
    throw new Error(`达到最大尝试次数 (${maxTotalAttempts})，无法完成调用`);
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.stats,
      totalModels: this.allModels.length,
      failedModelsCount: this.failedModels.size,
      usedModelsCount: this.usedModels.size,
      availableModelsCount: this.allModels.length - this.failedModels.size,
      currentBatchSize: this.currentBatch.length,
      currentModelIndex: this.currentModelIndex
    };
  }

  /**
   * 打印统计信息
   */
  printStats() {
    const stats = this.getStats();
    console.log('\n========== 模型管理统计 ==========');
    console.log(`总模型数: ${stats.totalModels}`);
    console.log(`失败模型数: ${stats.failedModelsCount}`);
    console.log(`已使用模型数: ${stats.usedModelsCount}`);
    console.log(`可用模型数: ${stats.availableModelsCount}`);
    console.log(`当前批次: ${stats.currentBatchNumber}`);
    console.log(`当前批次大小: ${stats.currentBatchSize}`);
    console.log(`总调用次数: ${stats.totalCalls}`);
    console.log(`成功调用: ${stats.successfulCalls}`);
    console.log(`失败调用: ${stats.failedCalls}`);
    console.log('==================================\n');
  }

  /**
   * 重置状态（保留失败模型）
   */
  reset() {
    this.usedModels.clear();
    this.currentModelIndex = 0;
    this.stats = {
      totalCalls: 0,
      successfulCalls: 0,
      failedCalls: 0,
      currentBatchNumber: 0
    };
    this.loadNextBatch();
  }

  /**
   * 完全重置（包括失败模型）
   */
  fullReset() {
    this.failedModels.clear();
    this.reset();
  }
}

module.exports = ModelManager;
