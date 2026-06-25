/**
 * SM-2 Spaced Repetition Scheduler
 * 
 * Lightweight implementation of the SuperMemo SM-2 algorithm.
 * Stores review state in localStorage.
 */

export type Rating = 'again' | 'hard' | 'good' | 'easy';

export interface ReviewState {
  itemId: string;
  easeFactor: number;     // starts at 2.5
  interval: number;       // days until next review
  repetitions: number;    // consecutive correct reviews
  nextReview: string;     // ISO date string
  lastReview: string;     // ISO date string
  history: ReviewEntry[];
}

export interface ReviewEntry {
  date: string;
  rating: Rating;
  interval: number;
}

const STORAGE_KEY = 'trusted-advisor-os-sm2';

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
    // Failed — reset
    repetitions = 0;
    interval = 1;
  } else {
    // Passed
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (never below 1.3)
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

export function getAllReviewStates(): Record<string, ReviewState> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function getReviewState(itemId: string): ReviewState {
  const states = getAllReviewStates();
  return states[itemId] || createInitialState(itemId);
}

export function saveReviewState(state: ReviewState): void {
  const states = getAllReviewStates();
  states[state.itemId] = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
}

export function getDueItems(itemIds: string[]): string[] {
  const today = new Date().toISOString().split('T')[0];
  const states = getAllReviewStates();
  
  return itemIds.filter(id => {
    const state = states[id];
    if (!state) return true; // Never reviewed = due
    return state.nextReview <= today;
  });
}

export function getWeakestItems(itemIds: string[], count: number = 5): string[] {
  const states = getAllReviewStates();
  
  return [...itemIds]
    .map(id => ({ id, state: states[id] || createInitialState(id) }))
    .sort((a, b) => {
      // Sort by ease factor (lowest = weakest), then by interval (shortest = weakest)
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
