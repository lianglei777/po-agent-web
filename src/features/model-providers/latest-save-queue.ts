interface LatestSaveQueueOptions<T> {
  save: (value: T) => Promise<unknown>;
  onSavingChange: (saving: boolean) => void;
  onSaved: (value: T) => void;
  onError: (error: unknown) => void;
}

export function createLatestSaveQueue<T>({
  save,
  onSavingChange,
  onSaved,
  onError,
}: LatestSaveQueueOptions<T>) {
  let pending: T | undefined;
  let hasPending = false;
  let running = false;
  let disposed = false;

  async function pump() {
    if (running || disposed) return;
    running = true;
    onSavingChange(true);

    while (hasPending && !disposed) {
      const value = pending as T;
      pending = undefined;
      hasPending = false;
      try {
        await save(value);
        if (!disposed) onSaved(value);
      } catch (error) {
        if (!disposed) onError(error);
      }
    }

    running = false;
    if (!disposed) onSavingChange(false);
  }

  return {
    enqueue(value: T) {
      if (disposed) return;
      pending = value;
      hasPending = true;
      void pump();
    },
    dispose() {
      disposed = true;
      pending = undefined;
      hasPending = false;
    },
  };
}

export function createDebouncedSaveQueue<T>(
  options: LatestSaveQueueOptions<T> & {
    delayMs: number;
    onScheduled?: () => void;
  },
) {
  const queue = createLatestSaveQueue(options);
  let timer: ReturnType<typeof setTimeout> | null = null;

  function cancelScheduled() {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  }

  return {
    schedule(value: T) {
      cancelScheduled();
      options.onScheduled?.();
      timer = setTimeout(() => {
        timer = null;
        queue.enqueue(value);
      }, options.delayMs);
    },
    cancelScheduled,
    saveNow(value: T) {
      cancelScheduled();
      queue.enqueue(value);
    },
    dispose() {
      cancelScheduled();
      queue.dispose();
    },
  };
}
