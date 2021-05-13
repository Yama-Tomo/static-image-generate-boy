const wait = async (
  waitIntervalMs: number,
  timeoutMs: number,
  breakCondition?: () => boolean
): Promise<void> => {
  const limit = waitIntervalMs > 0 ? Math.ceil(timeoutMs / waitIntervalMs) : 0;
  for (let i = 0; i < limit; i++) {
    if (breakCondition?.()) {
      break;
    }

    await new Promise((r) => setTimeout(r, waitIntervalMs));
  }
};

export { wait };
