import { VibeOrchestrator } from "../orchestrators/vibe.orchestrator";
import { vibePromptSchema, vibeSubmissionSchema, vibeVoteSchema } from "../vali/vibe.vali";

const getOrigin = (request: Request) => {
  const url = new URL(request.url);
  return `${url.protocol}//${url.host}`;
};

export const VibeController = {
  async getPrompt() {
    return VibeOrchestrator.getTodayPrompt();
  },
  async createPrompt(request: Request) {
    const body = await request.json();
    const payload = vibePromptSchema.parse(body);
    return VibeOrchestrator.createPrompt(payload);
  },
  async submit(request: Request) {
    const body = await request.json();
    const payload = vibeSubmissionSchema.parse(body);
    return VibeOrchestrator.submit(payload);
  },
  async getSubmission(request: Request, id: string) {
    const submission = await VibeOrchestrator.getSubmission(id);
    if (!submission) {
      throw new Error("Submission not found");
    }
    return submission;
  },
  async listSubmissions(request: Request) {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get("promptId");
    if (!promptId) {
      throw new Error("promptId is required");
    }
    const limit = Number(searchParams.get("limit") ?? 20);
    return VibeOrchestrator.listSubmissions(promptId, limit);
  },
  async vote(request: Request) {
    const body = await request.json();
    const payload = vibeVoteSchema.parse(body);
    return VibeOrchestrator.vote(payload);
  },
  async leaderboard(request: Request) {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get("promptId");
    const limit = Number(searchParams.get("limit") ?? 10);
    if (!promptId) {
      throw new Error("promptId is required");
    }
    return VibeOrchestrator.getLeaderboard(promptId, limit);
  },
  async embed(request: Request, id: string) {
    const submission = (await VibeOrchestrator.getSubmission(id)) as
      | {
          title: string;
          authorName: string;
          stats?: { upvotes?: number };
        }
      | null;
    if (!submission) {
      throw new Error("Submission not found");
    }
    const origin = getOrigin(request);
    const embedUrl = `${origin}/vibe/embed/${id}`;
    const previewUrl = `${origin}/vibe/preview/${id}`;
    const shareUrl = `${origin}/vibe/entry/${id}`;
    const title = submission.title;
    const authorName = submission.authorName;
    const upvotes = submission.stats?.upvotes ?? 0;

    return {
      id,
      title,
      authorName,
      promptTitle: submission.title,
      upvotes,
      embedUrl,
      previewUrl,
      shareUrl,
      embedHtml: `<iframe src="${embedUrl}" width="420" height="220" frameborder="0" style="border-radius:16px;overflow:hidden" allowfullscreen></iframe>`,
    };
  },
};
