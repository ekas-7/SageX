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
    <main className="app-page">
      <div className="app-page-inner">
        <header>
          <p className="page-label">Developer Tools</p>
          <h1 className="page-title mt-2 text-3xl md:text-5xl">
            Mongoose schema map
          </h1>
          <p className="page-description mt-3 max-w-3xl text-sm">
            Generated from your Mongoose models in{" "}
            <code className="rounded bg-[var(--surface-2)] px-1 py-0.5 text-[var(--text-primary)]">
              src/models
            </code>
            . Refs and logical string foreign keys are shown as relationships.
            <span className="mt-2 block text-[var(--text-muted)]">
              <strong className="font-medium text-[var(--text-secondary)]">
                Player (OAuth):
              </strong>{" "}
              <code>email</code>, <code>accountProvider</code>, and{" "}
              <code>accountId</code> link Google/GitHub sign-ins. Sessions
              expose <code>playerId</code> via Auth.js.
            </span>
          </p>
        </header>
        <SchemaDiagram diagram={diagram} />
        <details>
          <summary className="cursor-pointer text-sm text-[var(--text-muted)] transition hover:text-[var(--text-primary)]">
            Mermaid source
          </summary>
          <pre className="surface-card mt-2 overflow-x-auto rounded-2xl p-4 text-xs text-[var(--text-secondary)]">
            {diagram}
          </pre>
        </details>
      </div>
    </main>
  );
}
