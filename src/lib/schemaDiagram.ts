import type { Model, Schema, SchemaType } from "mongoose";

type AnyModel = Model<unknown>;

/** String FKs that are not Mongoose `ref`s but represent logical links between collections. */
const LOGICAL_RELATIONS: ReadonlyArray<{
  from: string;
  field: string;
  to: string;
}> = [
  { from: "ArenaAttempt", field: "playerId", to: "Player" },
  { from: "ArenaAttempt", field: "problemId", to: "ArenaProblem" },
  { from: "XpEvent", field: "playerId", to: "Player" },
];

function getSubschema(path: SchemaType): Schema | undefined {
  const p = path as SchemaType & {
    schema?: Schema;
    caster?: { schema?: Schema };
  };
  if (p.schema) return p.schema;
  if (p.caster?.schema) return p.caster.schema;
  return undefined;
}

function describeType(path: SchemaType): string {
  const inst = path.instance;
  if (inst === "ObjectID") {
    const ref = (path as SchemaType & { options?: { ref?: string } }).options
      ?.ref;
    return ref ? `objectId_ref_${ref}` : "objectId";
  }
  if (inst === "Mixed") return "mixed";
  if (inst === "Array") {
    const sub = getSubschema(path);
    return sub ? "array_of_object" : "array";
  }
  return inst.toLowerCase();
}

function flattenSchemaPaths(
  schema: Schema,
  prefix = ""
): { name: string; typeLabel: string }[] {
  const rows: { name: string; typeLabel: string }[] = [];
  for (const name of Object.keys(schema.paths)) {
    if (name === "__v") continue;
    const path = schema.path(name) as SchemaType;
    const fullName = prefix ? `${prefix}.${name}` : name;
    const sub = getSubschema(path);

    if (path.instance === "Array" && sub) {
      rows.push({ name: `${fullName}_items`, typeLabel: "array_of_object" });
      for (const subName of Object.keys(sub.paths)) {
        if (subName === "_id" || subName === "__v") continue;
        const subPath = sub.path(subName) as SchemaType;
        const subSub = getSubschema(subPath);
        if (subSub && subPath.instance !== "Array") {
          rows.push(
            ...flattenSchemaPaths(subSub, `${fullName}.${subName}`)
          );
        } else {
          rows.push({
            name: `${fullName}.${subName}`,
            typeLabel: describeType(subPath),
          });
        }
      }
      continue;
    }

    if (sub && path.instance !== "Array") {
      rows.push(...flattenSchemaPaths(sub, fullName));
      continue;
    }

    rows.push({ name: fullName, typeLabel: describeType(path) });
  }
  return rows;
}

function sanitizeAttrName(name: string): string {
  return name.replace(/\./g, "_").replace(/\[\]/g, "_items");
}

/** Mermaid ER attribute types cannot contain `<>()`, quotes, or spaces — they break the lexer. */
function sanitizeMermaidType(type: string): string {
  return type
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

function mermaidRefRelationships(models: AnyModel[]): string[] {
  const lines: string[] = [];
  const names = new Set(models.map((m) => m.modelName));

  for (const model of models) {
    const schema = model.schema;
    for (const name of Object.keys(schema.paths)) {
      const path = schema.path(name) as SchemaType;
      if (path.instance !== "ObjectID") continue;
      const ref = (path as SchemaType & { options?: { ref?: string } }).options
        ?.ref;
      if (!ref || !names.has(ref)) continue;
      lines.push(`${model.modelName} }o--|| ${ref} : ${name}`);
    }
  }

  for (const { from, field, to } of LOGICAL_RELATIONS) {
    if (!names.has(from) || !names.has(to)) continue;
    lines.push(`${from} }o--o{ ${to} : ${field}_logical`);
  }

  return lines;
}

/**
 * Builds a Mermaid `erDiagram` string from registered Mongoose models (application schema).
 */
export function buildMongooseErDiagram(models: AnyModel[]): string {
  const entityBlocks: string[] = [];
  const sorted = [...models].sort((a, b) =>
    a.modelName.localeCompare(b.modelName)
  );

  for (const model of sorted) {
    const fields = flattenSchemaPaths(model.schema);
    const body = fields
      .map((f) => {
        const attr = sanitizeAttrName(f.name);
        const type = sanitizeMermaidType(f.typeLabel);
        return `    ${type} ${attr}`;
      })
      .join("\n");

    entityBlocks.push(`${model.modelName} {\n${body}\n}`);
  }

  const rels = mermaidRefRelationships(sorted);
  const parts = ["erDiagram", ...rels, ...entityBlocks];
  return parts.join("\n");
}
