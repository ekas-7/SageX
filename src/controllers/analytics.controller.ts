import { AnalyticsOrchestrator } from "../orchestrators/analytics.orchestrator";

export const AnalyticsController = {
  async getGlobal(request: Request) {
    const { searchParams } = new URL(request.url);
    const rawDays = Number(searchParams.get("days") ?? "14");
    const days = Number.isFinite(rawDays)
      ? Math.min(90, Math.max(1, Math.round(rawDays)))
      : 14;
    const payload = await AnalyticsOrchestrator.getGlobalDashboard(days);
    return { ok: true, days, ...payload };
  },
};
