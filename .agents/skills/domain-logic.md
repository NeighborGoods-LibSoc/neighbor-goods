# Skill: Domain-Driven Design (DDD) Logic

NeighborGoods separates its core business logic (Domain) from the infrastructure (Payload CMS/Next.js).

## Core Structure
- `src/domain/entities/`: Core business objects (e.g., `Loan`, `Thing`).
- `src/domain/valueItems/`: Immutable value objects (e.g., `ID`, `DueDate`, `LoanStatus`).
- `src/collections/common/mappers.ts`: Functions to convert Payload documents to Domain entities.

## Guidelines
1. **Rich Domain Models**: Business rules should live in domain entities, not in API routes or frontend components.
2. **Value Objects**: Use specific types for IDs, dates, and locations to ensure data integrity.
3. **Validation**: Rely on domain entity constructors and methods to enforce valid states.
4. **Normalization**: Use hooks in Payload collections to ensure data is normalized according to domain rules before being saved.
