import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export async function startPostgres(): Promise<StartedPostgreSqlContainer> {
  return new PostgreSqlContainer("postgres:18-alpine")
    .withDatabase("caab_test")
    .withUsername("postgres")
    .withPassword("test-only-password")
    .start();
}
