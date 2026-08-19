# Worked refinements

Five examples of the output these commands produce, chosen to be different from each other rather than to reinforce one shape. Read them when the right shape for a rewrite is unclear — especially example 1 (when to do almost nothing) and example 3 (when to refuse to rewrite at all).

The repo paths inside are illustrative. Yours come from Step 1.

<examples>

<example index="1" name="A one-liner stays a one-liner">

**Raw prompt:** `bump the node version in CI to 22`

**Refined prompt**

```
In .github/workflows/ci.yml, change the `node-version` in the setup-node step from 20 to 22.
Leave the matrix and every other workflow file alone. Verify with: gh workflow run ci.yml
```

**What changed**
- Named the file and the exact key, so there is nothing to search for.
- Fenced the scope to one step — the repo has three other workflows that also pin Node.

*Why this one is here:* the raw prompt was already clear. The rewrite adds a path, a scope fence, and a check, and then stops. No acceptance criteria, no rollback plan, no risk section. Inventing those would have made it worse.

</example>

<example index="2" name="A vague referent resolves to a real path">

**Raw prompt:** `fix the auth bug`

**Refined prompt**

```
In src/auth/session.ts, refreshSession() at line 42 rotates the refresh token before the new
access token is persisted, so a failed write leaves the user logged out with a token that no
longer validates.

Reorder it: persist the new access token first, then rotate. Preserve the existing
SessionError contract — callers in src/middleware/auth.ts depend on the error codes.

Done when tests/auth/session.test.ts passes, including a new case covering a write failure
mid-refresh. Run: npm test -- session
```

**What changed**
- Resolved "the auth bug" to `src/auth/session.ts:42` and stated the actual failure, so the fix targets a mechanism rather than a symptom.
- Named the done-condition as a test file and command instead of "make it work".
- Fenced `SessionError` as behavior to preserve, since a caller depends on it.

**Assumptions**
- The intended bug is the refresh-ordering one. `git log` shows it reported two days ago; no other open auth issue matches.

</example>

<example index="3" name="Several requests get decomposed, not compressed">

**Raw prompt:** `add SSO, fix the flaky tests, and move us off the old DB`

**This is three independent projects, not one prompt.** Refining them together would produce a prompt that is vague about all three. In dependency order:

1. **Stabilize the flaky tests** — smallest, and it is the thing that will tell you whether the other two broke anything. Refined below.
2. **Add SSO** — depends on nothing else, but wants its own grounding pass on the current auth flow.
3. **Migrate the database** — largest and least reversible; do it once the suite is trustworthy.

**Refined prompt** *(for the first only)*

```
Three tests in tests/api/ fail intermittently in CI and pass locally: users.test.ts,
orders.test.ts, sessions.test.ts. All three share the seedDatabase() helper in
tests/support/db.ts, which does not await its truncate call.

Find the actual source of the nondeterminism — confirm it is the missing await before
fixing it. Do not add retries or increase timeouts; a passing flaky test is still flaky.

Done when: for i in {1..20}; do npm test -- tests/api/; done passes 20/20.
```

**What changed**
- Split one request into three and refined only the first; the other two each deserve their own pass.
- Named the three test files and the shared helper — the common factor is the lead.
- Ruled out retries and timeout bumps explicitly, since those make the symptom disappear without fixing anything.
- Made the done-condition a repeat-run command, because a single green run proves nothing about a flaky test.

</example>

<example index="4" name="/evenbetter folds answers in as facts">

**Raw prompt:** `make the dashboard load faster`

**Asked first** *(one batched call, options drawn from what grounding found)*

> **Which load is slow?** › *Initial page load — `src/pages/Dashboard.tsx` fetches 6 endpoints serially on mount (Recommended)* / *Chart re-renders on filter change* / *Both*
>
> **What is the budget?** › *Under 1s to first meaningful paint* / *Just noticeably better, no number* / *Match the /reports page*

**Answered:** initial page load; match the `/reports` page.

**Refined prompt**

```
src/pages/Dashboard.tsx awaits six endpoints serially in its mount effect (lines 28–61),
so first meaningful paint waits on the sum of all six.

Parallelize them the way src/pages/Reports.tsx already does — Promise.all with the same
useQueries pattern from src/hooks/useQueries.ts. Match Reports' perceived load time; it is
the benchmark.

Keep the existing per-endpoint error handling: one failed endpoint must still render the
rest of the dashboard, as it does today. Out of scope: chart re-render performance.

Verify with the Performance panel, comparing FMP against /reports on the same profile.
```

**What changed**
- "The dashboard" became `src/pages/Dashboard.tsx:28–61` and a named cause: serial awaits.
- The budget became a concrete benchmark — `/reports` — because that is what the user chose over an absolute number.
- Pointed at `useQueries.ts`, an existing pattern in the repo, rather than describing a new one.
- Marked chart re-renders explicitly out of scope, since that was the option not chosen.

*Why this one is here:* every answer appears as a stated fact. Not "probably the initial load" — the refined prompt commits.

</example>

<example index="5" name="A gauntlet-shaped prompt fills the template">

**Raw prompt:** `build me a really nice tetris`

**Offered the gauntlet, accepted.** Slots resolved: project and technology from the prompt and the empty repo; reference and aspect split asked.

**Refined prompt**

```
I want you to build **a browser-based Tetris** at the level of **Tetr.io**. It should be
utterly polished, visually impressive, and production-quality, with every aspect carefully
implemented—from **piece-drop feel and lock delay** to **line-clear animation and juice**,
**menu and settings flow**, and anything else you could think of.

Fan out sub-agents and have sub-agents tackle each major area individually so that the
project is as close to perfect as possible. You should loop on each item and have a separate
sub-agent independently review and critique it to ensure it reaches **the standard set by
Tetr.io**.

[...the remaining four paragraphs of the template, verbatim...]

Do this in **TypeScript and canvas, no framework, deployed as a static site**. Loop through
the process repeatedly until the result is genuinely polished and production-ready.

Fan out sub-agents, perform independent reviews, apply the feedback, and iterate until it is
utterly perfect.

Give each sub-agent an objective, the output format to return, which tools to use, and the
files it owns — piece mechanics, rendering, and menus are three separate owners and must not
edit each other's files. Three areas means three builders and three reviewers, not ten.

Write features.json before starting: one line per item, each passing or failing, covering
SRS rotation, wall kicks, lock delay, DAS/ARR tuning, line-clear timing, and every menu
screen. Play the game to check them — do not mark an item passing from reading the diff. It
is unacceptable to delete or weaken an item to make it pass.

Reviewers report everything they find; a separate pass decides what is worth fixing. No
hardcoding to features.json — the mechanics must be correct generally, not just for the
items being checked.
```

**What changed**
- "Really nice" became a named benchmark, Tetr.io, which reviewers can actually hold the result up against.
- The three aspects name surfaces a sub-agent can own and a critic can judge, rather than "polish".
- Added the four closing stanzas: file ownership per agent, a fan-out width matched to three areas, `features.json` as the done-condition, and report-everything reviewers.

**Assumptions**
- Browser target and no-framework TypeScript, inferred from an empty repo and "browser-based". Say so if you meant native.

</example>

</examples>
