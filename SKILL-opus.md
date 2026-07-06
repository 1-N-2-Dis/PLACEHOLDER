---
name: executing-hard-tasks
description: Use when starting a multi-step or ambiguous task, when a result surprises you, when repeated fix attempts stop converging, or before claiming any work is complete.
metadata:
  trigger: Hard/multi-step tasks, surprising results, non-converging fixes, pre-completion claims
  author: Distilled from Claude Fable 5's working method, for Opus 4.8
---

# Executing Hard Tasks

## Overview

Treat the plan as a hypothesis, every action as an experiment, and every result as evidence to re-plan from. Working a hard task is one loop: decompose to expose assumptions → act on the riskiest one → verify by observation → decide again from what you saw.

The failure this skill prevents is **running on rails**: executing step 4 of a plan that step 2's output already invalidated.

## Decomposing

1. **Define done before defining steps.** Before planning anything, write the acceptance check: the exact command you will run or behavior you will observe when the task is finished. If you can't state it, the task is underspecified — resolving that ambiguity *is* the first step, not a footnote.

2. **Name the load-bearing unknown.** List what the plan assumes. Mark the assumption that, if wrong, invalidates the most downstream work. Probe it with the cheapest experiment that could disprove it — a grep, a five-line script, one API call — before building anything on top of it.

3. **Order steps by risk, not by workflow.** The natural order is "set up, build, wire up, test." The correct order puts the step most likely to fail — the unfamiliar API, the parse of real data, the integration boundary — first, while abandoning the approach is still cheap.

4. **Slice vertically.** Get a thin end-to-end path running — ugly, hardcoded, incomplete — before widening any single layer. A vertical slice exercises every interface at once; a polished but unconnected layer verifies nothing.

5. **Plan one verification deep.** Detail only the steps up to the next point where reality can answer back; past that, keep goals rather than steps. Detailed plans beyond a verification point are fiction, and fiction you wrote down demands sunk-cost loyalty later.

## Verifying

- **Predict, then look.** Before running a check, state the output you expect and what would count as failure. A check that could not have failed is ritual, not verification.

- **Observe behavior; don't re-read code.** Evidence is the program doing the thing — run the flow, hit the endpoint, load the page, feed it the real input. "The code looks right" is a prediction, not a result.

- **Reproduce before fixing.** First make the bug happen on demand; the same reproduction passing after your change is the only proof the fix worked. A fix verified against a bug you never saw fires blind.

- **Hunt siblings.** Every bug found is evidence about a pattern, not just a line. Search for other instances of the same mistake before declaring the fix complete.

- **Ask what would make this claim wrong.** Before asserting "it works," enumerate two or three ways the claim could be false and check the cheapest one that discriminates. If nothing you can imagine would falsify it, you haven't understood it.

- **Verify at boundaries, not at the end.** Check each slice as it lands. Deferred verification means a late failure won't localize — you'll be debugging five changes at once.

## Deciding what to do next

After each result, classify it before acting on it:

| The result... | Then |
|---|---|
| Matches your prediction | Continue to the next planned step |
| Surprises you but doesn't threaten the goal | Update your model, adjust the plan, then proceed |
| Contradicts a plan assumption | Stop executing. Re-decompose from the new evidence |

When blocked, name which kind of blocked you are:

- **Missing information you can obtain** → go get it (read, run, search). Never ask a person for what a tool can answer.
- **A decision only the user can make** (scope change, irreversible action, genuine preference) → ask, and bring a recommendation.
- **A flaky or broken environment** → retry once with a variation, then report exactly what failed and what you observed.

**Convergence rule:** the same approach failing twice means your model of the problem is wrong. The third action must be diagnostic — instrument, isolate, read more — never a third variation of the fix.

When uncertain, choose the action that buys the most information per unit cost. When confident, choose the action that finishes the task.

Stop only at one of two states: done and verified, or blocked on input only the user can provide. A plan, a summary, or a promise ("next I would...") is not a finish — it's a signal to keep working.

## Red flags — stop and re-decide

| Thought | Reality |
|---|---|
| "It compiles / typechecks, so it works" | Compilation checks syntax. Run the behavior. |
| "I'm 90% sure; no need to run it" | The bug lives in the 10%. Run it. |
| "One more tweak should do it" (attempt 3+) | Your model is wrong. Diagnose; stop patching. |
| "That result is odd, but let me finish the plan" | Odd means your model is wrong somewhere. Chase it now. |
| "I'll verify everything at the end" | Errors compound. Late failure won't localize. |
| "This edge case probably doesn't matter" | Decide from evidence: check what actually calls it. |
| "I've done a lot; time to summarize what's left" | Effort isn't completion. Finish, or state the true blocker. |
