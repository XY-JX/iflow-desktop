<template>
  <div class="calculator-container">
    <div class="calculator">
      <div class="calculator-header">
        <h3>🧮 计算器</h3>
        <button @click="$emit('close')" class="close-btn">×</button>
      </div>
      
      <div class="display">
        <div class="expression" v-if="expression">{{ expression }}</div>
        <div class="result">{{ displayValue || '0' }}</div>
      </div>
      
      <div class="buttons">
        <button @click="clear" class="btn clear">C</button>
        <button @click="clearLast" class="btn operator">⌫</button>
        <button @click="appendOperator('%')" class="btn operator">%</button>
        <button @click="appendOperator('/')" class="btn operator">÷</button>
        
        <button @click="appendNumber('7')" class="btn number">7</button>
        <button @click="appendNumber('8')" class="btn number">8</button>
        <button @click="appendNumber('9')" class="btn number">9</button>
        <button @click="appendOperator('*')" class="btn operator">×</button>
        
        <button @click="appendNumber('4')" class="btn number">4</button>
        <button @click="appendNumber('5')" class="btn number">5</button>
        <button @click="appendNumber('6')" class="btn number">6</button>
        <button @click="appendOperator('-')" class="btn operator">−</button>
        
        <button @click="appendNumber('1')" class="btn number">1</button>
        <button @click="appendNumber('2')" class="btn number">2</button>
        <button @click="appendNumber('3')" class="btn number">3</button>
        <button @click="appendOperator('+')" class="btn operator">+</button>
        
        <button @click="appendNumber('0')" class="btn number zero">0</button>
        <button @click="appendDecimal" class="btn number">.</button>
        <button @click="calculate" class="btn equals">=</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const displayValue = ref('');
const expression = ref('');
const currentNumber = ref('');
const lastOperation = ref('');
const shouldResetDisplay = ref(false);

const updateDisplay = () => {
  if (currentNumber.value) {
    displayValue.value = currentNumber.value;
  } else if (lastOperation.value) {
    displayValue.value = lastOperation.value;
  } else {
    displayValue.value = '';
  }
};

const appendNumber = (num: string) => {
  if (shouldResetDisplay.value) {
    currentNumber.value = num;
    shouldResetDisplay.value = false;
  } else {
    currentNumber.value += num;
  }
  updateDisplay();
};

const appendDecimal = () => {
  if (shouldResetDisplay.value) {
    currentNumber.value = '0.';
    shouldResetDisplay.value = false;
  } else if (!currentNumber.value.includes('.')) {
    currentNumber.value += '.';
  }
  updateDisplay();
};

const appendOperator = (op: string) => {
  if (currentNumber.value === '') return;
  
  if (lastOperation.value !== '') {
    calculate();
  }
  
  lastOperation.value = currentNumber.value + ' ' + op + ' ';
  expression.value = lastOperation.value;
  currentNumber.value = '';
  shouldResetDisplay.value = true;
  updateDisplay();
};

const clear = () => {
  displayValue.value = '';
  expression.value = '';
  currentNumber.value = '';
  lastOperation.value = '';
  shouldResetDisplay.value = false;
};

const clearLast = () => {
  if (currentNumber.value.length > 0) {
    currentNumber.value = currentNumber.value.slice(0, -1);
    updateDisplay();
  }
};

const calculate = () => {
  if (currentNumber.value === '' || lastOperation.value === '') return;
  
  try {
    const fullExpression = lastOperation.value + currentNumber.value;
    const result = eval(fullExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'));
    
    if (isNaN(result) || !isFinite(result)) {
      throw new Error('无效结果');
    }
    
    expression.value = fullExpression + ' =';
    displayValue.value = String(result);
    currentNumber.value = String(result);
    lastOperation.value = '';
    shouldResetDisplay.value = true;
  } catch (error) {
    displayValue.value = '错误';
    setTimeout(() => {
      clear();
    }, 1000);
  }
};
</script>

<style scoped>
.calculator-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
}

.calculator {
  background: linear-gradient(145deg, #1e1e1e, #2d2d2d);
  border-radius: 20px;
  padding: 24px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 8px 24px rgba(0, 0, 0, 0.3);
  min-width: 320px;
  border: 1px solid #404040;
}

.calculator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calculator-header h3 {
  margin: 0;
  font-size: 18px;
  color: #e0e0e0;
  font-weight: 600;
}

.close-btn {
  background: transparent;
  border: none;
  color: #e0e0e0;
  font-size: 28px;
  cursor: pointer;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #ff4d4f;
  color: white;
}

.display {
  background: #0d0d0d;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  text-align: right;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
}

.expression {
  font-size: 14px;
  color: #888;
  margin-bottom: 8px;
  min-height: 20px;
}

.result {
  font-size: 36px;
  color: #e0e0e0;
  font-weight: 600;
  word-break: break-all;
}

.buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.btn {
  padding: 16px;
  font-size: 20px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
}

.btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.btn.number {
  background: #3d3d3d;
  color: #e0e0e0;
}

.btn.number:hover {
  background: #4d4d4d;
}

.btn.number:active {
  background: #2d2d2d;
}

.btn.operator {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: white;
}

.btn.operator:hover {
  background: linear-gradient(135deg, #ff7b7b 0%, #ff6a6a 100%);
}

.btn.operator:active {
  background: linear-gradient(135deg, #ff5b5b 0%, #dd4a4a 100%);
}

.btn.clear {
  background: linear-gradient(135deg, #ff9500 0%, #ff7b00 100%);
  color: white;
}

.btn.clear:hover {
  background: linear-gradient(135deg, #ffa500 0%, #ff8b00 100%);
}

.btn.equals {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
  grid-column: span 1;
}

.btn.equals:hover {
  background: linear-gradient(135deg, #5ade90 0%, #32c55e 100%);
}

.btn.zero {
  grid-column: span 2;
}

@media (prefers-color-scheme: light) {
  .calculator {
    background: linear-gradient(145deg, #ffffff, #f5f5f5);
    border-color: #e0e0e0;
  }
  
  .calculator-header h3 {
    color: #333;
  }
  
  .close-btn {
    color: #666;
  }
  
  .close-btn:hover {
    background: #ff4d4f;
    color: white;
  }
  
  .display {
    background: #f8f9fa;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .expression {
    color: #999;
  }
  
  .result {
    color: #333;
  }
  
  .btn.number {
    background: #e0e0e0;
    color: #333;
  }
  
  .btn.number:hover {
    background: #d0d0d0;
  }
  
  .btn.number:active {
    background: #c0c0c0;
  }
}
</style>