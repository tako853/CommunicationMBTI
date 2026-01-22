import { NextRequest, NextResponse } from 'next/server';
import type { CommunicationType, CommunicationAxisScores, CommunicationScores, AxisReasons } from '@/types/analysis';

// パーソナライズコメント生成用のシステムプロンプト
const SYSTEM_PROMPT = `あなたはコミュニケーション診断の専門家です。ユーザーの診断結果に基づいて、その人独自のパーソナライズされた一言コメントを生成してください。

## 入力データの説明

### MBTIタイプ（4文字）
- 1文字目: A(Assert/主張型) or R(Reserved/省察型) - 伝える力
- 2文字目: C(Connect/共鳴型) or D(Distill/要点抽出型) - 聞く力
- 3文字目: F(Faceful/表情型) or S(Subtle/気配型) - 非言語を伝える力
- 4文字目: P(Perceptive/察知型) or T(Tell-me/明示待ち型) - 非言語を読み取る力

### 軸スコア（各0-100）
- assertiveness: 高いほど主張型、低いほど省察型
- listening: 高いほど共鳴型、低いほど要点抽出型
- nonverbalExpression: 高いほど表情型、低いほど気配型
- nonverbalReading: 高いほど察知型、低いほど明示待ち型

### 詳細スコア（各0-100）
- expressiveness: 表情の豊かさ
- gestureActivity: ジェスチャーの活発さ
- posturalOpenness: 姿勢の開放性
- eyeContact: アイコンタクトの頻度
- nodding: 頷きの多さ

## コメント生成のポイント

1. タイプだけでなく、詳細スコアの特徴を見つけて言及する
2. 「〇〇タイプだけど、△△なところもあるね」のような、その人ならではの特徴を指摘
3. ポジティブな表現を心がける
4. 1-2文で簡潔に

## 例
- 「控えめなRタイプですが、表情がとても豊かでアイコンタクトもしっかりしているので、聞き上手な印象を与えられていますね」
- 「主張型のAタイプで、さらにジェスチャーも活発なので、プレゼンテーションが得意そうですね」
- 「察知型のPですが、頷きが少なめなので、もう少し相槌を意識すると相手に安心感を与えられるかも」

### 各軸の評価理由について
評価理由が提供されている場合は、その具体的な行動や特徴を踏まえてコメントを生成してください。
例：「発話量が多く積極的」という理由があれば、それを活かしたアドバイスができます。

## 回答形式
コメントのテキストのみを返してください。JSON形式は不要です。`;

export async function POST(request: NextRequest) {
  try {
    const { type, axisScores, detailScores, axisReasons } = await request.json() as {
      type: CommunicationType;
      axisScores: CommunicationAxisScores;
      detailScores: CommunicationScores;
      axisReasons?: AxisReasons;
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
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `以下の診断結果に基づいて、この人独自のパーソナライズコメントを生成してください。

MBTIタイプ: ${type}

軸スコア:
- 伝える力 (assertiveness): ${axisScores.assertiveness}
- 聞く力 (listening): ${axisScores.listening}
- 非言語を伝える力 (nonverbalExpression): ${axisScores.nonverbalExpression}
- 非言語を読み取る力 (nonverbalReading): ${axisScores.nonverbalReading}

各軸の評価理由:
- 伝える力の理由: ${axisReasons?.assertiveness || '（理由なし）'}
- 聞く力の理由: ${axisReasons?.listening || '（理由なし）'}
- 非言語を伝える力の理由: ${axisReasons?.nonverbalExpression || '（映像分析による評価）'}
- 非言語を読み取る力の理由: ${axisReasons?.nonverbalReading || '（理由なし）'}

詳細スコア:
- 表情の豊かさ (expressiveness): ${detailScores.expressiveness}
- ジェスチャー活発度 (gestureActivity): ${detailScores.gestureActivity}
- 姿勢の開放性 (posturalOpenness): ${detailScores.posturalOpenness}
- アイコンタクト (eyeContact): ${detailScores.eyeContact}
- 頷き (nodding): ${detailScores.nodding}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'コメント生成に失敗しました' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const comment = data.choices[0]?.message?.content?.trim();

    if (!comment) {
      return NextResponse.json(
        { error: 'コメントが生成されませんでした' },
        { status: 500 }
      );
    }

    return NextResponse.json({ comment });
  } catch (error) {
    console.error('Personalized comment error:', error);
    return NextResponse.json(
      { error: 'コメント生成中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
