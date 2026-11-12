# MySword+ (development preview)

Independent, theme-adaptive, offline-first Bible reading and study workspace for Obsidian.

The public name is provisional. Not affiliated with the original MySword.

## Develop and test

- Requirements: Node 22+, Python 3, Obsidian.
- Public-domain source: https://ebible.org/Scriptures/engwebp_vpl.zip
- Put the downloaded archive in .research/engwebp_vpl.zip.
- Run: npm install; npm run library:build; npm run check; npm run deploy:test.
- Open the generated test-vault in Obsidian and enable the development plugin.

Data files are generated per book; the reader loads only the requested book.
Community release packaging and sync behavior are not final; distributing only the three default plugin files will **not** install the Bible library yet.

No remote calls are made by this reader. No MySword importer, secondary translation, commentaries or morphology are claimed as implemented.

See the main PLAN.md and design/UIUX-design-plan.md one level above.
