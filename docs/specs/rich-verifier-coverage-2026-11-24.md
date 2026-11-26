# Rich verifier completeness gate

## Strict rich-source verification — November 24, 2026

The release review found and reproduced a verifier false pass: one forced parser
fallback left all 22 book source records retained but only 21 text projections
compared, while the command exited zero and reported complete. The shared script
policy now requires every retained source record and, for non-Bible resources,
zero parser fallbacks and a complete text-comparison count. Bible records continue
to use their separate GBF reader; no Bible HTML-projection claim is introduced.
The verifier writes an incomplete report before oracle/build/validation work.
The controlled oracle-startup failure leaves that report incomplete.

Five persistent unit cases pass; the actual defect reproduced before the helper
existed. Initial unit RED was missing-module collection, not five behavioral
failures. Removing each of the three policy guards fails its intended tests and
exact helper source is restored. Two full-corpus negative cases exit nonzero and
leave incomplete reports. A controlled oracle-startup failure also clears a seeded
prior success; removing that initialization in an isolated script copy preserves
the stale success and is detected. Production parser/source inputs are unchanged.

The positive full pinned-corpus comparison passes: **56,984** exact source records,
**25,882** non-Bible text projections, **zero fallbacks**. Existing unresolved
source links/anchors remain explicit. A successful report does not assert that
those source addresses are valid. Evidence is retained under
.research/platform-mini/verifier-review, including the false-success report,
negative cases, unit/mutation logs and final full-rich report summary.

Full Mini/Linux **472-test / 69-file** checks, strict TypeScript and build pass.
Linux takes **67.593 seconds**, with **1,689** inputs unchanged,
fingerprint `b67204b11020a73bbf7da17597966ea7ff74854c83ca1196cb939e294083d210`.
Six-source import/reopen, management and recovery checks pass. Production remains
**392,949 bytes**, SHA-256
`93ee77baba265984529402ec0cb749d9834a7b730bcb01c7666abc360455cd25`.
Every entry of the existing **1,475-entry / 34,957,307-byte** preview
matches current project bytes; its prior two identical builds and clean-install/
offline-restart data smoke evidence remain valid. ZIP SHA-256:
`a601c9e78724a68091bd5f928c3abcbcc04c738361bd0b6a9c75c6a52de01d76`.
No redundant package/UI run is claimed for this QA-script-only change. The isolated
test-vault core files remain identical; no deployment change is needed.

All **107 production TS files, styles.css, 25 scripts and esbuild.config.mjs** now
have source inspection. Full accumulated test/evidence coverage and all open
native/source-update/failure/final ZIP/platform/theme/assistive/slower-device
acceptance remain incomplete. Fresh read-only Windows probes timed out before a
command ran. The Mini QA-only AppleScript exception remains unanswered. No native
Mini UI, personal vault, OS permission, commit, publication or permanent user-data
deletion changed. Primary development remains on the mini and the goal is active.
