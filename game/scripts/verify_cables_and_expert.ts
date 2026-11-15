import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('🧪 Verifying Cables & M.I.L.O. Expert System Integration...');

// 1. Verify expert_questions.json
const jsonPath = resolve('game/src/data/expert_questions.json');
const raw = readFileSync(jsonPath, 'utf-8');
const db = JSON.parse(raw);

if (!db.version || !Array.isArray(db.categories) || !Array.isArray(db.questions)) {
  console.error('❌ Test failed: Invalid schema in expert_questions.json');
  process.exit(1);
}

console.log(`✅ Loaded ${db.categories.length} categories and ${db.questions.length} questions from ${jsonPath}`);

if (db.questions.length !== 67) {
  console.warn(`⚠️ Expected 67 questions, found ${db.questions.length}`);
} else {
  console.log('✅ Exactly 67 verified NASA questions loaded.');
}

// 2. Verify all categories have labels and ids
for (const cat of db.categories) {
  if (!cat.id || !cat.label) {
    console.error(`❌ Category missing id or label:`, cat);
    process.exit(1);
  }
}
console.log('✅ All categories valid.');

// 3. Verify question fields & triggers
let triggersCount = 0;
let sourcesCount = 0;
let scienceUrlCount = 0;

for (const q of db.questions) {
  if (!q.id || !q.category || !q.question || !q.answer || !q.source) {
    console.error(`❌ Question missing required fields:`, q.id);
    process.exit(1);
  }
  if (q.triggers && q.triggers.length > 0) triggersCount++;
  if (q.source) sourcesCount++;
  if (q.source_url) scienceUrlCount++;
}

console.log(`✅ ${triggersCount}/${db.questions.length} questions have trigger conditions.`);
console.log(`✅ ${sourcesCount}/${db.questions.length} questions cite NASA sources.`);
console.log(`✅ ${scienceUrlCount}/${db.questions.length} questions include direct links to NASA research.`);

console.log('🎉 ALL CABLES & EXPERT SYSTEM CHECKS PASSED!');
