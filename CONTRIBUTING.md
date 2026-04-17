# Contributing to Galactic Math Academy

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
https://galactic-math.pages.dev/
```

---

## For Claude Code

When picking up a Linear issue:

1. Only pick up issues that are in the **"To Do"** state **and** have the **"claude"**
   label. Do not work on issues in any other state or without this label.
   If multiple issues match, select by priority first (Urgent → High → Medium → Low).
   Break ties by creation date — pick the oldest issue first.

   **Finding the right issue:** Use `list_issues` with `status: Todo` and
   `labels: ["claude"]`. If the response is saved to a file that is too large to
   read (the JSON is a single line), do **not** try to parse it with shell tools.
   Instead fall back to `get_issue` with specific IDs — start from the last known
   completed issue number and increment (e.g. try IDT-43, IDT-44, …) until you
   find issues in "Todo" state with the "claude" label.
2. Confirm you are on `main` and it is up to date: `git pull origin main`
3. If no Linear issue exists for the work, create one and assign it to the
   **"Galactic Math"** project and label it **claude**
4. Create a branch following the naming convention above
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
