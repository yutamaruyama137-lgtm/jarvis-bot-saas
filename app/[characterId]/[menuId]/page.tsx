import { redirect } from "next/navigation";

interface Props {
  params: { characterId: string; menuId: string };
}

// フォーム形式は廃止 → チャットUIへリダイレクト
export default function MenuRedirectPage({ params }: Props) {
  redirect(`/chat?character=${params.characterId}&menu=${params.menuId}`);
}
