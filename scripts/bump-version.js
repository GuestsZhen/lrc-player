#!/usr/bin/env node

/**
 * 版本管理脚本
 * 用法:
 *   node scripts/bump-version.js [major|minor|patch]
 *   默认: patch
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 读取 package.json
const packageJsonPath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

// 获取当前版本
const currentVersion = packageJson.version;
console.log(`当前版本: ${currentVersion}`);

// 解析版本号
const [major, minor, patch] = currentVersion.split('.').map(Number);

// 确定要递增的部分
const bumpType = process.argv[2] || 'patch';

let newMajor = major;
let newMinor = minor;
let newPatch = patch;

switch (bumpType) {
    case 'major':
        newMajor += 1;
        newMinor = 0;
        newPatch = 0;
        break;
    case 'minor':
        newMinor += 1;
        newPatch = 0;
        break;
    case 'patch':
    default:
        newPatch += 1;
        break;
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;
console.log(`新版本: ${newVersion}`);

// 更新 package.json
packageJson.version = newVersion;
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 4) + '\n', 'utf-8');

console.log('✅ package.json 已更新');

// 生成更新日志条目
const now = new Date();
const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

console.log('\n📝 更新信息:');
console.log(`   版本: ${newVersion}`);
console.log(`   时间: ${dateStr} ${timeStr}`);
console.log(`   时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);

console.log('\n💡 提示:');
console.log('   1. 请在 CHANGELOG.md 中记录本次更新内容');
console.log('   2. 测试完成后使用以下命令提交:');
console.log(`      git add .`);
console.log(`      git commit -m "chore: bump version to ${newVersion}"`);
console.log(`      git push origin main`);
