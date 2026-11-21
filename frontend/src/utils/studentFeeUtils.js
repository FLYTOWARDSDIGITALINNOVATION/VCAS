export function normalizeBatch(batch) {
  if (batch === null || batch === undefined) return '';
  let value = String(batch).trim().replace(/\s*[–—]\s*/g, '-').replace(/\s+/g, '');
  if (/^\d{4}-\d{4}$/.test(value)) return value;
  // Handle 2-digit years e.g. 26-29 -> 2026-2029
  if (/^\d{2}-\d{2}$/.test(value)) {
    const [p1, p2] = value.split('-');
    return `20${p1}-20${p2}`;
  }
  return value || '';
}

export function getStudentBatch(student = {}) {
  if (!student) return '';

  // 1. Direct batch if present
  const direct = normalizeBatch(student.batch);
  if (direct) return direct;

  // 2. From course duration / batch years
  let from = student.courseDurationFrom || student.batchStartYear;
  let to = student.courseDurationTo;
  const duration = Number(student.courseDurationYears) || 3;

  if (from) {
    from = String(from).trim();
    if (from.length === 2) from = `20${from}`;
  }
  if (to) {
    to = String(to).trim();
    if (to.length === 2) to = `20${to}`;
  }

  if (from && to) {
    const calculated = normalizeBatch(`${from}-${to}`);
    if (calculated) return calculated;
  }

  if (from && duration > 0) {
    const calculated = normalizeBatch(`${from}-${Number(from) + duration}`);
    if (calculated) return calculated;
  }

  // 3. Fallback to academic year if present
  const academicYear = normalizeBatch(student.academicYear);
  if (academicYear) return academicYear;

  return '';
}

