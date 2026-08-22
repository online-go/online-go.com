# Report Submission Checklist — Feature Spec

Date: 2026-08-21
Status: For review
Companion: `2026-08-21-report-submission-checklist-design.md` (the technical design)

## What this is

A proposal to reduce wrong reporting by screening and educating at the moment someone files a
report, rather than closing the report afterwards and hoping they work out why.

The mechanism is a short checklist in the report dialog. Before a player can submit, they
confirm a few things — and we check a few things for them, and tell them what we found.

This document describes what a reporter experiences. It is the one to comment on if you have a
view about the wording of the items, or about whether we should be stopping a report at all in
a given situation. The companion design document covers how it is built.

## The problem

Wrong reports cost us twice.

They take community-moderator attention away from real incidents. And they teach the reporter
nothing — the report is closed, usually with no explanation the reporter can learn from, so the
same person files the same kind of report again next month. The cost repeats because nothing
about the experience changes the reporter's understanding.

The report dialog is where both costs could be headed off, and at the moment it does almost
nothing about either. It is a form: pick a type, write a description, send. It does not
**screen** — it rarely tells a reporter that what they are describing cannot be acted on. And it
does not **educate** — it does not tell them what the standard is, at the one moment they are
actually motivated to find out.

That moment matters. Someone filling in a report is more interested in how reporting works than
they will ever be again. We currently spend it on a blank textarea.

### What is there today, and why it is not enough

The dialog does refuse some reports, so the machinery half-exists. It just does not communicate,
and it has nowhere to put the education.

- Pick **Stopped Playing** on a game where your opponent resigned, and the button greys out. The
  reason exists, but it is grey placeholder text inside the description box: it disappears the
  moment the reporter types, and most people never read it at all.
- Report a game that is **still being played**, and the refusal comes from the server. So the
  reporter writes the whole description, presses the button, waits, and gets *"There was an error
  submitting your report"* — which tells them nothing and reads like a bug.
- Elsewhere the dialog swaps the textarea for a line of prose, or shows a character countdown.

Three different mechanisms, three different presentations, no shared language. And the category
that would do the actual teaching — *here is what you should have checked before filing this* —
does not exist anywhere.

### This is a first step

The problem is site-wide. This proposal works one report type through properly and builds the
mechanism to do the rest. It is a pilot: the point of the first release is to find out whether
screening and educating at this moment actually reduces wrong reporting, before we spend the
effort — and the reporters' patience — on every other report type.

## What we are proposing

A checklist in the report dialog, specific to the type of report being filed. Two sorts of
entry:

**Things the reporter confirms.** A short statement they tick. *"I waited a reasonable time for
this player to play."*

**Things we check for them.** We look at the game and show the result. *"This player did not
resign the game"* — with a tick when it passes. When a check like this fails, it is never shown
as a cross next to its tick in the list: the check moves to the top of the dialog alone, with its
explanation, and the list disappears along with the rest of the form. See "Something they cannot
fix" below.

The reporter cannot submit until everything is satisfied.

## What a reporter sees

There are three situations, and the difference between them is whether the reporter can do
anything about it.

### Everything is in order

Below the description box, a short list headed **Before you can submit**. The checks we have
done are listed with ticks. Anything the reporter still needs to do sits in the same list — a
tickbox to confirm, or a note that the description needs to be longer.

They tick the box, write their description, and the button becomes available. The list sits
directly above the button, so it plainly explains what the button is waiting for.

### Something they can fix

Exactly the same list. The unticked box or the short description simply stays in it, and the
button stays unavailable until it is dealt with.

### Something they cannot fix

Different treatment, because the reporter's position is different: nothing they type or tick
will help.

The failed check moves to the top of the dialog, above the description, with the reason and the
instruction to choose a different type of report. **The description box and the rest of the
checklist are removed.** The dialog says one thing.

This is deliberate. Leaving the form in place would invite the reporter to fill it all in and
then discover the button still does not work — which reads as a broken dialog rather than an
answer. Removing it makes the response unambiguous: this is not the right kind of report, here
is why, try a different one.

### If we cannot run a check

If the check cannot be completed — the game data does not load, something times out — the item
says so plainly, and **does not stop the report**. A network problem must never prevent someone
reporting a genuine incident. Today this case fails silently; the item just disappears.

## The items we propose

Only one report type gets new items in this first version: **Stopped Playing**. Everything
already enforced elsewhere carries on being enforced, just presented properly.

| The reporter sees | Sort | New? |
| --- | --- | --- |
| The reported game is identified | We check | Already enforced |
| The game has ended | We check | **New** |
| This player did not resign the game | We check | Already enforced |
| Enough moves were played to judge this | We check | Already enforced |
| I waited a reasonable time for this player to play | They confirm | **New** |

**"The game has ended"** is the one that changes an outcome rather than just an appearance. The
server already refuses these reports; this stops the reporter reaching that refusal, and
replaces the meaningless error with an explanation given before they have written anything.

**"I waited a reasonable time"** is the only thing we ask the reporter to confirm. It is the
question a moderator would ask first, so asking it up front should divert some reports that
would be closed anyway, and should teach the standard to people who did not know it.

## What is not changing

- **Other report types** keep exactly the behaviour they have now. Score cheating, sandbagging,
  AI use and the rest gain nothing new — their existing requirements are simply shown in the
  new list instead of being invisible.
- **The moderator warning tool** is untouched.
- **Every server-side rule stays exactly where it is.** The checklist runs in the browser; it
  does not replace anything the server enforces.
- **Nothing is recorded.** We do not store which boxes a reporter ticked. The checklist is a
  gate at the moment of reporting, not evidence attached to the report. A moderator handling
  the report sees no change.

## Choices worth challenging

These are settled in the design, but they are judgement calls, and this is the moment to say so
if you disagree.

**No warnings in the wording.** An early draft included a line telling reporters that
deliberately false reports could result in action against their own account. It was dropped as
passive aggressive. The agreed principle is that anything we ask a reporter to confirm should
be one of the natural things a careful person would check — helpful, not cautionary. Deterrence
comes from having to actively confirm the sensible things, not from a threat.

**Nothing appears on every report type.** No blanket "I have read the guidelines" tickbox.
Everyone learns to click past those, and it would train reporters to ignore the items that do
matter.

**An unverifiable check lets the report through.** We would rather accept some reports we
cannot verify than block a genuine victim because a request failed.

**A failed check clears the form.** The alternative — leaving it visible but greyed — keeps more
context on screen. We judged the unambiguous version better, but it is a taste call.

## What we would like your view on

1. **Is "I waited a reasonable time for this player to play" the right thing to ask, and is that
   the right wording?** It is the only thing we ask reporters to confirm, so it carries the
   whole weight of the idea.

2. **Should any other report type get items in the first version?** Score cheating, sandbagging
   and AI use were each considered and deferred, because each item is a policy decision. If one
   of them is causing you enough queue noise to be worth doing now, say so.

3. **Is stopping a report ever the wrong answer?** The checks that block are all cases where the
   report genuinely cannot be acted on. If you can think of a case where a reporter should be
   allowed through anyway, that changes the design.

4. **Where should a blocked reporter be sent?** At present they are told to choose a different
   type of report. Some of them will choose *Other* and write the same complaint. Whether that
   is acceptable, or whether we should say something more specific, is worth a view.

## How we would know it worked

The two halves of the problem need separate evidence, and one is much easier to see than the
other.

**Screening — visible quickly.** Fewer **Stopped Playing** reports closed as inapplicable. This
should show up within weeks, and it is the measure that decides whether to extend the checklist
to other report types.

**Education — slower, and the one that actually matters.** A reporter who is screened out once
should file better reports afterwards. That is the effect that stops the cost repeating, and it
is worth looking for even though we are not instrumenting it specially: it means watching what
happens to people the checklist turns away, not just counting reports.

**The backfire to watch for.** A rise in **Other** reports that are really Stopped Playing
reports in disguise would mean we have moved the problem rather than solved it — screening
without educating. This is the single most important number to check, because a fall in Stopped
Playing reports would otherwise look like success.

**And the basics.** No reports of the dialog appearing broken or stuck.

## Risks

**Suppressing valid reports.** A checklist that is too aggressive stops people reporting real
problems. This is why only one report type gains items, why only one of them is a tickbox, and
why a check we cannot run lets the report through.

**Tickbox fatigue.** Every item added reduces the attention paid to all of them. The single
attestation is deliberate. Items should be added only with evidence that they divert reports
that would have been closed.
