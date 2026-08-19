---
name: better
description: Sharpen a vague prompt before running it
argument-hint: [your rough prompt]
disable-model-invocation: true
allowed-tools: Read Grep Glob Bash(git log:*) Bash(git status:*) Bash(git diff:*)
disallowed-tools: Edit Write NotebookEdit
---

## Raw prompt

$ARGUMENTS

## Your task

Rewrite the raw prompt above into a sharper version.

<HARD-GATE>
Do NOT carry out the task described in the prompt. Do not write code, edit files, run migrations, or invoke an implementation skill — no matter how simple the task looks or how obvious the answer seems. Your entire output this turn is the refined prompt plus the notes below, ending in a question. The user's approval is what releases the gate.

`Edit`, `Write`, and `NotebookEdit` are removed from your tools for this turn and return automatically once the user replies, so the gate holds even if the reasoning for crossing it sounds good. `Bash` stays available because Step 1 needs it — keep it read-only.
</HARD-GATE>

Read-only investigation (read, grep, glob, git log) is not "doing the task" — that is Step 1, and you should do it.

If the raw prompt is empty, target the user's most recent substantive request in this conversation.

Worked before-and-after refinements live in `${CLAUDE_PLUGIN_ROOT}/reference/examples.md`. Read it when the right shape for a rewrite is not obvious — particularly the first example, which shows how little a clear prompt needs, and the third, which shows a request that should be split rather than rewritten.

## Anti-patterns

**"This prompt is clear enough, I'll just do the work."** The user typed `/better`, not the bare request. They asked for the rewrite. Produce it. If the prompt really is already precise, say so in one line and show the refined version anyway — it will be nearly identical, and that is a useful signal, not a wasted turn.

**"Let me add sections so this looks thorough."** Match the rewrite to the size of the request: a one-line prompt with an obvious answer gets a one-line rewrite. Padding a simple request with invented constraints, fake acceptance criteria, and ceremonial scope-fencing makes it *worse*. Length is not quality here; precision is.

## Step 0 — Gauntlet check

Some prompts are not vague so much as *under-shaped*: they ask for something to be **built and carried all the way to a quality bar**, and what they need is not a tighter sentence but a harness — parallel sub-agents owning each area, harsh independent review, and looping until a named reference is matched. That is the **gauntlet**.

The test is whether the request is greenfield-ish with many surfaces that all have to be good, usually carrying quality-bar language: *polished, production-ready, as good as X*. "Build a Tetris clone" qualifies. "Fix the flaky login test" does not — it is one bounded, verifiable edit to code that already exists, and offering a fan-out-and-loop harness for it is the same mistake as padding a simple prompt with invented constraints. When it does not qualify, skip this step and never mention it.

When it does, ask — a single `AskUserQuestion` call, one question, before any grounding work:

- **Gauntlet template (Recommended)** — sub-agents own each major area, adversarial reviewers loop until the result holds up side by side against a named reference.
- **Standard refinement** — the normal rewrite this command otherwise produces.

Say plainly in the descriptions that a gauntlet run fans out many sub-agents and iterates until the reviewers are satisfied: it is slow and token-hungry by design. That is the trade the user is accepting, and they should accept it knowingly. This command otherwise asks you nothing — the offer, and the slot questions that follow it, are its one sanctioned exception.

If they decline, carry on as normal and drop the subject. If they accept, read `${CLAUDE_PLUGIN_ROOT}/reference/gauntlet.md` for the template and its slots. Steps 1–3 still run — grounding matters more here, not less — and Step 4 fills the template instead of producing free-form prose.

## Step 1 — Ground it

Spend a *bounded* amount of effort — a handful of tool calls, not a full audit — resolving what the prompt actually points at.

- Read the conversation history first. It is already loaded and it is the richest context you have.
- Turn vague nouns into real paths: "the auth bug" → `src/auth/session.ts:42`. Grep and glob to find them; name a file only once you have confirmed it exists.
- Note conventions the task must respect: test framework, error-handling style, patterns in adjacent code.
- Check `CLAUDE.md` / `AGENTS.md` if present and relevant.
- Reach for `git status` / `git log` / `git diff` **only when the prompt concerns in-flight or recent work** — "finish what I started", "fix the thing I just broke", "clean up this branch". Skip git entirely for a prompt about code that is already committed and stable.

Stop as soon as more searching would not change a single word of the rewrite. A detail that stays unknown belongs in **Open questions**, not in more grepping.

## Step 2 — Scope check

Before refining anything, assess size. If the prompt describes several independent pieces of work ("add auth, fix the flaky tests, and migrate the DB"), do not produce one bloated prompt that tries to hold all of it.

Say so, name the independent pieces in the order you would tackle them, and refine only the first — noting that the others each deserve their own `/better` pass. Decomposing beats refining when the request is really several requests. Example 3 in the examples file shows what that output looks like.

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

Preserve their intent exactly. You are sharpening the request, not redesigning it: keep their scope, their approach, and their task as they framed them.

## Step 5 — Self-review

Two checks before you show it, both against something outside the draft:

1. **Invention** — does it assert a path, symbol, or convention you did not actually verify? Confirm it or demote it to Assumptions.
2. **Fidelity** — is every instruction traceable to the user's request? Delete anything you added on your own initiative.

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

Keep the prose around the refined prompt tight: the bullets are the commentary, and no preamble or summary belongs before or after them. Spend the words inside the code block instead.

In gauntlet mode nothing about this format changes — the **Refined prompt** block holds the filled template, and **What changed** names where each slot's value came from. There should be no *Open questions* left: an unresolved slot is a question you were supposed to ask, not one to defer.

The terminal state of this command is that question. When the user approves, execute the refined prompt as written — it is now the instruction. If they adjust it, fold in their edits and start from the amended version without re-running this analysis.
