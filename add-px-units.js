const fs = require('fs');
const path = require('path');

// CSS 파일 경로
const cssFilePath = path.join(__dirname, 'build', 'css', 'variables.css');

// CSS 파일 읽기
let cssContent = fs.readFileSync(cssFilePath, 'utf8');

// 1단계: 변수명에서 숫자 prefix 제거
// --1-tailwind-css-default → --tailwind-css-default
// --2-theme-default → --theme-default
cssContent = cssContent.replace(/--([0-9]+)-/g, '--');

// 2단계: px 단위 추가 (기존 로직)
const keywords = [
  'spacing', 'margin', 'padding', 'gap', 'border', 'radius', 
  'shadow', 'offset', 'blur', 'spread', 'font-size', 
  'breakpoint', 'container', 'viewport', 'width', 'height',
  'min-width', 'max-width', 'min-height', 'max-height'
];

const exceptions = [
  'opacity', 'alpha', 'font-weight', 'z-index', 
  'line-clamp', 'letter-spacing', 'order'
];

const lines = cssContent.split('\n');
let changedCount = 0;

const processedLines = lines.map(line => {
  // CSS 변수 라인인지 확인
  if (!line.includes('--') || !line.includes(':')) {
    return line;
  }

  // 변수명과 값 분리
  const colonIndex = line.indexOf(':');
  const varName = line.substring(0, colonIndex);
  const rest = line.substring(colonIndex);

  // Exception 키워드 체크 (변수명에서)
  const varNameParts = varName.split('-');
  const hasException = exceptions.some(ex => 
    varNameParts.some(part => part === ex)
  );
  
  if (hasException) {
    return line;
  }

  // Keyword 매칭 체크
  const hasKeyword = keywords.some(keyword => 
    varNameParts.some(part => part === keyword)
  );

  if (!hasKeyword) {
    return line;
  }

  // 값 부분에서 단위가 이미 있는지 확인
  const valueHasUnit = /:\s*-?\d+(?:\.\d+)?(px|%|em|rem|vh|vw|pt|cm|mm|in|pc)/.test(rest);
  
  if (valueHasUnit) {
    return line;
  }

  // 숫자 값인지 확인하고 px 추가
  const valueMatch = rest.match(/:\s*(-?\d+(?:\.\d+)?)\s*;/);
  
  if (valueMatch) {
    const newLine = line.replace(
      /:\s*(-?\d+(?:\.\d+)?)\s*;/, 
      `: $1px;`
    );
    
    // 이미 px가 붙어있는지 재확인 (pxpx 방지)
    if (!newLine.includes('pxpx')) {
      changedCount++;
      return newLine;
    }
  }

  return line;
});

// 파일에 다시 쓰기
const finalContent = processedLines.join('\n');
fs.writeFileSync(cssFilePath, finalContent, 'utf8');

console.log(`✅ CSS 처리 완료!`);
console.log(`  - 숫자 prefix 제거됨`);
console.log(`  - px 단위 추가: ${changedCount}개`);
