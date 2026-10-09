import { UpstreamProtocolError } from './upstream';

type JsonObject = Record<string, unknown>;

/** Decode the indexed object graph used by SvelteKit's __data.json response. */
export const decodeSvelteData = (payload: unknown): unknown => {
  if (!payload || typeof payload !== 'object' || !Array.isArray((payload as JsonObject).nodes)) {
    throw new UpstreamProtocolError('Unexpected SvelteKit page-data response');
  }

  const node = ((payload as JsonObject).nodes as unknown[]).find(
    (candidate) =>
      candidate &&
      typeof candidate === 'object' &&
      (candidate as JsonObject).type === 'data' &&
      Array.isArray((candidate as JsonObject).data),
  ) as JsonObject | undefined;

  const graph = node?.data as unknown[] | undefined;
  if (!graph?.length) {
    throw new UpstreamProtocolError('SvelteKit page-data graph is missing');
  }

  const resolveReference = (index: number, stack: Set<number>): unknown => {
    if (!Number.isSafeInteger(index) || index < 0 || index >= graph.length) {
      throw new UpstreamProtocolError('SvelteKit page-data reference is out of range');
    }
    if (stack.has(index)) {
      throw new UpstreamProtocolError('SvelteKit page-data contains a circular reference');
    }
    const nextStack = new Set(stack);
    nextStack.add(index);
    return resolveNode(graph[index], nextStack);
  };

  const resolveNode = (value: unknown, stack: Set<number>): unknown => {
    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === 'number') return resolveReference(item, stack);
        return resolveNode(item, stack);
      });
    }

    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as JsonObject).map(([key, item]) => [
          key,
          typeof item === 'number' ? resolveReference(item, stack) : resolveNode(item, stack),
        ]),
      );
    }

    return value;
  };

  return resolveNode(graph[0], new Set([0]));
};
