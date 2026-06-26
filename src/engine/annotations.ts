/**
 * Annotations Engine — Private Layer
 *
 * Private notes/annotations keyed by content ID.
 * Stored in a SEPARATE localStorage key from the draft authored layer.
 * NEVER included in any export. This is the privacy boundary.
 */

const ANNOTATIONS_KEY = 'trusted-advisor-os-private-annotations';

export interface Annotation {
  id: string;
  itemId: string;
  text: string;
  createdAt: string;
  pinned: boolean;
}

function loadAnnotations(): Annotation[] {
  try {
    const stored = localStorage.getItem(ANNOTATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveAnnotations(annotations: Annotation[]): void {
  localStorage.setItem(ANNOTATIONS_KEY, JSON.stringify(annotations));
}

export function getAllAnnotations(): Annotation[] {
  return loadAnnotations();
}

export function getAnnotationsForItem(itemId: string): Annotation[] {
  return loadAnnotations().filter(a => a.itemId === itemId);
}

export function addAnnotation(itemId: string, text: string): Annotation {
  const annotations = loadAnnotations();
  const annotation: Annotation = {
    id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    itemId,
    text,
    createdAt: new Date().toISOString(),
    pinned: false,
  };
  annotations.push(annotation);
  saveAnnotations(annotations);
  return annotation;
}

export function deleteAnnotation(annotationId: string): void {
  const annotations = loadAnnotations().filter(a => a.id !== annotationId);
  saveAnnotations(annotations);
}

export function toggleAnnotationPin(annotationId: string): void {
  const annotations = loadAnnotations().map(a =>
    a.id === annotationId ? { ...a, pinned: !a.pinned } : a
  );
  saveAnnotations(annotations);
}

export function getPinnedAnnotations(): Annotation[] {
  return loadAnnotations().filter(a => a.pinned);
}

export function getAnnotationsStorageKey(): string {
  return ANNOTATIONS_KEY;
}
