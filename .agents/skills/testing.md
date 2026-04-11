# Skill: Testing & Verification

Maintaining high quality through automated testing in a containerized environment.

## Environment
- **Runner**: Vitest.
- **Context**: Tests often require the MongoDB container from `docker-compose.yml`.

## Strategies
1. **Unit Tests**: Test domain entities and value objects in isolation.
2. **Integration Tests**: Verify that Payload hooks and domain mapping work together.
3. **Reproduction Scripts**: Create minimal scripts to demonstrate bugs before fixing them.

## Command Reference
- Run all tests: `pnpm test` or `vitest`.
- Watch mode: `pnpm test:watch`.
- Coverage: `pnpm test:coverage`.
