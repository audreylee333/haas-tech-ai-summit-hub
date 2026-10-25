import { createOpenAI } from "@ai-sdk/openai";
import { jsonSchema, Output, streamText, type LanguageModel } from "ai";
import type { Theme } from "./themes";

const schema = jsonSchema<{ themes: Theme[] }>({
  type: "object",
  additionalProperties: false,
  required: ["themes"],
  properties: {
    themes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "question_ids"],
        properties: {
          label: { type: "string" },
          question_ids: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
});

export async function groupQuestionsByTheme(questions: { id: string; body: string }[], sessionTitle: string): Promise<Theme[]> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra") as unknown as LanguageModel,
    output: Output.object({ schema }),
    instructions:
      "You help conference moderators. Group audience questions into 2 to 7 short themes (2-5 word labels). Every question id must appear in exactly one theme. A submission may contain several questions; group it by its main topic.",
    messages: [
      {
        role: "user",
        content: `Session: ${sessionTitle}\n\nQuestions:\n${questions.map((q) => `[${q.id}] ${q.body}`).join("\n")}`,
      },
    ],
    providerOptions: {
      openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] },
    },
  });
  const out = await result.output;
  return out.themes;
}
