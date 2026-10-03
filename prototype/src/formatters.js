/** Shared display-only formatters. Raw identifiers/edit values must never be passed back from these helpers. */
export const EMPTY_VALUE = '—';

export function isEmptyValue(value) {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

export function displayValue(value, { empty = EMPTY_VALUE, unknown = '未知' } = {}) {
  if (isEmptyValue(value)) return empty;
  const text = String(value).trim();
  return /^unknown$/i.test(text) ? unknown : text;
}

function expandScientific(text) {
  const match = String(text).match(/^([+-]?)(\d+)(?:\.(\d+))?[eE]([+-]?\d+)$/);
  if (!match) return text;
  const [, sign, integer, fraction = '', exponentText] = match;
  const exponent = Number(exponentText);
  const digits = integer + fraction;
  const point = integer.length + exponent;
  if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length) return `${sign}${digits}${'0'.repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

function normalizedDecimal(value) {
  if (isEmptyValue(value)) return null;
  let text = typeof value === 'bigint' ? value.toString() : String(value).trim();
  if (/^(待核验|未知|不详|无)$/u.test(text)) return { semantic: text };
  text = text.replace(/[¥￥,，\s]/g, '').replace(/元$/u, '');
  text = expandScientific(text);
  const match = text.match(/^([+-]?)(\d*)(?:\.(\d*))?$/);
  if (!match || (!match[2] && !match[3])) return { semantic: displayValue(value) };
  const sign = match[1] === '-' ? '-' : '';
  const integer = (match[2] || '0').replace(/^0+(?=\d)/, '') || '0';
  return { sign, integer, fraction: match[3] || '' };
}

function roundFraction(integer, fraction, digits) {
  if (digits < 0) return { integer, fraction: '' };
  const kept = fraction.slice(0, digits).padEnd(digits, '0');
  if (fraction.length <= digits || Number(fraction[digits] || 0) < 5) return { integer, fraction: kept };
  const combined = `${integer}${kept}`.split('');
  let carry = 1;
  for (let index = combined.length - 1; index >= 0 && carry; index -= 1) {
    const next = Number(combined[index]) + carry;
    combined[index] = String(next % 10);
    carry = next > 9 ? 1 : 0;
  }
  if (carry) combined.unshift('1');
  const wholeLength = Math.max(1, combined.length - digits);
  return {
    integer: combined.slice(0, wholeLength).join('') || '0',
    fraction: digits ? combined.slice(wholeLength).join('').padStart(digits, '0') : '',
  };
}

function groupInteger(integer) {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function formatNumber(value, { minimumFractionDigits = 0, maximumFractionDigits = minimumFractionDigits, empty = EMPTY_VALUE } = {}) {
  const parsed = normalizedDecimal(value);
  if (!parsed) return empty;
  if (parsed.semantic) return parsed.semantic;
  const digits = Math.max(minimumFractionDigits, maximumFractionDigits);
  const rounded = roundFraction(parsed.integer, parsed.fraction, digits);
  let fraction = rounded.fraction;
  while (fraction.length > minimumFractionDigits && fraction.endsWith('0')) fraction = fraction.slice(0, -1);
  const isZero = /^0+$/.test(rounded.integer) && (!fraction || /^0+$/.test(fraction));
  const sign = parsed.sign && !isZero ? '-' : '';
  return `${sign}${groupInteger(rounded.integer)}${fraction ? `.${fraction}` : ''}`;
}

export function formatMoney(value, { unit = true, symbol = false, empty = EMPTY_VALUE } = {}) {
  const number = formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2, empty });
  if (number === empty || /^(待核验|未知|不详|无)$/u.test(number)) return number;
  return `${symbol ? '¥' : ''}${number}${unit ? '元' : ''}`;
}

export function formatCount(value, unit = '次', { empty = EMPTY_VALUE } = {}) {
  const number = formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 0, empty });
  return number === empty ? empty : `${number}${unit}`;
}

function dateParts(value) {
  if (isEmptyValue(value)) return null;
  const text = String(value).trim();
  const match = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return { text };
  const [, year, month, day, hour, minute, second] = match;
  return {
    date: `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`,
    time: hour === undefined ? '' : `${hour.padStart(2, '0')}:${minute}${second ? `:${second}` : ''}`,
  };
}

export function formatDate(value, { empty = EMPTY_VALUE } = {}) {
  const parts = dateParts(value);
  if (!parts) return empty;
  return parts.date || parts.text;
}

export function formatDateTime(value, { seconds = false, empty = EMPTY_VALUE } = {}) {
  const parts = dateParts(value);
  if (!parts) return empty;
  if (!parts.date) return parts.text;
  if (!parts.time) return parts.date;
  const time = seconds ? parts.time.padEnd(8, ':00') : parts.time.slice(0, 5);
  return `${parts.date} ${time}`;
}

export function formatCompactDateTime(value, { empty = EMPTY_VALUE } = {}) {
  const full = formatDateTime(value, { empty });
  if (full === empty) return empty;
  const match = full.match(/^\d{4}-(\d{2}-\d{2} \d{2}:\d{2})$/);
  return match ? match[1] : full;
}
