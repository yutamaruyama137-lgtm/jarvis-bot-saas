import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCharacter } from "@/data/characters";
import { getMenu } from "@/data/menus";

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      characterId,
      messages,
      skillId,
    }: {
      characterId: string;
      messages: { role: "user" | "assistant"; content: string }[];
      skillId?: string;
    } = body;

    const character = getCharacter(characterId);
    if (!character) {
      return NextResponse.json({ error: "Character not found" }, { status: 404 });
    }

    const skill = skillId ? getMenu(skillId) : undefined;

    const systemPrompt = buildSystemPrompt(character, skill);

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          if (client) {
            const claudeStream = await client.messages.stream({
              model: "claude-sonnet-4-6",
              max_tokens: 4096,
              system: systemPrompt,
              messages: messages,
            });

            for await (const chunk of claudeStream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                controller.enqueue(encoder.encode(chunk.delta.text));
              }
            }
          } else {
            const mock = `${character.name}です！（デモモード）\n\nAPIキーを設定すると実際のAI応答が返ります。\n\`.env.local\` に \`ANTHROPIC_API_KEY\` を設定してください。`;
            controller.enqueue(encoder.encode(mock));
          }
        } catch (err) {
          controller.enqueue(
            encoder.encode(
              `エラーが発生しました: ${err instanceof Error ? err.message : "Unknown error"}`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch {
    return NextResponse.json({ error: "不正なリクエストです" }, { status: 400 });
  }
}

type CharacterType = ReturnType<typeof getCharacter>;
type SkillType = ReturnType<typeof getMenu>;

function buildSystemPrompt(character: CharacterType, skill?: SkillType): string {
  if (!character) return "";

  let prompt = `あなたは「${character.name}」です。${character.department}の${character.role}として、ユーザーの仕事をサポートするAI社員です。

【プロフィール】
- 名前: ${character.name}
- 所属: ${character.department}
- 役割: ${character.role}
- 専門: ${character.description}

【行動指針】
- 常に日本語で応答してください
- フレンドリーで親切な口調を保ちつつ、専門的な回答をしてください
- 回答は具体的で実用的にしてください
- 必要に応じてMarkdown形式で見やすく構造化してください
- 長い出力が必要な場合は、ステップを分けてわかりやすく説明してください`;

  if (skill) {
    prompt += `\n\n【現在のタスクモード: ${skill.title}】\n${skill.description}\nこのモードでは特に「${skill.title}」に特化した高品質な出力を心がけてください。`;
  }

  return prompt;
}
