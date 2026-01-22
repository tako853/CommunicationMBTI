import { NextRequest, NextResponse } from 'next/server';

// GPT分析結果の型
interface SpeechAnalysisResult {
  assertiveness: number; // 軸1: 伝える力 (0-100)
  listening: number;     // 軸2: 聞く力 (0-100)
  nonverbalReading: number; // 軸4: 非言語を読み取る力 (0-100)
  reasons: {
    assertiveness: string;
    listening: string;
    nonverbalReading: string;
  };
}

// 分析用のシステムプロンプト
const SYSTEM_PROMPT = `あなたは会話分析の専門家です。与えられた会話テキストを分析し、話者のコミュニケーションスタイルを3つの軸で評価してください。

## 評価軸

### 1. assertiveness（伝える力 / Assert vs Reserved）: 0-100

**高い(70-100) = Assert傾向**
以下の特徴が多いほど高得点：
- 断定/言い切り：「〜だ」「〜する」「絶対」「確実」など
- 提案/指示：「〜しよう」「〜して」「〜した方がいい」など
- 話題の開始や転換を自分から行う
- 結論を先に言う
- 自己の立場を明確化：「俺は〜」「自分はこう思う」
- 短い前置きで本題に入る（迷いが少ない）

**低い(0-30) = Reserved傾向**
以下の特徴が多いほど低得点：
- ヘッジ/保留：「たぶん」「かも」「〜な気がする」「一応」
- 相手に委ねる：「どう思う？」「任せる」「どっちでも」
- 前置きが長い：「えっと…」「うーん…」が多い、結論が遅い
- 断定回避：「〜かもしれない」「〜って感じ」
- 質問中心で自分の主張が少ない

**中間(30-70)**：両方の特徴が混在

### 2. listening（聞く力 / Connect vs Distill）: 0-100

**高い(70-100) = Connect傾向（共鳴型）**
以下の特徴が多いほど高得点：
- 感情の反映：相手の気持ちを言語化して返す
- 承認/共感：「わかる」「それは大変」「すごい」
- 相手の背景を深掘り：「その時どう感じた？」「何が一番しんどかった？」
- 安心させる/寄り添う：「大丈夫」「無理しなくていい」
- 相手の言葉を繰り返す（ミラーリング）で受け止める

**低い(0-30) = Distill傾向（要点抽出型）**
以下の特徴が多いほど低得点：
- 要約/言い換え：「つまり〜ってことだね」
- 論点整理：「課題はAとB」「原因は〜」「優先は〜」
- 具体化質問：目的/期限/条件/数値を聞く（「締切いつ？」「何がボトルネック？」）
- 次アクション化：「じゃあ次は〜しよう」「まず〜をやる」
- 選択肢の提示

**中間(30-70)**：両方の特徴が混在

### 3. nonverbalReading（非言語を読み取る力）: 0-100
- 高い(70-100): 相手の状態への言及がある（「疲れてる？」「嬉しそうだね」など）、空気を読んだ発言、場の雰囲気への配慮
- 中間(30-70): 時々相手の様子に触れる
- 低い(0-30): 相手の非言語的なサインへの言及がない、明示的な情報のみで判断

## 回答形式
必ず以下のJSON形式のみで回答してください。各軸のスコアと、そのスコアをつけた具体的な理由（会話内容から読み取れた特徴）を含めてください。
{
  "assertiveness": 数値,
  "listening": 数値,
  "nonverbalReading": 数値,
  "reasons": {
    "assertiveness": "理由（20文字程度で簡潔に）",
    "listening": "理由（20文字程度で簡潔に）",
    "nonverbalReading": "理由（20文字程度で簡潔に）"
  }
}`;

export async function POST(request: NextRequest) {
  try {
    const { transcript, duration } = await request.json();

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json(
        { error: '会話テキストが空です' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      );
    }

    // 話速の計算（文字数/秒）
    const speechRate = duration > 0 ? transcript.length / duration : 0;

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
            content: `以下の会話テキストを分析してください。

会話テキスト:
"""
${transcript}
"""

話速情報: ${speechRate.toFixed(2)}文字/秒（参考値）
総発話時間: ${duration}秒`,
          },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'GPT分析に失敗しました' },
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

    // JSONをパース
    let result: SpeechAnalysisResult;
    try {
      result = JSON.parse(content);
    } catch {
      console.error('Failed to parse GPT response:', content);
      // パースに失敗した場合、デフォルト値を返す
      result = {
        assertiveness: 50,
        listening: 50,
        nonverbalReading: 50,
        reasons: {
          assertiveness: '分析できませんでした',
          listening: '分析できませんでした',
          nonverbalReading: '分析できませんでした',
        },
      };
    }

    // 値の範囲を0-100に制限
    result.assertiveness = Math.max(0, Math.min(100, result.assertiveness));
    result.listening = Math.max(0, Math.min(100, result.listening));
    result.nonverbalReading = Math.max(0, Math.min(100, result.nonverbalReading));

    // reasonsがない場合のフォールバック
    if (!result.reasons) {
      result.reasons = {
        assertiveness: '',
        listening: '',
        nonverbalReading: '',
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Speech analysis error:', error);
    return NextResponse.json(
      { error: '分析中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
