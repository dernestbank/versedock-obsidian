# Cooperative module preparation — November 24, 2026

Development and measurements run on Nana’s Mac mini (Apple M1, 16 GiB,
Node 22.23.1 ARM64). Large study-module transformations and imported Bible
construction previously ran synchronously after SQLite inspection had yielded.
The measured pauses justified a targeted change to those two stages.

## Behavior

`prepareStudyContent` is asynchronous and accepts the existing optional abort
signal. The normalization dispatcher forwards that signal after inspection.
Bible, commentary and dictionary records are decoded in batches of 250, with
a timer yield between batches and cancellation checks before work, between
records and after the final batch. The output format and property order remain
unchanged. Books, devotionals and graphics keep their existing preparation path.

`ImportedBibleResource.create` replaces direct construction. It prepares a local
chapter map in batches and publishes a complete resource only after cancellation
checks pass. Every production/test/verifier caller awaits it. The plugin passes
a lifetime signal, aborts it on unload and rechecks the installed generation
after decoding; a superseded result cannot replace the current cached edition.
The existing latest-edition selection guard remains in use.

## Measured tradeoff

Three warm samples per stage, using the pinned real-source SQLite corpora.
Duration is the sample median; gap is the largest recursive 1 ms timer gap across
those samples. Timer gaps include scheduling and the requested timer interval.

| Stage | Duration before → after (ms) | Largest gap before → after (ms) |
| --- | ---: | ---: |
| Bible transformation | 297.901 → 534.513 | 337.475 → 10.234 |
| Commentary transformation | 222.388 → 331.345 | 246.600 → 11.043 |
| Dictionary transformation | 37.097 → 59.336 | 38.032 → 7.743 |
| Imported Bible opening | 364.638 → 496.241 | 368.016 → 13.939 |

Yielding increases elapsed processing time while letting input/cancellation tasks
run. A blocking/cooperative calibration verifies that the sampler detects stalls.
Fixture reads, hashing, bundling and WASM initialization are outside timed work.
The benchmark does not control all OS background activity or thermal state.
These are Node event-loop measurements, not native Electron INP, UI acceptance,
screen-reader evidence or representative slower-device proof.

Full preview preparation still includes synchronous validation/JSON serialization
and other work. Maximum warm full-preview gaps were 58.464 ms for Bible and
122.944 ms for commentary, with variable larger gaps elsewhere. This does not close the overall
responsiveness gate or establish a universal per-entry time bound.

## Verification

All six prepared module JSON hashes and byte counts match the saved pre-change
baseline exactly (56,984 records total). Source fixture bytes are unchanged.
Seventeen new regressions cover pending input, mid-work/pre-work/final-batch
cancellation, dispatcher signal propagation, generation replacement and unload.
They include seven initial failing transformation cases, three missing-factory
cases and two failing integration cases before their respective fixes.
Six targeted mutations remove yielding, signal propagation, final checks,
the generation guard or unload abort. Every mutation fails its relevant tests;
exact production source is restored after each. Existing content, coordinates,
blank verses, lexical tokens, search and provenance assertions remain intact.

The complete Mac mini check passes 397 tests / 62 files, TypeScript and build.
Real-source installation/reopen, management/recovery and Linux/package results
are recorded in the current STATUS checkpoint. The dependency lockfile is unchanged.

Evidence is under `.research/platform-mini/cooperative-preparation`:
`content-before.json`, `performance-before.json`, `performance-after.json`,
red/green/full-check logs and both mutation reports. The sampler is
`.research/platform-mini/benchmark-core.mjs`; run it with `node --expose-gc`.
The earlier monitor-based draft underreports synchronous gaps and is retained
only as a discarded measurement draft, not as evidence supporting this decision.
