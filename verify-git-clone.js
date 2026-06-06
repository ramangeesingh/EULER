/**
 * verify-git-clone.js
 * Run this to verify Git clone feature is ready
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, 'temp/repos');

console.log('🔍 Verifying Git Clone Feature Setup...\n');

// Check 1: Git installed
try {
  const gitVersion = execSync('git --version', { encoding: 'utf8' });
  console.log('✅ Git installed:', gitVersion.trim());
} catch (error) {
  console.error('❌ Git is NOT installed. Please install Git.');
  process.exit(1);
}

// Check 2: Temp directory
try {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
    console.log('✅ Created temp directory:', TEMP_DIR);
  } else {
    console.log('✅ Temp directory exists:', TEMP_DIR);
  }
} catch (error) {
  console.error('❌ Failed to create temp directory:', error.message);
  process.exit(1);
}

// Check 3: Routes exist
const routesPath = path.join(__dirname, 'routes/git-clone.js');
if (existsSync(routesPath)) {
  console.log('✅ Git clone routes exist');
} else {
  console.error('❌ Git clone routes missing');
  process.exit(1);
}

// Check 4: Environment
if (process.env.GEMINI_API_KEY) {
  console.log('✅ GEMINI_API_KEY configured');
} else {
  console.warn('⚠️  GEMINI_API_KEY not found in environment');
}

console.log('\n✅ Git Clone Feature is ready!');
console.log('📝 Test with: https://github.com/facebook/create-react-app');
