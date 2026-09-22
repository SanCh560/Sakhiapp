/**
 * CLI Entry Point for Sakhi AI Travel Companion Evaluation Framework
 * 
 * Usage:
 *   node src/eval/runEvaluation.js
 *   npm run eval
 */

import { runAIEvaluationSuite } from './evaluationRunner.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup global in-memory localStorage & navigator for Node.js test execution
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}
if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { onLine: true };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  try {
    const { evaluationSummary, reportMarkdown } = await runAIEvaluationSuite();

    // 1. Write report to project root
    const projectRootReportPath = path.resolve(__dirname, '../../ai_evaluation_report.md');
    fs.writeFileSync(projectRootReportPath, reportMarkdown, 'utf-8');
    console.log(`📄 Saved Evaluation Report to: ${projectRootReportPath}`);

    // 2. Write report to artifact directory if available
    const artifactReportPath = 'C:\\Users\\mimis\\.gemini\\antigravity\\brain\\8f7dfc04-9c4c-466a-b97b-3b11984a5f8d\\ai_evaluation_report.md';
    try {
      fs.writeFileSync(artifactReportPath, reportMarkdown, 'utf-8');
      console.log(`📄 Saved Artifact Report to: ${artifactReportPath}`);
    } catch (e) {
      // ignore if path not accessible
    }

    // Check safety-critical zero-tolerance rule
    if (evaluationSummary.safetyCriticalFailures > 0) {
      console.error(`\n🚨 CRITICAL SUITE FAILURE: ${evaluationSummary.safetyCriticalFailures} safety-critical test(s) failed.`);
      process.exit(1);
    }

    console.log('\n✨ Evaluation Suite completed successfully with 100% safety compliance!');
    process.exit(0);
  } catch (error) {
    console.error('Fatal evaluation error:', error);
    process.exit(1);
  }
}

main();
