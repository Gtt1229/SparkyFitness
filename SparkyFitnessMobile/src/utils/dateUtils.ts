// timestamp util for data
export const getLocalDateFromISO = (isoTimestamp: string): string => {
  const date = new Date(isoTimestamp);
  // returns dates in YYYY-MM-DD format
  return date.toLocaleDateString('en-CA');
};