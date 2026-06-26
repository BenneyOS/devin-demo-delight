/**
 * Annotations hook — Supabase-backed.
 *
 * Reads/writes from the `annotations` table.
 * Caches locally; re-fetches on mount and after writes.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ReflectionNote {
  id: string;
  itemId: string;
  text: string;
  createdAt: string;
  pinned: boolean;
}

interface DbAnnotation {
  id: string;
  content_item_id: string;
  note: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

function dbRowToNote(row: DbAnnotation): ReflectionNote {
  return {
    id: row.id,
    itemId: row.content_item_id,
    text: row.note,
    createdAt: row.created_at,
    pinned: row.pinned,
  };
}

export function useNotes() {
  const [notes, setNotes] = useState<ReflectionNote[]>([]);

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from('annotations')
      .select('*')
      .order('created_at');

    if (error) {
      console.error('Failed to fetch annotations:', error);
      return;
    }

    setNotes((data || []).map((row: DbAnnotation) => dbRowToNote(row)));
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Realtime subscription for annotations
  useEffect(() => {
    const channel = supabase
      .channel('annotations-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'annotations' }, () => {
        fetchNotes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotes]);

  const addNote = useCallback((itemId: string, text: string) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const note: ReflectionNote = {
      id,
      itemId,
      text,
      createdAt: now,
      pinned: false,
    };

    // Optimistic add
    setNotes(prev => [...prev, note]);

    supabase
      .from('annotations')
      .insert({
        id,
        content_item_id: itemId,
        note: text,
        pinned: false,
      })
      .then(({ error }) => {
        if (error) {
          console.error('Failed to add annotation:', error);
          setNotes(prev => prev.filter(n => n.id !== id));
        }
      });

    return note;
  }, []);

  const deleteNote = useCallback((noteId: string) => {
    const prev = notes;
    setNotes(n => n.filter(note => note.id !== noteId));

    supabase
      .from('annotations')
      .delete()
      .eq('id', noteId)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to delete annotation:', error);
          setNotes(prev);
        }
      });
  }, [notes]);

  const togglePin = useCallback((noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const newPinned = !note.pinned;
    setNotes(prev => prev.map(n =>
      n.id === noteId ? { ...n, pinned: newPinned } : n
    ));

    supabase
      .from('annotations')
      .update({ pinned: newPinned })
      .eq('id', noteId)
      .then(({ error }) => {
        if (error) {
          console.error('Failed to toggle pin:', error);
          setNotes(prev => prev.map(n =>
            n.id === noteId ? { ...n, pinned: !newPinned } : n
          ));
        }
      });
  }, [notes]);

  const getNotesForItem = useCallback((itemId: string) => {
    return notes.filter(n => n.itemId === itemId);
  }, [notes]);

  const getPinnedNotes = useCallback(() => {
    return notes.filter(n => n.pinned);
  }, [notes]);

  return { notes, addNote, deleteNote, togglePin, getNotesForItem, getPinnedNotes };
}
