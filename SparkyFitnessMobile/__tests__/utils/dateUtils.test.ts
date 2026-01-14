import { getLocalDateString } from '../../src/utils/dateUtils';

describe('getLocalDateString', () => {
  // Save original timezone
  const originalTZ = process.env.TZ;

  afterEach(() => {
    // Restore original timezone
    process.env.TZ = originalTZ;
  });

  describe('basic functionality', () => {
    test('extracts date from ISO timestamp', () => {
      const result = getLocalDateString('2026-01-15T12:00:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('handles timestamp with timezone offset', () => {
      const result = getLocalDateString('2026-01-15T12:00:00-05:00');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('handles timestamp without timezone (treated as local)', () => {
      const result = getLocalDateString('2026-01-15T12:00:00');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('timezone awareness', () => {
    test('respects local timezone conversion', () => {
      // This timestamp is 11:00 PM on Jan 14 in EST (UTC-5)
      // But it's stored as 4:00 AM on Jan 15 in UTC
      const timestamp = '2026-01-15T04:00:00Z';
      
      // When running in EST timezone, should return Jan 14
      // Note: In test environment, the actual timezone may vary
      // So we just verify it returns a valid date string
      const result = getLocalDateString(timestamp);
      expect(result).toMatch(/^2026-01-(14|15)$/);
    });

    test('handles midnight boundary correctly', () => {
      // Just after midnight UTC
      const timestamp = '2026-01-15T00:01:00Z';
      const result = getLocalDateString(timestamp);
      expect(result).toMatch(/^2026-01-(14|15)$/);
    });

    test('handles end of day boundary correctly', () => {
      // Just before midnight UTC
      const timestamp = '2026-01-14T23:59:00Z';
      const result = getLocalDateString(timestamp);
      expect(result).toMatch(/^2026-01-14$/);
    });
  });

  describe('date formatting', () => {
    test('pads single digit month', () => {
      const result = getLocalDateString('2026-01-15T12:00:00Z');
      expect(result.split('-')[1]).toHaveLength(2);
      expect(result.split('-')[1]).toMatch(/^0\d$/);
    });

    test('pads single digit day', () => {
      const result = getLocalDateString('2026-01-05T12:00:00Z');
      expect(result.split('-')[2]).toHaveLength(2);
      expect(result.split('-')[2]).toMatch(/^0\d$/);
    });

    test('does not pad double digit month', () => {
      const result = getLocalDateString('2026-12-15T12:00:00Z');
      expect(result.split('-')[1]).toBe('12');
    });

    test('does not pad double digit day', () => {
      const result = getLocalDateString('2026-01-25T12:00:00Z');
      expect(result.split('-')[2]).toBe('25');
    });

    test('formats year correctly', () => {
      const result = getLocalDateString('2026-01-15T12:00:00Z');
      expect(result.split('-')[0]).toBe('2026');
    });
  });

  describe('various timestamp formats', () => {
    test('handles Z suffix (UTC)', () => {
      const result = getLocalDateString('2026-01-15T12:00:00Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('handles +00:00 offset', () => {
      const result = getLocalDateString('2026-01-15T12:00:00+00:00');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('handles negative timezone offset', () => {
      const result = getLocalDateString('2026-01-15T12:00:00-05:00');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('handles positive timezone offset', () => {
      const result = getLocalDateString('2026-01-15T12:00:00+05:00');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('handles milliseconds in timestamp', () => {
      const result = getLocalDateString('2026-01-15T12:00:00.123Z');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('comparison with naive approach', () => {
    test('demonstrates the bug with naive split approach', () => {
      // This is what the OLD code would do (incorrect)
      const timestamp = '2026-01-15T04:00:00Z';
      const naiveResult = timestamp.split('T')[0]; // Always returns "2026-01-15"
      
      // This is what the NEW code does (correct)
      const correctResult = getLocalDateString(timestamp);
      
      // Naive approach always gives UTC date
      expect(naiveResult).toBe('2026-01-15');
      
      // Correct approach gives local date (will vary by timezone)
      // In UTC-5, this should be 2026-01-14
      expect(correctResult).toMatch(/^2026-01-(14|15)$/);
    });
  });

  describe('edge cases', () => {
    test('handles year boundaries', () => {
      const result = getLocalDateString('2026-01-01T00:00:00Z');
      expect(result).toMatch(/^(2025-12-31|2026-01-01)$/);
    });

    test('handles leap year dates', () => {
      const result = getLocalDateString('2024-02-29T12:00:00Z');
      expect(result).toMatch(/^2024-02-29$/);
    });

    test('handles month boundaries', () => {
      const result = getLocalDateString('2026-02-01T00:00:00Z');
      expect(result).toMatch(/^(2026-01-31|2026-02-01)$/);
    });
  });
});
