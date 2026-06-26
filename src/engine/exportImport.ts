/**
 * Export/Import Engine
 *
 * Export: serializes the authored layer ONLY. Zero annotation data.
 * Import: validates against schema and loads into draft.
 *
 * The privacy boundary is enforced here: export reads from the draft engine
 * (which only knows about authored content) and never touches annotations.
 */

import type { ContentItem } from '../content/schema';
import { validateContentItem } from '../content/schema';
import { getEffectiveContent, getEffectiveModules } from './draft';

export interface ExportPayload {
  version: 1;
  exportedAt: string;
  modules: string[];
  items: ContentItem[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  warnings: string[];
  errors: string[];
}

/**
 * Export authored content as JSON.
 * CRITICAL: This exports ONLY authored content. Zero annotations.
 */
export function exportAuthoredContent(): ExportPayload {
  const items = getEffectiveContent();
  const modules = getEffectiveModules();

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    modules,
    items,
  };
}

/** Export as a downloadable JSON blob */
export function downloadExport(): void {
  const payload = exportAuthoredContent();
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'content.export.json';
  a.click();
  URL.revokeObjectURL(url);
}

/** Validate and parse an import file */
export function validateImport(jsonString: string): ImportResult {
  const warnings: string[] = [];
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return { success: false, imported: 0, warnings: [], errors: ['Invalid JSON'] };
  }

  const payload = parsed as Record<string, unknown>;
  if (!payload || typeof payload !== 'object') {
    return { success: false, imported: 0, warnings: [], errors: ['Root must be an object'] };
  }

  if (payload.version !== 1) {
    warnings.push(`Unknown version: ${payload.version}. Attempting import anyway.`);
  }

  if (!Array.isArray(payload.items)) {
    return { success: false, imported: 0, warnings, errors: ['Missing or invalid "items" array'] };
  }

  const items = payload.items as unknown[];
  let validCount = 0;

  for (let i = 0; i < items.length; i++) {
    if (validateContentItem(items[i], i)) {
      validCount++;
    } else {
      warnings.push(`Item at index ${i} has validation issues (see console)`);
    }
  }

  if (validCount === 0 && items.length > 0) {
    errors.push('No valid items found in import');
  }

  return {
    success: errors.length === 0,
    imported: validCount,
    warnings,
    errors,
  };
}

/** Parse import and return items */
export function parseImportItems(jsonString: string): ContentItem[] {
  const parsed = JSON.parse(jsonString) as { items: ContentItem[] };
  return parsed.items.filter((item, i) => validateContentItem(item, i));
}

/**
 * Generate content files format for copy-paste into src/content/.
 * Groups items by module and formats as TypeScript arrays.
 */
export function generateContentFilesOutput(): string {
  const items = getEffectiveContent();
  const modules = getEffectiveModules();
  const output: string[] = [];

  for (const moduleName of modules) {
    const moduleItems = items
      .filter(i => i.module === moduleName && i.status === 'active')
      .sort((a, b) => a.order - b.order);

    if (moduleItems.length === 0) continue;

    const varName = moduleName.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + 'Content';
    output.push(`// --- ${moduleName} ---`);
    output.push(`import type { ContentItem } from './schema';`);
    output.push('');
    output.push(`export const ${varName}: ContentItem[] = [`);

    for (const item of moduleItems) {
      output.push('  {');
      output.push(`    id: ${JSON.stringify(item.id)},`);
      output.push(`    module: ${JSON.stringify(item.module)},`);
      output.push(`    type: ${JSON.stringify(item.type)},`);
      output.push(`    title: ${JSON.stringify(item.title)},`);
      output.push(`    body: ${JSON.stringify(item.body)},`);
      output.push(`    persona: ${JSON.stringify(item.persona)},`);
      output.push(`    tags: ${JSON.stringify(item.tags)},`);
      output.push(`    confidence: ${JSON.stringify(item.confidence)},`);
      output.push(`    source: ${JSON.stringify(item.source)},`);
      output.push(`    dateAdded: ${JSON.stringify(item.dateAdded)},`);
      output.push(`    order: ${item.order},`);
      output.push(`    status: ${JSON.stringify(item.status)},`);
      output.push(`    lastEditedBy: ${JSON.stringify(item.lastEditedBy)},`);
      output.push(`    lastEditedAt: ${JSON.stringify(item.lastEditedAt)}`);
      output.push('  },');
    }

    output.push('];');
    output.push('');
  }

  return output.join('\n');
}
