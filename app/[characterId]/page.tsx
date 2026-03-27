import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCharacter } from "@/data/characters";
import { getMenusByCharacter } from "@/data/menus";
import { characters } from "@/data/characters";

interface Props {
  params: { characterId: string };
}

export default function CharacterPage({ params }: Props) {
  const character = getCharacter(params.characterId);
  if (!character) notFound();

  const menus = getMenusByCharacter(character.id);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1" aria-label="ホームへ">
              {["J","A","R","V","I","S"].map((letter, i) => {
                const colors = [
                  "bg-orange-500", "bg-blue-500", "bg-purple-500",
                  "bg-teal-500", "bg-rose-500", "bg-amber-500"
                ];
                return (
                  <div
                    key={letter}
                    className={`w-6 h-6 ${colors[i]} rounded-md flex items-center justify-center text-white font-black text-xs`}
                  >
                    {letter}
                  </div>
                );
              })}
              <span className="font-black text-base text-gray-800 ml-1">BOT</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className={`text-sm font-bold ${character.textColor}`}>
              {character.department} {character.name}
            </span>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            ← 社員一覧へ
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* 左サイドバー：AI社員一覧 */}
          <div className="hidden lg:block w-48 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-24">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">AI社員</div>
              <div className="space-y-1">
                {characters.map((c) => (
                  <Link
                    key={c.id}
                    href={`/${c.id}`}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-bold
                      ${c.id === character.id
                        ? `${c.lightColor} ${c.textColor}`
                        : "text-gray-500 hover:bg-gray-50"
                      }
                    `}
                  >
                    <Image
                      src={`/avatars/${c.id}.svg`}
                      alt={c.name}
                      width={28}
                      height={28}
                      className="rounded-full flex-shrink-0"
                    />
                    <div>
                      <div>{c.name}</div>
                      <div className="text-xs font-normal opacity-60">{c.department}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* メインコンテンツ */}
          <div className="flex-1 min-w-0">
            {/* キャラクターヘッダー */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className={`bg-gradient-to-r ${character.gradientFrom} ${character.gradientTo} px-6 py-5`}>
                <div className="flex items-center gap-4">
                  <div className="rounded-full border-2 border-white/40 shadow-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={`/avatars/${character.id}.svg`}
                      alt={character.name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  </div>
                  <div className="text-white">
                    <div className="text-xl font-black">{character.name}</div>
                    <div className="text-sm opacity-80">{character.department} · {character.role}</div>
                  </div>
                  <div className="ml-auto text-4xl opacity-80">{character.emoji}</div>
                </div>
              </div>
              {/* 吹き出し */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed">
                  💬 「{character.greeting}」
                </p>
              </div>
            </div>

            {/* メニュー一覧 */}
            <div className="mb-4">
              <h2 className="text-base font-black text-gray-700">
                頼める仕事メニュー
                <span className="ml-2 text-sm font-normal text-gray-400">（{menus.length}種類）</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {menus.map((menu) => (
                <Link
                  key={menu.id}
                  href={`/chat?character=${character.id}&menu=${menu.id}`}
                  className="group block bg-white rounded-2xl border-2 border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className={`${character.lightColor} w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
                      {menu.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-black text-gray-800">{menu.title}</h3>
                        <span className={`text-xs ${character.textColor} ${character.lightColor} px-2 py-0.5 rounded-full flex-shrink-0 font-medium whitespace-nowrap`}>
                          {menu.estimatedSeconds < 60
                            ? `約${menu.estimatedSeconds}秒`
                            : `約${Math.round(menu.estimatedSeconds / 60)}分`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">{menu.description}</p>
                    </div>
                  </div>
                  <div className={`mt-3 text-xs font-bold ${character.textColor} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                    💬 チャットで頼む
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ← 他のAI社員を選ぶ
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
