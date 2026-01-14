# Timezone Handling Fix for Health Data Sync (Issue #516)

## Problem

Health data from the Android companion app was being synced to the next day instead of the correct day due to improper timezone handling.

## Root Cause

The bug was caused by using naive string splitting to extract dates from ISO 8601 timestamps:

```typescript
// OLD CODE (BUGGY)
const date = record.startTime.split('T')[0];
```

This approach doesn't account for timezone offsets. When a timestamp is recorded in local time but stored/transmitted in UTC (or vice versa), data gets assigned to the wrong date.

## Example of the Bug

If health data is recorded on **January 14, 2026 at 11:00 PM local time (EST, UTC-5)**, it's stored as:
- `2026-01-15T04:00:00Z` (UTC time, which is 5 hours ahead)

The old code extracted the date as `2026-01-15` (tomorrow) instead of `2026-01-14` (today).

## Solution

We created a timezone-aware helper function and replaced all instances of `.split('T')[0]` date extraction:

```typescript
// NEW CODE (FIXED)
import { getLocalDateString } from '../../utils/dateUtils';

const date = getLocalDateString(record.startTime);
```

The helper function:
```typescript
export const getLocalDateString = (timestamp: string): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = ('0' + (date.getMonth() + 1)).slice(-2);
  const day = ('0' + date.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
};
```

This ensures:
- The timestamp is properly parsed as a Date object
- The local timezone is respected (`getFullYear`, `getMonth`, `getDate` use local time)
- The date format remains `YYYY-MM-DD` as expected by the API

## Files Updated

### Android Health Connect (40+ occurrences)
- `src/services/healthconnect/dataAggregation.ts` (4 occurrences)
- `src/services/healthconnect/dataTransformation.ts` (30+ occurrences)
- `src/services/healthconnect/index.ts` (2 occurrences)
- `src/services/healthConnectService.ts` (3 occurrences)

### iOS HealthKit (for consistency)
- `src/services/healthkit/dataAggregation.ts` (2 occurrences)
- `src/services/healthkit/dataTransformation.ts` (1 occurrence)
- `src/services/healthkit/index.ts` (2 occurrences)

## Expected Behavior After Fix

Health data recorded on a specific day in the user's local timezone will be correctly synced to that same day, regardless of:
- UTC offset
- Timestamp representation
- Time of day (including near midnight)

## Testing

Comprehensive tests have been added to verify:
1. Basic timezone-aware date extraction
2. Handling of timestamps near midnight boundaries
3. Various timestamp formats (Z suffix, timezone offsets, etc.)
4. Compatibility with different timezones

Run tests:
```bash
npm run test:run -- __tests__/utils/dateUtils.test.ts
npm run test:run -- __tests__/services/healthconnect/dataAggregation.test.ts
```

## Example Scenarios

### Scenario 1: Evening workout
- **Local time:** Jan 14, 2026, 11:00 PM EST (UTC-5)
- **UTC timestamp:** `2026-01-15T04:00:00Z`
- **Old behavior:** Synced to Jan 15 ❌
- **New behavior:** Synced to Jan 14 ✅

### Scenario 2: Morning activity
- **Local time:** Jan 15, 2026, 6:00 AM EST (UTC-5)
- **UTC timestamp:** `2026-01-15T11:00:00Z`
- **Old behavior:** Synced to Jan 15 ✅
- **New behavior:** Synced to Jan 15 ✅

### Scenario 3: Midnight boundary
- **Local time:** Jan 14, 2026, 11:59 PM EST (UTC-5)
- **UTC timestamp:** `2026-01-15T04:59:00Z`
- **Old behavior:** Synced to Jan 15 ❌
- **New behavior:** Synced to Jan 14 ✅

## Related Issues

Fixes #516 from CodeWithCJ/SparkyFitness
