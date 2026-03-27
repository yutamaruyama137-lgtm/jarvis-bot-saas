import Link from "next/link";
import Image from "next/image";
import { characters } from "@/data/characters";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* JARVISロゴ */}
            <div className="flex items-center gap-1">
              {["J","A","R","V","I","S"].map((letter, i) => {
                const colors = [
                  "bg-orange-500", "bg-blue-500", "bg-purple-500",
                  "bg-teal-500", "bg-rose-500", "bg-amber-500"
                ];
                return (
                  <div
                    key={letter}
                    className={`w-7 h-7 ${colors[i]} rounded-lg flex items-center justify-center text-white font-black text-sm`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
            <span className="font-black text-lg text-gray-800 ml-1">BOT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-colors"
            >
              💬 チャットで使う
            </Link>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full font-medium hidden sm:inline">
              AI社員サービス by REQS Lab
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* キャッチコピー */}
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 mb-3">
            担当のAI社員に、仕事を頼もう
          </h1>
          <p className="text-gray-500 text-base mb-5">
            メニューを選んで入力するだけ。専門AIがすぐに対応します。
          </p>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-2xl transition-colors shadow-sm text-sm"
          >
            💬 チャット形式で話しかける
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>

        {/* AI社員グリッド */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-8">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">
            AI社員一覧 — J.A.R.V.I.S
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            {characters.map((character) => (
              <Link
                key={character.id}
                href={`/${character.id}`}
                className="group flex flex-col items-center p-4 rounded-2xl hover:bg-gray-50 transition-all duration-200 cursor-pointer"
              >
                {/* SVGアバター */}
                <div className="mb-3 shadow-md group-hover:shadow-lg transition-all duration-200 group-hover:scale-105 rounded-full">
                  <Image
                    src={`/avatars/${character.id}.svg`}
                    alt={character.name}
                    width={72}
                    height={72}
                    className="rounded-full"
                  />
                </div>
                <div className="text-center">
                  <div className="text-sm font-black text-gray-800">{character.name}</div>
                  <div className={`text-xs font-bold ${character.textColor} mt-0.5`}>
                    {character.department}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 仕事メニューカード（6部門の業務一覧） */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <Link
              key={character.id}
              href={`/${character.id}`}
              className="block group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
            >
              <div className={`${character.color} h-1.5`} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${character.gradientFrom} ${character.gradientTo} shadow-sm`}
                  >
                    <span className="text-white font-black text-base">{character.nameEn}</span>
                  </div>
                  <div>
                    <div className="font-black text-gray-800 text-sm">{character.name}</div>
                    <div className={`text-xs ${character.textColor} font-bold`}>{character.department}</div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{character.description}</p>
                <div className={`text-xs font-bold ${character.textColor} group-hover:translate-x-1 transition-transform inline-flex items-center gap-1`}>
                  仕事メニューを見る
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 下部ノート */}
        <div className="mt-12 text-center text-xs text-gray-400">
          JARVIS BOT — AI社員サービス by REQS Lab ·
          入力された情報はAI処理にのみ使用されます
        </div>
      </main>
    </div>
  );
}
