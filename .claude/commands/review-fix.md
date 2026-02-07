---
description: Fix all CodeRabbit review comments on the current PR
allowed-tools: Bash(git:*), Bash(gh:*), Bash(npx:*), Read, Edit, Write, Glob, Grep
---

## Context

- Current branch: !`git branch --show-current`
- Current PR: !`gh pr view --json number,title,url --jq '"\(.number) — \(.title)\n\(.url)"' 2>&1`

## Your task

Resolve ALL CodeRabbit review comments on the current PR. Do up to 3 rounds — each round: fix everything, commit once, push once, then wait for re-review.

### Process per round

1. **Fetch ALL review comments** from CodeRabbit on the PR:
   ```
   gh api repos/{owner}/{repo}/pulls/{number}/comments --paginate
   ```
   Also read the latest review body:
   ```
   gh api repos/{owner}/{repo}/pulls/{number}/reviews --jq '.[-1]'
   ```

2. **Filter to unresolved comments** — skip any that say "Addressed in commit".

3. **Read and understand ALL comments** before making changes. Group by file.

4. **Fix EVERY issue** regardless of severity — critical, major, minor, and nitpicks. Apply ALL fixes without committing between them.

5. **Run `npx tsc --noEmit`** to verify types still compile.

6. **Stage and commit** all fixes as a SINGLE commit:
   ```
   fix: resolve CodeRabbit review feedback (round N)
   ```
   List what was fixed in the commit body. Include:
   ```
   Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
   ```

7. **Push ONCE** to the PR branch.

8. **Post a summary comment** on the PR:
   ```
   gh pr comment {number} --body "## Claude Code: resolved CodeRabbit feedback

   **Round N of 3**

   ### Changes made:
   - [list each fix]

   Waiting for CodeRabbit to re-review..."
   ```

9. **Wait for CodeRabbit** to finish re-reviewing:
   ```
   gh pr checks {number} --watch
   ```

10. **Check if new comments exist.** If yes and round < 3, repeat. If clean or round = 3, stop.

### Important rules

- NEVER push after each individual fix — batch ALL fixes, commit and push ONCE per round
- Each push triggers a CodeRabbit re-review (counts against rate limits)
- Max 3 rounds total — after 3, stop and tell the user
- Always verify TypeScript compiles before committing
- Preserve existing behavior — don't refactor beyond what's requested
