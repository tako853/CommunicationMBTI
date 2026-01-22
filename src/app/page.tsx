import Link from "next/link";
import Image from "next/image";

// テーマカラー
const theme = {
  primary: '#e24f29',      // オレンジレッド（アクセント）
  secondary: '#63a4a6',    // ティールグリーン（サブカラー）
  brown: '#7d6456',        // ブラウン（テキスト）
  primaryLight: '#fef2ef', // プライマリの薄い背景
  secondaryLight: '#f0f7f7', // セカンダリの薄い背景
  brownLight: '#f7f5f4',   // ブラウンの薄い背景
};

const axes = [
  {
    name: '伝える力',
    high: 'Assert',
    highSub: '主張型',
    low: 'Reserved',
    lowSub: '省察型',
    icon: '💬',
  },
  {
    name: '聞く力',
    high: 'Connect',
    highSub: '共鳴型',
    low: 'Distill',
    lowSub: '要点抽出型',
    icon: '👂',
  },
  {
    name: '非言語を伝える力',
    high: 'Faceful',
    highSub: '表情型',
    low: 'Subtle',
    lowSub: '気配型',
    icon: '😊',
  },
  {
    name: '非言語を読み取る力',
    high: 'Perceptive',
    highSub: '察知型',
    low: 'Tell-me',
    lowSub: '明示待ち型',
    icon: '👁️',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: theme.brownLight }}>
      <main className="max-w-2xl w-full">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <Image
            src="/types/logo.jpg"
            alt="コミュニケーションMBTI"
            width={400}
            height={100}
            className="mx-auto mb-6"
            priority
          />
          <p className="text-lg leading-relaxed" style={{ color: theme.brown }}>
            カメラと音声を使って、あなたのコミュニケーションスタイルを分析します。
            <br />
            <span className="font-medium">4つの軸</span>から<span className="font-bold" style={{ color: theme.primary }}>16タイプ</span>に分類し、強みと注意点をフィードバックします。
          </p>
        </div>

        {/* 4つの軸 */}
        <div className="mb-8">
          <h2
            className="text-center text-lg font-bold mb-4 flex items-center justify-center gap-2"
            style={{ color: theme.brown }}
          >
            <span className="w-8 h-0.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
            4つの軸
            <span className="w-8 h-0.5 rounded-full" style={{ backgroundColor: theme.secondary }} />
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {axes.map((axis, index) => (
              <div
                key={axis.name}
                className="rounded-xl p-4 shadow-sm"
                style={{
                  backgroundColor: 'white',
                  border: `1px solid ${index % 2 === 0 ? theme.secondary : theme.primary}30`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{axis.icon}</span>
                  <span className="font-bold" style={{ color: theme.brown }}>{axis.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-center">
                    <span className="font-semibold" style={{ color: theme.secondary }}>{axis.high}</span>
                    <span className="ml-1 text-xs" style={{ color: `${theme.brown}80` }}>({axis.highSub})</span>
                  </div>
                  <span style={{ color: `${theme.brown}50` }}>vs</span>
                  <div className="text-center">
                    <span className="font-semibold" style={{ color: theme.primary }}>{axis.low}</span>
                    <span className="ml-1 text-xs" style={{ color: `${theme.brown}80` }}>({axis.lowSub})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 使い方 */}
        <div
          className="rounded-xl p-5 mb-8"
          style={{ backgroundColor: theme.secondaryLight, border: `1px solid ${theme.secondary}30` }}
        >
          <h3 className="font-bold mb-3 flex items-center gap-2" style={{ color: theme.secondary }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            診断の流れ
          </h3>
          <ol className="space-y-2 text-sm" style={{ color: theme.brown }}>
            <li className="flex items-start gap-2">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: theme.secondary }}
              >
                1
              </span>
              <span>カメラとマイクをONにして、AIと会話します</span>
            </li>
            <li className="flex items-start gap-2">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: theme.secondary }}
              >
                2
              </span>
              <span>表情・ジェスチャー・発言内容をリアルタイム分析</span>
            </li>
            <li className="flex items-start gap-2">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: theme.secondary }}
              >
                3
              </span>
              <span>あなたのコミュニケーションタイプと個別アドバイスを表示</span>
            </li>
          </ol>
        </div>

        {/* 開始ボタン */}
        <div className="text-center">
          <Link
            href="/analysis"
            className="inline-flex items-center gap-2 text-white px-10 py-4 rounded-xl text-lg font-bold shadow-lg transition-all hover:opacity-90 hover:scale-105"
            style={{ backgroundColor: theme.primary }}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            診断を開始する
          </Link>
          <p className="mt-3 text-xs" style={{ color: `${theme.brown}80` }}>
            ※ カメラとマイクの使用許可が必要です
          </p>
        </div>
      </main>
    </div>
  );
}
