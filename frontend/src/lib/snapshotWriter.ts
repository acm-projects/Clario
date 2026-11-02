/** One ordered writer for autosave, explicit Run snapshots, and final snapshots. */
export function isCompletedSessionError(error: unknown): boolean {
  return error instanceof Error && "status" in error && error.status === 400
    && error.message === "Session already completed";
}

export function createSnapshotWriter(persist: (id: string, code: string) => Promise<unknown>) {
  let queue: Promise<unknown> = Promise.resolve();
  const saved = new Map<string, string>();
  const completed = new Map<string, unknown>();
  return (id: string, code: string, force = true) => {
    const next = queue.catch(() => {}).then(async () => {
      if (completed.has(id)) throw completed.get(id);
      if (!force && saved.get(id) === code) return false;
      try {
        await persist(id, code);
      } catch (error) {
        if (isCompletedSessionError(error)) completed.set(id, error);
        throw error;
      }
      saved.set(id, code);
      return true;
    });
    queue = next;
    return next;
  };
}
