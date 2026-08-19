<p align="center">
  <img src="assets/banner.webp" alt="betterprompt — scattered fragments of a vague request refracted through a prism into a precise prompt naming the file, line, and done-condition" width="100%">
</p>

# betterprompt

A Claude Code plugin that rewrites a rough prompt into a precise, context-grounded one, shows it to you, and waits for your approval before doing any work.

Two commands, same spine, different amount of your attention:

| | `/better` | `/evenbetter` |
|---|---|---|
| Grounds in repo + conversation | yes | yes, deeper |
| Asks you questions | no, except the gauntlet offer | 1–4, multiple choice |
| Unknowns end up as | *Open questions* you may ignore | answered before the rewrite |
| Offers the [gauntlet](#the-gauntlet) | yes | yes |
| Your turns | 1 | 2 |

Both share the same spine: gauntlet check → ground → scope-check → diagnose → rewrite → self-review → stop for approval.

## Why

Most of the cost of a bad result is a vague request. These put one cheap step in front of the work: resolve the vague nouns to real file paths, name the done-condition, state what's out of scope — then let you approve it.

## Install

```bash
/plugin marketplace add aurelioochoa/betterprompt
/plugin install betterprompt@betterprompt
```

To hack on it locally instead, clone the repo and point the marketplace at your working copy — `/plugin marketplace add ~/Repos/betterprompt`. Claude Code symlinks the cache entry at your checkout, so edits are picked up on the next session without a reinstall. Confirm with `claude --debug --debug-file /tmp/cc.log -p ok` and look for the `skillsPath` line naming your working copy.

## `/better`

```
/better fix the auth bug
```

<p align="center">
  <img src="assets/before-after.webp" alt="A blurred 'fix the auth bug' beside a sharp refined prompt naming the file, line, and done-condition" width="90%">
</p>

Claude reads your conversation so far and the repo, then replies with:

- **Refined prompt** — a drop-in replacement you could paste into a fresh session
- **What changed** — which gap each edit closes
- **Assumptions** — anything inferred rather than confirmed
- **Open questions** — only genuine blockers, capped at three

Then it stops and asks whether to run it.

## `/evenbetter`

```
/evenbetter fix the auth bug
```

Same grounding, but Claude investigates *first* and then asks you what it genuinely can't determine — as multiple choice, with options naming real files and real trade-offs it found in your code:

```
Which refresh path is failing?
  › src/auth/session.ts:42 — rotation on renew (Recommended)
    src/middleware/auth.ts:88 — header validation
```

Its recommendation comes first, since it has already read the code. Answer, and it folds your choices in as stated facts — then produces the same refined prompt block and waits for approval.

The design bar is in the skill file: **never ask what a grep would answer.** If grounding leaves nothing genuinely forked, it asks nothing and goes straight to the rewrite.

Use `/better` when you mostly know what you want and just want it sharpened. Use `/evenbetter` when the task is large, ambiguous, or expensive to get wrong.

Called with no argument, both target your most recent request in the conversation.

## The gauntlet

Some prompts aren't vague — they're *under-shaped*. "Build me a Tetris clone" is perfectly clear; what it's missing is a harness. Both commands recognise that shape and offer one:

```
This looks like a build-to-a-quality-bar task. Use the gauntlet template?
  › Gauntlet template (Recommended) — sub-agents own each area, harsh
    reviewers loop until it holds up beside a named reference
    Standard refinement — the normal rewrite
```

Say yes and the refined prompt becomes a filled-in copy of the gauntlet: sub-agents fan out across the major areas, a separate reviewer independently critiques each one as a deliberately harsh critic, and the loop runs until every reviewer is satisfied comparing the result side by side against a named benchmark.

That template has six slots — what's being built, the reference product to be measured against, the aspects each sub-agent owns, the quality standard, the benchmark for the side-by-side, and the technology. Claude fills every slot it can from your prompt and your repo, then asks about whatever's left — in one batched question, same as `/evenbetter`. **No placeholder ships unresolved.** A gauntlet prompt still carrying `[ASPECT 3]` is a broken prompt, not a flexible one.

The slot that matters most is the reference. "AAA quality" gives the reviewers nothing to compare against; "Celeste" or "Stripe's dashboard" gives them a target they can actually hold the result up beside.

Four stanzas get appended to the filled template, each closing a documented failure mode of fan-out-and-loop prompts:

| Stanza | Closes |
|---|---|
| Delegation spec — objective, output format, tools, and owned files per agent | Subagents given a one-line brief misread it and duplicate each other's work |
| Effort scaling — fan-out width stated explicitly, matched to the project | A ten-agent fleet on a project that needed two |
| Definition of done — a granular pass/fail checklist, verified by using the thing | "Loop until satisfied" has no observable end, so it ends when the model feels finished |
| Critic calibration — report everything, filter in a separate pass | Reviewers told to be selective *are*, and the findings you lose are the ones you needed |

The template itself is never reworded; the stanzas follow it. Everything lives in `reference/gauntlet.md`, read on demand by both commands rather than duplicated into each.

The offer only fires on build-shaped requests. A bug fix, a refactor, or a one-flag feature never sees it — spinning up a fan-out-and-loop harness for a one-line change is the same mistake as padding a simple prompt with invented constraints, and the skill files name it as one.

A gauntlet run is slow and token-hungry by design. That's the trade, and the offer says so plainly so you're taking it knowingly.

## Layout

```
.claude-plugin/
  plugin.json        plugin manifest
  marketplace.json   makes this repo installable as a one-plugin marketplace
skills/
  better/
    SKILL.md         rewrite, then wait
    evals/           eval suite for the skill-creator loop
  evenbetter/
    SKILL.md         interrogate, rewrite, then wait
    evals/
reference/
  gauntlet.md        the gauntlet template, its slots, and the four stanzas
  examples.md        five worked before-and-after refinements
```

Custom commands have been [merged into skills](https://code.claude.com/docs/en/slash-commands), so these live in `skills/` rather than `commands/`. `/better` and `/evenbetter` are unchanged; `/betterprompt:better` also resolves.

The two files under `reference/` are read on demand via `${CLAUDE_PLUGIN_ROOT}`. A skill body stays in context for the rest of the session once invoked, so material that's only sometimes needed — five worked examples, the full gauntlet spec — costs nothing until it's actually wanted. `claude plugin details betterprompt` puts the current numbers at ~56 tokens always-on and ~2.7k / ~4.1k on invoke; inlining the reference files would roughly double the second figure for every run, gauntlet or not.

## Design notes

Both commands borrow structure from the `superpowers:brainstorming` skill, which solves an adjacent problem (turning an idea into an approved design):

- A `<HARD-GATE>` block instead of a polite "please wait" — with an explicit carve-out that read-only investigation is *not* doing the task, so grounding doesn't get chilled along with implementation.
- **Named anti-patterns** that quote the rationalization and rebut it. Rules get argued around; a rationalization written down and answered in advance is much harder to talk past.
- A **scope check** before refining, so a prompt that's really four requests gets decomposed rather than compressed into one bloated rewrite.
- A **self-review pass** — placeholders, ambiguity, invention, fidelity — before anything is shown. The ambiguity check matters most: "could this be read two ways" is precisely the defect these commands exist to remove, so it would be strange not to run it on their own output.
- A **checklist and process digraph** in `/evenbetter`, which makes the revision edge explicit: if you amend the refined prompt, it folds your edit in rather than re-interrogating you.

One thing deliberately *not* copied: brainstorming insists every project gets a design no matter how simple. These commands take the opposite line — a one-line prompt gets a one-line rewrite. Padding a simple request with invented constraints makes it worse, and that's named as an anti-pattern too.

### What Anthropic's guidance changed

The rest is tuned against the published prompting guidance rather than against intuition:

- **[Examples](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) are the most reliable steering lever** — 3–5, wrapped in `<example>` tags, diverse enough that no unintended pattern is learned. `reference/examples.md` is five: a one-liner that stays a one-liner, a vague referent resolved, a decomposition, a question round, and a filled gauntlet.
- **Positive exemplars beat prohibitions.** The named anti-patterns stay, since a written-down rationalization is harder to talk past than a rule — but each now carries the behavior it implies, and the demonstration moved to the examples file.
- **[Right altitude](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)** — the gauntlet trigger was a three-row decision table, which is closer to hardcoded if-else than to a heuristic. It's now one sentence of criteria and two cases.
- **[Opus 5 over-verifies when told to verify](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5).** Self-review dropped its placeholder and ambiguity checks — the model does both unprompted — and kept the ones that check the draft against something outside it: invention, fidelity, and (in `/evenbetter`) answer coverage.
- **Opus 5 runs verbose and effort doesn't shorten it**, so conciseness is asked for explicitly, aimed at the prose around the refined prompt rather than the prompt itself.
- **The gauntlet's four stanzas** come from [the multi-agent research writeup](https://www.anthropic.com/engineering/multi-agent-research-system) (delegation needs objective, format, tools, boundaries; scale agent count to complexity) and [the long-running-harness writeup](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents) (agents declare victory early without a granular pass/fail artifact).

## Tweaking it

The two `SKILL.md` files hold the process; `reference/` holds the material they load on demand. Common changes:

- **Skip the approval gate** — remove the `<HARD-GATE>` block and the closing "and stop", and replace with an instruction to proceed directly.
- **Never execute** — drop the final paragraph so the command becomes a pure prompt-rewriting tool.
- **More or less repo digging** — the "bounded amount of effort" line in `better/SKILL.md` Step 1, and "go deeper here" in `evenbetter/SKILL.md` Step 1, are the dials.
- **Question count** — `evenbetter/SKILL.md` Step 3 caps at four; the tool's own hard limit is four questions with four options each.
- **The gauntlet** — Step 0 in both skills decides *whether* to offer it; `reference/gauntlet.md` holds *what* gets offered. Widen the Step 0 criteria to see it more often, delete the step to never see it, or drop the `AskUserQuestion` paragraph and treat the answer as yes to always use it.
- **Your own examples** — replace `reference/examples.md` with refinements from your own repo. This is the highest-leverage edit in the plugin: it steers output shape more reliably than any rule you can write.
- **Let Claude invoke them** — both set `disable-model-invocation: true`, so only you can trigger them by typing the command. Drop that line to let Claude call them through the SlashCommand tool.
- **Pre-loaded shell context** — neither skill injects shell output at expansion time; Step 1 gathers what it needs on demand. To pre-load some anyway, add `` !`cmd` `` lines near the top and add the command to `allowed-tools`.
- **A softer gate** — drop `disallowed-tools` if you'd rather the gate be advisory. See below for what it currently does.

## The approval gate is mechanical

The `<HARD-GATE>` block used to be a request. It's now backed by frontmatter:

```yaml
allowed-tools: Read Grep Glob Bash(git log:*) Bash(git status:*) Bash(git diff:*)
disallowed-tools: Edit Write NotebookEdit
```

`disallowed-tools` removes those tools from Claude's pool for the turn that invokes the skill, and [the restriction clears when you send your next message](https://code.claude.com/docs/en/slash-commands) — which is exactly when your approval arrives. So the gate holds for the refinement and releases itself for the execution, with no way to reason across it.

`allowed-tools` does the opposite: it *pre-approves* the read-only grounding in Step 1 so you're not prompted for each `grep`. It grants, it does not restrict — every other tool stays callable under your normal permission settings, and this grant also clears before the execution turn. It is worth being precise about that, because the opposite reading — that listing tools *limits* the command to them — is the reason this plugin went without the field for so long.

One honest gap: `Bash` has to stay available because Step 1 uses `git log`, and it can't be narrowed to "read-only" as a class. The prose gate still carries that half.

## Testing

The skills ship with eval suites in `skills/*/evals/evals.json` — five cases each, in [skill-creator](https://claude.com/blog/improving-skill-creator-test-measure-and-refine-agent-skills) format, covering the behaviors that are actually gradeable: does a clear prompt stay short, does a vague referent resolve to the fixture path, does a three-part request get decomposed, does a build-shaped prompt trigger the offer, and does the gate hold under pressure to skip it.

```bash
/plugin marketplace add anthropics/claude-plugins-official
/plugin install skill-creator@claude-plugins-official
```

Then ask Claude to `evaluate my better skill with skill-creator`. It runs each case in an isolated subagent, grades the assertions with evidence, and benchmarks with-skill against without-skill so you can see whether a change bought anything for its token cost. Blind A/B between two versions is the check worth running before committing an edit.

Grounding *quality* — whether the paths it finds are the right ones — isn't gradeable from a fixture and stays a manual check against a real repo.

There's a first-party alternative, `claude plugin eval`, which runs cases straight from the repo path, adds a no-plugin baseline arm on its own, and exits non-zero below a threshold — a better fit for CI than the agent-driven loop. It's in early access, so its `evals/**/case.yaml` suite isn't authored here rather than being authored against an unverified schema. `claude plugin eval --help` and `claude plugin details betterprompt` are the starting points if you have access.

Cheap sanity check that needs no eval framework at all:

```bash
claude plugin details betterprompt   # both skills listed = frontmatter parsed, components resolved
```
