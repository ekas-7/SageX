import mongoose from "mongoose";
import { env } from "../config/env";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalCache = globalThis as typeof globalThis & {
  mongooseCache?: MongooseCache;
};

const cached: MongooseCache = globalCache.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalCache.mongooseCache = cached;

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;
  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not set in .env.local");
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(env.mongodbUri, {
      dbName: "sagex",
      maxPoolSize: 10,
    });
    cached.promise = cached.promise.then(async (conn) => {
      // One-time migration: drop the legacy `name_1` unique index so two
      // players can share a display name. `playerId` is the new unique key.
      try {
        const coll = conn.connection.db?.collection("players");
        if (coll) {
          const indexes = await coll.indexes();
          const legacy = indexes.find(
            (idx) => idx.name === "name_1" && idx.unique === true
          );
          if (legacy) {
            await coll.dropIndex("name_1");
          }
        }
      } catch {
        // non-fatal: schema sync will re-create indexes on next op
      }
      return conn;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};
