
"use client"

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';

export const CalculatorComponent = () => {
  const [display, setDisplay] = useState('0');
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleDigitClick = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const handleOperatorClick = (op: string) => {
    const inputValue = parseFloat(display);

    if (currentValue === null) {
      setCurrentValue(inputValue);
    } else if (operator) {
      const result = calculate(currentValue, inputValue, operator);
      setCurrentValue(result);
      setDisplay(String(result));
    }

    setWaitingForOperand(true);
    setOperator(op);
  };

  const handleEqualClick = () => {
    if (operator && currentValue !== null) {
      const inputValue = parseFloat(display);
      const result = calculate(currentValue, inputValue, operator);
      setCurrentValue(result);
      setDisplay(String(result));
      setOperator(null);
    }
  };

  const handleClearClick = () => {
    setDisplay('0');
    setCurrentValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };
  
  const handleDecimalClick = () => {
    if (waitingForOperand) {
        setDisplay('0.');
        setWaitingForOperand(false);
        return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const calculate = (val1: number, val2: number, op: string) => {
    switch (op) {
      case '+':
        return val1 + val2;
      case '-':
        return val1 - val2;
      case '*':
        return val1 * val2;
      case '/':
        return val1 / val2;
      default:
        return val2;
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+'
  ];

  const handleButtonClick = (btn: string) => {
    if (!isNaN(parseInt(btn))) {
      handleDigitClick(btn);
    } else if (btn === '.') {
        handleDecimalClick();
    } else if (btn === '=') {
      handleEqualClick();
    } else {
      handleOperatorClick(btn);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <Input type="text" readOnly value={display} className="mb-4 text-right text-2xl h-14 font-mono" />
        <Button onClick={handleClearClick} className="w-full mb-2">C</Button>
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <Button
              key={btn}
              onClick={() => handleButtonClick(btn)}
              variant={isNaN(parseInt(btn)) && btn !== '.' ? "secondary" : "outline"}
              className="text-xl"
            >
              {btn}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
