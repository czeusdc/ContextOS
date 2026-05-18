import fs from 'fs';
const executePath = 'src/lib/runtime/executeWorkflow.ts';
let executeContent = fs.readFileSync(executePath, 'utf8');
executeContent = executeContent.replace(/Date\.now\(\)\.toString\(\)\s*\+\s*Math\.random\(\)/g, 'crypto.randomUUID()');
executeContent = executeContent.replace(/Date\.now\(\)\.toString\(\)/g, 'crypto.randomUUID()');
fs.writeFileSync(executePath, executeContent);

const analysisPath = 'src/pages/Analysis.tsx';
let analysisContent = fs.readFileSync(analysisPath, 'utf8');
analysisContent = analysisContent.replace(/Date\.now\(\)\.toString\(\)\s*\+\s*Math\.random\(\)/g, 'crypto.randomUUID()');
analysisContent = analysisContent.replace(/Date\.now\(\)\.toString\(\)/g, 'crypto.randomUUID()');
fs.writeFileSync(analysisPath, analysisContent);
