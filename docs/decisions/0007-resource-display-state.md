# KJV identifiers and independent Resources state

Date: 2026-11-18. Status: implemented; native acceptance partially verified.

The module brief asks for clean reading, optional visible Strong’s identifiers,
and resource switching that preserves context. The installed KJV supplies
phrase-to-Strong’s tags, not complete KJV-to-original-word alignment. Reading
and Word study are enabled; full Interlinear stays unavailable until an
identified alignment dataset is validated.

`kjvInlineStrongs` is a persisted opt-in Reader preference. Identifiers are
inert superscripts within existing tagged buttons and are hidden from duplicate
accessibility announcements: each button already names its source IDs. They
appear only in KJV Word study. They do not alter copied Bible source text.

Resources keeps module choices by category and queries by dictionary ID in its
native leaf state. Restoring only accepts known modules of the matching type
and bounded query strings. The existing lookup parser still validates a full
identifier before calling the local provider. Passive passage updates retain
queries, result context, query focus/caret and scroll position. An incrementing
lookup sequence prevents an old asynchronous response replacing a newer result.

Resources remains an additional right-dock tab. It never replaces the existing
Inspector or its Study/Parallel/Notes controls. Unsupported installed-resource
types remain explicit empty states; catalogue file links do not claim importer
compatibility or successful installation.

Policy tests and native verification details are recorded in STATUS.md's
November 18 continuation. Reload/theme/narrow-pane acceptance remains pending;
all six formats and the catalogue-to-install pipeline remain project scope.
