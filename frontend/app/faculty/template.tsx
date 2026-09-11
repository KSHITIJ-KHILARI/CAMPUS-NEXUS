"use client";

import { PageTransition } from "@/components/ui/page-transition";

export default function FacultyTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
