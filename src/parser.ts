import yaml from 'js-yaml';
import type { DataValue } from './diff';

export type Format = 'auto' | 'json' | 'yaml';

const ensureDataValue = (value: unknown): DataValue => {
  if (value === undefined || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') {
    throw new Error('The document contains an unsupported value.');
  }
  return value as DataValue;
};

export const parseDocument = (source: string, format: Format): DataValue => {
  if (!source.trim()) throw new Error('Add some content before comparing.');
  if (format === 'json') return ensureDataValue(JSON.parse(source));
  if (format === 'yaml') return ensureDataValue(yaml.load(source));

  try {
    return ensureDataValue(JSON.parse(source));
  } catch {
    return ensureDataValue(yaml.load(source));
  }
};

export const formatDocument = (value: DataValue) => JSON.stringify(value, null, 2);
