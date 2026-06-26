/**
 * SM-2 Spaced Repetition Scheduler
 *
 * Stores review state in Supabase study_state table.
 * Uses an in-memory cache for synchronous access;
 * writes propagate to Supabase asynchronously.
 */

import { supabase } from '../lib/supabase';

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewState {
  itemId: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string;
  history: ReviewEntry[];
}

export interface ReviewEntry {
  date: string;
  rating: Rating;
  interval: number;
}

// In-memory cache — populated from Supabase on init
let stateCache: Record<string, ReviewState> = {};
let initialized = false;

function ratingToQuality(rating: Rating): number {
  switch (rating) {
    case 'again': return 0;
    case 'hard': return 3;
    case 'good': return 4;
    case 'easy': return 5;
  }
}

export function calculateNextReview(state: ReviewState, rating: Rating): ReviewState {
  const quality = ratingToQuality(rating);
  const now = new Date().toISOString().split('T')[0];

  let { easeFactor, interval, repetitions } = state;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + interval);
  const nextReview = nextDate.toISOString().split('T')[0];

  return {
    ...state,
    easeFactor,
    interval,
    repetitions,
    nextReview,
    lastReview: now,
    history: [...state.history, { date: now, rating, interval }]
  };
}

export function createInitialState(itemId: string): ReviewState {
  const today = new Date().toISOString().split('T')[0];
  return {
    itemId,
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: today,
    lastReview: '',
    history: []
  };
}

interface DbStudyState {
  content_item_id: string;
  ease_factor: number;
  interval: number;
  reps: number;
  next_review_at: string | null;
  last_reviewed_at: string | null;
  history: ReviewEntry[] | null;
}

function dbRowToReviewState(row: DbStudyState): ReviewState {
  return {
    itemId: row.content_item_id,
    easeFactor: row.ease_factor,
    interval: row.interval,
    repetitions: row.reps,
    nextReview: row.next_review_at?.split('T')[0] || new Date().toISOString().split('T')[0],
    lastReview: row.last_reviewed_at?.split('T')[0] || '',
    history: (row.history as ReviewEntry[]) || [],
  };
}

export async function initStudyState(): Promise<void> {
  const { data, error } = await supabase
    .from('study_state')
    .select('*');

  if (error) {
    console.error('Failed to load study state from Supabase:', error);
    return;
  }

  const cache: Record<string, ReviewState> = {};
  for (const row of (data || []) as DbStudyState[]) {
    cache[row.content_item_id] = dbRowToReviewState(row);
  }
  stateCache = cache;
  initialized = true;
}

export function isStudyStateInitialized(): boolean {
  return initialized;
}

export function getAllReviewStates(): Record<string, ReviewState> {
  return stateCache;
}

export function getReviewState(itemId: string): ReviewState {
  return stateCache[itemId] || createInitialState(itemId);
}

export function saveReviewState(state: ReviewState): void {
  // Update cache synchronously
  stateCache[state.itemId] = state;

  // Write to Supabase asynchronously
  const row = {
    content_item_id: state.itemId,
    ease_factor: state.easeFactor,
    interval: state.interval,
    reps: state.repetitions,
    next_review_at: state.nextReview,
    last_reviewed_at: state.lastReview || null,
    history: state.history,
  };

  supabase
    .from('study_state')
    .upsert(row, { onConflict: 'content_item_id' })
    .then(({ error }) => {
      if (error) {
        console.error('Failed to save study state:', error);
      }
    });
}

export function getDueItems(itemIds: string[]): string[] {
  const today = new Date().toISOString().split('T')[0];

  return itemIds.filter(id => {
    const state = stateCache[id];
    if (!state) return true;
    return state.nextReview <= today;
  });
}

export function getWeakestItems(itemIds: string[], count: number = 5): string[] {
  return [...itemIds]
    .map(id => ({ id, state: stateCache[id] || createInitialState(id) }))
    .sort((a, b) => {
      if (a.state.easeFactor !== b.state.easeFactor) {
        return a.state.easeFactor - b.state.easeFactor;
      }
      return a.state.interval - b.state.interval;
    })
    .slice(0, count)
    .map(item => item.id);
}

export function getConfidenceLevel(itemId: string): 'new' | 'weak' | 'learning' | 'strong' {
  const state = getReviewState(itemId);
  if (state.history.length === 0) return 'new';
  if (state.easeFactor < 1.8 || state.interval < 3) return 'weak';
  if (state.interval < 14) return 'learning';
  return 'strong';
}
