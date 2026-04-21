import { API_ENDPOINTS } from "@/src/lib/apiEndpoints";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const endpoints = API_ENDPOINTS.map((e) => ({
    ...e,
    url: `${origin}${e.path.replace(/\[id\]/g, ":id")}`,
  }));

  return Response.json({
    name: "sagex",
    origin,
    endpoints,
    note:
      "Replace :id in `url` with a real id for dynamic segments (e.g. arena problem id, vibe submission id).",
  });
}
