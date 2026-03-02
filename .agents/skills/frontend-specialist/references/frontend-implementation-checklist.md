# Frontend Implementation Checklist

Use this checklist before considering Angular work complete.

- Requirement and user behavior are explicit.
- Component/service boundaries are clear and maintainable.
- Route and navigation behavior are defined and tested.
- Forms include validation and clear error messaging.
- All UI states are implemented: loading, success, empty, and error.
- API integration handles happy path and failure modes.
- Types are strict; avoid `any` unless justified.
- Accessibility baseline is met (keyboard, labels, semantics).
- Performance pitfalls are addressed (`OnPush`, `trackBy`, unnecessary rerenders).
- Tests cover core behavior and high-risk regressions.
- Reuse existing design system/components where appropriate.
- Follow-up technical debt is explicitly tracked.

