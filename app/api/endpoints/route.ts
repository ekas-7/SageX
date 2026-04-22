import { API_ENDPOINTS } from "@/src/lib/apiEndpoints";
import {
  authMetadata,
  dbSchemaMetadata,
} from "@/src/lib/dbSchemaMetadata";

function endpointExampleUrl(origin: string, path: string): string {
  if (path.includes("[...nextauth]")) {
    return `${origin}/api/auth`;
  }
  return `${origin}${path.replace(/\[id\]/g, ":id")}`;
}

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const endpoints = API_ENDPOINTS.map((e) => ({
    ...e,
    url: endpointExampleUrl(origin, e.path),
  }));

  return Response.json({
    name: "sagex",
    origin,
    endpoints,
    database: dbSchemaMetadata,
    auth: authMetadata,
    note:
      "Replace :id in dynamic paths (e.g. /api/arena/problem/:id). Auth uses Auth.js under /api/auth (see `auth` and OAuth callbacks).",
  });
}
