import { auth } from "@/auth";
import { createPersonalDataExport } from "@/lib/account/data-export";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const exportData = await createPersonalDataExport(session.user.id);
  if (!exportData) {
    return Response.json({ error: "Account data could not be found." }, { status: 404 });
  }

  const date = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="persist-fitness-data-${date}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      Expires: "0",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
