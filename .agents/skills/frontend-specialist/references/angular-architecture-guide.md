# Angular Architecture Guide

## Structure and Boundaries

- Organize by feature domain rather than technical type-only folders.
- Keep shared UI primitives in dedicated shared modules/libraries.
- Keep domain-specific logic inside feature scope.
- Avoid circular dependencies between features.

## Components and Services

- Keep components focused on rendering and interaction orchestration.
- Move API calls and business/data transformation into services/facades.
- Prefer smart/container and presentational separation when complexity grows.
- Keep components small and cohesive.

## State and Data Flow

- Use a consistent strategy for state (Signals, RxJS, or store pattern).
- Keep async flows explicit; model loading, success, empty, and error states.
- Avoid duplicated state in multiple layers when a single source of truth is possible.

## Forms and Validation

- Use reactive forms for complex scenarios.
- Validate on both client and backend-aligned constraints.
- Surface validation errors in a clear and accessible way.

## Routing and Navigation

- Design route trees aligned with feature boundaries.
- Protect routes with guards where required.
- Handle deep links and refresh behavior predictably.

## Performance and Accessibility

- Use `ChangeDetectionStrategy.OnPush` where feasible.
- Use `trackBy` for repeated lists.
- Defer heavy views when possible and avoid unnecessary subscriptions.
- Ensure keyboard navigation and semantic HTML.

## API Contract Alignment

- Keep request/response mappings centralized.
- Normalize backend error payloads into user-facing patterns.
- Document pagination, filtering, sorting, and versioning expectations.

