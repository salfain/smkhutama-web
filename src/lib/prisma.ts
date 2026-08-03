import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL!;

function createPrismaClient() {
  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({ adapter });
}

type PrismaClientInstance = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

function hasCurrentSchema(client: PrismaClientInstance | undefined) {
  return Boolean(client?.lessonSchedule && client?.userAssignment && client?.notification && client?.sensitiveAccessLog && client?.counselingSession && client?.counselingReferral);
}

// Turbopack keeps globalThis alive across hot reloads. After `prisma generate`
// adds a model, the cached client can therefore still expose the previous
// schema until the dev server is restarted. Replace that stale client here.
export const prisma: PrismaClientInstance = hasCurrentSchema(globalForPrisma.prisma)
  ? globalForPrisma.prisma!
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
