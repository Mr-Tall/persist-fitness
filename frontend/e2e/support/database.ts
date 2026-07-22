import { PrismaClient } from "@prisma/client";

import { getE2EEnvironment } from "./environment";

const environment = getE2EEnvironment();

export const e2eDb = new PrismaClient({
  datasources: {
    db: { url: environment.databaseURL },
  },
});
