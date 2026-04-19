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
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
};
