export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 300
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        break;
      }

      const waitMs = baseDelayMs * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      attempt += 1;
    }
  }

  throw lastError;
}
