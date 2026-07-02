---
name: Sync Upstream
description: "Use when the upstream Unify Chat Provider has a new release and needs to be merged into the fork. Handles fetching upstream, merging, resolving conflicts, applying the provider picker grouping fix, compiling, packaging the VSIX, installing it, and pushing to the fork. Keywords: upstream sync, merge upstream, new version, update extension, build VSIX, install extension."
tools:
  [
    execute/runInTerminal,
    execute/getTerminalOutput,
    execute/killTerminal,
    read/readFile,
    read/problems,
    read/terminalLastCommand,
    edit/editFiles,
    search/textSearch,
    search/fileSearch,
    search/listDirectory,
    search/codebase,
    todo,
  ]
---

# Goal

Merge a new upstream release from `smallmain/vscode-unify-chat-provider` into the user's fork, apply the provider picker grouping customization, build, install, and push.

# Repository Layout

- **upstream** remote: `https://github.com/smallmain/vscode-unify-chat-provider` (original author)
- **origin** remote: `https://github.com/Witchcraft2k/vscode-unify-chat-provider` (user's fork)
- Working branch: `feat/provider-picker-grouping`
- Local `main` tracks `upstream/main` — do NOT modify it; push to `origin/main` via `git push origin HEAD:main`

# Procedure

Follow these steps exactly. Use the todo tool to track progress.

## 1. Check Repository State

```powershell
cd "I:\Programs\Coding Projects\Unify_Chat_Provider"
git status --short
git log --oneline -3
git remote -v
```

Verify the working tree is clean (no uncommitted changes). If dirty, stop and ask the user.

## 2. Fetch Upstream

```powershell
git fetch upstream --tags 2>&1
```

Identify the new tag (e.g. `v7.8.0`) and list what changed:

```powershell
git log --oneline <previous_tag>..upstream/main
git diff --name-only <previous_tag>..upstream/main
```

## 3. Merge Upstream

```powershell
git merge upstream/main --no-commit 2>&1
```

If there are no conflicts, proceed to step 5.

## 4. Resolve Conflicts

Common conflict patterns and resolutions:

- **`package.json`** — version field: take upstream's version number.
- **`src/commit-message/model.ts`** — if upstream refactored to use `pickLanguageModel`: take upstream's version (`git checkout --theirs`).
- **`src/extension.ts`** — imports: keep BOTH our `language-model-vendors` imports AND upstream's new imports.
- **`src/service.ts`** — keep our `getVisibleProviders()` and `matchesVisibleProvider()` methods but use upstream's `createVsCodeModelId`/`parseVsCodeModelId`. Remove our local `encodeProviderName`/`decodeProviderName`/`parseModelId` if upstream replaced them. Watch for duplicate closing braces after merge.
- **`src/language-model-picker.ts`** — if upstream modified this file, re-apply our grouping enhancements (see section below).
- **`CHANGELOG.md`, `README.md`** — usually take upstream's version.

After resolving each file: `git add <file>`
Verify no conflicts remain: `git diff --name-only --diff-filter=U`

## 5. Apply Provider Picker Grouping

Check if `src/language-model-picker.ts` exists and whether it has our grouping imports. Our customizations to this file:

1. **Import** `getProviderPickerDisplayName`, `isUnifyChatProviderVendor`, `getLanguageModelVendorDisplayName` from `./language-model-vendors`
2. **Add** `getModelVendorLabel()` and `getModelGroupLabel()` helper functions after `getExtensionProviderName()`
3. **Update** `createModelQuickPickItem()` to use `getModelVendorLabel(model)` in the `description` field instead of `model.vendor`
4. **Update** `pickLanguageModel()` to insert `QuickPickItemKind.Separator` items between groups using `getModelGroupLabel()`

If these customizations are already present, skip this step. If upstream changed `language-model-picker.ts`, re-apply them.

Also verify `src/language-model-vendors.ts` exists and is unchanged — this is our custom file that provides the grouping logic.

## 6. Compile

```powershell
npm run compile 2>&1 | Select-String "error TS" | Measure-Object -Line
```

Must be **0 errors**. If errors exist, diagnose and fix. Common issues:
- Duplicate closing braces from merge
- Missing imports after conflict resolution
- Type mismatches from upstream API changes

## 7. Package VSIX

```powershell
npx --yes @vscode/vsce package -o smallmain.vscode-unify-chat-provider-<VERSION>.vsix --no-yarn 2>&1
```

Replace `<VERSION>` with the new version from `package.json`. Do NOT use `--allow-dirty` (not supported).

## 8. Install Extension

```powershell
code --install-extension smallmain.vscode-unify-chat-provider-<VERSION>.vsix --force 2>&1
```

## 9. Commit

```powershell
git add -A
git commit -m "Merge upstream v<VERSION>: <brief summary of upstream changes>"
```

Do NOT include the `.vsix` file (it should be gitignored). Do NOT include `.tia/` folder if present.

## 10. Push

```powershell
git push origin feat/provider-picker-grouping 2>&1
git push origin HEAD:main 2>&1
```

Both pushes should be fast-forward. If not, stop and ask the user.

# Important Notes

- PowerShell: use `Select-Object` instead of `head`/`tail`, use `Select-String` instead of `grep`
- PowerShell: `git merge-base --is-ancestor` produces no stdout — check `$LASTEXITCODE` instead of using `if()`
- `@vscode/vsce` has no `--allow-dirty` flag; dirty trees package fine without it
- Local `main` branch tracks `upstream/main` — leave it alone for future syncing
- Always verify zero TS errors before packaging
