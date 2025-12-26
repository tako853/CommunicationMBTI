# CommunicationMBTI

感情と行動のコンピューティングのチームプロジェクト

カメラ映像から非言語コミュニケーションを分析し、コミュニケーションスタイルをスコアリングするWebアプリのプロトタイプ

**公開URL**: https://tako853.github.io/CommunicationMBTI/

> mainブランチにマージされたコードは自動的にこのURLにデプロイされ、誰でもブラウザから使えるようになります

---

## 環境構築（初めての人向け）

### 1. Gitをインストール

まだの場合は以下からダウンロード：
- **Mac**: ターミナルで `git --version` を実行。インストールされていなければ自動でインストールが始まります
- **Windows**: https://git-scm.com/ からダウンロード

### 2. Node.js をインストール

まだの場合は以下からダウンロード：
- https://nodejs.org/
- **LTS版（推奨版）** をダウンロードしてインストール

インストール確認：
```bash
node -v   # v20.x.x などと表示されればOK
npm -v    # 10.x.x などと表示されればOK
```

### 3. リポジトリをクローン（ダウンロード）

ターミナル（Macの場合）またはコマンドプロンプト/PowerShell（Windowsの場合）を開いて：

```bash
# 好きな場所に移動（例：デスクトップ）
cd ~/Desktop

# リポジトリをダウンロード
git clone https://github.com/tako853/CommunicationMBTI.git

# ダウンロードしたフォルダに移動
cd CommunicationMBTI
```

> **「クローン」とは？** GitHubにあるプロジェクトを自分のパソコンにコピーすること

### 4. 依存パッケージをインストール

```bash
npm install
```

これで `node_modules` フォルダが作られ、必要なライブラリがダウンロードされます（少し時間がかかります）。

### 5. 開発サーバーを起動

```bash
npm run dev
```

ターミナルに表示されるURL（通常 http://localhost:5173）をブラウザで開く。

**カメラへのアクセス許可を求められたら「許可」を選択してください。**

---

## 使い方

1. ブラウザでアプリを開く
2. 「モデルを読み込み中...」と表示されるので待つ（初回は少し時間がかかります）
3. カメラ映像が表示されたら **「分析開始」** ボタンをクリック
4. リアルタイムで分析結果が右側に表示される
5. 終わったら **「分析停止」** ボタンをクリック
6. **「JSONエクスポート」** ボタンでデータをダウンロード可能

---

## ブランチ戦略（チーム開発のルール）

このリポジトリは **GitHub Flow** を採用しています。

### そもそもブランチとは？

コードの「枝分かれ」のこと。メインのコード（main）を壊さずに、別の場所で新機能を開発できます。

```
main ────●────●────●────●──── 本番コード（ここにマージされると公開される）
              \         ↗
               ●───●───●     feature/新機能（作業用ブランチ）
```

### 基本ルール

1. **mainには直接pushしない** → 間違って本番を壊さないため
2. 新機能や修正は **featureブランチ** を作成して作業
3. 作業が終わったら **Pull Request（PR）** を出す
4. チームメンバーが確認してOKならmainへマージ

### 具体的な手順

#### 作業を始める前に（毎回やる）

⚠️ **これ超重要！** 作業前に必ず最新のコードを取得してください。これを忘れると後でコンフリクト（衝突）が起きます。

```bash
# mainブランチに切り替え
git checkout main

# 最新のコードを取得（これを忘れない！）
git pull origin main
```

> **pullとは？** GitHubにある最新のコードを自分のPCにダウンロードすること。他のメンバーが更新した内容を取り込めます。

#### 新しい機能を作る

```bash
# 1. 新しいブランチを作成して切り替え
git checkout -b feature/機能名
# 例: git checkout -b feature/add-graph

# 2. コードを編集...（VSCodeなどで普通に作業）

# 3. 変更したファイルを確認
git status

# 4. 変更をステージング（コミット対象に追加）
git add .

# 5. コミット（変更を記録）
git commit -m "変更内容の説明"
# 例: git commit -m "グラフ表示機能を追加"

# 6. GitHubにプッシュ（アップロード）
git push origin feature/機能名
```

#### Pull Requestを作る

1. GitHubのリポジトリページを開く
2. 「Compare & pull request」ボタンが表示されるのでクリック
3. タイトルと説明を書いて「Create pull request」

> **Pull Request（PR）とは？** 「この変更をmainに入れてください」というお願い。チームで確認してからマージできる

### ブランチ名の例

- `feature/add-emotion-graph` （新機能追加）
- `fix/camera-permission` （バグ修正）
- `docs/update-readme` （ドキュメント更新）

---

## デプロイの仕組み

```
あなたのPC                    GitHub                      公開サイト
    │                           │                            │
    │  git push                 │                            │
    ├──────────────────────────→│                            │
    │                           │                            │
    │                    PRをマージ                           │
    │                      ↓                                 │
    │               mainブランチ更新                          │
    │                      ↓                                 │
    │             GitHub Actions                             │
    │             （自動ビルド＆デプロイ）                      │
    │                      ↓                                 │
    │                           ├───────────────────────────→│
    │                           │                   サイト更新！
```

mainブランチにコードがマージされると：
1. GitHub Actionsが自動でビルド（`npm run build`）
2. ビルド結果をGitHub Pagesにデプロイ
3. https://tako853.github.io/CommunicationMBTI/ が更新される

---

## 困ったとき

### git cloneできない
- Gitがインストールされているか確認（Mac/Windows共通）: ターミナルやコマンドプロンプトで `git --version` を実行

### カメラが映らない
- ブラウザのカメラ権限を確認（アドレスバー左のカメラアイコンをクリック）
- 他のアプリがカメラを使っていないか確認

### npm install でエラー
- Node.jsのバージョンを確認（v18以上推奨）
- `node_modules` を削除して再度 `npm install`

```bash
rm -rf node_modules
npm install
```

### モデルが読み込めない
- ネットワーク接続を確認（モデルはCDNからダウンロードされます）

### git pushでエラー
- 最新のmainを取り込んでから再度push

```bash
git pull origin main
git push origin feature/ブランチ名
```

### コンフリクト（衝突）が起きた

コンフリクトとは、同じファイルの同じ場所を複数人が編集したときに起きる問題です。

#### コンフリクトが起きるとこうなる

```
<<<<<<< HEAD
あなたが書いたコード
=======
他の人が書いたコード
>>>>>>> main
```

#### 解決方法

1. **どちらのコードを残すか決める**（両方残すこともできる）
2. `<<<<<<<`, `=======`, `>>>>>>>` の行を削除
3. 正しいコードだけを残す

例：両方の変更を残したい場合
```javascript
// 修正後
あなたが書いたコード
他の人が書いたコード
```

4. 解決したらコミット
```bash
git add .
git commit -m "コンフリクトを解消"
git push origin feature/ブランチ名
```

#### コンフリクトを防ぐコツ

- **作業前に必ず `git pull origin main`**
- 長期間ブランチを放置しない
- 同じファイルを複数人で同時に編集しない（事前に相談）

---

# 技術詳細

## このアプリでできること

- カメラで自分の顔・体を映す
- リアルタイムで以下を分析：
  - **表情**（喜び、悲しみ、怒り、驚きなど7種類）
  - **顔の向き**（頷き、首振り、傾き）
  - **視線**（カメラを見ているか）
  - **手の形**（グー、パー、ピース、指さしなど）
  - **姿勢**（肩の開き、前傾/後傾）
  - **体の動き**（腕の上げ下げ、体の揺れ）
  - **ジェスチャー**（手の動きの頻度）
- セッション終了後、データをJSONでエクスポート可能

## 技術スタック

| 用途 | ライブラリ |
|------|-----------|
| フレームワーク | Vite + React + TypeScript |
| カメラ | react-webcam |
| 表情分析 | face-api.js |
| 姿勢・手・顔 | MediaPipe Holistic |

## プロジェクト構成

```
src/
├── components/          # UIコンポーネント
│   ├── WebcamCapture.tsx   # カメラ映像
│   └── ScoreDisplay.tsx    # 分析結果表示
├── hooks/               # カスタムフック
│   ├── useFaceAnalysis.ts  # 表情分析
│   └── useMediaPipe.ts     # 姿勢・手・視線分析
├── services/            # 分析ロジック
│   ├── faceApiService.ts   # face-api.js
│   ├── mediaPipeService.ts # MediaPipe
│   └── scoreEngine.ts      # スコア計算
├── types/               # 型定義
│   └── analysis.ts
├── utils/               # ユーティリティ
│   └── dataExport.ts       # JSONエクスポート
├── App.tsx              # メインコンポーネント
└── main.tsx             # エントリーポイント
```
