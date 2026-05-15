# Scripts Governance (Root `scripts/`)

This folder contains many historical helper scripts.  
To reduce operational risk, treat only the scripts below as **supported**.

## Supported Scripts

- `start-all.sh` - starts main local stack.
- `stop-all.sh` - stops local services started by scripts.
- `restart-backend.sh` - restarts backend service only.
- `test-auth.sh` - authentication smoke checks.
- `test-login.sh` - login flow smoke test.
- `setup-collections.sh` - collection setup helper (when needed).
- `setup-import.sh` - import-related setup helper.

## Preferred Entry Points

Use these first before calling individual scripts:

- `make verify`
- `make start`
- `make stop`
- `./start-dev.sh`
- `./stop-dev.sh`
- `./check-services.sh`

## Legacy / One-Off Script Policy

Scripts not listed under "Supported Scripts" are considered legacy or ad-hoc.

- Keep them for audit/history unless explicitly approved for deletion.
- Do not use them in onboarding docs or standard workflows.
- If you need one, validate behavior in a disposable/dev environment first.

## Cleanup Plan

1. Confirm no active references from README/Makefile/automation.
2. Move legacy scripts to `scripts/legacy/` in a dedicated cleanup PR.
3. Keep only supported scripts at the root `scripts/`.
