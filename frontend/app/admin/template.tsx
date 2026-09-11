"use client";

import { PageTransition } from "@/components/ui/page-transition";

export default function AdminTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
