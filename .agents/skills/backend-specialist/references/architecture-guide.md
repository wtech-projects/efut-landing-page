# Spring Boot Architecture Guide

## Layering

- `controller`: HTTP transport concerns only.
- `service`: use cases and business rules.
- `repository`: persistence access and query concerns.
- `domain`/`model`: business state and invariants.
- `config`: framework wiring and technical configuration.

Keep dependency direction inward:
- controller depends on service
- service depends on repository/domain
- repository depends on persistence framework

Avoid lateral coupling between controllers or between services unless it represents a valid domain relationship.

## API Design

- Design resource-oriented endpoints and consistent naming.
- Version APIs when breaking changes are unavoidable.
- Use DTOs for request/response boundaries where needed.
- Keep OpenAPI documentation updated as part of endpoint changes.
- Return clear status codes:
- `200`/`201` for success
- `400` for validation issues
- `401`/`403` for auth issues
- `404` for missing resources
- `409` for business conflicts
- `5xx` for unexpected server failures

## Transaction Design

- Apply `@Transactional` at service layer for use-case boundaries.
- Keep transactions small and focused.
- Avoid remote calls inside long-running transactions.
- Use read-only transactions for pure read flows when helpful.

## Persistence Guidelines

- Model aggregates intentionally; do not expose internal tables as API shape.
- Be explicit on fetch strategy to avoid N+1 surprises.
- Add indexes for query-critical fields.
- Keep migration scripts backward compatible during rolling deployments.

## Reliability and Operability

- Add timeout/retry policies around unstable downstream calls.
- Prefer Feign clients for outbound REST integrations and centralize their configuration.
- Use correlation IDs and structured logging.
- Emit actionable domain events/log entries for critical business actions.
- Design for idempotency on retried commands where applicable.
