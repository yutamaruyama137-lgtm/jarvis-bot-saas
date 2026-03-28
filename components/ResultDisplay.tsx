"use client";

import { useState } from "react";
import { AICharacter } from "@/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ResultDisplayProps {
  output: string;
  character: AICharacter;
  outputLabel: string;
  isStreaming?: boolean;
  onReset: () => void;
}

function isHTML(text: string): boolean {
  return /<!DOCTYPE\s+html/i.test(text) || /<html[\s>]/i.test(text);
}

export default function ResultDisplay({
  output,
  character,
  outputLabel,
  isStreaming = false,
  onReset,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [previewMode, setPreviewMode] = useState<"preview" | "code">("preview");

  const htmlOutput = isHTML(output);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className={`${character.lightColor} rounded-2xl p-4 flex items-center gap-3`}>
        <div className={`${character.color} w-10 h-10 rounded-xl flex items-center justify-center text-xl text-white shadow-sm`}>
          {character.emoji}
        </div>
        <div>
          <div className={`text-xs font-bold ${character.textColor}`}>{character.name}より</div>
          <div className="text-sm font-bold text-gray-700">
            {outputLabel}ができました {isStreaming ? "" : "✅"}
          </div>
        </div>
        {isStreaming && (
          <div className="ml-auto">
            <div className={`w-2 h-2 ${character.color} rounded-full animate-pulse`}/>
          </div>
        )}
        {/* HTMLのときだけプレビュー切り替えタブを表示 */}
        {htmlOutput && !isStreaming && (
          <div className="ml-auto flex gap-1 bg-white rounded-lg p-1 shadow-sm border border-gray-100">
            <button
              onClick={() => setPreviewMode("preview")}
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                previewMode === "preview"
                  ? `${character.color} text-white`
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🖥️ プレビュー
            </button>
            <button
              onClick={() => setPreviewMode("code")}
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${
                previewMode === "code"
                  ? `${character.color} text-white`
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {"</>"} コード
            </button>
          </div>
        )}
      </div>

      {/* 出力内容 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        {htmlOutput && previewMode === "preview" && !isStreaming ? (
          <iframe
            srcDoc={output}
            className="w-full border-0"
            style={{ height: "600px" }}
            sandbox="allow-scripts allow-same-origin"
            title="HTMLプレビュー"
          />
        ) : (
          <div className={`p-6 ${isStreaming ? "cursor-blink" : ""}`}>
            {htmlOutput ? (
              <pre className="text-xs text-gray-600 overflow-auto whitespace-pre-wrap font-mono leading-relaxed" style={{ maxHeight: "600px" }}>
                {output}
              </pre>
            ) : (
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {output}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </div>

      {/* アクションボタン */}
      {!isStreaming && (
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            {copied ? "✅ コピーしました" : "📋 コピーする"}
          </button>
          <button
            onClick={onReset}
            className={`flex-1 py-3 px-4 rounded-xl ${character.lightColor} ${character.textColor} text-sm font-bold hover:opacity-80 transition-colors flex items-center justify-center gap-2 border-2 ${character.borderColor}`}
          >
            🔄 もう一度
          </button>
        </div>
      )}
    </div>
  );
}
