import { useEffect, useState } from 'react';
import { API_BASE } from '../apiConfig';
import { getStudentBatch, normalizeBatch } from './studentFeeUtils';

/**
 * Normalizes a single batch value (e.g. "2022–2026" -> "2022-2026").
 * Returns an empty string for placeholders such as "All Batches".
 */
export const sanitizeBatch = (value) => {
  const raw = normalizeBatch(value);
  if (!raw) return '';
  if (raw.toLowerCase().includes('batch')) return '';
  return raw;
};

/**
 * Extracts the unique batch list from a list of student documents.
 */
export const collectBatches = (students = []) => {
  const set = new Set();
  (Array.isArray(students) ? students : []).forEach(student => {
    if (!student) return;
    const batch =
      sanitizeBatch(student.batch) ||
      sanitizeBatch(getStudentBatch(student)) ||
      sanitizeBatch(student.academicYear);
    if (batch) set.add(batch);
  });
  return Array.from(set);
};

/**
 * Merges any number of batch lists / single values into one sorted list
 * (newest batch first), removing blanks and duplicates.
 */
export const mergeBatches = (...lists) => {
  const set = new Set();
  lists.forEach(list => {
    if (!list) return;
    (Array.isArray(list) ? list : [list]).forEach(value => {
      const batch = sanitizeBatch(value);
      if (batch) set.add(batch);
    });
  });
  return Array.from(set).sort().reverse();
};

// Module-level cache so every section shares one request.
let cachedBatches = [];
let cachedPromise = null;

export const fetchStudentBatches = (force = false) => {
  if (!force && cachedPromise) return cachedPromise;
  cachedPromise = fetch(`${API_BASE}/students`)
    .then(response => response.json())
    .then(json => {
      const data = Array.isArray(json?.data) ? json.data : (Array.isArray(json) ? json : []);
      cachedBatches = collectBatches(data);
      return cachedBatches;
    })
    .catch(() => cachedBatches);
  return cachedPromise;
};

/**
 * React hook returning the batch list fetched from the Students section,
 * exactly like the fee modules do.
 */
export function useStudentBatches() {
  const [batches, setBatches] = useState(() => cachedBatches);

  useEffect(() => {
    let active = true;
    fetchStudentBatches().then(list => {
      if (active) setBatches(list);
    });
    return () => {
      active = false;
    };
  }, []);

  return batches;
}

export default useStudentBatches;
