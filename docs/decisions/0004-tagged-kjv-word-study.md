# ADR-004: Preserve source-tagged KJV words for offline study

Status: Accepted for the local preview, 2026-11-16.

The supplied UI shows red-letter Scripture, an original-language details panel and parallel Bible editions. WEB alone has no verified word tags. Inferring Strong’s identifiers from English wording would give misleading study results.

Bundle [CrossWire KJV 3.1](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=KJV), [Strong’s Greek 2.0](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=StrongsGreek) and [Strong’s Hebrew 1.2](https://www.crosswire.org/sword/modules/ModInfo.jsp?modName=StrongsHebrew). The pinned source hashes are in the converter and manifests. KJV’s original configuration labels distribution GPL and explicitly grants use for any purpose while noting Crown rights to the base text. Preserve that complete notice and all source credits in `library/kjv/SOURCE-LICENSE.md`; do not describe this resource as wholly public domain. Both dictionaries are public domain, with complete original configurations in their notice.

Use the already installed SWORD 1.9.0 public C API at build time. Extract only exact allowlisted paths from hash-pinned source archives into a new temporary directory. Check resolved resource paths and versions. Read KJV’s own chapter verse counts and verify every returned OSIS key; never use nearest-key fallback. KJV has 31,102 verses. It lacks WEB’s Romans 14:24–26 and includes Romans 16:26–27. Preserve these independently rather than remapping or dropping source verses. The common reference parser can represent either coordinate system.

Convert OSIS to inert text tokens, retaining Strong’s identifiers, Greek source forms, morphology codes, added-word italics and red-letter markers. Notes and headings are excluded from verse text, as documented in the source notice. Empty source-word tags are not displayed. The English surface may be a phrase and may link several original words; split source words can share a Strong’s identifier. No one-to-one alignment is promised. WEB remains untagged. The engine is not shipped or linked into the application.

Load at most two Bible books at runtime. Check KJV book sizes before reading, then verify SHA-256 and token bounds. Dictionary lookup accepts canonical G/H identifiers and reads only two fixed, checksummed JSON files. Verify exact source dictionary entry numbers at export; preserve source gaps. Greek lexical forms and transliterations are retained; the older Hebrew resource supplies transliteration/pronunciation in its full entry text, and Hebrew script is not synthesized.

Reader edition selection persists in vault settings. Reader, copy, Quick Jump, insertion and text search use that edition. Cross-reference excerpts remain explicitly labelled WEB. Parallel and chapter Comparison display actual WEB and KJV text independently. Resource and storage inventories include all five resource bundles.

The bottom panel previews a hovered KJV word without broadcasting a passage change or moving focus. Click/Enter pins the word. Once pinned, incidental hover does not replace it. A pure state transition preserves manual collapse and the chosen tab during unrelated Reader updates; Unpin clears it. Word/Lexicon/Occurrences tabs support roving keyboard focus. The Word view uses a compact three-column identity/grammar/definition layout; narrow Reader panes stack the definition below identity and grammar. Long text remains available in Lexicon. Reader pane-width changes keep the selected verse visible, without treating height-only footer expansion as navigation.

Morphology expansions implement the factual code grammar in Maurice Robinson’s public-domain [verb documentation](https://github.com/byztxt/robinson-documentation/blob/master/doc/PARSING.COD) and [declension documentation](https://github.com/byztxt/robinson-documentation/blob/master/doc/DECLINE.COD). The original code remains visible. Only fully recognized schemas, combinations and modifiers are expanded. Hebrew `strongMorph` codes and unfamiliar combinations retain their source code with an unavailable-expansion message. This does not add the separately licensed CrossWire Robinson dictionary or infer grammatical analysis from English words.

Both footer Occurrences and the Inspector offer matching **verses**, deduplicating repeated displayed tokens within one verse. Search scans the installed tagged books, returns an exact total plus a bounded result page, and supports cancellation. The UI exposes 25 results per page, previous/next controls and a source-count explanation. For example, G25 matches 109 displayed tagged KJV verses in these assets. Empty source-word tags were omitted during export, so this is not a count of every original-language word in another source edition. Pagination keeps keyboard focus and moves it to the available paging control at either end. Arrow keys move among tagged words in the same verse; Enter selects one. Source text is never injected as HTML. Word selection is transient across reloads; edition choice persists.

Reproduce assets with the three exact `.research/{KJV,StrongsGreek,StrongsHebrew}.zip` archives and:

```sh
npm run tagged:build -- --sword-library /absolute/path/to/libsword.dylib
```

Ordinary builds use checked-in JSON; neither the engine nor research archives enter the preview ZIP. Tests cover real Greek/Hebrew links, exact-key lookup, both Romans numbering differences, checksums, all token/text joins, missing/tampered/oversized files, metadata recovery, bounded occurrence results and cancellation. Native QA verifies the rendering, edition persistence, selected-word details, keyboard movement and both parallel surfaces. Full mockup fidelity remains a separate gate.

A second export of the final converter produced identical SHA-256 hashes for all 72 generated KJV/dictionary assets, including manifests and notices.

Comparison source choices and its independent passage are stored in native view state. Each pane may select WEB or KJV without changing the Reader's edition. Actual chapter verse-number sets supply an omission notice; identical number sets are not evidence of semantic alignment. A source change retains the other pane's scroll position. Policy tests cover the real Romans 14 difference and malformed view state. Native verification covered both selectors, unaffected-pane scrolling, saved choices/pinned passage after reload, Romans 14's actual warning, John 3's equal-number state, and narrow panes in both themes. Local comparison word study is documented in decision 0006.
