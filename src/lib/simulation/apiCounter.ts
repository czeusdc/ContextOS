/**
 * API Call Counter — tracks Gemini API usage per device.
 * Stored in localStorage under an obfuscated key.
 * Resets at midnight Manila time (Asia/Manila, UTC+8).
 * Limit: 100 calls. After that, only simulated mode works.
 */

const STORAGE_KEY = 'ctx_ap1_usage'; // Obfuscated — looks like a generic app metric
const API_LIMIT = 100;
const MANILA_TZ = 'Asia/Manila';

/** Returns today's date string in Manila timezone (YYYY-MM-DD). */
function getManilaDate(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: MANILA_TZ });
}

interface UsageRecord {
  date: string;
  count: number;
}

function readRecord(): UsageRecord {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { date: getManilaDate(), count: 0 };
    const record: UsageRecord = JSON.parse(stored);
    // Reset if it's a new Manila day
    if (record.date !== getManilaDate()) {
      return { date: getManilaDate(), count: 0 };
    }
    return record;
  } catch {
    return { date: getManilaDate(), count: 0 };
  }
}

function writeRecord(record: UsageRecord): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // localStorage unavailable (private browsing, etc.) — fail silently
  }
}

/** Returns the current API call count for today (Manila time). */
export function getApiCallCount(): number {
  return readRecord().count;
}

/** Increments the API call counter and returns the new total. */
export function incrementApiCall(): number {
  const record = readRecord();
  record.count += 1;
  writeRecord(record);
  return record.count;
}

/** Returns true if the daily API limit has been reached or exceeded. */
export function isApiLimitReached(): boolean {
  return readRecord().count >= API_LIMIT;
}

/** Returns how many calls remain before hitting the daily limit. */
export function getApiCallsRemaining(): number {
  return Math.max(0, API_LIMIT - readRecord().count);
}
