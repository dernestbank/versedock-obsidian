# Management focus and opening ownership

Date: November 24, 2026. Active development host: Nana’s Mac mini.

The flow is Manage resources -> Rescan storage -> newer keyboard navigation,
source disclosure or external typing -> delayed success/failure. Completion must
preserve the newer context. In addition, an operation from an old modal opening
must not refresh a reopened instance or clear a newer operation’s busy state.

The component records scoped control identity and open disclosure/scroll state
before rebuilding the same resource. Catalogue and attribution scopes distinguish
identical publisher links. It restores focus only through the existing guarded
animation-frame helper; absent reloading links use their source summary. Resource
changes reset disclosure context. A vanished resource leaves Close accessible.
Operations carry an opening token checked before any completion UI mutation.

The production patch is in src/ui/module-management-modal.ts. Tests are in
tests/management-context.test.ts; shared unit DOM support is in tests/ui-fixture.ts.
No module preparation, ownership, installation, removal or storage policy changes.
Source data and the KJV/Berean companion presentation are unchanged.

Browser plugin not available; connected Mini Playwright was used with no new
dependencies. URL: http://host.docker.internal:56062/. Production UI renders with
controlled metadata/operations and host shims; light/dark colors and the scroll
container are fixture conditions. No actual file read or management write occurs.
Do not infer native/community-theme/mobile/screen-reader/slower-device acceptance.

## Management context and operation openings — November 24, 2026

Resource management now retains the current resource’s expanded source panels,
scroll and scoped keyboard focus through completion or inventory changes. Newer
Close focus, source summaries and publisher links remain in context. A source link
that is still reloading falls back to its containing summary; it does not jump
later. External typing remains untouched. Normal initiating-action restoration
still works. Selecting a different resource starts its own closed disclosures;
when a reviewed resource disappears, Close remains available and focused.

Operation completion is bound to its requesting opening. Closing/reopening the
same modal permits a new operation, and old success/failure callbacks cannot
refresh that opening or clear its newer busy state. The existing shared module
transactions and data protections are unchanged.

Sixteen new cases pass; twelve fail against the exact pre-fix source. Five
independent context/opening/resource-scope mutations fail their intended tests
and source is restored. The fixture was extended to model dataset attributes,
details, ancestor lookup and animation frames; an initial strict-check failure
from loose fixture typing was retained and corrected before the full green run.
Six browser baseline cases reproduce actual focus loss/collapsed details. The
initial Tab probe’s inaccurate Close label is retained separately; the final
baseline tabs until Close is actually focused.

Twenty-four production-modal Chromium cases pass at 1100/390 x 1000 with controlled
light/dark host variables, inventory and delayed operations. Page identity, nonblank
content, overlays, console, keyboard/actions, screenshots and overflow checks pass.
The fixture supplies a scrolling content area and performs no real management
writes or native Obsidian actions. This is not native/theme/device/assistive proof.
Artifacts and reproduction code are outside the repo under sibling
.sworddock-qa/management-context-2026-11-24. The QA server is stopped/56062 closed.

Full Mini/Linux **488-test / 70-file** checks, strict TypeScript and build pass.
Linux takes **98.136 seconds**, all **1,690** inputs unchanged,
fingerprint `d0b924f651dbed33494cfe4cfcc0749e5057229e5af2c9d533f68e4700f28ac0`.
Six-source import/reopen, management and recovery pass. Matching bundles:
**394,340 bytes**, SHA-256
`27e1a4314441cde1437971301be88b2ea16238636ab8b40dce6dd381b49e19b1`.
Two identical **1,475-entry / 34,957,736-byte** previews pass clean-install/
offline-restart data smoke, SHA-256
`56c9f8db2c4c9c3840125a0d985ada10b12b2bd4b1bacf214aad84586dd61253`.
Only isolated dev/test-vault is deployed; its core files match. HEAD and dependency
lock remain unchanged. No native Mini UI, personal vault, OS permission, commit,
publication or permanent user-data deletion changed.

All 107 production TS files, styles.css, 25 scripts and esbuild.config.mjs have
source inspection. Full accumulated test/evidence review and all open native/
source-update/failure/final ZIP/platform/theme/assistive/slower-device acceptance
remain incomplete. The Mini QA-only AppleScript exception remains unanswered.
Development stays on the mini and the full completion goal is active.
