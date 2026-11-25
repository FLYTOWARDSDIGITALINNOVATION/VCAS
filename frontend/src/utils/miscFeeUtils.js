// Helpers for repairing and totalling itemised miscellaneous fee records.
//
// Historically the fee entry form shared its monetary fields across tabs, so an
// inflated value from another fee head (e.g. a ₹10,000 tuition amount/fine) could
// be stored as the "assessed" amount of a miscellaneous item such as Lab Fees.
// The item was actually paid at the approved price (₹2,500), which made receipts
// show ₹12,500 even though only ₹2,500 was collected.

export const getApprovedMiscFeePrice = (feeName, feeStructure = []) => {
  const name = String(feeName || '').trim().toLowerCase();
  if (!name) return null;

  const match = (feeStructure || []).find(
    (fee) => String(fee?.feeType || '').trim().toLowerCase() === name
  );
  if (!match) return null;

  const price = Number(match.amount);
  return Number.isFinite(price) && price >= 0 ? price : null;
};

export const normalizeMiscFeeItems = (items, feeStructure = []) => {
  if (!Array.isArray(items) || items.length === 0) return [];

  return items.map((item) => {
    if (!item) return item;

    const price = getApprovedMiscFeePrice(item.feeType || item.name, feeStructure);
    if (price === null) return item;

    const amount = Number(item.amount ?? item.total ?? 0);
    const paid = Number(item.paid ?? 0);

    // Only clamp an inflated assessed amount when the excess was never actually
    // paid. Real overpayments (paid > approved price) are left untouched.
    if (amount > price && paid <= price) {
      return {
        ...item,
        amount: price,
        total: price,
        balance: Math.max(0, price - paid),
        status: paid >= price ? 'Paid' : paid > 0 ? 'Partial' : 'Pending'
      };
    }

    return item;
  });
};

export const sumMiscFeeItems = (items = []) => {
  const total = items.reduce(
    (sum, item) => sum + Number(item?.amount ?? item?.total ?? item?.paid ?? 0),
    0
  );
  const paid = items.reduce(
    (sum, item) => sum + Number(item?.paid ?? item?.amount ?? 0),
    0
  );

  return { total: Math.max(total, paid), paid };
};
