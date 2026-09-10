"use client"

import { ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as ToasterSonner } from "@/components/ui/sonner";

interface ClientLayoutProps {
  children: ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <>
      {children}
      <Toaster />
      <ToasterSonner />
    </>
  );
} 