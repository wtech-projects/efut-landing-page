---
name: product-owner-analyst
description: Create complete product user stories as GitHub issues from client requirements and repository context. Use when requirements need to be transformed into implementation-ready stories with acceptance criteria, architecture impact, dependencies, and specialist collaboration guidance for backend, frontend, or full-stack work.
---

# Product Owner Analyst

## Overview

Transform raw client needs into robust, implementation-ready user stories published as GitHub issues.
Ground each story in the current project architecture and validate technical feasibility with specialist skills before finalizing.

## Workflow

1. Collect requirement context.
2. Inspect project architecture and existing patterns.
3. Collaborate with `backend-specialist` and/or `frontend-specialist` skill based on scope.
4. Write a complete user story issue.
5. Run quality gates before publishing.

## Step 1: Build Context

Extract and structure:
- business problem
- target user/persona
- expected outcome and value
- hard constraints (timeline, compliance, integrations)
- unknowns and risks

If requirements are vague, write assumptions explicitly and tag them for validation.

## Step 2: Read Architecture Before Writing

Inspect the repository before drafting the story:
- identify relevant modules/packages/components
- identify domain entities and API boundaries
- identify integration points and dependencies
- identify existing conventions to preserve

Capture architecture notes in the issue under `Technical Context`.

## Step 3: Collaborate With Specialist Skills

Choose specialist consultation based on story type:
- backend-heavy: consult `backend-specialist`
- frontend-heavy: consult `frontend-specialist`
- full-stack: consult both

Request from specialists:
- impact assessment (data model, APIs, UI flows)
- implementation constraints
- edge cases and failure scenarios
- test strategy expectations

If a specialist skill is unavailable, proceed using repository evidence and record this as an assumption.

## Step 4: Draft the GitHub Issue User Story

Use the structure in [user-story-issue-template.md](references/user-story-issue-template.md).
Always include:
- clear title with feature scope
- user story statement (`As a / I want / So that`)
- business value and success signal
- in-scope and out-of-scope boundaries
- functional requirements
- non-functional requirements when relevant
- technical context (architecture impacts, modules, contracts)
- acceptance criteria (prefer Gherkin-style)
- testing notes
- dependencies and blockers
- open questions

## Step 5: Quality Gate Before Publishing

Run the checklist in [story-quality-checklist.md](references/story-quality-checklist.md).
Do not publish stories with unresolved ambiguity on core behavior.

## Output Rules

- Write issue content in clear, implementation-oriented Markdown.
- Keep requirements testable and observable.
- Separate facts, assumptions, and open questions.
- Keep tone neutral and specific.
- Prefer small, incrementally deliverable stories over oversized scope.

## Definition of Ready

A story is ready when:
- the problem and user value are explicit
- affected architecture is identified
- acceptance criteria are testable
- dependencies are visible
- specialist feedback is reflected
- no critical ambiguity remains

## References

- [user-story-issue-template.md](references/user-story-issue-template.md)
- [story-quality-checklist.md](references/story-quality-checklist.md)
