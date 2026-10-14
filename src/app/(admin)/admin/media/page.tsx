import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listMedia, type MediaItem } from "@/lib/media";
import { AdminShell } from "@/components/admin/AdminShell";
import { MediaClient } from "@/components/admin/MediaClient";

export const dynamic = "force-dynamic";

export default async function MediaPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  let items: MediaItem[] = [];
  try {
    items = await listMedia();
  } catch {
    items = [];
  }

  return (
    <AdminShell email={session.email} active="media">
      <MediaClient initial={items} />
    </AdminShell>
  );
}
