# Native desktop verification, November 26

The Mac mini ran Obsidian 1.15.1 on macOS 26.6.2 in a separate profile and disposable vault. Preview 0.1.11 contains 1,475 files, weighs 34,957,962 bytes and has SHA-256 `8037f4bfd4edbe1bce326c668e6806b1eb356e698a7d817d1a93fcd15074d19f`. All installed package files matched it. A separate fresh vault passed first launch, KJV companion selection and a full process restart on this ZIP. The full local check passed 501 tests in 73 files, TypeScript, production build and offline package smoke.

## Reader contrast and pane sizes

KJV red-letter text inherited each theme’s error color. Eleven of 20 native samples fell below 4.5:1 across John 3:15 and selected John 3:16. Converting the native captures from their embedded display profile to sRGB corrects the previously reported minimum. The original minimum was 2.638:1. The first adjustment reached 4.461:1. Mixing 40% theme red with normal text brought the minimum to 4.998:1.

| Theme | Selected verse, light | Selected verse, dark |
| --- | ---: | ---: |
| Obsidian Default | 3.658 → 8.856 | 4.230 → 6.865 |
| Minimal 9.1.4 | 4.003 → 10.550 | 2.638 → 4.998 |
| Things 2.2.6 | 3.706 → 8.874 | 3.766 → 6.112 |
| Catppuccin 0.4.52 | 4.223 → 6.300 | 4.911 → 6.427 |
| Border 1.13.10 | 4.017 → 9.564 | 4.713 → 6.418 |

The measurement uses the computed text color and the most common painted background pixel in a native word capture. The selected verse and the source’s red-letter distinction remain visible together. [Before](figures/2026-11-26/red-letter-before.jpg) · [After](figures/2026-11-26/red-letter-after.jpg)

The same ten theme/appearance combinations covered Import, the selected My library tab and Read WEB in both ordinary and hover states. All 60 control samples exceeded 4.5:1, with a minimum of 5.719:1. A four-state Catppuccin regression fails on the preceding stylesheet and passes from the freshly installed ZIP.

Each theme ran in light and dark appearance at 960- and 1,510-pixel window widths. Reader and Library panes measured 366 and 746 pixels in the variable-dock pass. Study and Resources measured 250 and 420 pixels. Each of the 80 captures showed the selected passage or the expected Library section. No measured root pane overflowed horizontally. The Library’s arrow keys moved between My library and Downloads, with focus on the selected tab. A second series used a fixed 300-pixel dock and exercised a 316-pixel central pane. [Study](figures/2026-11-26/study-wide.jpg) · [Resources](figures/2026-11-26/resources-wide.jpg) · [Library](figures/2026-11-26/library-narrow.jpg)

## App startup and screen reader

The earlier 94481577 preview passed the Windows and Linux native startup and restart checks. Both opened WEB John 3:16 from a fresh profile, switched to KJV and the labelled Berean companion, loaded an offline Strong’s definition and retained the Berean English order through an application process restart. Windows passed under the native quit lifecycle. Linux ran in a kernel network namespace with only loopback and no external route. [Windows and Linux CI core checks and Windows native run](https://github.com/dernestbank/versedock-obsidian/actions/runs/45793008766)

Orca 43.1 ran in the Debian desktop session over AT-SPI. Native keyboard input moved through My library, Downloads and Import. Orca announced each selected tab. In John 3:16 it announced movement between Greek words, pressed state, the missing gloss, source position, English rank, grammatical description and the G3588 dictionary entry. Speech Dispatcher and eSpeak NG generated a non-silent, 16 kHz recording on the guest audio monitor. The speech transcript and audio stay outside Git with the disposable test artifacts. These observations cover those specific interactions.

## Publisher interruption and retry

In the disposable Mac vault, canceling JFB from Discover retained 551,838 bytes. After a normal Obsidian quit and relaunch, the publisher answered the native client's range request at byte 551,838 with HTTP 206. The visible Downloads queue completed JFB, Easton and the MySword KJV. Their catalogue identities coexist with the six local imports.

A separate repair test closed the QA client's real JFB response socket while the publisher was sending data. The existing active generation remained unchanged and its 21,114 entries opened after the failure. Downloads originally showed only “aborted.” The updated transport reports the interrupted publisher connection and offers Retry. On the updated preview, the socket was closed at byte 527,838. The message appeared in management and Downloads, and the Retry button completed the 5,494,192-byte transfer and verified the original content digest. A loopback regression also checks saved bytes, the retry range and the complete payload.

## Reviewed publisher update and recovery

The starting inventory included a QA-prepared generation from the publisher's April 2015 KJV database. Its dated metadata and 31,102 entries were verified before staging. Management displayed the two complete publisher artifact digests. Selecting **Install reviewed update** fetched the June 2023 catalogue revision. Both 31,102-entry versions remained readable. Selecting the older version and returning to the newer one worked. After quitting and restarting Obsidian, the newer version opened at Proverbs 5:3, retained its default-edition removal protection, and all nine installed resources were present. [2015 publisher bundle](https://www.mysword.info/news/247-manual-install-of-default-modules-using-one-zip-file) · [Current publisher Bibles](https://www.mysword.info/download-mysword/bibles)

A damaged Easton dictionary failed validation. Repair activated a separately verified generation and reopened “Pledge”. The damaged files were preserved. A second local book generation exercised selection, removal and restore. Storage review recovered a complete stage prepared from an actual installer output, withheld recovery for an incomplete stage and protected the active version. The two selected folders moved to the disposable vault Trash (373.4 KB).

## Local sources, citations and word order

The native picker installed six real local modules. After restart their counts were 31,102 Bible verses, 21,114 commentary entries, 3,965 dictionary entries, 22 book entries, 745 devotional entries and 36 graphics entries. The six input fingerprints survived verification unchanged. Native checks opened a separate Genesis 1:4 translator note, a book contents link and Back, the devotional index and January anchor, Easton's Pledge → Loan → Back and a 1,142 × 784 source map and its larger view.

Matthew Henry's Psalm 88–89 citation paged through Psalm 89:52. Its source's James 9:7 citation displayed an unavailable chapter and preserved the current Reader passage. The four-target citation, explicit Reader navigation, continuation focus, retained OSIS and semantic emphasis were exercised. JFB's Colossians 3:6 commentary opened its Ephesians 5:6 target and a nested KJV passage.

The native Reader displayed seven Hebrew words in Genesis 1:1, 25 Greek words in John 3:16, 12 words in Daniel 2:4 and the explicitly empty Acts 8:37 record. Both source and English rank order, keyboard direction, grammar and offline definitions were checked. KJV Scripture remains separate from its labelled Berean companion. The corpus comparison covered all nine fields across 443,625 words, 31,102 verse records and 1,189 chapters, including all 17 empty records. Resource verification covered 56,984 retained source records, 25,882 independent text projections and all 4,249 Matthew Henry sections.
