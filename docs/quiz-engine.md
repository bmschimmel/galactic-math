# Quiz Engine

The quiz engine handles question generation, answer submission, navigation, and live scoring.

---

## Question Generation (`startQuiz`)

When the user clicks Begin Mission, `startQuiz()` builds the question set:

1. **Separate pools per operation** — for each selected operation, all valid question pairs from the selected numbers are generated:
   - Multiply: all `[a, b]` pairs
   - Divide: all `[a*b, b]` pairs where `b > 0`
   - Add: all `[a, b]` pairs
   - Subtract: all `[a, b]` pairs where `a >= b` (no negative results)

2. **Even distribution** — `SESSION_LENGTH` (20) questions are distributed evenly across selected operations using integer division with remainder distributed to the first operations. For example, with 3 operations selected: 7 + 7 + 6 = 20.

3. **Shuffle per pool** — each operation's pool is shuffled independently (Fisher-Yates). If a pool has fewer questions than its quota, questions are repeated randomly to fill the quota.

4. **Interleave** — the picked questions from all operations are combined and shuffled together, so operations appear in random order throughout the quiz.

The final results are two parallel arrays:
- `questions` — array of `[a, b]` number pairs
- `questionOps` — array of operation strings (`'multiply'`, `'divide'`, `'add'`, `'subtract'`)

---

## Question Display

`loadQuestion(idx)` updates the quiz screen for a given question index:
- Sets the question text via `getQuestionText(idx)` (e.g., `"6 × 7 = ?"`)
- Updates the progress bar and counter (`PROBLEM 3 OF 20`)
- Restores any previously submitted answer for that question
- Colors the input green/red if already answered
- Updates nav dots and live score
- Focuses the answer input

---

## Answer Helpers

Two pure functions derive question display and correct answer from the parallel arrays:

```js
getQuestionText(i)   // Returns "a × b = ?", "a ÷ b = ?", etc.
getCorrectAnswer(i)  // Returns the numeric correct answer
```

---

## Answer Submission (`submitAnswer`)

When the user presses Enter (or taps Submit on mobile):

1. Validates the input is a non-empty integer
2. Records the answer in `answers[currentQ]`
3. Compares to `getCorrectAnswer(currentQ)`
4. Colors the input green (correct) or red (wrong) and disables it
5. Shows the feedback flash (`✓` or `✗`)
6. Plays `sounds.correct()` or `sounds.wrong()`
7. If Kessel Run is active and the answer is wrong, adds a 5s penalty
8. Updates nav dots and live score
9. If all questions answered: triggers results (with a 900ms delay for the feedback animation)
10. Otherwise: advances to the next unanswered question after 600ms

The answer search wraps around — if there are no unanswered questions after the current one, it looks backward from the beginning.

---

## Session Length

`SESSION_LENGTH` is `20` by default. With `?debug=1` in the URL, it becomes `1` for fast UX testing.

---

## Navigation Dots

A row of dots below the question counter shows the status of every question at a glance. Each dot has one of these states:

| Class | Meaning |
|---|---|
| (none) | Unanswered |
| `.current` | Currently displayed |
| `.answered-correct` | Answered correctly |
| `.answered-wrong` | Answered incorrectly |

`buildNavDots()` creates the dots once at quiz start. `updateNavDots()` refreshes their classes after every answer.

---

## Live Score

`updateScoreLive()` counts correct answers in the `answers` array on every update and displays `N ✓` in the top-right corner of the quiz screen.

---

## Retry vs. New Mission

From the results screen:

- **Retry** — reshuffles the same question/op pairs and restarts without going back to setup
- **New Mission** — goes back to the setup screen

Both reset `answers`, `currentQ`, `score`, and restart any active timers.
