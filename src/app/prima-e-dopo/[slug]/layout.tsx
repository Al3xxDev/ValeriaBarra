import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Un’esperienza di percorso nutrizionale condivisa con consenso e nel rispetto della riservatezza.",
};

export default function StoryDetailLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
