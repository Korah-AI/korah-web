# Issue: Weekly email digest with SAT advice

## Problem

Once a user closes the app they get nothing from us until they come back on their own.
A weekly email with a bit of advice and a nudge back to the app could help with retention
and give people a reason to open the app again.

## Idea

Once a week, send each user a short email with:

- A quick tip or piece of SAT advice (could rotate through a fixed list, or be based on
  their weak skills if we have that data, see `docs/analytics-driven-study-feedback.md`)
- A summary of what they practiced that week (or a nudge if they didn't practice at all)
- A link back into the app

## Open questions

- Who sends this (existing email provider or a new one)
- Opt in or opt out, and where that setting lives
- Cadence: fixed day/time for everyone, or based on signup date
- Content source: static rotating tips first, personalized later once analytics data
  exists
- Unsubscribe handling

## First pass

Keep it simple to start: static tip of the week, sent to everyone who hasn't opted out,
no personalization yet. Personalize later.
