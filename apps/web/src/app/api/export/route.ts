import { route } from "@/lib/server";
import { reportList } from "@/services/reports";
import { reportsCsv } from "@/lib/analytics";
export const GET = route(
  async (request) =>
    new Response(reportsCsv(await reportList(request)), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="phytox-reports.csv"',
      },
    }),
);
