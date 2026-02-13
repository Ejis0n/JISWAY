import { redirect } from "next/navigation";

export default async function LegacyCategoryRedirect({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  redirect(`/jis/${category}`);
}

