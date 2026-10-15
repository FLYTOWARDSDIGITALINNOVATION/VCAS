/**
 * Utility to convert date strings (YYYY-MM-DD or DD-MM-YYYY) into formal English words
 * e.g., '2003-08-15' -> 'Fifteenth August Two Thousand Three'
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

const ORDINALS = [
  '', 'First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
  'Eleventh', 'Twelfth', 'Thirteenth', 'Fourteenth', 'Fifteenth', 'Sixteenth', 'Seventeenth', 'Eighteenth', 'Nineteenth', 'Twentieth',
  'Twenty First', 'Twenty Second', 'Twenty Third', 'Twenty Fourth', 'Twenty Fifth', 'Twenty Sixth', 'Twenty Seventh', 'Twenty Eighth', 'Twenty Ninth',
  'Thirtieth', 'Thirty First'
];

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function numberToWords(num) {
  if (num < 0) return '';
  if (num < 20) return ONES[num];
  if (num < 100) return (TENS[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ONES[num % 10] : '')).trim();
  if (num < 1000) {
    const rem = num % 100;
    return (ONES[Math.floor(num / 100)] + ' Hundred' + (rem > 0 ? ' and ' + numberToWords(rem) : '')).trim();
  }
  if (num < 10000) {
    const thousands = Math.floor(num / 1000);
    const rem = num % 1000;
    return (ONES[thousands] + ' Thousand' + (rem > 0 ? ' ' + numberToWords(rem) : '')).trim();
  }
  return String(num);
}

export function convertDateToWords(dateInput) {
  if (!dateInput || typeof dateInput !== 'string') return '';
  const clean = dateInput.trim();
  if (!clean) return '';

  let year = NaN;
  let month = NaN;
  let day = NaN;

  if (clean.includes('-')) {
    const parts = clean.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        // DD-MM-YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    }
  } else if (clean.includes('/')) {
    const parts = clean.split('/');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      }
    }
  }

  if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return '';
  }

  const dayWord = ORDINALS[day] || numberToWords(day);
  const monthWord = MONTHS[month] || '';

  let yearWord = '';
  if (year >= 2000 && year < 2100) {
    const rem = year - 2000;
    yearWord = 'Two Thousand' + (rem > 0 ? ' ' + numberToWords(rem) : '');
  } else if (year >= 1900 && year < 2000) {
    const rem = year - 1900;
    yearWord = 'Nineteen' + (rem > 0 ? ' ' + numberToWords(rem) : ' Hundred');
  } else {
    yearWord = numberToWords(year);
  }

  return `${dayWord} ${monthWord} ${yearWord}`.trim();
}

export default convertDateToWords;
