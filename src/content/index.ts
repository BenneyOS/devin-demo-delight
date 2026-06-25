/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║                     HOW TO ADD A SOURCE                             ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║                                                                      ║
 * ║  1. Open the module file that matches your content (e.g.,            ║
 * ║     thesis.ts, accountIntel.ts, discovery.ts, etc.)                  ║
 * ║                                                                      ║
 * ║  2. Add a new object to the array. Copy this template:              ║
 * ║                                                                      ║
 * ║     {                                                                ║
 * ║       id: "your-unique-kebab-case-id",                              ║
 * ║       module: "thesis",  // must match the file's module            ║
 * ║       type: "fact",      // fact|question|objection|card|source|    ║
 * ║                          //   story-beat                            ║
 * ║       title: "Your Title Here",                                     ║
 * ║       body: "Your content. Markdown is supported.",                 ║
 * ║       persona: ["CTO"],  // CTO|CIO|Security or [] for all         ║
 * ║       tags: ["relevant", "tags"],                                   ║
 * ║       confidence: "verified",  // verified|inferred|claim           ║
 * ║       source: {                                                     ║
 * ║         label: "Source Name",                                       ║
 * ║         url: "https://example.com"                                  ║
 * ║       },  // or null if no source                                   ║
 * ║       dateAdded: "2026-06-25"  // YYYY-MM-DD                        ║
 * ║     }                                                                ║
 * ║                                                                      ║
 * ║  3. Save. The UI renders it automatically — no other changes        ║
 * ║     needed. It will appear in:                                       ║
 * ║     - Its module page (Study + Drill views)                         ║
 * ║     - The Source Library (if source is not null)                     ║
 * ║     - Presenter Mode (if persona array is not empty)                ║
 * ║     - The Dashboard (if type is "question" or "objection")          ║
 * ║                                                                      ║
 * ║  4. The confidence badge appears automatically:                     ║
 * ║     🟢 verified = sourced and confirmed                             ║
 * ║     🟡 inferred = reasoned from evidence                            ║
 * ║     ⚪ claim = stated but unverified                                ║
 * ║                                                                      ║
 * ║  Time to add: ~30 seconds.                                          ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */

import type { ContentItem } from './schema';
import { validateContentItem } from './schema';
import { thesisContent } from './thesis';
import { accountIntelContent } from './accountIntel';
import { repoRationaleContent } from './repoRationale';
import { discoveryContent } from './discovery';
import { devinNarrativeContent } from './devinNarrative';
import { competitiveContent } from './competitive';
import { masteryContent } from './mastery';

// Aggregate all content
const rawContent: ContentItem[] = [
  ...thesisContent,
  ...accountIntelContent,
  ...repoRationaleContent,
  ...discoveryContent,
  ...devinNarrativeContent,
  ...competitiveContent,
  ...masteryContent,
];

// Validate all items at load time (dev console warnings)
rawContent.forEach((item, index) => {
  validateContentItem(item, index);
});

// Check for duplicate IDs
const ids = rawContent.map(item => item.id);
const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
if (duplicates.length > 0) {
  console.warn(`[Content Validator] Duplicate IDs found: ${duplicates.join(', ')}`);
}

export const allContent: ContentItem[] = rawContent;

// Convenience getters
export function getContentByModule(module: string): ContentItem[] {
  return allContent.filter(item => item.module === module);
}

export function getContentByPersona(persona: string): ContentItem[] {
  return allContent.filter(item => item.persona.includes(persona as ContentItem['persona'][number]));
}

export function getContentByType(type: string): ContentItem[] {
  return allContent.filter(item => item.type === type);
}

export function getContentByTag(tag: string): ContentItem[] {
  return allContent.filter(item => item.tags.includes(tag));
}

export function getDrillableItems(): ContentItem[] {
  return allContent.filter(item => 
    item.type === 'question' || item.type === 'objection' || item.type === 'story-beat'
  );
}

export function getSourceItems(): ContentItem[] {
  return allContent.filter(item => item.source !== null);
}

export type { ContentItem, ModuleName, Persona, Confidence } from './schema';
