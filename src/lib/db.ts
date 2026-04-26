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
      try {
        const coll = conn.connection.db?.collection("players");
        if (coll) {
          // 1. Drop legacy `name_1` unique index — uniqueness is enforced in app code (case-insensitive).
          const indexes = await coll.indexes();
          const legacy = indexes.find(
            (idx) => idx.name === "name_1" && idx.unique === true
          );
          if (legacy) {
            await coll.dropIndex("name_1");
          }

          // 2. Backfill missing `playerId` on legacy documents. We use
          //    the Mongo _id (as a string) as the stable identifier so
          //    existing progress is preserved.
          const missing = await coll
            .find({ playerId: { $exists: false } })
            .project({ _id: 1 })
            .toArray();
          if (missing.length > 0) {
            const ops = missing.map((doc) => ({
              updateOne: {
                filter: { _id: doc._id },
                update: {
                  $set: {
                    playerId: (doc._id as { toString(): string }).toString(),
                  },
                },
              },
            }));
            await coll.bulkWrite(ops, { ordered: false });
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
