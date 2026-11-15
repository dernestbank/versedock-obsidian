import {describe, expect, it} from "vitest";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import {parseBenchmarkIterations, summarizeDurations} from "../scripts/benchmark-stats.mjs";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const benchmarkScript = fileURLToPath(new URL("../scripts/benchmark_mysword_local.mjs", import.meta.url));

describe("MySword benchmark statistics", () => {
  it("summarizes odd and even duration samples without mutating them", () => {
    const odd = [9, 1, 5, 3, 7];
    const even = [4, 1, 3, 2];

    expect(summarizeDurations(odd)).toEqual({
      iterations: 5,
      minimum: 1,
      median: 5,
      p95: 9,
      maximum: 9,
      mean: 5
    });
    expect(summarizeDurations(even)).toEqual({
      iterations: 4,
      minimum: 1,
      median: 2.5,
      p95: 4,
      maximum: 4,
      mean: 2.5
    });
    expect(odd).toEqual([9, 1, 5, 3, 7]);
    expect(even).toEqual([4, 1, 3, 2]);
  });

  it("rejects too few, negative, or non-finite samples", () => {
    expect(() => summarizeDurations([1, 2])).toThrow(/at least 3/i);
    expect(() => summarizeDurations([1, -1, 2])).toThrow(/finite non-negative/i);
    expect(() => summarizeDurations([1, Number.NaN, 2])).toThrow(/finite non-negative/i);
  });

  it("uses seven iterations by default and bounds explicit runs", () => {
    expect(parseBenchmarkIterations(undefined)).toBe(7);
    expect(parseBenchmarkIterations("3")).toBe(3);
    expect(parseBenchmarkIterations("25")).toBe(25);
    expect(() => parseBenchmarkIterations("2")).toThrow(/3 and 25/i);
    expect(() => parseBenchmarkIterations("26")).toThrow(/3 and 25/i);
    expect(() => parseBenchmarkIterations("3.5")).toThrow(/3 and 25/i);
    expect(() => parseBenchmarkIterations("word")).toThrow(/3 and 25/i);
  });

  it("does not disclose an unreadable source path in error output", () => {
    const privatePath = "/tmp/sworddock-private-missing.bbl.mybible";
    const result = spawnSync(process.execPath, [benchmarkScript, privatePath, "3"], {
      cwd: repositoryRoot,
      encoding: "utf8"
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Unable to read selected module file.");
    expect(result.stderr).not.toContain(privatePath);
  });
});
