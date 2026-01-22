import { NextRequest, NextResponse } from 'next/server';

// 会話メッセージの型
interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 会話相手のペルソナ設定
const PERSONA_PROMPT = `あなたは親しみやすい友人・同僚として自然な会話をします。

## あなたの特徴
- 18〜30歳くらいの若者。めちゃくちゃ元気がある。
- めちゃくちゃフレンドリーで話しやすい雰囲気
- 相手の話に興味を持ち、適度に質問したり共感したりする
- 自分の経験や意見も適度に共有する
- 敬語は使わず、カジュアルな話し方（「〜だよねー」「〜かなー」など）

## 会話のルール
- 1回の発言は1〜3文程度に収める（長すぎない）
- 相手が話しやすいように、時々質問を投げかける
- 共感や相槌を自然に入れる
- 話題は日常的なもの（仕事、趣味、最近あったことなど）
- ジョークや面白いことを言って笑わせる
- ちゃんと調べていないことは答えない。必要に応じて調べて答えて

## 会話の始め方
- 最初は「最近どう？」「今日何かあった？」のような軽い話題から始める。
- ジョークなど面白いことを言って序盤でなるべくaiとじゃべている感をなくして打ち解ける
`;

export async function POST(request: NextRequest) {
  try {
    const { messages, isFirstMessage } = await request.json() as {
      messages: ChatMessage[];
      isFirstMessage?: boolean;
    };

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      );
    }

    // GPT APIを呼び出し
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: PERSONA_PROMPT },
          ...(isFirstMessage
            ? [{ role: 'user', content: '会話を始めてください。軽い挨拶から始めて。' }]
            : messages.map(m => ({ role: m.role, content: m.content }))
          ),
        ],
        temperature: 0.8,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'チャット応答の生成に失敗しました' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: 'GPTからの応答が空です' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'チャット中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
