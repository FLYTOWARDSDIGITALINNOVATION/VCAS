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

// ── Fee section helpers ─────────────────────────────────────────────
// Fee payments can be stored either on a section (feeBreakdown.tuition.paid)
// or only on the record itself (paidFee). Older/edited records sometimes have
// an unallocated paidFee while the section paid stays 0, which made the
// per-section fee tabs show ₹0 even though collections showed the payment.
export const FEE_SECTION_KEYS = ['tuition', 'exam', 'transport', 'misc'];

const toAmount = (value) => {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
};

export function getFeeSectionKeyFromType(feeType = '') {
  const type = String(feeType || '').toLowerCase();
  if (!type.trim()) return '';
  if (type.includes('exam')) return 'exam';
  if (type.includes('transport')) return 'transport';
  if (type.includes('misc')) return 'misc';
  if (type.includes('tuition') || type.includes('semester') || type.includes('course fee') || type.includes('base')) return 'tuition';
  return '';
}

// Returns the section that should receive a record-level payment that was never
// stored against a fee head. Explicit fee type wins; otherwise the only section
// with an assessed total; otherwise tuition (legacy default).
export function getUnallocatedPaymentSection(record = {}) {
  const breakdown = record.feeBreakdown || {};
  const allocatedPaid = FEE_SECTION_KEYS.reduce(
    (sum, key) => sum + toAmount(breakdown[key]?.paid),
    0
  );
  const overallPaid = toAmount(record.paidFee ?? record.paidAmount);
  if (overallPaid <= allocatedPaid) return '';

  const typedKey = getFeeSectionKeyFromType(record.feeType || record.feeCategory);
  if (typedKey) return typedKey;

  const sectionsWithTotal = FEE_SECTION_KEYS.filter(
    (key) => toAmount(breakdown[key]?.total) > 0
  );
  if (sectionsWithTotal.length === 1) return sectionsWithTotal[0];

  return 'tuition';
}

// Resolve total / paid / pending for one fee head, honouring a record-level
// paidFee that has not been allocated to any section yet.
export function getSectionFeeAmounts(record = {}, sectionKey = 'tuition') {
  // Normalise first so this matches exactly what the shared record list and
  // the other fee tabs display (a partially allocated paidFee still counts).
  const normalized = normalizeFeeBreakdownPayment(record);
  const breakdown = normalized.feeBreakdown || {};
  const section = breakdown[sectionKey] || {};
  const targetKey = getUnallocatedPaymentSection(normalized);

  let paid = toAmount(section.paid);
  if (targetKey === sectionKey) {
    const allocatedPaid = FEE_SECTION_KEYS.reduce(
      (sum, key) => sum + toAmount(breakdown[key]?.paid),
      0
    );
    const otherAllocated = Math.max(0, allocatedPaid - paid);
    const share = Math.max(0, toAmount(normalized.paidFee ?? normalized.paidAmount) - otherAllocated);
    paid = Math.max(paid, share);
  }

  let total = toAmount(section.total);
  if (total <= 0 && targetKey === sectionKey) {
    // Only the tuition head may fall back to the record-level annual fee; for
    // other heads the record total covers every section and would be wrong.
    total = targetKey === 'tuition'
      ? Math.max(toAmount(normalized.totalFee), paid)
      : paid;
  }
  if (total < paid) total = paid;

  return {
    total,
    paid,
    pending: Math.max(0, total - paid)
  };
}

// Move a record-level paidFee into the matching fee head so every section view
// (table, summary, receipt) sees the same paid amount. Idempotent.
export function normalizeFeeBreakdownPayment(record = {}) {
  if (!record || !record.feeBreakdown) return record;

  const targetKey = getUnallocatedPaymentSection(record);
  if (!targetKey) return record;

  const breakdown = record.feeBreakdown;
  const section = breakdown[targetKey] || {};
  const allocatedPaid = FEE_SECTION_KEYS.reduce(
    (sum, key) => sum + toAmount(breakdown[key]?.paid),
    0
  );
  const unallocated = Math.max(0, toAmount(record.paidFee ?? record.paidAmount) - allocatedPaid);
  if (unallocated <= 0) return record;

  const paid = toAmount(section.paid) + unallocated;
  let total = toAmount(section.total);
  if (total <= 0) {
    // Tuition can inherit the record-level annual fee; other heads must not,
    // because that total spans all fee sections.
    total = targetKey === 'tuition'
      ? Math.max(toAmount(record.totalFee), paid)
      : paid;
  }
  if (total < paid) total = paid;

  return {
    ...record,
    feeBreakdown: {
      ...breakdown,
      [targetKey]: {
        ...section,
        total,
        paid,
        pending: Math.max(0, total - paid)
      }
    }
  };
}


