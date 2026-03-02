# Backend Implementation Checklist

Use this checklist before considering backend work complete.

- Requirement and business rule are explicit.
- API contract is documented (paths, payloads, statuses, errors).
- OpenAPI documentation is updated and consistent with current implementation.
- Validation is implemented for inputs and business constraints.
- Service layer owns business logic and transaction boundaries.
- Repository changes include query correctness and performance checks.
- External REST integrations use Feign with explicit timeout/error handling configuration.
- Security requirements are implemented (authz/authn, data exposure controls).
- Error handling is consistent and actionable.
- Logging/metrics are sufficient to debug production incidents.
- New behavior has unit/integration/web tests as appropriate.
- Backward compatibility and migration impact are reviewed.
- Technical debt or follow-ups are tracked explicitly.
