// timestamp util for data
export const getLocalDateFromISO = (isoTimestamp: string): string => {
  // Check if timestamp has explicit timezone info (Z or ±HH:MM offset)
  const hasTimezone = /Z|[+-]\d{2}:\d{2}|[+-]\d{4}$/.test(isoTimestamp);

  if (!hasTimezone && isoTimestamp.includes('T')) {
    // No timezone info - Health Connect often provides local time without timezone
    // Extract date portion directly to avoid JavaScript treating it as UTC
    return isoTimestamp.split('T')[0];
  }

  // Has explicit timezone - parse and convert to local date
  const date = new Date(isoTimestamp);
  
  // Use local date components to build YYYY-MM-DD format
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};