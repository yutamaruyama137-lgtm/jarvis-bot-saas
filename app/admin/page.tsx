"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { characters } from "@/data/characters";
import { getMenusByCharacter } from "@/data/menus";

const ADMIN_CONFIG_KEY = "jarvis-admin-config";

const capabilities = [
  { feature: "テキストチャット・自由会話", status: "✅", note: "Anthropic APIで完全対応。今すぐ使える" },
  { feature: "文書作成（提案書・メール・議事録）", status: "✅", note: "Anthropic APIで完全対応" },
  { feature: "翻訳・要約・校正", status: "✅", note: "Anthropic APIで完全対応" },
  { feature: "EXCEL関数・SQL生成", status: "✅", note: "テキストで数式を生成→コピペで使用可" },
  { feature: "データ分析・レポート", status: "✅", note: "テキストデータを貼り付ければ分析可" },
  { feature: "PDF・画像の解析・文字起こし", status: "⚠️", note: "Claude Vision APIで実装可（追加開発必要）" },
  { feature: "Notion連携（DB同期）", status: "⚠️", note: "Notion API + Claudeで実装可（別途開発）" },
  { feature: "Slack連携（メッセージ連携）", status: "⚠️", note: "Slack Bot API + Claudeで実装可（別途開発）" },
  { feature: "Webリアルタイム検索", status: "⚠️", note: "Tavily等のSearch APIを追加すれば可" },
  { feature: "画像生成", status: "❌", note: "Anthropic APIは非対応（DALL-E/SDが別途必要）" },
  { feature: "音声入力・文字起こし", status: "❌", note: "Whisper API等が別途必要" },
  { feature: "マルチユーザー管理・認証", status: "⚠️", note: "Supabase Auth等で実装可（別途開発）" },
];

export default function AdminPage() {
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADMIN_CONFIG_KEY);
      if (stored) setConfig(JSON.parse(stored));
    } catch {}
  }, []);

  const toggleSkill = (menuId: string) => {
    setConfig((prev) => {
      const current = prev[menuId] !== false;
      return { ...prev, [menuId]: !current };
    });
    setSaved(false);
  };

  const saveConfig = () => {
    localStorage.setItem(ADMIN_CONFIG_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const resetAll = () => {
    setConfig({});
    localStorage.removeItem(ADMIN_CONFIG_KEY);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/chat"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← チャットに戻る
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-black text-gray-800">⚙️ 管理者パネル</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetAll}
              className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 border border-gray-200 rounded-lg transition-colors"
            >
              全てリセット
            </button>
            <button
              onClick={saveConfig}
              className={`text-xs font-bold px-4 py-1.5 rounded-lg transition-colors ${
                saved
                  ? "bg-green-500 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {saved ? "✓ 保存しました" : "設定を保存"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Capability table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="font-black text-gray-800 text-lg mb-1">
            Anthropic API でできること・できないこと
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            現在の JARVIS BOT が対応している機能の一覧です。⚠️ は追加開発で実現可能。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-2 pr-4 text-gray-500 font-bold">機能</th>
                  <th className="text-left py-2 pr-6 text-gray-500 font-bold w-10">状況</th>
                  <th className="text-left py-2 text-gray-500 font-bold">備考</th>
                </tr>
              </thead>
              <tbody>
                {capabilities.map((cap, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium text-gray-800">{cap.feature}</td>
                    <td className="py-2.5 pr-6 text-lg">{cap.status}</td>
                    <td className="py-2.5 text-gray-500">{cap.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Skill toggles */}
        <h2 className="font-black text-gray-800 text-lg mb-2">
          AI社員スキル管理
        </h2>
        <p className="text-sm text-gray-500 mb-5">
          チャット画面で表示するスキルチップをオン/オフできます。クライアントに提供する機能を絞り込むときに使います。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {characters.map((char) => {
            const menus = getMenusByCharacter(char.id);
            return (
              <div
                key={char.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* Character header */}
                <div
                  className={`bg-gradient-to-r ${char.gradientFrom} ${char.gradientTo} px-4 py-3 flex items-center gap-3`}
                >
                  <Image
                    src={`/avatars/${char.id}.svg`}
                    alt={char.name}
                    width={36}
                    height={36}
                    className="rounded-full border-2 border-white/40"
                  />
                  <div className="text-white">
                    <div className="font-black text-sm">{char.name}</div>
                    <div className="text-xs opacity-80">{char.department}</div>
                  </div>
                </div>

                {/* Skill list */}
                <div className="p-4 space-y-2.5">
                  {menus.map((menu) => {
                    const isEnabled = config[menu.id] !== false;
                    return (
                      <div key={menu.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-base flex-shrink-0">{menu.icon}</span>
                          <span className="text-sm text-gray-700 truncate">{menu.title}</span>
                        </div>
                        {/* Toggle switch */}
                        <button
                          onClick={() => toggleSkill(menu.id)}
                          className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors flex-shrink-0 ml-3 ${
                            isEnabled ? char.color : "bg-gray-200"
                          }`}
                          aria-label={`${menu.title}を${isEnabled ? "無効" : "有効"}にする`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                              isEnabled ? "translate-x-5" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-gray-400 text-center">
          設定はブラウザの localStorage に保存されます。「設定を保存」ボタンを押すまで反映されません。
          <br />
          将来的にはデータベースでの管理（マルチテナント対応）が可能です。
        </p>
      </main>
    </div>
  );
}
