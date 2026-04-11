# Skill: Payload CMS Management

This skill covers the configuration and extension of the Payload CMS backend.

## Key Responsibilities
- **Collection Definitions**: Creating and modifying collections in `src/collections/`.
- **Access Control**: Implementing granular permissions using `authenticated` and `anyone` helpers.
- **Hooks**: Utilizing `beforeChange`, `afterRead`, and `beforeValidate` for data normalization and domain mapping.
- **Field UI**: Configuring `admin` properties for better usability in the CMS dashboard.

## Patterns
- **Domain Mapping**: Use `beforeValidate` and `beforeChange` hooks to sync Payload data with domain entities (e.g., in `src/collections/Loans.ts`).
- **Slugs**: Ensure consistent use of slugs for collection identification.
- **Relationships**: Properly use `relationship` fields to link users, items, and transactions.
