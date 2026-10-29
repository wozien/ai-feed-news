import { and, eq } from "drizzle-orm";
import { HttpError, ok, withHandler } from "@/lib/api/http";
import { requireUser } from "@/lib/api/session";
import { db } from "@/lib/db";
import { briefings } from "@/lib/db/schema";
import { toBriefing } from "@/lib/mappers";

export const runtime = "nodejs";

export const GET = withHandler(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;

  const [row] = await db
    .select()
    .from(briefings)
    .where(and(eq(briefings.id, id), eq(briefings.userId, user.id)))
    .limit(1);

  if (!row) {
    throw new HttpError("NOT_FOUND", "简讯不存在", 404);
  }

  return ok(toBriefing(row));
});

export const DELETE = withHandler(async (_request, context) => {
  const user = await requireUser();
  const { id } = await context.params;

  const [row] = await db
    .select({ id: briefings.id })
    .from(briefings)
    .where(and(eq(briefings.id, id), eq(briefings.userId, user.id)))
    .limit(1);

  if (!row) {
    throw new HttpError("NOT_FOUND", "简讯不存在", 404);
  }

  await db
    .delete(briefings)
    .where(and(eq(briefings.id, id), eq(briefings.userId, user.id)));

  return ok({ id });
});
