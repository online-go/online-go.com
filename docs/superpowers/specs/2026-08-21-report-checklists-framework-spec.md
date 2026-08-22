# Report Checklists — Framework Spec

Date: 2026-08-21
Status: For review
Lead document. Companions:

- `2026-08-21-report-submission-checklist-feature-spec.md` — the first instance, and the items proposed for it
- `2026-08-21-report-submission-checklist-design.md` — how it is built

## What this is

A capability, not a feature. It establishes that **any class of report can carry a checklist**,
and that adding to a checklist is an act of authoring policy rather than an act of building
software.

This document describes what that capability is, what will stay true about it however far it
grows, and the directions it can grow in. It deliberately does not discuss which report types
get items first or how any particular item should be worded — that is the companion feature
spec's job.

## Why it exists

Wrong reports cost twice. They take community-moderator attention away from real incidents, and
they leave the reporter no wiser — the report is closed, usually without an explanation they can
learn from, and the same person files the same kind of report again. The cost repeats because
nothing about the experience changes what the reporter understands.

The report dialog is where both costs could be headed off, and it does neither. It does not
**screen** — it rarely tells a reporter that what they are describing cannot be acted on. And it
does not **educate** — it does not say what the standard is, at the one moment the reporter is
motivated to find out.

Screening and education are not two features. They are one mechanism seen from two sides: a
check that stops a report has to explain itself to do its job, and an explanation delivered at
the moment of reporting *is* the teaching. That is the observation this framework is built on.

## The idea

A report type declares a list of items. The reporter cannot submit until every item is
satisfied. Items come in two kinds, and the difference between them is who establishes the
claim.

**An attestation is a claim the reporter confirms.** *"I waited a reasonable time for this player
to play."* It does the educating: it names a standard the reporter may not have known, at the
moment they care. It screens by self-selection — someone who cannot honestly tick it has learned
why their report would fail, and has done so without consuming any moderator time.

**A data check is a claim we establish for them.** *"This player did not resign the game."* It
does the screening: it stops a report that cannot be acted on. It educates through its failure
message, which has to explain itself to be worth anything.

The two are different in kind, not degree, and the difference is **agency**. An attestation is
always within the reporter's power to satisfy — that is what the tickbox is for. A failed data
check never is. Everything about how the two behave follows from that one distinction.

## What a reporter experiences

Three situations. Which one they are in depends only on whether they can do something about it.

**Everything is satisfied, or nearly so.** A short list sits between the description and the
submit button. Checks that passed are ticked off; anything outstanding is in the same list, in
the same visual language. The list explains what the button is waiting for.

**Something is outstanding that they can fix.** No different. The unticked item simply stays in
the list and the button stays unavailable. The reporter is never guessing.

**Something failed that they cannot fix.** Different treatment, because their position is
different: nothing they type or tick will help. The failure is raised to the top of the dialog
with its reason, and the rest of the form is removed. The dialog says one thing, and that thing
is an explanation.

**A check could not be run.** It says so, and does not stop the report.

## Why a framework rather than more one-off gates

The dialog already refuses some reports. There are three separate mechanisms doing it, each
added to solve a specific nuisance, and each with its own presentation: one reports its reason as
placeholder text inside a textarea, one replaces the textarea with a line of prose, one shows a
character countdown. There is no shared vocabulary, and no consistent place a reporter learns to
look.

More importantly, the category that does the actual teaching — *here is what you should have
checked before filing this* — cannot be expressed at all. There is nowhere to put it.

So the argument for a framework is not tidiness. It is that:

- **Adding a rule stops being a build.** Today a new gate means new bespoke interface work.
  Afterwards it means writing down a claim and, for a data check, how to establish it.
- **Reporters learn one pattern.** A reporter who has met a checklist once knows what one is,
  wherever they next meet it. That is a precondition for the education to compound.
- **The rules become inspectable.** What a report type requires becomes a list somebody can read,
  review and argue with, rather than behaviour distributed through a dialog's rendering logic.
- **The teaching category exists.** This is the part that does not exist today in any form.

## How it grows

Three independent axes. Movement along one does not require movement along another.

### Coverage — which report types carry items

The obvious axis. Every reporter-facing report type is a candidate. Each item is a policy
decision with translation consequences, so coverage should grow on evidence that a given type is
generating reports the checklist would have deflected — not on the basis that a type happens to
exist.

### Reach — what a data check can see

Today a data check sees what the reporter is already allowed to see: public game data. That
supports claims like *did this game end*, *did the accused resign*, *were enough moves played*.

Beyond that lie checks the browser cannot make:

- Things about the reporter's own history — *you have already reported this game*.
- Things about the wider picture that the reporter cannot see — patterns across recent reports,
  prior findings against the accused, rank movement.

The second group is powerful screening and carries an obligation, stated as an invariant below:
a check may stop a report without disclosing what it knows.

### Authorship — who defines items

Items are defined in code today. Two further routes are visible and neither is foreclosed: an
administrative form allowing items to be added without a deploy, and programmable rules in the
style of the fair-play filters.

**The governance question is deliberately open.** Who should be able to word an attestation that
every reporter of a given type must read is a policy question, not a technical one, and it is not
answered here. What is settled is the technical shape: every read of a report type's checklist
goes through one function, so a new source of items is added in one place rather than threaded
through the dialog.

## Invariants

These hold however far the framework grows. They are the part of this document most worth
disagreeing with now, because changing one later means revisiting everything built on it.

**A reporter is never told a check passed when it did not run.** A check that could not be
completed reports that distinctly.

**A check that cannot be run never blocks.** A network fault must not prevent someone reporting a
genuine incident. We would rather accept some reports we could not verify than silence a victim.

**An attestation is never blocking.** By construction the reporter can satisfy it. Only a data
check can reach the state where the form is cleared.

**Items say what they mean, and mean what they say.** Anything a reporter is asked to confirm is
one of the natural things a careful person would check. Items are not warnings, not cautions and
not threats. Deterrence is a by-product of having to think, never the purpose of the wording.

**A checklist explains, it does not merely refuse.** A blocking item without a usable reason is
not acceptable — refusing without explaining is the behaviour this framework exists to replace.

**A check may stop a report without disclosing what it knows.** Where a truthful explanation
would reveal something about the accused that the reporter is not entitled to see, the
explanation is less specific — but it is never false, and never absent. This is a real tension
with the invariant above, and it is resolved in favour of not leaking.

**The checklist never silently changes what gets filed.** It may tell a reporter their report
belongs elsewhere; it never reroutes them without their knowledge. Anything that changes a report
behind the reporter's back belongs outside this framework.

This is not hypothetical. A sandbagging report is never filed as sandbagging: the server converts
it to a thrown-game report if the accused definitively lost, and to a moderator assessment
otherwise, and the reporter is simply thanked. That conversion is deliberate and is not in
question here — the invariant says only that the checklist will not add more of the same. Where a
checklist item knows a report belongs under a different type, its job is to say so.

**The checklist is a gate, not enforcement.** It runs in the browser. Every server-side rule
stays exactly where it is and continues to apply independently. The framework never becomes the
only thing standing between a bad report and the queue.

**Item identifiers are stable and opaque.** Never renamed, never reused for a different claim.
This costs nothing now and is what makes any later record of what a reporter was shown
meaningful.

## Authoring items

Rules for anyone wording a new item, not just style preference — the last one below is a real
constraint on what a blocking check is allowed to ship.

**Attestations state the natural things a careful reporter would check.** Not warnings, not
cautions, not threats. Deterrence is a by-product of having to think, never the purpose of the
wording.

**Attestation labels are first person and specific to the report type.** *"I waited a reasonable
time for this player to play,"* not a generic *"I have read the guidelines."* Boilerplate that
applies to every report type gets clicked past without being read, which defeats the point of
asking.

**Data-check labels are positive statements about the world** — *"This player did not resign the
game"* — but they serve **the list only**, where a tick or an unticked marker sits beside them.
A blocking failure never renders in that list: it takes over the dialog alone, and shows no label
at all, only its `message`. A label that reads correctly with a tick beside it says nothing about
whether it reads correctly on its own, because it never has to — the blocker never shows it.

**Every blocking message must therefore be self-contained.** With no label and no tick or cross to
carry meaning, the message is the entire explanation. It must state what is actually true about
this case — not a general policy, not a hypothetical — and what the reporter should do instead.

`escaping.enough_moves` was shipped wrong this way and is the worked example. Its message opened
with *"If the other player leaves the game without playing the first move we will automatically
warn them about this."* — a conditional about what the system does in general, never a statement
of what is true about this game. Read under its label, *"Enough moves were played to judge this,"*
crossed out, the omission didn't show: the label supplied the missing fact. Read alone, as a
blocking message now always is, it told a blocked reporter nothing about their own situation. The
fix prepended a fact about the case, as a separately translated sentence joined by a blank line so
the existing translated paragraph could be kept unchanged: *"There aren't enough moves played in
this game to decide whether this player stopped playing."* Its sibling, `stalling.enough_moves`,
had carried that opening sentence from the start and did not need the fix.

**Item identifiers are stable and opaque.** Never renamed, never reused for a different claim.
Repeated here because it is the one rule that also binds anyone editing an item's wording: the id
does not change even when the label or message does.

## What it is not

- **Not a replacement for server-side rules.** Those are the enforcement; this is the
  explanation.
- **Not a moderation record.** Nothing is stored today. A moderator handling a report sees no
  change. Should that ever be wanted, stable identifiers make it additive — but it is a separate
  decision with its own justification to make.
- **Not a way to make reporting harder in general.** Every item added lowers the attention paid
  to all of them, and an over-eager checklist silences real victims. Growth is a cost, not a
  benefit.

## Evidence for continuing to invest

The framework earns further investment by evidence, not by existing.

**For coverage:** a fall in reports of the covered type being closed as inapplicable, *without* a
matching rise in the same complaints arriving under another type. A fall accompanied by that rise
means the checklist screened without educating — it moved the problem, and the honest reading is
that it failed.

**For reach:** a specific check somebody wants that the browser cannot make. Server-side checks
are a real cost and should be pulled by a named need, not built speculatively.

**For authorship:** demand. If items are being requested faster than they can reasonably be
released, that is the argument for an administrative route. Until then, code-defined items going
through review is a feature rather than a limitation.

## Open questions

1. **Governance of items.** Who decides what a report type requires, and who words it? Deferred
   deliberately — see "Authorship".
2. **Whether anything should ever apply to every report type.** Currently nothing does, on the
   grounds that a blanket item trains reporters to click past items generally. If a genuinely
   universal claim emerges, that decision is worth reopening.
3. **Whether a blocked reporter should be pointed somewhere specific.** Today they are told to
   choose a different report type. Naming a likely alternative would screen better; getting the
   suggestion wrong would teach the wrong thing.
4. **Whether answers should ever be recorded.** Not today. The seam is left open.

## Where the first release fits

The first release builds the mechanism, migrates the three existing ad-hoc gates onto it so there
is one vocabulary instead of three, and works a single report type through properly as a
demonstration.

That is deliberately a pilot. Whether screening and educating at this moment actually reduces
wrong reporting is the question the first release exists to answer, and every axis above should
wait on that answer. The specific type, the specific items and their exact wording are in the
companion feature spec.
