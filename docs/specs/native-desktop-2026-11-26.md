# Native desktop verification, November 26

The Mac mini ran Obsidian 1.15.1 on macOS 26.6.2 in a separate profile and disposable vault. The final stylesheet preview is version 0.1.11, SHA-256 `a1795ef9ddcac86ee492e65ac790c9ca2b2d6f824e45453c089314af9be5dc64`. All 1,475 installed package files matched this ZIP. The JavaScript bundle is identical to the earlier 94481577 preview.

## Reader contrast and pane sizes

The KJV red-letter text inherited each theme’s error color. In 11 of 20 native samples, the contrast against the painted verse background fell below 4.5:1. Samples cover ordinary John 3:15 and selected John 3:16 in both appearances across five themes. The new stylesheet mixes the theme’s red with its normal text color. The minimum across the same samples rose from 2.91:1 to 4.93:1.

| Theme | Selected verse, light | Selected verse, dark |
| --- | ---: | ---: |
| Obsidian Default | 3.58 → 7.55 | 4.46 → 6.55 |
| Minimal 9.1.4 | 3.92 → 8.78 | 2.91 → 4.93 |
| Things 2.2.6 | 3.64 → 7.51 | 4.09 → 6.01 |
| Catppuccin 0.4.52 | 4.07 → 5.84 | 5.48 → 6.85 |
| Border 1.13.10 | 3.92 → 8.10 | 5.22 → 6.67 |

The measurement uses the computed text color and the most common painted background pixel in a native word capture. The selected verse and the source’s red-letter distinction remain visible together. [Before](figures/2026-11-26/red-letter-before.jpg) · [After](figures/2026-11-26/red-letter-after.jpg)

Each theme ran in light and dark appearance at 960- and 1,510-pixel window widths. Reader and Library panes measured 366 and 746 pixels in the variable-dock pass. Study and Resources measured 250 and 420 pixels. Each of the 80 captures showed the selected passage or the expected Library section. No measured root pane overflowed horizontally. The Library’s arrow keys moved between My library and Downloads, with focus on the selected tab. A second series used a fixed 300-pixel dock and exercised a 316-pixel central pane. [Study](figures/2026-11-26/study-wide.jpg) · [Resources](figures/2026-11-26/resources-wide.jpg) · [Library](figures/2026-11-26/library-narrow.jpg)

## App startup and screen reader

The earlier 94481577 preview passed the Windows and Linux native startup and restart checks. Both opened WEB John 3:16 from a fresh profile, switched to KJV and the labelled Berean companion, loaded an offline Strong’s definition and retained the Berean English order through an application process restart. Windows passed under the native quit lifecycle. Linux ran in a kernel network namespace with only loopback and no external route. [Windows and Linux CI core checks and Windows native run](https://github.com/dernestbank/versedock-obsidian/actions/runs/45793008766)

Orca 43.1 ran in the Debian desktop session over AT-SPI. Native keyboard input moved through My library, Downloads and Import. Orca announced each selected tab. In John 3:16 it announced movement between Greek words, pressed state, the missing gloss, source position, English rank, grammatical description and the G3588 dictionary entry. Speech Dispatcher and eSpeak NG generated a non-silent, 16 kHz recording on the guest audio monitor. The speech transcript and audio stay outside Git with the disposable test artifacts. These observations cover those specific interactions.
