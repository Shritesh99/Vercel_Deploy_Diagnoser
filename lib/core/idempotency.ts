const seenKeys = new Set<string>();

export function makeEventKey(deploymentId: string, state: string): string {
  return `${deploymentId}:${state}`;
}

export function isDuplicateEvent(key: string): boolean {
  if (seenKeys.has(key)) {
    return true;
  }

  seenKeys.add(key);
  return false;
}

export function clearIdempotencyStore(): void {
  seenKeys.clear();
}
