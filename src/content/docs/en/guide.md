---
title: How to read the rules
description: What hard constraints, soft guidance, and pending items mean, and how to read each field on a rule card.
---

## Three markers

- **Hard constraint**: must be followed. A rule is a hard constraint only when all three conditions hold: there is a reliable source, or violating it has serious and widely recognized consequences; a concrete check can be written; and the wording contains no soft phrases such as “try to” or “as appropriate”, with any preconditions stated in the rule itself. If you cannot comply, stop and explain; do not quietly work around it.
- **Soft guidance**: follow by default. You may deviate for a reason, but state the reason and cite the rule ID so reviewers can see it.
- **Pending**: statements that have not been verified or research that still needs to be done. They are listed separately at the end of each topic and **are not enforced as rules**. They become rules only after verification.

## Fields on a rule card

| Field | Meaning |
|---|---|
| ID | Such as `AGT-013`. Unique across the site and never reused. You can link directly to `/en/topics/agents/#agt-013`. |
| Check method | **Automated**: a tool or CI can decide directly; **Semi-automated**: a tool finds candidates and a human confirms; **Manual**: only review or drill records can confirm it. |
| Applies to | A rule with no tags applies to all projects; one tagged “Go” or “Web frontend” applies only to that kind of project. When both a language and a project type are tagged (for example “Python” + “backend service exposed to clients”), both must match. |
| How to check | The concrete way to decide whether the rule is satisfied. |
| Reference value | A number without an authoritative source. Treat it as a starting point and adjust it for the project. |
| Sources | Where the rule comes from. Every source shows the date it was checked. |
| See also | When related material is owned by another topic, follow the link there. |

## When a project has its own standards

The project's own written conventions take precedence. Plumbrule is the default when a project has no convention, and a reference when writing one.

## Each concern is defined in exactly one topic

For example, the semantics of idempotency are defined only in “16 API Contracts and Events”; other topics reference it. This prevents the same concern from having two different answers.

## Review

Every topic shows the date it was reviewed and the date of its next review. Fast-moving topics (coding agents, large language models, frontend, and so on) are reviewed every three months; the rest every six months. Topics whose status is “Draft” have not yet had an independent review.

## Not legal advice

Content about law, privacy, and licenses is engineering reference only and is not legal advice.
