import { notFound } from "next/navigation";
import { buildMongooseErDiagram } from "@/src/lib/schemaDiagram";
import { schemaDiagramModels } from "@/src/lib/schemaDiagramModels";
import { SchemaDiagram } from "./SchemaDiagram";

export const metadata = {
  title: "DB schema (dev)",
};

export default function DevSchemaPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const diagram = buildMongooseErDiagram(schemaDiagramModels);

  return (
    <div className="mx-auto max-w-6xl p-6 text-zinc-100">
      <h1 className="mb-2 text-2xl font-semibold tracking-tight">
        Mongoose schema map
      </h1>
      <p className="mb-6 text-sm text-zinc-400">
        Generated from your Mongoose models in{" "}
        <code className="rounded bg-zinc-800 px-1 py-0.5 text-zinc-200">
          src/models
        </code>
        . Refs and logical string foreign keys are shown as relationships.
        <span className="mt-2 block text-zinc-500">
          <strong className="font-medium text-zinc-400">Player (OAuth):</strong>{" "}
          <code>email</code>, <code>accountProvider</code>, and{" "}
          <code>accountId</code> link Google/GitHub sign-ins (sparse; anonymous
          pilots omit them). Sessions expose <code>playerId</code> via Auth.js
          — see <code>auth.ts</code> and{" "}
          <code>GET /api/endpoints</code> (<code>database</code> /{" "}
          <code>auth</code>).
        </span>
      </p>
      <SchemaDiagram diagram={diagram} />
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-zinc-500">
          Mermaid source
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-zinc-900 p-4 text-xs text-zinc-300">
          {diagram}
        </pre>
      </details>
    </div>
  );
}
