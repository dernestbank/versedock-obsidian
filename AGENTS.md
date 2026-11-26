# Development workflow

- The user expects development progress to be committed and pushed to Git after meaningful verified checkpoints. Do not leave completed work only on the development machine while waiting for full release acceptance.
- Primary development currently runs on the Mac mini. Use the active checkout there; the original Mac checkout is retained as a backup.
- Inspect status and fetch the current remote before syncing. Preserve existing user work and use ordinary fast-forward pushes to the current feature branch.
- Include the source, tests, build inputs, attributed bundled data and documentation needed to reproduce the checkpoint. Review staged contents for secrets and unintended personal data.
- Keep dependency caches, compiled bundles, release ZIPs, test vaults, imported/private resources and raw research evidence out of Git. Curated design QA images referenced by project documentation may be tracked after review.
- Run checks appropriate to changed behavior and verify that the committed tree is self-contained. Record native/platform/assistive/performance limitations honestly; a development checkpoint is not a completed release.
- Do not force-push, rewrite shared history, merge to the main branch, tag or publish a release unless the user authorizes that action.
