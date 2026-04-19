import { AnalyticsController } from "@/src/controllers/analytics.controller";

export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const payload = await AnalyticsController.getGlobal(request);
    return Response.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load analytics";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
