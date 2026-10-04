# Fray Labs Homebrew tap

Standalone command-line tools from Fray Labs. Formulae are updated by each tool's release workflow.

```sh
brew install fraylabs/tap/possible
```

Possible releases: https://github.com/fraylabs/possible/releases

The `Update Possible` workflow reads the latest public release and its published
`SHA256SUMS` every hour. It updates only `Formula/possible.rb` using this tap's own
`GITHUB_TOKEN` with Contents write permission. No cross-repository token or new
secret is needed. Other formulae, including Burr, are preserved.

Agents can update immediately after a Possible release:

```sh
gh workflow run update-possible.yml -R fraylabs/homebrew-tap
```

The updater skips older npm-only releases without standalone checksums. It rejects
missing or duplicate checksums, changed checksums for the same version, and never
downgrades an existing formula. `node --test scripts/update-possible.test.mjs`
checks these behaviors with synthetic release fixtures.
