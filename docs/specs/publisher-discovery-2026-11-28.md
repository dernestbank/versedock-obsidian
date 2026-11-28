# Publisher discovery verification

On November 28, 2026, a fresh macOS Obsidian vault read 935 listings from the seven official MySword collections and 260 from Doctor Dave. These are catalogue counts. Installability depends on the download, its size and its database contents. BibleSupport returned 10 listings on its first general page, 10 more on the second page and 10 on the first foreign-language page. Its public download flow required a publisher account. Both David Cox sites returned HTTP 403.

The desktop check selected *Highlights of Archaeology in Bible Lands* from Doctor Dave and *Edersheim The Temple - Its Ministry and Service* from MySword in one batch. It cancelled and retried the queued job. Both ZIP downloads installed. After a full Obsidian restart, the test read all 31 and 20 entries, respectively, with the browser context offline.

An iPad Air (5th generation) installed the same pair through the wizard in a disposable local vault. A QA driver operated the visible controls and recorded results on the device. After terminating and relaunching Obsidian, the driver reopened the two resources with the plugin downloader and browser HTTP fetch disabled. It observed zero requests through those hooks. The Wi-Fi connection remained available for device control.

Automated tests cover all six resource types, SQLite and gzip normalization, individual ZIP member selection, invalid archives, cancellation, stable module IDs, persistence, failed replacement and stale catalogues. The full check passed 537 tests in 79 files. The offline preview passed fresh-install and restart checks with 1,437 files, 66 WEB books and 31,103 verses.

The 0.1.15 release branch applies the wizard to the 0.1.14 baseline. Review found that concurrent detail requests could discard another title’s resolved download link. The fix merges each result into the current catalogue and ignores results for superseded entries. A regression test completes two requests out of order. The release branch passed 523 tests across 77 files. Its 1,435-file offline package passed clean-install and restart checks.
