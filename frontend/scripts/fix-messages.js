#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const localesDir = './src/locales';

function convertToESModule(filePath) {
  try {
    let content = readFileSync(filePath, 'utf8');
    
    if (content.includes('module.exports={messages:')) {
      content = content.replace('module.exports={messages:', 'export const messages=');
      writeFileSync(filePath, content);
      console.log(`✅ Converted ${filePath} to ES module`);
    }
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
  }
}

function processLocaleDir(dir) {
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      processLocaleDir(fullPath);
    } else if (item === 'messages.js') {
      convertToESModule(fullPath);
    }
  }
}

console.log('🔄 Converting Lingui compiled messages to ES modules...');
processLocaleDir(localesDir);
console.log('✨ Conversion complete!');