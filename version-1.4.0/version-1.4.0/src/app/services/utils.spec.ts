import { parseCSV, parseCSVLine } from './utils';

describe('Utils Service', () => {
  describe('parseCSVLine', () => {
    it('should parse a simple CSV line', () => {
      const result = parseCSVLine('a,b,c');
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle quoted values', () => {
      const result = parseCSVLine('"a,b",c');
      expect(result).toEqual(['a,b', 'c']);
    });

    it('should handle empty values', () => {
      const result = parseCSVLine('a,,c');
      expect(result).toEqual(['a', '', 'c']);
    });
  });

  describe('parseCSV', () => {
    it('should parse a simple CSV', () => {
      const csv = `name,age,city
John,30,NYC
Jane,25,LA`;

      const result = parseCSV(csv);

      expect(result.headers).toEqual(['name', 'age', 'city']);
      expect(result.parsedData).toHaveLength(2);
      expect(result.parsedData[0]).toEqual({ name: 'John', age: '30', city: 'NYC' });
      expect(result.parsedData[1]).toEqual({ name: 'Jane', age: '25', city: 'LA' });
    });

    it('should handle empty CSV', () => {
      const result = parseCSV('');
      // Empty CSV returns one empty row
      expect(result.parsedData).toEqual([]);
    });
  });
});
