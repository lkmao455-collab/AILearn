"""
保险续保预测 - 逻辑回归分类建模
包含系数打印和可视化（正负系数区分）
"""

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, roc_auc_score, roc_curve
import warnings
warnings.filterwarnings('ignore')

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# 生成模拟保险数据
def generate_insurance_data(n_samples=1000, random_state=42):
    """
    生成保险续保相关数据
    特征说明：
    - age: 客户年龄
    - policy_duration: 保单持续时间（年）
    - premium_amount: 保费金额
    - claim_count: 历史理赔次数
    - claim_amount: 历史理赔金额
    - satisfaction_score: 满意度评分（1-10）
    - discount_rate: 折扣率
    - competitor_price: 竞争对手价格
    - service_calls: 客服通话次数
    - payment_delay: 缴费延迟次数
    """
    np.random.seed(random_state)
    
    data = {
        'age': np.random.randint(18, 70, n_samples),
        'policy_duration': np.random.randint(1, 15, n_samples),
        'premium_amount': np.random.uniform(2000, 20000, n_samples),
        'claim_count': np.random.poisson(2, n_samples),
        'claim_amount': np.random.exponential(5000, n_samples),
        'satisfaction_score': np.random.randint(1, 11, n_samples),
        'discount_rate': np.random.uniform(0, 0.3, n_samples),
        'competitor_price': np.random.uniform(1800, 22000, n_samples),
        'service_calls': np.random.poisson(3, n_samples),
        'payment_delay': np.random.poisson(1, n_samples)
    }
    
    df = pd.DataFrame(data)
    
    # 生成续保标签（基于逻辑关系）
    # 满意度高、保单时间长、理赔次数少、折扣高的客户更可能续保
    prob = 1 / (1 + np.exp(-(
        0.3 * (df['satisfaction_score'] - 5) +
        0.2 * df['policy_duration'] -
        0.25 * df['claim_count'] +
        0.15 * df['discount_rate'] * 10 -
        0.1 * (df['competitor_price'] - df['premium_amount']) / 1000 -
        0.2 * df['payment_delay'] +
        0.05 * (70 - df['age']) / 10
    )))
    
    df['renewal'] = (prob > 0.5).astype(int)
    
    return df

# 主函数
def main():
    print("=" * 60)
    print("保险续保预测 - 逻辑回归分类建模")
    print("=" * 60)
    
    # 1. 生成数据
    print("\n【1】生成模拟保险数据...")
    df = generate_insurance_data(n_samples=1000)
    print(f"数据集大小: {df.shape}")
    print(f"\n数据预览:")
    print(df.head(10))
    
    # 2. 数据探索
    print("\n【2】数据探索...")
    print(f"\n续保分布:")
    print(df['renewal'].value_counts())
    print(f"\n续保率: {df['renewal'].mean():.2%}")
    
    # 3. 准备特征和标签
    print("\n【3】准备训练数据...")
    feature_names = ['age', 'policy_duration', 'premium_amount', 'claim_count', 
                     'claim_amount', 'satisfaction_score', 'discount_rate', 
                     'competitor_price', 'service_calls', 'payment_delay']
    X = df[feature_names]
    y = df['renewal']
    
    # 4. 划分训练集和测试集
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"训练集大小: {X_train.shape[0]}")
    print(f"测试集大小: {X_test.shape[0]}")
    
    # 5. 特征标准化
    print("\n【4】特征标准化...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 6. 训练逻辑回归模型
    print("\n【5】训练逻辑回归模型...")
    model = LogisticRegression(random_state=42, max_iter=1000)
    model.fit(X_train_scaled, y_train)
    
    # 7. 模型评估
    print("\n【6】模型评估...")
    y_pred = model.predict(X_test_scaled)
    y_pred_proba = model.predict_proba(X_test_scaled)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_pred_proba)
    
    print(f"\n准确率: {accuracy:.4f}")
    print(f"AUC: {auc:.4f}")
    print(f"\n分类报告:")
    print(classification_report(y_test, y_pred, target_names=['不续保', '续保']))
    
    # 8. 打印逻辑回归系数
    print("\n" + "=" * 60)
    print("【7】逻辑回归系数分析")
    print("=" * 60)
    
    coefficients = model.coef_[0]
    intercept = model.intercept_[0]
    
    print(f"\n截距 (Intercept): {intercept:.6f}")
    print(f"\n特征系数:")
    print("-" * 60)
    
    coef_df = pd.DataFrame({
        'Feature': feature_names,
        'Coefficient': coefficients,
        'Abs_Coefficient': np.abs(coefficients),
        'Odds_Ratio': np.exp(coefficients)
    })
    coef_df = coef_df.sort_values('Coefficient', ascending=False)
    
    for idx, row in coef_df.iterrows():
        sign = "+" if row['Coefficient'] > 0 else ""
        print(f"{row['Feature']:20s}: {sign}{row['Coefficient']:10.6f}  (OR: {row['Odds_Ratio']:.4f})")
    
    # 9. 系数可视化
    print("\n【8】生成系数可视化图表...")
    
    fig, axes = plt.subplots(2, 2, figsize=(16, 12))
    fig.suptitle('保险续保预测 - 逻辑回归分析结果', fontsize=16, fontweight='bold')
    
    # 图1: 系数条形图（按正负分类）
    ax1 = axes[0, 0]
    colors = ['#2ecc71' if c > 0 else '#e74c3c' for c in coef_df['Coefficient']]
    bars = ax1.barh(coef_df['Feature'], coef_df['Coefficient'], color=colors, alpha=0.8, edgecolor='black', linewidth=0.5)
    ax1.axvline(x=0, color='black', linestyle='-', linewidth=1)
    ax1.set_xlabel('Coefficient Value', fontsize=11)
    ax1.set_ylabel('Feature', fontsize=11)
    ax1.set_title('逻辑回归系数（绿色=正向影响，红色=负向影响）', fontsize=12, fontweight='bold')
    ax1.grid(axis='x', alpha=0.3)
    
    # 添加数值标签
    for bar, coef in zip(bars, coef_df['Coefficient']):
        width = bar.get_width()
        label_x = width + 0.02 if width > 0 else width - 0.02
        ha = 'left' if width > 0 else 'right'
        ax1.text(label_x, bar.get_y() + bar.get_height()/2, 
                f'{coef:.3f}', ha=ha, va='center', fontsize=9)
    
    # 图2: 系数绝对值排序
    ax2 = axes[0, 1]
    coef_df_sorted = coef_df.sort_values('Abs_Coefficient', ascending=True)
    colors2 = ['#2ecc71' if c > 0 else '#e74c3c' for c in coef_df_sorted['Coefficient']]
    bars2 = ax2.barh(coef_df_sorted['Feature'], coef_df_sorted['Abs_Coefficient'], 
                     color=colors2, alpha=0.8, edgecolor='black', linewidth=0.5)
    ax2.set_xlabel('Absolute Coefficient Value', fontsize=11)
    ax2.set_ylabel('Feature', fontsize=11)
    ax2.set_title('特征重要性（按绝对值排序）', fontsize=12, fontweight='bold')
    ax2.grid(axis='x', alpha=0.3)
    
    # 图3: ROC曲线
    ax3 = axes[1, 0]
    fpr, tpr, _ = roc_curve(y_test, y_pred_proba)
    ax3.plot(fpr, tpr, color='#3498db', linewidth=2, label=f'ROC Curve (AUC = {auc:.4f})')
    ax3.plot([0, 1], [0, 1], color='gray', linestyle='--', linewidth=1, label='Random')
    ax3.fill_between(fpr, tpr, alpha=0.3, color='#3498db')
    ax3.set_xlabel('False Positive Rate', fontsize=11)
    ax3.set_ylabel('True Positive Rate', fontsize=11)
    ax3.set_title('ROC曲线', fontsize=12, fontweight='bold')
    ax3.legend(loc='lower right')
    ax3.grid(alpha=0.3)
    
    # 图4: 混淆矩阵
    ax4 = axes[1, 1]
    cm = confusion_matrix(y_test, y_pred)
    im = ax4.imshow(cm, interpolation='nearest', cmap='Blues')
    ax4.set_title('混淆矩阵', fontsize=12, fontweight='bold')
    tick_marks = np.arange(2)
    ax4.set_xticks(tick_marks)
    ax4.set_yticks(tick_marks)
    ax4.set_xticklabels(['不续保', '续保'])
    ax4.set_yticklabels(['不续保', '续保'])
    ax4.set_ylabel('真实标签', fontsize=11)
    ax4.set_xlabel('预测标签', fontsize=11)
    
    # 添加数值
    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax4.text(j, i, format(cm[i, j], 'd'),
                    ha="center", va="center",
                    color="white" if cm[i, j] > thresh else "black",
                    fontsize=14, fontweight='bold')
    
    plt.tight_layout()
    plt.savefig('insurance_logistic_regression_analysis.png', dpi=300, bbox_inches='tight')
    print("\n✓ 可视化图表已保存: insurance_logistic_regression_analysis.png")
    plt.show()
    
    # 10. 系数详细解读
    print("\n" + "=" * 60)
    print("【9】系数解读")
    print("=" * 60)
    
    print("\n正向影响特征（促进续保）:")
    print("-" * 60)
    positive_coef = coef_df[coef_df['Coefficient'] > 0].sort_values('Coefficient', ascending=False)
    for idx, row in positive_coef.iterrows():
        print(f"• {row['Feature']:20s}: 系数={row['Coefficient']:+.6f}, OR={row['Odds_Ratio']:.4f}")
        print(f"  解释: 该特征每增加1个标准差，续保几率增加{(row['Odds_Ratio']-1)*100:.1f}%")
    
    print("\n负向影响特征（抑制续保）:")
    print("-" * 60)
    negative_coef = coef_df[coef_df['Coefficient'] < 0].sort_values('Coefficient', ascending=True)
    for idx, row in negative_coef.iterrows():
        print(f"• {row['Feature']:20s}: 系数={row['Coefficient']:+.6f}, OR={row['Odds_Ratio']:.4f}")
        print(f"  解释: 该特征每增加1个标准差，续保几率减少{(1-row['Odds_Ratio'])*100:.1f}%")
    
    # 11. 预测示例
    print("\n" + "=" * 60)
    print("【10】预测示例")
    print("=" * 60)
    
    # 创建几个示例客户
    sample_customers = pd.DataFrame({
        'age': [35, 55, 28, 45],
        'policy_duration': [5, 10, 2, 8],
        'premium_amount': [5000, 8000, 3000, 6000],
        'claim_count': [0, 3, 1, 5],
        'claim_amount': [0, 15000, 2000, 25000],
        'satisfaction_score': [9, 6, 8, 4],
        'discount_rate': [0.15, 0.05, 0.20, 0.02],
        'competitor_price': [4800, 7500, 2800, 5500],
        'service_calls': [1, 5, 2, 8],
        'payment_delay': [0, 2, 0, 4]
    })
    
    sample_scaled = scaler.transform(sample_customers)
    predictions = model.predict(sample_scaled)
    probabilities = model.predict_proba(sample_scaled)[:, 1]
    
    print("\n客户续保预测:")
    print("-" * 80)
    for i in range(len(sample_customers)):
        result = "✓ 续保" if predictions[i] == 1 else "✗ 不续保"
        print(f"客户{i+1}: {result} (概率: {probabilities[i]:.2%})")
    
    print("\n" + "=" * 60)
    print("分析完成！")
    print("=" * 60)
    
    return model, scaler, coef_df

if __name__ == "__main__":
    model, scaler, coef_df = main()
