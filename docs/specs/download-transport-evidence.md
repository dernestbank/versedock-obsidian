# Download transport evidence

Observed 2026-11-18 with a direct HTTPS HEAD probe, including
`Origin: app://obsidian.md`, against the existing pinned KJV source.

The catalogue URL redirects with HTTP 302 from
`https://mysword-bible.info/download/getfile.php?file=kjv.bbl.mybible.gz`
to `https://mysword-bible.info/download/kjv.bbl.mybible.gz`. The final response is
HTTP 200, Content-Length 2,448,610, Accept-Ranges `bytes`, Content-Encoding
`x-gzip`, Last-Modified 2023-06-16 and ETag `"255ce2-5fe358e51ca80"`.
Neither response exposed an Access-Control-Allow-Origin header for the supplied
Obsidian origin. Do not assume ordinary browser fetch can replace requestUrl.

The installed public Obsidian RequestUrlParam interface has URL/method/body/
headers/throw fields and no AbortSignal or transfer-cancellation method. The
mobile transport uses a logical abort/timeout around requestUrl. Its network
transfer can finish after the result is discarded. The desktop replacement is
implemented in decision 0013; actual mobile-device acceptance remains open.

A real GET range probe now returns HTTP 206, Content-Length 1024 and Content-Range
`bytes 0-1023/2448610`, with the same strong ETag and x-gzip encoding.
The desktop implementation destroys actual requests on abort/timeout, checkpoints
immutable prefixes, validates Range/If-Range/Content-Range and final source pins,
and restarts safely when resuming is unsupported or metadata changes.
Loopback socket tests and a real publisher HTTPS verifier cover this path.
The initial real publisher run saved 527,838 KJV bytes, resumed that exact offset
with 206, then installed/reopened all six kinds with their expected record counts.
Its reopen service forbids network calls. See
`.research/modules/transport-report.json` for the latest ignored report and
`scripts/verify-download-transport.mjs` for the executable check.

Prepared-resource staging recovery (decision 0012) remains a separate capability.
Native transport UX/reload and actual mobile/Windows/Linux acceptance still need
verification; a Node process alone does not establish those platform gates.


November 24 transport/evidence audit: 497/72 Mini/Linux checks pass after isolating
the new verifier regression fixture. Stale success is invalidated before build/
network work; two failure cases and a deliberate mutation verify the fix. Fresh
actual publisher HTTPS cancels/saves/resumes at 527,838 bytes with 206 and installs/
reopens all six kinds offline. Current source/runtime/corpus bindings and all
1,475 unchanged packaged entries preserve prior package/data evidence. All 68
ledger criteria are classified; current native/platform/theme/assistive/slower-
device/final native ZIP/update/failure gates remain open. See transport-verifier-
evidence-2026-11-24.md and the current requirement audit for exact limits.
