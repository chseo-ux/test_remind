const StyleDictionary = require('style-dictionary');

// Flutter 전용 Name Transform (완성!)
StyleDictionary.registerTransform({
  name: 'name/cti/camel-flutter',
  type: 'name',
  transformer: function(token) {
    const cleanedParts = token.path
      .map(part => {
        let cleaned = String(part);
        
        // 1. 앞의 숫자와 점, 공백 제거 (1. TailwindCSS → TailwindCSS)
        cleaned = cleaned.replace(/^[0-9]+[\.\s]+/g, '');
        
        // 2. 슬래시를 공백으로 변경 (TailwindCSS/Default → TailwindCSS Default)
        cleaned = cleaned.replace(/\//g, ' ');
        
        // 3. 콤마를 점으로 변경 (1,5 → 1.5)
        cleaned = cleaned.replace(/,/g, '.');
        
        // 4. 하이픈을 공백으로 변경 (W-12 → W 12)
        cleaned = cleaned.replace(/-/g, ' ');
        
        return cleaned;
      })
      .join(' ');
    
    // 5. 공백으로 분리
    const allWords = cleanedParts.split(/\s+/).filter(w => w.length > 0);
    
    // 6. camelCase 변환 (모든 단어 유지!)
    return allWords.map((word, index) => {
      const lower = word.toLowerCase();
      if (index === 0) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join('');
  }
});

// Flutter 전용 Format
StyleDictionary.registerFormat({
  name: 'custom/flutter-dart',
  formatter: function(dictionary) {
    const tokens = dictionary.allTokens;
    
    const formatValue = (token) => {
      const value = token.value;
      
      if (token.type === 'color' || /^#[0-9A-Fa-f]{6,8}$/.test(value)) {
        const hex = value.replace('#', '').toUpperCase();
        const fullHex = hex.length === 6 ? `FF${hex}` : hex;
        return {
          type: 'Color',
          value: `Color(0x${fullHex})`
        };
      }
      
      if (typeof value === 'string' && value.endsWith('px')) {
        return {
          type: 'double',
          value: value.replace('px', '.0')
        };
      }
      
      if (!isNaN(value) && value !== '') {
        const num = parseFloat(value);
        if (num >= 100 && num <= 900 && num % 100 === 0) {
          return {
            type: 'FontWeight',
            value: `FontWeight.w${num}`
          };
        }
        return {
          type: 'double',
          value: Number.isInteger(num) ? `${num}.0` : `${num}`
        };
      }
      
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
      const formatted = formatValue(token);
      output += `  static const ${formatted.type} ${token.name} = ${formatted.value};\n`;
    });
    
    output += '}\n';
    return output;
  }
});

// Flutter 전용 Transform Group
StyleDictionary.registerTransformGroup({
  name: 'flutter-custom',
  transforms: [
    'name/cti/camel-flutter',
    'color/hex8flutter',
    'size/flutter/remToDouble'
  ]
});

// 설정
module.exports = {
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      options: {
        showFileHeader: false
      },
      files: [{
        destination: 'variables.css',
        format: 'css/variables',
        options: {
          outputReferences: false
        }
      }]
    },
    flutter: {
      transformGroup: 'flutter-custom',
      buildPath: 'build/dart/',
      files: [{
        destination: 'design_tokens.dart',
        format: 'custom/flutter-dart',
        className: 'DesignTokens',
        options: {
          showFileHeader: false,
          outputReferences: false
        }
      }]
    }
  }
};
