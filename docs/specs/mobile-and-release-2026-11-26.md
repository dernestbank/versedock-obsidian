# SwordDock Bible 0.1.11 release verification

The development ZIP contains 1,475 files and is 34,957,645 bytes. SHA-256 is `b00249d60b78c6525fb018bcd8ad2c6628b5f5b96bbe19fbc431e5fc2b629795`. It enables mobile installation. The only members changed since the five-theme desktop candidate are the manifest and README. The JavaScript, CSS, database engine and bundled libraries are byte-identical.

macOS, Windows and Linux produced this same ZIP. All 501 tests across 73 files, TypeScript, production build and package smoke passed. Each desktop system opened the package in a fresh Obsidian 1.15.1 vault, switched WEB to KJV, opened the labelled Berean companion and a Strong’s definition, and retained English word order after quitting and restarting. The native Linux CI process had only a loopback network interface. [Windows and Linux CI](https://github.com/dernestbank/versedock-obsidian/actions/runs/45806157183)

Orca 43.1 repeated the keyboard pass with the final ZIP in Debian. It announced My library, Downloads and Import, then a Greek word's position, its missing gloss, grammar and offline G3588 entry. The 16 kHz recording contained 20.54 seconds of audio. The [desktop report](native-desktop-2026-11-26.md) covers the five themes, two appearances, narrow and wide panes, verified publisher update, rollback, repair and interruption tests.

## Physical iPads

The iPad Air (5th generation, iPadOS 27.2.1) and iPad Pro (12.9-inch, 3rd generation, iPadOS 26.7.3) both ran Obsidian 1.15.1. Each had a separate, local disposable vault. File Sharing delivered all package members after iCloud reported insufficient quota.

The timing run used the production JavaScript with a QA driver appended to it. The driver invoked the app's commands and visible controls and wrote its measurements to that test vault. Both devices displayed WEB, switched to KJV, opened an offline definition and rendered the expected Berean data for Genesis 1:1 (7 words), John 3:16 (25), Daniel 2:4 (12) and Acts 8:37 (an explicit empty record). Psalm 119 rendered all 176 verses without horizontal Reader overflow.

Each iPad reviewed and installed a 53,248-byte synthetic SQLite book through the normal import form. The driver supplied a browser File to the input. Obsidian's native storage and bundled SQLite engine handled the real bytes. After restarting, both devices recovered the 480 entries and the 25 Greek words in the selected KJV passage. The six original publisher/import types also have a separate native macOS file-picker and restart pass.

On the older Pro, cancelling a JFB install prevented activation. Native Retry install completed the publisher download. JFB, Easton and KJV took 5.64, 1.14 and 5.26 seconds respectively to reach Ready. The installed versions reopened with 21,114, 3,965 and 31,102 entries. Mobile cancellation prevents installation. The host download API may finish an in-flight request. Desktop has separate byte-level cancellation and HTTP range resume.

## Measured responsiveness

Times below are elapsed milliseconds in the native WebView while it was visible. The endpoints include two animation frames after the requested content appeared. These are individual observations on the named devices.

| Interaction | iPad Air | Older iPad Pro |
| --- | ---: | ---: |
| Open WEB Reader | 705 | 723 |
| Library to KJV companion | 391 | 649 |
| Open a Greek word and its dictionary definition | 67 | 113 |
| Quick Jump to the final verse of Psalm 119 | 484 | 512 |
| Review, install and verify 480 SQLite entries | 455 | 658 |

Six consecutive verse selections in the Pro Reader took 34–79 ms, with a median of 38 ms. The largest animation-frame interval in those selections was 52 ms. Quick Jump showed a longer delay. The first Genesis 1:1 jump took 1,042 ms with a 328 ms frame interval. Three additional normal Quick Jump samples took 290–550 ms. Skipping the navigation drawer in a controlled comparison still left frame intervals above 200 ms. The tested preview keeps the normal navigation behavior.

All 1,475 installed files on each iPad matched the final ZIP. The Mac read back the Air’s files over File Sharing. On the Pro, the Mac restored and read back the production JavaScript, then the running verifier checked every installed file’s SHA-256 on the device. Both iPads subsequently relaunched Obsidian with the unmodified plugin and reopened KJV John 3:16 with its labelled Berean companion. The captures exclude the system status bar. [iPad Air after restart](figures/2026-11-26/ipad-air-reader.jpg) · [iPad Pro after restart](figures/2026-11-26/ipad-pro-reader.jpg)
