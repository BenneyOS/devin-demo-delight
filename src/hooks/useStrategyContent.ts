/**
 * useStrategyContent — manages the editable strategy view fields.
 *
 * Each field has a seeded default (hardcoded). The DB value overrides
 * the default only when non-empty. If the DB row is missing or empty,
 * the seeded default renders — guaranteeing GS12 (never blank).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

// ── Seeded defaults (exact copy from the PRD §1–§2) ──

export const STRATEGY_DEFAULTS: Record<string, string> = {
  narrative:
    'The room has one job. Land a single idea: Devin is the shift from inputs to outcomes — it de-risks technology investment by owning a specific, verified engineering outcome rather than selling seats or tokens.',
  goal:
    'Land one idea — Devin is the shift from inputs to outcomes. It de-risks tech investment by owning a specific, verified outcome instead of selling seats.',
  act1_title: 'Diagnose',
  act1_body:
    'Discovery first. Get them to name the cost of maintenance work on their senior engineers. Listen 70%.',
  act2_title: 'Prove',
  act2_body:
    'A quick Angular upgrade demo — plan, execute, verify, ship a PR. Show the outcome, not the tool.',
  act3_title: 'Walk away',
  act3_body:
    "Don't over-sell. Anchor the $10M guarantee, propose a one-repo pilot, leave on a question.",
  walkaway_1:
    'An agreed pilot scope — one repo, one Angular upgrade, in their VPC.',
  walkaway_2:
    'Agreement on how value is measured — equivalent engineering-hours.',
  walkaway_3:
    'A named next step + owner before leaving the room.',
};

export type StrategyFieldKey = keyof typeof STRATEGY_DEFAULTS;

interface StrategyContentState {
  /** Get the effective value for a field (DB override or seeded default) */
  getField: (key: string) => string;
  /** Set a field value (write to DB, optimistic) */
  setField: (key: string, value: string) => void;
  /** Reset a field to its seeded default (delete DB row) */
  resetField: (key: string) => void;
  /** Reset all fields to seeded defaults */
  resetAll: () => void;
  /** Whether a field has been customized (differs from default) */
  isCustomized: (key: string) => boolean;
  /** Loading state */
  loading: boolean;
}

export function useStrategyContent(): StrategyContentState {
  const [dbValues, setDbValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Fetch all strategy_content rows
  const fetchContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('strategy_content')
        .select('key, value');

      if (error) {
        console.error('Failed to fetch strategy content:', error);
        return;
      }

      const map: Record<string, string> = {};
      for (const row of data || []) {
        if (row.value && row.value.trim()) {
          map[row.key] = row.value;
        }
      }
      setDbValues(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('strategy-content-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'strategy_content' }, () => {
        fetchContent();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchContent]);

  const getField = useCallback((key: string): string => {
    const dbVal = dbValues[key];
    if (dbVal && dbVal.trim()) return dbVal;
    return STRATEGY_DEFAULTS[key] || '';
  }, [dbValues]);

  const setField = useCallback((key: string, value: string) => {
    // Optimistic update
    setDbValues(prev => ({ ...prev, [key]: value }));

    // Debounced write (300ms)
    if (debounceTimers.current[key]) {
      clearTimeout(debounceTimers.current[key]);
    }
    debounceTimers.current[key] = setTimeout(async () => {
      const { error } = await supabase
        .from('strategy_content')
        .upsert({ key, value }, { onConflict: 'key' });

      if (error) {
        console.error(`Failed to save strategy field "${key}":`, error);
        // Rollback
        fetchContent();
      }
    }, 300);
  }, [fetchContent]);

  const resetField = useCallback(async (key: string) => {
    // Optimistic: remove from local state → fallback to default
    setDbValues(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    const { error } = await supabase
      .from('strategy_content')
      .delete()
      .eq('key', key);

    if (error) {
      console.error(`Failed to reset strategy field "${key}":`, error);
      fetchContent();
    }
  }, [fetchContent]);

  const resetAll = useCallback(async () => {
    // Optimistic: clear all
    setDbValues({});

    const keys = Object.keys(STRATEGY_DEFAULTS);
    const { error } = await supabase
      .from('strategy_content')
      .delete()
      .in('key', keys);

    if (error) {
      console.error('Failed to reset all strategy fields:', error);
      fetchContent();
    }
  }, [fetchContent]);

  const isCustomized = useCallback((key: string): boolean => {
    const dbVal = dbValues[key];
    return !!dbVal && dbVal.trim() !== '' && dbVal !== STRATEGY_DEFAULTS[key];
  }, [dbValues]);

  return { getField, setField, resetField, resetAll, isCustomized, loading };
}
