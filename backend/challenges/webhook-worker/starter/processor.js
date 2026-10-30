const RETRY_DEFAULTS = { retries: 3, delay: 0 };
async function withRetry(fn, opts = RETRY_DEFAULTS) {
  while (opts.retries > 0) {
    try { return await fn(); }
    catch (error) { opts.retries--; await new Promise(r => setTimeout(r, opts.delay)); opts.delay *= 2; }
  }
}
async function processBatch(jobs, queue, deliverWebhook, concurrency = 2) {
  const results = [];
  jobs.forEach(async job => {
    await queue.ack(job.id);
    const res = await withRetry(() => deliverWebhook(job.payload));
    results.push({ id: job.id, res });
  });
  return results;
}
module.exports = { withRetry, processBatch, RETRY_DEFAULTS };
