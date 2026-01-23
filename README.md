# Communication MBTI

AIとの会話を通じて、あなたのコミュニケーションスタイルを16タイプで診断するWebアプリケーションです。

## 概要

カメラとマイクを使用してAIと会話し、その間の**言語的特徴**と**非言語的特徴**をリアルタイムで分析。4つの軸で評価し、16種類のコミュニケーションタイプを判定します。

---

## システム構成図

```mermaid
flowchart TB
    subgraph Client["クライアント（ブラウザ）"]
        subgraph Pages["ページ"]
            Home["/<br/>ホームページ"]
            Analysis["/analysis<br/>診断ページ"]
            Result["/result/[type]<br/>結果ページ"]
        end

        subgraph Components["コンポーネント"]
            WebcamCapture["WebcamCapture<br/>カメラ映像"]
            ConversationLog["ConversationLog<br/>会話ログ"]
            ScoreDisplay["ScoreDisplay<br/>リアルタイムスコア"]
            ResultDisplay["ResultDisplay<br/>結果表示"]
        end

        subgraph Hooks["カスタムフック"]
            useFaceAnalysis["useFaceAnalysis<br/>表情認識"]
            useMediaPipe["useMediaPipe<br/>姿勢・ジェスチャー"]
            useAudioRecorder["useAudioRecorder<br/>音声録音"]
            useConversation["useConversation<br/>会話管理"]
            useTextToSpeech["useTextToSpeech<br/>音声再生"]
        end

        subgraph Services["サービス"]
            faceApiService["faceApiService<br/>表情検出"]
            mediaPipeService["mediaPipeService<br/>姿勢検出"]
            scoreEngine["scoreEngine<br/>スコア計算"]
        end
    end

    subgraph Server["Next.js API Routes"]
        ChatAPI["/api/chat<br/>AI会話"]
        TranscribeAPI["/api/transcribe<br/>音声→テキスト"]
        TTSAPI["/api/tts<br/>テキスト→音声"]
        AnalyzeSpeechAPI["/api/analyze-speech<br/>会話分析"]
        PersonalizedCommentAPI["/api/personalized-comment<br/>コメント生成"]
    end

    subgraph External["外部サービス"]
        subgraph OpenAI["OpenAI API"]
            GPT["GPT-4o-mini"]
            Whisper["Whisper"]
            TTS["TTS-1"]
        end

        subgraph LocalML["ブラウザ内MLモデル"]
            FaceAPI["face-api.js"]
            MediaPipe["MediaPipe Holistic"]
        end
    end

    Home -->|診断開始| Analysis
    Analysis -->|結果を見る| Result

    Analysis --> WebcamCapture
    Analysis --> ConversationLog
    Analysis --> ScoreDisplay
    Result --> ResultDisplay

    WebcamCapture --> useFaceAnalysis
    WebcamCapture --> useMediaPipe
    Analysis --> useAudioRecorder
    Analysis --> useConversation
    Analysis --> useTextToSpeech

    useFaceAnalysis --> faceApiService
    useMediaPipe --> mediaPipeService
    faceApiService --> FaceAPI
    mediaPipeService --> MediaPipe

    useConversation --> ChatAPI
    useAudioRecorder --> TranscribeAPI
    useTextToSpeech --> TTSAPI

    ChatAPI --> GPT
    TranscribeAPI --> Whisper
    TTSAPI --> TTS
    AnalyzeSpeechAPI --> GPT
    PersonalizedCommentAPI --> GPT
```

---

## 診断フロー

```mermaid
sequenceDiagram
    participant U as ユーザー
    participant A as アプリ
    participant ML as ローカルML<br/>(face-api/MediaPipe)
    participant API as Next.js API
    participant OpenAI as OpenAI API

    U->>A: 診断開始
    A->>API: /api/chat (初回挨拶)
    API->>OpenAI: GPT-4o-mini
    OpenAI-->>API: AIメッセージ
    API-->>A: テキスト
    A->>API: /api/tts
    API->>OpenAI: TTS-1
    OpenAI-->>API: 音声データ
    API-->>A: MP3
    A->>U: AI音声再生

    loop 会話ループ
        U->>A: 発話（録音中）
        A->>ML: フレーム分析
        ML-->>A: 表情・姿勢・ジェスチャー

        Note over A: 2秒沈黙で自動送信

        A->>API: /api/transcribe
        API->>OpenAI: Whisper
        OpenAI-->>API: テキスト
        API-->>A: 文字起こし結果

        A->>API: /api/chat
        API->>OpenAI: GPT-4o-mini
        OpenAI-->>API: AI応答
        API-->>A: テキスト

        A->>API: /api/tts
        API->>OpenAI: TTS-1
        OpenAI-->>API: 音声
        A->>U: AI音声再生
    end

    U->>A: 会話終了
    A->>API: /api/analyze-speech
    API->>OpenAI: GPT-4o-mini
    OpenAI-->>API: 3軸スコア + 理由
    API-->>A: 分析結果

    A->>A: 非言語スコア計算<br/>(scoreEngine)
    A->>A: 16タイプ判定
    A->>A: sessionStorage保存

    A->>U: 結果ページへ遷移

    A->>API: /api/personalized-comment
    API->>OpenAI: GPT-4o-mini
    OpenAI-->>API: コメント
    API-->>A: パーソナライズコメント
    A->>U: 結果表示
```

---

## データフロー

```mermaid
flowchart LR
    subgraph Input["入力"]
        Camera["カメラ映像"]
        Microphone["マイク音声"]
    end

    subgraph Processing["処理"]
        subgraph VideoAnalysis["映像分析（ローカル）"]
            FaceAPI["face-api.js<br/>表情認識"]
            MediaPipe["MediaPipe<br/>姿勢・ジェスチャー"]
        end

        subgraph AudioAnalysis["音声分析（API）"]
            Whisper["Whisper<br/>文字起こし"]
            GPTAnalysis["GPT-4o-mini<br/>会話分析"]
        end

        ScoreEngine["scoreEngine<br/>スコア計算"]
    end

    subgraph Output["出力"]
        Timeline["TimelineEntry[]<br/>時系列データ"]
        AxisScores["4軸スコア"]
        DetailScores["5項目詳細スコア"]
        Type["16タイプ判定"]
        Comment["パーソナライズコメント"]
    end

    Camera --> FaceAPI
    Camera --> MediaPipe
    Microphone --> Whisper

    FaceAPI --> Timeline
    MediaPipe --> Timeline
    Timeline --> ScoreEngine

    Whisper --> GPTAnalysis
    GPTAnalysis --> AxisScores

    ScoreEngine --> DetailScores
    ScoreEngine --> AxisScores

    AxisScores --> Type
    Type --> Comment
    DetailScores --> Comment
```

---

## 4軸評価システム

```mermaid
graph TB
    subgraph Axis1["軸1: 伝える力"]
        A1High["A: Assert（主張型）"]
        A1Low["R: Reserved（省察型）"]
        A1Source["データソース: 会話テキスト<br/>GPT-4o-mini分析"]
    end

    subgraph Axis2["軸2: 聞く力"]
        A2High["C: Connect（共鳴型）"]
        A2Low["D: Distill（要点抽出型）"]
        A2Source["データソース: 会話テキスト<br/>GPT-4o-mini分析"]
    end

    subgraph Axis3["軸3: 非言語を伝える力"]
        A3High["F: Faceful（表情型）"]
        A3Low["S: Subtle（気配型）"]
        A3Source["データソース: カメラ映像<br/>表情25% + ジェスチャー25%<br/>+ 姿勢20% + 視線20% + 頷き10%"]
    end

    subgraph Axis4["軸4: 非言語を読み取る力"]
        A4High["P: Perceptive（察知型）"]
        A4Low["T: Tell-me（明示待ち型）"]
        A4Source["データソース: 会話テキスト<br/>GPT-4o-mini分析"]
    end

    Axis1 --> TypeCode
    Axis2 --> TypeCode
    Axis3 --> TypeCode
    Axis4 --> TypeCode

    TypeCode["タイプコード<br/>例: ACFP, RDST など<br/>（16パターン）"]
```

---

## 外部サービス連携

```mermaid
flowchart LR
    subgraph App["アプリケーション"]
        Client["クライアント"]
        APIRoutes["API Routes"]
    end

    subgraph OpenAI["OpenAI API"]
        GPT["GPT-4o-mini<br/>・会話生成<br/>・会話分析<br/>・コメント生成"]
        WhisperAPI["Whisper<br/>・音声認識<br/>・日本語対応"]
        TTSAPI["TTS-1<br/>・音声合成<br/>・voice: nova"]
    end

    subgraph LocalModels["ローカルMLモデル"]
        FaceAPIJS["face-api.js<br/>・TinyFaceDetector<br/>・FaceExpressionNet<br/>・7種類の表情認識"]
        MediaPipeHL["MediaPipe Holistic<br/>・顔ランドマーク<br/>・手ランドマーク<br/>・ポーズランドマーク"]
    end

    subgraph BrowserAPIs["ブラウザAPI"]
        GetUserMedia["getUserMedia<br/>カメラ・マイク取得"]
        WebAudio["Web Audio API<br/>音声録音"]
    end

    Client --> LocalModels
    Client --> BrowserAPIs
    APIRoutes --> OpenAI
```

---

## 技術スタック

| カテゴリ | 技術 | 用途 |
|---------|------|------|
| フレームワーク | Next.js 15 (App Router) | フルスタックReact |
| 言語 | TypeScript | 型安全性 |
| スタイル | Tailwind CSS | UIスタイリング |
| AI/ML (クラウド) | OpenAI GPT-4o-mini | 会話・分析 |
| AI/ML (クラウド) | OpenAI Whisper | 音声認識 |
| AI/ML (クラウド) | OpenAI TTS-1 | 音声合成 |
| AI/ML (ローカル) | face-api.js | 表情認識 |
| AI/ML (ローカル) | MediaPipe Holistic | 姿勢・ジェスチャー |
| メディア | react-webcam | カメラ取得 |

---

## ディレクトリ構成

```
src/
├── app/
│   ├── page.tsx              # ホームページ
│   ├── analysis/             # 診断ページ
│   ├── result/[type]/        # 結果ページ
│   └── api/
│       ├── chat/             # AI会話
│       ├── transcribe/       # 音声→テキスト
│       ├── tts/              # テキスト→音声
│       ├── analyze-speech/   # 会話分析
│       └── personalized-comment/  # コメント生成
├── components/               # UIコンポーネント
├── hooks/                    # カスタムフック
├── services/                 # サービス層
├── types/                    # 型定義
└── data/                     # 16タイプ定義
```

---

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成:

```
OPENAI_API_KEY=sk-...
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリが起動します。

---

## デプロイ

Vercelでのデプロイを推奨:

1. GitHubにプッシュ
2. Vercelでプロジェクトをインポート
3. 環境変数 `OPENAI_API_KEY` を設定
4. 自動デプロイ
