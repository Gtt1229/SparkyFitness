/**
 * Extracts the local date string (YYYY-MM-DD) from an ISO 8601 timestamp.
 * This function respects the local timezone of the device, ensuring that
 * timestamps are assigned to the correct day regardless of UTC offset.
 * 
 * @param timestamp - ISO 8601 timestamp string (e.g., "2026-01-15T04:00:00Z")
 * @returns Local date string in YYYY-MM-DD format (e.g., "2026-01-14")
 * 
 * @example
 * // If local timezone is EST (UTC-5) and timestamp is "2026-01-15T04:00:00Z"
 * // This represents 11:00 PM on Jan 14 in EST
 * getLocalDateString("2026-01-15T04:00:00Z") // Returns "2026-01-14"
 */
export const getLocalDateString = (timestamp: string): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};
