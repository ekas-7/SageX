export const env = {
  mongodbUri: process.env.MONGODB_URI ?? "",
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  groqModel: process.env.GROQ_MODEL ?? "llama3-70b-8192",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
  livekitApiKey: process.env.LIVEKIT_API_KEY ?? "",
  livekitApiSecret: process.env.LIVEKIT_API_SECRET ?? "",
  livekitUrl: process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "",
};
