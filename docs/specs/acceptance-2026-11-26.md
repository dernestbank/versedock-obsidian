# SwordDock Bible acceptance, November 26

This is the current review of the 68 required entries in the [completion ledger](../../tasks/completion-2026-11-18.md). The two optional entries are outside that count. The assessed desktop artifact is the 0.1.11 archive at `8037f4bf`. The [native desktop report](native-desktop-2026-11-26.md) identifies the complete digest, platform tests and curated captures. Each row describes the proof available for that requirement. Historical fixture-specific checks are identified where the current run used a different resource.

## Design

| ID | Result |
| --- | --- |
| 0.1 | The supplied mockups and the historical Reader/Resources baselines were compared. Native before/after Reader captures preserve the starting and current designs. |
| 0.2 | Native wide and narrow Reader captures retain the passage controls, selected verse and study actions. |
| 0.3 | The Resources dock keeps its resource selectors and source content inside the 250- and 420-pixel panes. |
| 0.4 | Library keyboard navigation, word selection, sections, multi-target citations, Back and explicit Reader focus have native coverage. The regression suite also checks focus ownership across late renders and multiple panes. |
| 0.5 | The four views ran at two widths in both appearances of Default, Minimal, Things, Catppuccin and Border. All 80 captures retained the expected passage or Library state and fit the root pane. |
| 0.6 | The desktop report links the reviewed native before/after Reader, wide Study and Resources, and narrow Library captures. |

## Automatic installation and switching

| ID | Result |
| --- | --- |
| 1.1 | The KJV, JFB and Easton SQLite layouts and full record counts were checked against the actual publisher sources. |
| 1.2 | Three resource types use the verified transaction and can be rediscovered from storage. |
| 1.3 | Native Install selected fetched the three resources, including a resumed JFB transfer. All nine catalogue/local selections survived full application restart. |
| 1.4 | MySword KJV retained Proverbs 5:3 across restart and switching back to the bundled tagged KJV succeeded. The two editions remain individually identifiable. |
| 1.5 | MHC and JFB follow the selected passage. JFB source-coordinate previews and Easton's Pledge → Loan → Back preserve the originating context. |
| 1.6 | Disconnected service reopen, malformed and opaque input rejection, real publisher cancellation/resume, save rollback and native offline Linux package startup have separate evidence. |

## Local import

| ID | Result |
| --- | --- |
| 2.1 | Raw SQLite and gzip preparation, original source retention, stale-review rejection and persisted reopening are exercised across all six kinds. |
| 2.2 | The native picker installed Bible, commentary, dictionary, book, devotional and graphics inputs, including the explicit reader choices for shared book containers. |
| 2.3 | Preview records sizes, source note and selected-file/database fingerprints. Installed generations retained their reviewed provenance. |
| 2.4 | Six imports reopened with verified stored content and original input hashes after restart. |
| 2.5 | Imported Genesis 1:4 retained a distinct RF translator note and the original tagged verse. Two invalid inputs showed the expected explanation. |
| 2.6 | Real six-source corpus checks and Linux filesystem tests supplement the fixture regressions and the native file-picker run. |
| 2.7 | The native modal rejected malformed/opaque inputs and allowed the same review to be retried after write permission returned. Earlier wrong-type and closed-review cases and current stale-review tests cover invalidation. |

## Management

| ID | Result |
| --- | --- |
| 3.1 | Recovery and cleanup measured eligible folders, protected the active generation and moved selected items to recoverable vault Trash. |
| 3.2 | Current native checks cover version choice, replacement, rollback, removal, restore, default protection and repair. |
| 3.3 | Older/current selection and persisted activation passed with two genuine KJV revisions. The ledger's earlier All of Grace case covers that catalogue title. |
| 3.4 | Damaged Easton data was rejected. A pinned repair created a separate verified generation and preserved damaged bytes. All of Grace has earlier book-specific evidence. |
| 3.5 | All 105 files in the current QA storage snapshot survived a real write failure unchanged. Retry succeeded and restored the original mode. The historical 127/133-file counts describe a different inventory. |
| 3.6 | Native plugin disable during a JFB repair cancelled the live job. Re-enable reopened 21,114 commentary entries. The suite also exercises queued writes and partial cleanup. |
| 3.7 | Local preview preparation has dedicated shutdown, discard, replacement, database closure and stale-result regressions across the real corpora. |
| 3.8 | Interrupting a real response socket retained the prior digest and active version. The native Retry action completed the pinned transfer. |
| 3.9 | The native management dialog displayed two publisher digests and applied the reviewed KJV update. Both dated 31,102-entry versions remained readable through rollback, reselection and restart. |
| 3.10 | Native removal and restore preserved owned data. The selected default KJV had removal disabled. |
| 3.11 | The native HTTP client resumed at the saved byte after restart. Transport regressions exercise malformed ranges, changed validators and checkpoint failures. |
| 3.12 | A prepared stage recovered to the expected generation. The incomplete stage offered no recovery action. |
| 3.13 | Discover Cancel retained 551,838 bytes. The subsequent native publisher response was HTTP 206 from that byte. |
| 3.14 | The visible Cancel/Retry target operated during progress. Regression coverage checks handlers and focus for terminal/background updates. |
| 3.15 | Two selected stage folders totaling 373.4 KB reached the QA vault Trash. Source files and protected active generations survived. |
| 3.16 | Desktop socket cancellation, timeout and early termination have transport coverage. The mobile request adapter exposes installation cancellation while its host transfer may continue. |

## Interlinear

| ID | Result |
| --- | --- |
| 4.1 | The pinned, attributed Berean corpus and its published terms are documented with the dataset. |
| 4.2 | The selected presentation keeps KJV text distinct from Berean gloss and recorded word order. |
| 4.3 | Native Greek/Hebrew selection exposes original token, transliteration, gloss, identifiers and grammar. Changing word order survives a full application restart. |
| 4.4 | Hebrew source order is RTL, English rank is LTR, mixed-language data is retained and all 17 explicit empty records remain present. |
| 4.5 | Every one of the nine source fields was compared across 443,625 words in 31,102 verse records. Native representative passages cover Hebrew, Greek, Aramaic and an empty record. |

## Rich resources

| ID | Result |
| --- | --- |
| 5.1 | The bounded semantic model has parser, link and DOM coverage for structured formatting. |
| 5.2 | The rendering tests cover allowlisted elements, unsafe links, inherited names, malformed input and bounds. |
| 5.3 | Native references exercise book entry, dictionary headword, commentary coordinates, passage preview and Back. Missing and cross-chapter cases retain the original coordinates. |
| 5.4 | The native reader exposes original source and distinct Bible notes. Parser-limit regressions check full plain-text fallback. |
| 5.5 | All 56,984 retained records matched the pinned inputs. The independent oracle matched all 25,882 applicable text projections. |
| 5.6 | Real book, devotional and graphic entries opened in the native dock. Contents, Back, January anchor and a 1,142 × 784 map exercised the respective readers. |
| 5.7 | Easton, JFB and imported KJV checks covered saved query, nested commentary/passage links, original GBF and source-note separation. |
| 5.8 | Quick Jump and the four-target citation moved focus to the requested verse. Dictionary Back returned focus to the restored heading. |
| 5.9 | Native wide/narrow captures and the prior five-action toolbar checks cover selected-verse controls and source notes. |
| 5.10 | The native devotional index reached January with target focus. The historical index check covers horizontal table scrolling, date/time and Back. |
| 5.11 | The five-theme matrix includes rich commentary in both appearances and dock widths. The separate native citation run verifies link destinations. |
| 5.12 | Source-specific identifiers are preserved after normalization. Tests reject foreign and oversized metadata and require reinstall for older incomplete records. |
| 5.13 | The MHC verifier checks all 4,249 sections against retained OSIS, projected text and the independent source oracle. |
| 5.14 | The native MHC view retained headings, emphasis, small caps and superscript. Original source and single/multiple target previews opened. |
| 5.15 | Appending Genesis 1 sections preserved selection and focused the first appended heading. |
| 5.16 | Psalm 88–89 paged through 89:52. The source's James 9:7 target displayed its unavailable state and left the Reader passage intact. |

## Release verification

| ID | Result |
| --- | --- |
| 6.1 | The macOS four-view, five-theme matrix and the separate contrast series passed. |
| 6.2 | Default and Minimal were checked at narrow and wide sizes. The theme and window settings were restored. |
| 6.3 | Things Light and Dark ran in the current native matrix. The earlier Things-specific link/Escape run covers focus return. |
| 6.4 | The exact 1,475-file package passed fresh startup and full restart. Bundled WEB, KJV and the labelled companion opened. |
| 6.5 | Orca 43.1 on native Linux announced tab navigation, word position, missing gloss, grammar and the Strong’s entry on the exact ZIP. Speech was captured on the guest's audio monitor. |
| 6.6 | Windows and network-isolated Linux passed native fresh startup and full restart on the same ZIP as macOS. |
| 6.7 | Physical iPad acceptance is in progress. The shipped manifest remains desktop-only. |
| 6.8 | Physical slower-device timing and responsiveness are in progress. |
| 6.9 | The current 501-test suite, TypeScript, production build, clean extraction and offline data smoke passed on macOS and CI. The ZIP hash matched on all three desktop systems. |
| 6.10 | Desktop fresh-install, offline-start and assistive gates passed. The final package still depends on physical mobile acceptance. |
| 6.11 | The source and test reviews are recorded in the prior audit. The new transport, theme cascade, native regression and cross-host ZIP changes received focused review and direct runtime verification. |
| 6.12 | All 68 entries are accounted for here. Final acceptance and artifact identity remain open pending the physical-device results. |
