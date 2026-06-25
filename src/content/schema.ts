/**
 * Content Schema — Trusted Advisor OS
 * 
 * Every content item in the system conforms to this schema.
 * The UI is fully data-driven: it renders whatever is in the content files.
 * Adding a fact = adding an object to an array. The layout never changes.
 */

export type ContentType = 'fact' | 'question' | 'objection' | 'card' | 'source' | 'story-beat';
export type Confidence = 'verified' | 'inferred' | 'claim';
export type Persona = 'CTO' | 'CIO' | 'Security';
export type ModuleName = 
  | 'thesis' 
  | 'account-intel' 
  | 'repo-rationale' 
  | 'discovery' 
  | 'devin-narrative' 
  | 'competitive' 
  | 'mastery';

export interface ContentSource {
  label: string;
  url: string;
}

export interface ContentItem {
  id: string;
  module: ModuleName;
  type: ContentType;
  title: string;
  body: string;
  persona: Persona[];
  tags: string[];
  confidence: Confidence;
  source: ContentSource | null;
  dateAdded: string;
}

/**
 * Runtime validator — warns in console on malformed items.
 * Returns true if valid, false if not.
 */
export function validateContentItem(item: unknown, index: number): item is ContentItem {
  const errors: string[] = [];
  const i = item as Record<string, unknown>;

  if (!i || typeof i !== 'object') {
    console.warn(`[Content Validator] Item at index ${index} is not an object`);
    return false;
  }

  if (typeof i.id !== 'string' || !/^[a-z0-9-]+$/.test(i.id)) {
    errors.push(`id must be kebab-case string, got "${i.id}"`);
  }

  const validModules: ModuleName[] = ['thesis', 'account-intel', 'repo-rationale', 'discovery', 'devin-narrative', 'competitive', 'mastery'];
  if (!validModules.includes(i.module as ModuleName)) {
    errors.push(`module must be one of ${validModules.join(', ')}, got "${i.module}"`);
  }

  const validTypes: ContentType[] = ['fact', 'question', 'objection', 'card', 'source', 'story-beat'];
  if (!validTypes.includes(i.type as ContentType)) {
    errors.push(`type must be one of ${validTypes.join(', ')}, got "${i.type}"`);
  }

  if (typeof i.title !== 'string' || i.title.length === 0) {
    errors.push('title must be a non-empty string');
  }

  if (typeof i.body !== 'string') {
    errors.push('body must be a string');
  }

  if (!Array.isArray(i.persona)) {
    errors.push('persona must be an array');
  }

  if (!Array.isArray(i.tags)) {
    errors.push('tags must be an array');
  }

  const validConfidence: Confidence[] = ['verified', 'inferred', 'claim'];
  if (!validConfidence.includes(i.confidence as Confidence)) {
    errors.push(`confidence must be one of ${validConfidence.join(', ')}, got "${i.confidence}"`);
  }

  if (i.source !== null && typeof i.source === 'object') {
    const s = i.source as Record<string, unknown>;
    if (typeof s.label !== 'string' || typeof s.url !== 'string') {
      errors.push('source must have label and url strings');
    }
  } else if (i.source !== null) {
    errors.push('source must be an object with {label, url} or null');
  }

  if (typeof i.dateAdded !== 'string') {
    errors.push('dateAdded must be a string');
  }

  if (errors.length > 0) {
    console.warn(`[Content Validator] Item "${i.id || `index ${index}`}" has errors:\n  - ${errors.join('\n  - ')}`);
    return false;
  }

  return true;
}
