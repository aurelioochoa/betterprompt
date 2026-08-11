---
description: Sharpen a vague prompt before running it
argument-hint: [your rough prompt]
disable-model-invocation: true
---

## Raw prompt

$ARGUMENTS

## Your task

Rewrite the raw prompt above into a sharper version.

<HARD-GATE>
Do NOT carry out the task described in the prompt. Do not write code, edit files, run migrations, or invoke an implementation skill — no matter how simple the task looks or how obvious the answer seems. Your entire output this turn is the refined prompt plus the notes below, ending in a question. The user's approval is what releases the gate.
</HARD-GATE>

Read-only investigation (read, grep, glob, git log) is not "doing the task" — that is Step 1, and you should do it.

If the raw prompt is empty, target the user's most recent substantive request in this conversation.

## Anti-patterns

**"This prompt is clear enough, I'll just do the work."** The user typed `/better`, not the bare request. They asked for the rewrite. Produce it. If the prompt really is already precise, say so in one line and show the refined version anyway — it will be nearly identical, and that is a useful signal, not a wasted turn.

**"Let me add sections so this looks thorough."** Padding a simple request with invented constraints, fake acceptance criteria, and ceremonial scope-fencing makes it *worse*. A one-line prompt with an obvious answer gets a one-line rewrite. Length is not quality here; precision is.

## Step 1 — Ground it

Spend a *bounded* amount of effort — a handful of tool calls, not a full audit — resolving what the prompt actually points at.

- Read the conversation history first. It is already loaded and it is the richest context you have.
- Turn vague nouns into real paths: "the auth bug" → `src/auth/session.ts:42`. Grep and glob to find them; never name a file you have not confirmed exists.
- Note conventions the task must respect: test framework, error-handling style, patterns in adjacent code.
- Check `CLAUDE.md` / `AGENTS.md` if present and relevant.
- Reach for `git status` / `git log` / `git diff` **only when the prompt concerns in-flight or recent work** — "finish what I started", "fix the thing I just broke", "clean up this branch". Skip git entirely for a prompt about code that is already committed and stable.

Stop as soon as more searching would not change a single word of the rewrite. A detail that stays unknown belongs in **Open questions**, not in more grepping.

## Step 2 — Scope check

Before refining anything, assess size. If the prompt describes several independent pieces of work ("add auth, fix the flaky tests, and migrate the DB"), do not produce one bloated prompt that tries to hold all of it.

Say so, name the independent pieces in the order you would tackle them, and refine only the first — noting that the others each deserve their own `/better` pass. Decomposing beats refining when the request is really several requests.

## Step 3 — Diagnose

Identify what is genuinely underspecified. The usual suspects:

| Gap | What's missing |
|---|---|
| Referent | Which file, function, symbol, or route? |
| Goal | What observable state means this is done? |
| Scope | What is explicitly *out* of bounds? |
| Constraints | API compatibility, perf, deps, style, behavior to preserve |
| Verification | Which tests, which command, what manual check? |
| Format | Diff, new file, explanation, plan? |

Address only the gaps that are real for *this* prompt.

## Step 4 — Rewrite

Write the improved prompt in **second person, addressed to Claude**, as a drop-in replacement the user could paste into a fresh session. Concrete over abstract, paths over descriptions, verifiable over aspirational. Apply YAGNI ruthlessly — cut every requirement the user did not ask for and the task does not need.

Preserve their intent exactly. You are sharpening the request, not redesigning it: never widen scope, swap the approach, or fold in a task they did not ask for.

## Step 5 — Self-review

Before showing it, reread your rewrite with fresh eyes:

1. **Placeholders** — any `TBD`, `<fill this in>`, or hand-wave left in? Resolve it or move it to Open questions.
2. **Ambiguity** — could any line be read two ways? That is the exact defect this command exists to remove. Pick one reading and make it explicit.
3. **Invention** — does it assert a path, symbol, or convention you did not actually verify? Confirm it or demote it to Assumptions.
4. **Fidelity** — is every instruction traceable to the user's request? Delete anything you added on your own initiative.

Fix inline. Do not re-review; fix and move on.

## Output format

Emit exactly this and nothing more:

---

**Refined prompt**

```
<the rewritten prompt>
```

**What changed** — 2–5 bullets, each naming the gap it closes.

**Assumptions** — anything inferred rather than confirmed. Omit the section if there are none.

**Open questions** — only genuine blockers, where a wrong guess would waste real work. Omit if there are none. Cap at three.

Then ask: **"Run this, or want to adjust it first?"** and stop.

---

The terminal state of this command is that question. When the user approves, execute the refined prompt as written — it is now the instruction. If they adjust it, fold in their edits and start from the amended version without re-running this analysis.
