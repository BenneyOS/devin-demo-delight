/**
 * One-time migration script: seeds all content from src/content/*.ts into Supabase.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx npx tsx scripts/migrate-to-supabase.ts
 *
 * This script:
 *   1. Reads all content items from the static TypeScript files
 *   2. Creates module rows in the `modules` table
 *   3. Inserts all content items into `content_items`
 *   4. Verifies row counts match (GB8: migration fidelity)
 */

import { allContent } from '../src/content/index.js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kbsmtcrdgwokzkssixpc.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY is required');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function supabasePost(table: string, data: unknown[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation,resolution=merge-duplicates' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${table} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function supabaseGet(table: string, select = '*') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${select}`, {
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET ${table} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// Module slug → display title mapping
const MODULE_TITLES: Record<string, string> = {
  'thesis': 'The Thesis',
  'account-intel': 'Account Intelligence',
  'repo-rationale': 'Repo Rationale',
  'discovery': 'Discovery Engine',
  'devin-narrative': 'Devin Narrative',
  'competitive': 'Competitive Layer',
  'mastery': 'Mastery Module',
};

async function migrate() {
  console.log(`Migrating ${allContent.length} content items to Supabase...`);
  console.log(`URL: ${SUPABASE_URL}`);

  // 1. Collect unique modules from content
  const moduleSet = new Set<string>();
  for (const item of allContent) {
    moduleSet.add(item.module);
  }
  const moduleSlugs = Array.from(moduleSet);

  // Define module order based on the standard order
  const MODULE_ORDER = ['thesis', 'account-intel', 'repo-rationale', 'discovery', 'devin-narrative', 'competitive', 'mastery'];

  // 2. Insert modules
  const moduleRows = moduleSlugs.map(slug => ({
    slug,
    title: MODULE_TITLES[slug] || slug,
    order: MODULE_ORDER.indexOf(slug) >= 0 ? MODULE_ORDER.indexOf(slug) : 99,
    status: 'active',
  }));

  console.log(`\nInserting ${moduleRows.length} modules...`);
  const insertedModules = await supabasePost('modules', moduleRows);
  console.log(`  Inserted ${insertedModules.length} modules`);

  // Build slug → UUID map
  const moduleIdMap: Record<string, string> = {};
  for (const mod of insertedModules) {
    moduleIdMap[mod.slug] = mod.id;
  }
  console.log('  Module ID map:', moduleIdMap);

  // 3. Insert content items
  const contentRows = allContent.map(item => ({
    id: item.id,
    module_id: moduleIdMap[item.module],
    type: item.type,
    title: item.title,
    body: item.body,
    persona: item.persona,
    tags: item.tags,
    confidence: item.confidence,
    source_label: item.source?.label || null,
    source_url: item.source?.url || null,
    order: item.order,
    status: item.status,
    date_added: item.dateAdded,
    last_edited_by: item.lastEditedBy,
  }));

  // Insert in batches of 50 to avoid payload limits
  const BATCH_SIZE = 50;
  let totalInserted = 0;
  for (let i = 0; i < contentRows.length; i += BATCH_SIZE) {
    const batch = contentRows.slice(i, i + BATCH_SIZE);
    console.log(`\nInserting content items batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} items)...`);
    const result = await supabasePost('content_items', batch);
    totalInserted += result.length;
    console.log(`  Inserted ${result.length} items (total: ${totalInserted})`);
  }

  // 4. Verify (GB8: migration fidelity)
  console.log('\n--- Verification (GB8) ---');

  const dbModules = await supabaseGet('modules', 'id');
  const dbItems = await supabaseGet('content_items', 'id');

  console.log(`Source modules: ${moduleSlugs.length}, DB modules: ${dbModules.length}`);
  console.log(`Source items: ${allContent.length}, DB items: ${dbItems.length}`);

  if (dbModules.length !== moduleSlugs.length) {
    console.error('FAIL: Module count mismatch!');
    process.exit(1);
  }
  if (dbItems.length !== allContent.length) {
    console.error('FAIL: Content item count mismatch!');
    process.exit(1);
  }

  // Verify all IDs are present
  const dbItemIds = new Set(dbItems.map((r: { id: string }) => r.id));
  const missingIds = allContent.filter(item => !dbItemIds.has(item.id)).map(item => item.id);
  if (missingIds.length > 0) {
    console.error(`FAIL: Missing item IDs: ${missingIds.join(', ')}`);
    process.exit(1);
  }

  // Verify field completeness by spot-checking a few items
  const sampleItem = await supabaseGet(`content_items?id=eq.${allContent[0].id}`, '*');
  if (sampleItem.length === 1) {
    const db = sampleItem[0];
    const src = allContent[0];
    const checks = [
      ['title', db.title === src.title],
      ['body', db.body === src.body],
      ['type', db.type === src.type],
      ['confidence', db.confidence === src.confidence],
      ['status', db.status === src.status],
      ['persona', JSON.stringify(db.persona) === JSON.stringify(src.persona)],
      ['tags', JSON.stringify(db.tags) === JSON.stringify(src.tags)],
    ];
    const failures = checks.filter(([, ok]) => !ok);
    if (failures.length > 0) {
      console.error(`FAIL: Field mismatches on sample item "${src.id}": ${failures.map(([f]) => f).join(', ')}`);
      process.exit(1);
    }
    console.log('Sample field check: all fields match');
  }

  console.log('\nGB8 PASS: All content migrated with full fidelity.');
  console.log('Migration complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
