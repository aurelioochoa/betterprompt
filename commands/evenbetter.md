---
description: Ask questions, then sharpen a vague prompt
argument-hint: [your rough prompt]
disable-model-invocation: true
---

## Raw prompt

$ARGUMENTS

## Your task

Rewrite the raw prompt above into a sharper version — but unlike a silent rewrite, **ask the user what you cannot determine yourself first**, then fold their answers into the rewrite.

<HARD-GATE>
Do NOT carry out the task described in the prompt. Do not write code, edit files, run migrations, or invoke an implementation skill — no matter how simple the task looks or how obvious the answer seems. Your output this turn is questions, then a refined prompt, ending in a question. The user's approval is what releases the gate.
</HARD-GATE>

Read-only investigation (read, grep, glob, git log) is not "doing the task" — that is Step 1, and you should do it thoroughly.

If the raw prompt is empty, target the user's most recent substantive request in this conversation.

## Checklist

Create a task for each of these and complete them in order:

1. **Ground** — resolve the prompt against the repo and conversation
2. **Scope check** — decompose first if this is really several requests
3. **Select questions** — only what forks the work and only what you cannot answer yourself
4. **Ask** — one batched `AskUserQuestion` call
5. **Rewrite** — fold every answer in as a stated fact
6. **Self-review** — placeholders, ambiguity, invention, fidelity
7. **Present and stop** — wait for approval

## Process flow

```dot
digraph evenbetter {
    "Ground" [shape=box];
    "Scope check" [shape=box];
    "Needs decomposition?" [shape=diamond];
    "Name the pieces,\nrefine only the first" [shape=box];
    "Anything genuinely forked?" [shape=diamond];
    "Ask (batched)" [shape=box];
    "Rewrite" [shape=box];
    "Self-review" [shape=box];
    "Present + ask approval" [shape=diamond];
    "Execute refined prompt" [shape=doublecircle];

    "Ground" -> "Scope check";
    "Scope check" -> "Needs decomposition?";
    "Needs decomposition?" -> "Name the pieces,\nrefine only the first" [label="yes"];
    "Needs decomposition?" -> "Anything genuinely forked?" [label="no"];
    "Name the pieces,\nrefine only the first" -> "Anything genuinely forked?";
    "Anything genuinely forked?" -> "Ask (batched)" [label="yes"];
    "Anything genuinely forked?" -> "Rewrite" [label="no, ask nothing"];
    "Ask (batched)" -> "Rewrite";
    "Rewrite" -> "Self-review";
    "Self-review" -> "Present + ask approval";
    "Present + ask approval" -> "Rewrite" [label="user adjusts\n(do NOT re-ask)"];
    "Present + ask approval" -> "Execute refined prompt" [label="approved"];
}
```

Note the revision edge: if the user amends the refined prompt, fold in their edits and go straight to the amended version. Do not re-run the analysis and do not ask a second round of questions.

## Anti-patterns

**"I'll ask which test framework / where the config lives / what the file is called."** Every one of those is a grep away. Asking a question the codebase answers is the primary failure mode of this command — it spends the user's attention on work you were supposed to do. Go look.

**"I should ask something so the command feels worth invoking."** Zero questions is a legitimate outcome. If grounding left nothing genuinely forked, skip straight to the rewrite and say why you had nothing to ask.

**"They said X but Y is clearly better, I'll write Y."** An answer that surprises you is information, not an error to correct. Fold in what they chose. If you think it is a mistake, say so in one line *after* the refined prompt — do not quietly override it.

## Step 1 — Ground it

Investigate before you ask anything. The whole value of this command is that the questions are *specific*, which is only possible if you already know what is in the repo.

- Read the conversation history first; it is already loaded and is your richest context.
- Resolve vague nouns to real, confirmed paths. Grep and glob — never name a file you have not verified exists.
- Note the conventions the task must respect: test framework, error-handling style, patterns in adjacent code.
- Read `CLAUDE.md` / `AGENTS.md` if present and relevant.
- Reach for `git status` / `git log` / `git diff` **only when the prompt concerns in-flight or recent work** — "finish what I started", "fix the thing I just broke", "clean up this branch". Skip git entirely for a prompt about code that is already committed and stable.

Go deeper here than a silent rewrite would. **Every fact you establish yourself is a question you do not have to spend on the user.**

## Step 2 — Scope check

If the prompt describes several independent pieces of work ("add auth, fix the flaky tests, and migrate the DB"), do not spend questions refining the details of something that needs splitting first.

Name the independent pieces in the order you would tackle them, then run the rest of this process on the first one only, noting that the others each deserve their own pass.

## Step 3 — Decide what to ask

**The bar: ask only what genuinely forks the work, and only what you cannot resolve yourself.**

Never ask:

- Anything the codebase answers — see the anti-pattern above.
- Preferences with a conventional default and low stakes. Pick the default and note it under **Assumptions**.
- "Is this right?" / "Should I proceed?" — that comes at the end, not here.

Do ask when two readings lead to materially different work: which of several real candidate files is the target, what the done-condition is, whether an ambitious-but-plausible piece is in or out of scope, whether to preserve existing behavior or replace it.

**Ask 1–4 questions. Fewer is better.**

## Step 4 — Ask

Use the **AskUserQuestion** tool. One call, all questions batched.

Quality rules for the options:

- **Concrete, drawn from what you found.** "`src/auth/session.ts` (handles refresh)" beats "the auth file". Real paths, real functions, real behaviors are the point.
- **Put your recommendation first** and suffix its label with `(Recommended)`. You have read the code; you usually have a view, and withholding it makes the user redo work you already did.
- **State the consequence** in each description — what changes about the resulting work if they pick this.
- Use `multiSelect: true` when the choices are not mutually exclusive.
- Use the `preview` field when options are best compared as concrete artifacts — competing phrasings, layouts, code shapes. Skip it for plain preference questions.

Never fabricate an option. If you are unsure a file or approach exists, verify it or leave it out.

## Step 5 — Rewrite

Fold every answer in as a stated fact, not a hedge. If the user picked `src/auth/session.ts`, the refined prompt names that path — it does not say "probably in the auth layer".

Write it in **second person, addressed to Claude**, as a drop-in replacement the user could paste into a fresh session. Concrete over abstract, paths over descriptions, verifiable over aspirational. Apply YAGNI ruthlessly — cut every requirement the user did not ask for and the task does not need.

Preserve their intent exactly. You are sharpening the request, not redesigning it: never widen scope, swap the approach, or fold in a task they did not ask for.

## Step 6 — Self-review

Before showing it, reread your rewrite with fresh eyes:

1. **Placeholders** — any `TBD`, `<fill this in>`, or hand-wave left in? Resolve it.
2. **Ambiguity** — could any line be read two ways? That is the exact defect this command exists to remove. Pick one reading and make it explicit.
3. **Invention** — does it assert a path, symbol, or convention you did not verify? Confirm it or demote it to Assumptions.
4. **Fidelity** — is every instruction traceable to the user's request or their answers? Delete anything you added on your own initiative.
5. **Answer coverage** — is every answer they gave actually reflected? An asked-and-ignored question is worse than one never asked.

Fix inline. Do not re-review; fix and move on.

## Output format

After the questions are answered, emit exactly this and nothing more:

---

**Refined prompt**

```
<the rewritten prompt>
```

**What changed** — 2–5 bullets. Name which answer or which discovered fact drove each edit.

**Assumptions** — anything inferred rather than confirmed or asked. Omit the section if there are none.

Then ask: **"Run this, or want to adjust it first?"** and stop.

---

There is no *Open questions* section here — that is the difference between this command and `/better`. Anything that would have landed there should have been asked in Step 4. If something remains genuinely unresolvable, state it as an explicit assumption.

The terminal state of this command is that approval question. When the user approves, execute the refined prompt as written — it is now the instruction.
