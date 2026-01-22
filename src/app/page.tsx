import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <main className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          コミュニケーションタイプ診断
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          カメラと音声を使って、あなたのコミュニケーションスタイルを分析します。
          4つの軸から16タイプに分類し、強みと注意点をフィードバックします。
        </p>

        <div className="mb-8 text-left bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">4つの軸</h2>
          <ul className="space-y-2 text-gray-700">
            <li>
              <strong>伝える力:</strong> Assert（主張型） vs Reserved（省察型）
            </li>
            <li>
              <strong>聞く力:</strong> Connect（共鳴型） vs Distill（要点抽出型）
            </li>
            <li>
              <strong>非言語を伝える力:</strong> Faceful（表情型） vs Subtle（気配型）
            </li>
            <li>
              <strong>非言語を読み取る力:</strong> Perceptive（察知型） vs Tell-me（明示待ち型）
            </li>
          </ul>
        </div>

        <Link
          href="/analysis"
          className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          診断を開始する
        </Link>
      </main>
    </div>
  );
}
