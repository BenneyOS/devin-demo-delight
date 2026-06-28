/**
 * Interviewers hook — Supabase-backed.
 *
 * CRUD for the `interviewers` table: add, edit inline, delete (with confirm),
 * reorder. Optimistic UI with rollback on failure.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface Interviewer {
  id: string;
  name: string;
  role: string;
  background: string;
  will_probe: string;
  my_angle: string;
  likely_questions: string;
  my_hook: string;
  order: number;
  status: string;
}

interface DbInterviewer {
  id: string;
  name: string;
  role: string;
  background: string;
  will_probe: string;
  my_angle: string;
  likely_questions: string;
  my_hook: string;
  order: number;
  status: string;
  created_at: string;
  updated_at: string;
}

function showErrorToast(msg: string) {
  const existing = document.getElementById('interviewer-error-toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.id = 'interviewer-error-toast';
  el.textContent = msg;
  Object.assign(el.style, {
    position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px',
    background: '#ef4444', color: '#fff', borderRadius: '8px', fontSize: '14px',
    fontWeight: '500', zIndex: '99999', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    maxWidth: '400px',
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 5000);
}

export function useInterviewers() {
  const [interviewers, setInterviewers] = useState<Interviewer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInterviewers = useCallback(async () => {
    const { data, error } = await supabase
      .from('interviewers')
      .select('*')
      .eq('status', 'active')
      .order('order');

    if (error) {
      console.error('Failed to fetch interviewers:', error);
      return;
    }

    setInterviewers((data || []).map((row: DbInterviewer) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      background: row.background,
      will_probe: row.will_probe,
      my_angle: row.my_angle,
      likely_questions: row.likely_questions,
      my_hook: row.my_hook,
      order: row.order,
      status: row.status,
    })));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInterviewers();
  }, [fetchInterviewers]);

  useEffect(() => {
    const channel = supabase
      .channel('interviewers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interviewers' }, () => {
        fetchInterviewers();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchInterviewers]);

  const addInterviewer = useCallback((name: string) => {
    const id = crypto.randomUUID();
    const maxOrder = interviewers.length > 0
      ? Math.max(...interviewers.map(i => i.order))
      : -1;

    const newInterviewer: Interviewer = {
      id, name, role: '', background: '', will_probe: '', my_angle: '',
      likely_questions: '', my_hook: '', order: maxOrder + 1, status: 'active',
    };

    setInterviewers(prev => [...prev, newInterviewer]);

    supabase.from('interviewers').insert({
      id, name, order: maxOrder + 1,
    }).then(({ error }) => {
      if (error) {
        console.error('Failed to add interviewer:', error);
        setInterviewers(prev => prev.filter(i => i.id !== id));
        showErrorToast('Failed to add interviewer.');
      }
    });

    return newInterviewer;
  }, [interviewers]);

  const updateInterviewer = useCallback((id: string, fields: Partial<Omit<Interviewer, 'id' | 'order' | 'status'>>) => {
    const prev = [...interviewers];
    setInterviewers(items => items.map(i =>
      i.id === id ? { ...i, ...fields } : i
    ));

    supabase.from('interviewers').update(fields).eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to update interviewer:', error);
          setInterviewers(prev);
          showErrorToast('Failed to update interviewer.');
        }
      });
  }, [interviewers]);

  const deleteInterviewer = useCallback((id: string) => {
    const prev = [...interviewers];
    setInterviewers(items => items.filter(i => i.id !== id));

    supabase.from('interviewers').delete().eq('id', id)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to delete interviewer:', error);
          setInterviewers(prev);
          showErrorToast('Failed to delete interviewer.');
        }
      });
  }, [interviewers]);

  const reorderInterviewers = useCallback((orderedIds: string[]) => {
    const prev = [...interviewers];

    setInterviewers(items => {
      const updated = [...items];
      for (let i = 0; i < orderedIds.length; i++) {
        const idx = updated.findIndex(item => item.id === orderedIds[i]);
        if (idx >= 0) {
          updated[idx] = { ...updated[idx], order: i };
        }
      }
      return updated.sort((a, b) => a.order - b.order);
    });

    const updates = orderedIds.map((id, i) =>
      supabase.from('interviewers').update({ order: i }).eq('id', id)
    );

    Promise.all(updates).then(results => {
      const failed = results.find(r => r.error);
      if (failed) {
        setInterviewers(prev);
        showErrorToast('Failed to reorder interviewers.');
        fetchInterviewers();
      }
    });
  }, [interviewers, fetchInterviewers]);

  return {
    interviewers, loading,
    addInterviewer, updateInterviewer, deleteInterviewer, reorderInterviewers,
  };
}
