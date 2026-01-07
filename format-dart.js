const StyleDictionary = require('style-dictionary');

StyleDictionary.registerFormat({
  name: 'custom/flutter-dart',
  formatter: function(dictionary) {
    const tokens = dictionary.allTokens;
    
    const cleanName = (name) => {
      return name
        .replace(/^--/, '')
        .replace(/^[0-9]+-/, '')  // 앞의 1-, 2- 제거!
        .split('-')
        .filter(part => part.length > 0)
        .map((part, index) => {
          if (index === 0) return part.toLowerCase();
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('');
    };
    
    const formatValue = (token) => {
      const value = token.value;
      
      // 색상 변환
      if (token.type === 'color' || /^#[0-9A-Fa-f]{6,8}$/.test(value)) {
        const hex = value.replace('#', '').toUpperCase();
        // 6자리면 FF 추가 (불투명)
        const fullHex = hex.length === 6 ? `FF${hex}` : hex;
        return {
          type: 'Color',
          value: `Color(0x${fullHex})`
        };
      }
      
      // px 제거
      if (typeof value === 'string' && value.endsWith('px')) {
        return {
          type: 'double',
          value: value.replace('px', '.0')
        };
      }
      
      // 숫자 처리
      if (!isNaN(value) && value !== '') {
        const num = parseFloat(value);
        
        // Font weight (100-900)
        if (num >= 100 && num <= 900 && num % 100 === 0) {
          return {
            type: 'FontWeight',
            value: `FontWeight.w${num}`
          };
        }
        
        // 일반 숫자 → double
        return {
          type: 'double',
          value: Number.isInteger(num) ? `${num}.0` : `${num}`
        };
      }
      
      // 문자열
      return {
        type: 'String',
        value: `'${value}'`
      };
    };
    
    let output = `// GENERATED CODE - DO NOT MODIFY BY HAND
// Design Tokens from Figma
// Generated: ${new Date().toISOString()}

import 'package:flutter/material.dart';

class DesignTokens {
  DesignTokens._();

`;
    
    tokens.forEach(token => {
      const name = cleanName(token.name);
      const formatted = formatValue(token);
      
      output += `  static const ${formatted.type} ${name} = ${formatted.value};\n`;
    });
    
    output += '}\n';
    
    return output;
  }
});

module.exports = StyleDictionary;
