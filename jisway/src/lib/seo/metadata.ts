import type { Metadata } from "next";

export function buildSeoMetadata(input: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.path,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      siteName: "JISWAY",
      type: "website",
    },
  };
}

