export function parseBenchmarkIterations(value) {
  if (value === undefined) return 7;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 3 || parsed > 25)
    throw new Error("Benchmark iterations must be an integer between 3 and 25.");
  return parsed;
}

export function summarizeDurations(samples) {
  if (!Array.isArray(samples) || samples.length < 3)
    throw new Error("Benchmark statistics require at least 3 samples.");
  if (samples.some(value => !Number.isFinite(value) || value < 0))
    throw new Error("Benchmark samples must be finite non-negative numbers.");

  const sorted = [...samples].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return {
    iterations: sorted.length,
    minimum: sorted[0],
    median,
    p95: sorted[p95Index],
    maximum: sorted[sorted.length - 1],
    mean: sorted.reduce((total, value) => total + value, 0) / sorted.length
  };
}
