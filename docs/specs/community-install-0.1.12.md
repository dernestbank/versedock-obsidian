# SwordDock Bible 0.1.12 Community installation

The public distribution uses WEB for Scripture. It includes the complete Berean companion, Strong’s dictionaries, cross-references and Matthew Henry’s Commentary. The full tagged KJV is absent from the stable tracked tree, source archive, manual ZIP and Community bundle. The preview tag retains its historic sources. An existing local tagged KJV survives an upgrade. Publisher resource installations and local imports remain user initiated.

Obsidian fetches three release assets. The Community version of `main.js` contains the SQLite engine and 1,399 individually compressed library entries. The directory installer needs no additional resource request on first launch. This design makes the JavaScript download approximately 40 MiB. The manual ZIP carries the same text resources in individual files. Every uncompressed resource was compared byte for byte across the two layouts.

macOS, Windows and Linux built the identical Community JavaScript, SHA-256 `efd832bfac202df195d228baf1c5ebdbe430dda740de226c76d5131df0e9d5a6`. Each opened Obsidian 1.15.1 in a disposable vault containing only the three install files, selected the WEB Berean companion, opened a Strong’s entry and restored John 3:16 and the English word order after quitting and restarting. The Linux runner had only loopback networking. [Native Windows and Linux CI](https://github.com/dernestbank/versedock-obsidian/actions/runs/45816688434)

The additional macOS upgrade test began with the published 0.1.11 ZIP, selected its KJV and Berean English order, quit the app and overlaid the three Community assets. The next process loaded 0.1.12, restored the KJV verse and rendered all 25 companion words. These tests exercise the installed files. Directory submission and release publication have separate external records.

All 505 tests passed with the historical compatibility corpus. A clean source archive passed 498 tests and skipped seven cases requiring the historical KJV. It also passed isolated test-vault deployment and reproduced the identical directory bundle. The runtime dependency audit found zero known vulnerabilities.
