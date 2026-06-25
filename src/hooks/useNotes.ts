import { useLocalStorage } from './useLocalStorage';

export interface ReflectionNote {
  id: string;
  itemId: string;
  text: string;
  createdAt: string;
  pinned: boolean;
}

const NOTES_KEY = 'trusted-advisor-os-notes';

export function useNotes() {
  const [notes, setNotes] = useLocalStorage<ReflectionNote[]>(NOTES_KEY, []);

  const addNote = (itemId: string, text: string) => {
    const note: ReflectionNote = {
      id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      itemId,
      text,
      createdAt: new Date().toISOString(),
      pinned: false
    };
    setNotes(prev => [...prev, note]);
    return note;
  };

  const deleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(n => n.id !== noteId));
  };

  const togglePin = (noteId: string) => {
    setNotes(prev => prev.map(n => 
      n.id === noteId ? { ...n, pinned: !n.pinned } : n
    ));
  };

  const getNotesForItem = (itemId: string) => {
    return notes.filter(n => n.itemId === itemId);
  };

  const getPinnedNotes = () => {
    return notes.filter(n => n.pinned);
  };

  return { notes, addNote, deleteNote, togglePin, getNotesForItem, getPinnedNotes };
}
