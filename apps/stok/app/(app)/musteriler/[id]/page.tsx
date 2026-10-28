import { redirect } from "next/navigation";

// Customer cards open as a side panel on the list; old links (emails, bookmarks) land there.
export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/musteriler?secili=${encodeURIComponent(id)}`);
}
