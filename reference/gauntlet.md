# The gauntlet

Read this when the user has accepted the gauntlet offer in Step 0. It is the single source of truth for the template — both `/better` and `/evenbetter` read this same file.

## The template

Fill the slots. Leave every other word exactly as written: the fan-out, harsh-critic, side-by-side, and loop paragraphs are the mechanism, and rewording them dilutes it.

```
I want you to build **[PROJECT / GAME / APPLICATION]** at the level of **[REFERENCE / INDUSTRY STANDARD / SPECIFIC PRODUCT]**. It should be utterly polished, visually impressive, and production-quality, with every aspect carefully implemented—from **[ASPECT 1]** to **[ASPECT 2]**, **[ASPECT 3]**, and anything else you could think of.

Fan out sub-agents and have sub-agents tackle each major area individually so that the project is as close to perfect as possible. You should loop on each item and have a separate sub-agent independently review and critique it to ensure it reaches **[QUALITY STANDARD]**.

Each review sub-agent should be a genuinely harsh critic. It should actively look for flaws, inconsistencies, missing details, poor implementation, visual problems, usability issues, performance problems, and anything that could be improved. If it doesn't meet the required standard, it should keep iterating and improving it.

Don't stop until each sub-agent is completely satisfied with the quality when compared with **[REFERENCE / BENCHMARK]**. It should literally compare the result side by side against the reference and determine which looks, feels, or performs better.

Do this in **[TECHNOLOGY / ENGINE / FRAMEWORK]**. Loop through the process repeatedly until the result is genuinely polished and production-ready.

Fan out sub-agents, perform independent reviews, apply the feedback, and iterate until it is utterly perfect.
```

## Filling the slots

| Slot | What it needs | Where it comes from |
|---|---|---|
| `PROJECT / GAME / APPLICATION` | The thing being built, in a few concrete words | The raw prompt. Nearly always already there. |
| `REFERENCE / INDUSTRY STANDARD / SPECIFIC PRODUCT` | A **named** product, title, or standard to measure against — "Stripe's dashboard", "Celeste", "Apple's Human Interface Guidelines" | Prompt or conversation; ask if absent. This slot carries the whole prompt: reviewers can only judge against something they can actually look at, so "AAA quality" leaves them with nothing to compare. |
| `ASPECT 1` / `ASPECT 2` / `ASPECT 3` | The major surfaces the sub-agents will each own | Infer from the project and the repo; confirm only if the split is genuinely unobvious. |
| `QUALITY STANDARD` | The bar a reviewer applies when critiquing | Usually derived — "the standard set by [REFERENCE]". Rarely worth spending a question on. |
| `REFERENCE / BENCHMARK` | What the side-by-side comparison runs against | Normally the same product as the reference. Collapse them unless the user drew a distinction. |
| `TECHNOLOGY / ENGINE / FRAMEWORK` | Language, engine, framework, deployment target | The repo first — `package.json`, lockfiles, existing source. Ask only if it is greenfield and unstated. |

Resolve every slot you can yourself, then ask for what is genuinely left in **one batched `AskUserQuestion` call** — recommendation first, options drawn from what you actually found. If more than four slots are still open, spend the questions on the reference, the technology, and the aspect split; those three fork the work hardest, and the rest follow from them.

Two rules for the fill:

- **Every slot resolves.** A gauntlet prompt shipped with `[ASPECT 3]` still in it is broken, not flexible. Resolve it, cut it, or ask.
- **Aspects name real surfaces.** "Collision feel", "menu transitions", "mobile layout at 360px" — each one is about to become a sub-agent's entire assignment, so it has to be something an agent can own and a critic can judge. "Quality", "polish", and "UX" are not.

Length is not padding here. The usual "don't inflate a simple prompt" rule is suspended once the user has opted in — they asked for the harness. It still binds the slots: only aspects and constraints they actually care about.

## Append these four stanzas

The six paragraphs above are fixed. These follow them, adapted to the project. They exist because a fan-out-and-loop prompt has four documented failure modes, and each stanza closes one.

### Delegation spec

*Closes: subagents given a one-line brief misread it and duplicate each other's work.*

Give every fanned-out sub-agent four things: its **objective**, the **output format** it should return, **which tools** to use for the job, and its **boundaries** — what belongs to another agent and must not be touched. Name the files or surfaces each agent owns, so two agents never edit the same thing.

### Effort scaling

*Closes: a ten-agent fleet on a project that needed two.*

State the fan-out width explicitly rather than leaving it to judgment. Scale it to the project:

- A single surface or a small tool: work directly, or one agent, a handful of tool calls each.
- A few distinct areas: two to four agents, one per area, one reviewer each.
- A genuinely large build: one agent per major area, ten or more, with responsibilities divided up front.

One agent that can finish the job beats three that split it. If cost matters, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` and `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` cap this deterministically, which prose cannot.

### Definition of done

*Closes: "loop until satisfied" has no observable end, so the loop ends when the model feels finished.*

Give the loop something to check itself against:

- A granular checklist file — one line per feature or quality item, each marked passing or failing, written before the build starts and updated as it goes.
- Verification by actually using the result the way a person would, not by reading the diff. A feature is not done because the code looks right.
- Progress notes and commits as it goes, so a fresh context window can pick the work up.
- It is unacceptable to delete or weaken a checklist item to make it pass.

### Critic calibration

*Closes: reviewers follow "only flag what matters" literally and report almost nothing; builders optimize for the checklist instead of the result.*

Reviewers report **everything** they find and let a separate pass decide what is worth fixing — a reviewer told to be selective will be, and the findings you lose are the ones you needed. And hold the builders to the actual goal: no hardcoding to the checklist, no workaround scripts standing in for the real implementation, no solution that only works for the cases being checked. If an item is infeasible or wrong, say so rather than working around it.
