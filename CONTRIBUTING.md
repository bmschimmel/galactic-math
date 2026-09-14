# Contributing to Galactic Math

## Workflow Overview

All work is tracked in Linear under the **IDT** project. GitHub issues submitted
by users automatically sync to Linear Triage. Work flows from Triage → Backlog →
To Do → In Progress → In Review → Done.

---

## Branching

Always create a branch from `main` before starting any work. Branch names must
follow this format:

```text
idt-[issue-number]-short-description
```

Examples:

```text
idt-12-add-division-mode
idt-7-millennium-falcon-flyby
idt-23-fix-wrong-answer-sound
```

Never push directly to `main`.

---

## Commit Messages

Every commit message must include the Linear issue ID so Linear auto-links the
commit to the issue:

```text
IDT-12 add division mode to quiz
IDT-12 fix edge case when divisor is zero
```

Keep messages short, imperative, and lowercase after the ID. One commit per
logical change — don't bundle unrelated fixes.

---

## Pull Requests

Open a PR from your feature branch into `main` when the work is ready for review.

PR title format:

```text
IDT-12 Add division mode
```

PR description must include a closing reference so Linear auto-closes the issue
on merge:

```text
Fixes IDT-12
```

Include a brief summary of what changed and how to test it. For UI changes, note
which browser you tested in.

---

## Linear State Transitions

| State | Meaning | What triggers it |
| --------- | ------------------------------------ | --------------------------------- |
| **Triage** | New issue from GitHub, needs review | Auto — GitHub sync |
| **Backlog** | Accepted, not yet scheduled | Manual — you accept from Triage |
| **To Do** | Ready to be worked | Manual — you prioritize |
| **In Progress** | Branch created, actively building | Manual — when you start work |
| **In Review** | PR open, awaiting review | Auto — GitHub PR opened |
| **Done** | Merged to main | Auto — PR merged with `Fixes IDT-XX` |

---

## Testing

This project has no build step. Test by opening `index.html` directly in a browser:

```bash
# From the repo root
open index.html        # macOS
xdg-open index.html    # Linux/WSL
```

Before opening a PR verify:

- [ ] Quiz runs start to finish without errors
- [ ] Correct/wrong sounds play on answer submission
- [ ] Keyboard navigation works (Enter to submit)
- [ ] Comet celebration triggers on a passing score (≥75%) in Standard/Kessel Run modes
- [ ] Results screen shows correct score and missed problems
- [ ] Hyperspace mode difficulty cards appear, countdown works, and quiz ends on timeout with blue jump animation
- [ ] Kessel Run mode timer runs, wrong answers add 5s penalty shown beside input
- [ ] Theme cycler button cycles through all 5 themes without visual breakage
- [ ] Session history shows scores with correct mode labels
- [ ] Footer link opens `pages/feedback.html` and feedback form submits correctly
- [ ] Page is usable on mobile (resize browser to ~375px wide)
- [ ] Browser compatibility banner does **not** appear in Chrome, Safari, Firefox, and Edge
- [ ] Race to Earth mode tested on at least one touch device (Android or iOS) or Chrome DevTools mobile emulation

---

## Documentation

The `docs/` folder contains developer documentation explaining how each part of the app works. After making any code changes, review the relevant docs files and update them if the behavior, structure, or design has changed.

### Changelog

`docs/CHANGELOG.md` must be updated with every PR that changes code. Add an entry under the correct date heading (newest first) using this format:

```markdown
## YYYY-MM-DD

### IDT-XX — Short description of what changed (PR #N)
One or two sentences explaining what was added or fixed and why. Focus on
the user-facing or developer-facing impact, not just what lines changed.
```

Rules:

- One `### IDT-XX` entry per Linear issue, not per commit
- Use the merge date as the date heading
- If multiple issues merge on the same date, group them under a single `## YYYY-MM-DD` heading
- Match the existing tone: plain declarative sentences, no bullet soup

---

## Deployment

Cloudflare Pages deploys automatically on every merge to `main`. No manual deploy
step needed. The live site updates within ~60 seconds at:

```text
https://galacticmath.app/
```

---

## Releases

Releases are cut from `main` and use [semantic versioning](https://semver.org/):
bump the **major** version for a change that reworks how the game is played or
set up, the **minor** version for new modes or features, and the **patch**
version for fixes.

The version string lives in one place: the footer of `index.html`
(`<div ...>vX.Y.Z</div>`). Bumping it is a normal code change — open a Linear
issue, branch, update the footer, add a changelog entry, and get the PR merged
before the release is created.

Once the bump is on `main`, draft the release with the GitHub CLI:

```bash
gh release create vX.Y.Z --draft --target main --title "vX.Y.Z" \
  --generate-notes --notes-start-tag vPREVIOUS
```

- `--generate-notes` lists every PR merged between the previous tag and `main`,
  so nothing needs to be tracked by hand. `--notes-start-tag` is the last
  release's tag (`gh release list` shows it).
- `--draft` lets you edit the notes before anyone sees them. Add a short
  **Highlights** section above the generated PR list; `docs/CHANGELOG.md` has
  the detail to pull from.
- Publishing the draft creates the `vX.Y.Z` git tag on `main`. Tags are never
  created by hand — the release is the tag.

GitHub milestones are optional and are not used when generating release notes.
If you want one as a tracking record, assign it when merging
(`gh pr edit <n> --milestone vX.Y.Z`) and close it when the release ships.

---

## For Claude Code

Multiple Claude Code sessions may be working this repo at the same time, each on a
different issue. The steps below exist to keep them from picking the same issue or
colliding on the same file — don't skip the claim or worktree steps even if you're
the only session running.

When picking up a Linear issue:

1. Only pick up issues that are in the **"To Do"** state **and** have the **"claude"**
   label. Do not work on issues in any other state or without this label — in
   particular, skip anything already **"In Progress"**, since another session has
   already claimed it.
   If multiple issues match, select by priority first (Urgent → High → Medium → Low).
   Break ties by creation date — pick the oldest issue first.

   **Finding the right issue:** Use `list_issues` with `status: Todo` and
   `labels: ["claude"]`. If the response is saved to a file that is too large to
   read (the JSON is a single line), do **not** try to parse it with shell tools.
   Instead fall back to `get_issue` with specific IDs — start from the last known
   completed issue number and increment (e.g. try IDT-43, IDT-44, …) until you
   find issues in "Todo" state with the "claude" label.

   **Hot files:** if the issue touches `assets/js/game.js` or `assets/css/style.css`,
   check for other issues currently **"In Progress"** that touch the same file before
   starting — working two of those in parallel produces a painful merge later. Prefer
   picking a different, non-conflicting issue instead.
2. Claim it immediately: transition the issue to **"In Progress"** in Linear before
   touching git. This is what step 1 checks to avoid two sessions picking the same
   issue — do it before any other step below.
3. If no Linear issue exists for the work, create one and assign it to the
   **"Galactic Math"** project and label it **claude**, then claim it per step 2.
4. Do the work in a dedicated git worktree, not the shared checkout:
   `git worktree add <path> -b idt-NNN-description origin/main`. Run every git
   command against that worktree's path. Never `git checkout` in the shared checkout
   — another session may be actively using it.
5. Make changes only to `index.html` unless the issue explicitly requires otherwise
5a. After making changes, review `docs/` and update any files whose described behavior has changed; always add a `docs/CHANGELOG.md` entry
6. Follow all rules in `CLAUDE.md` — single file, no dependencies, no localStorage
7. Commit with the Linear ID in every commit message
8. Open a PR with `Fixes IDT-XX` in the description
9. Do not merge — leave the PR for human review and approval

After committing, always:

1. Push the branch: `git push origin <branch-name>`
2. Open a PR using GitHub CLI:
   `gh pr create --base main --title "IDT-XX description" --body "Fixes IDT-XX"`
3. Remove the worktree: `git worktree remove <path>` from the shared checkout
