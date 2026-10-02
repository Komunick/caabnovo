import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

export async function startPostgres(resources?: {
  memory: number;
  cpu: number;
}): Promise<StartedPostgreSqlContainer> {
  const container = new PostgreSqlContainer("postgres:18-alpine")
    .withDatabase("caab_test")
    .withUsername("postgres")
    .withPassword("test-only-password");
  if (resources) container.withResourcesQuota(resources);
  return container.start();
}
