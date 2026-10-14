import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { editingCategories } from "@/lib/data";
import { getHiddenCategorySlugs } from "@/lib/settings";
import { AdminShell } from "@/components/admin/AdminShell";
import { CategoriesClient } from "@/components/admin/CategoriesClient";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  const hidden = await getHiddenCategorySlugs();
  const categories = editingCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    description: c.description,
    image: c.image,
    visible: !hidden.has(c.slug),
  }));

  return (
    <AdminShell email={session.email} active="categories">
      <CategoriesClient initial={categories} />
    </AdminShell>
  );
}
