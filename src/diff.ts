export type DataValue = null | boolean | number | string | DataValue[] | { [key: string]: DataValue };
export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged' | 'nested';

export interface DiffNode {
  key: string;
  path: string;
  status: DiffStatus;
  before?: DataValue;
  after?: DataValue;
  children?: DiffNode[];
}

const isObject = (value: DataValue): value is Record<string, DataValue> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const same = (left: DataValue, right: DataValue) => JSON.stringify(left) === JSON.stringify(right);

export const buildDiff = (before: DataValue, after: DataValue, parent = ''): DiffNode[] => {
  if (!isObject(before) || !isObject(after)) {
    return [{
      key: parent || 'root',
      path: parent || 'root',
      status: same(before, after) ? 'unchanged' : 'changed',
      before,
      after,
    }];
  }

  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();

  return keys.map((key) => {
    const path = parent ? `${parent}.${key}` : key;
    const hasBefore = Object.hasOwn(before, key);
    const hasAfter = Object.hasOwn(after, key);

    if (!hasBefore) return { key, path, status: 'added', after: after[key] };
    if (!hasAfter) return { key, path, status: 'removed', before: before[key] };
    if (isObject(before[key]) && isObject(after[key])) {
      const children = buildDiff(before[key], after[key], path);
      const hasChanges = children.some((child) => child.status !== 'unchanged');
      return { key, path, status: hasChanges ? 'nested' : 'unchanged', children };
    }
    if (same(before[key], after[key])) return { key, path, status: 'unchanged', before: before[key], after: after[key] };
    return { key, path, status: 'changed', before: before[key], after: after[key] };
  });
};

export const flattenDiff = (nodes: DiffNode[]): DiffNode[] =>
  nodes.flatMap((node) => [node, ...(node.children ? flattenDiff(node.children) : [])]);

export const getSummary = (nodes: DiffNode[]) => {
  const items = flattenDiff(nodes).filter((node) => !node.children);
  return items.reduce(
    (result, node) => {
      if (node.status === 'nested') return result;
      return { ...result, [node.status]: result[node.status] + 1 };
    },
    { added: 0, removed: 0, changed: 0, unchanged: 0, total: items.length },
  );
};
