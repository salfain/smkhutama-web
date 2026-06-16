"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";

export function LogoutButton({ variant = "ghost", className = "" }: { variant?: "ghost" | "outline"; className?: string }) {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    if (!confirm("Yakin ingin keluar?")) return;
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <Button
      variant={variant}
      size="sm"
      className={`w-full justify-start gap-2 text-red-500 hover:bg-red-50 hover:text-red-600 ${className}`}
      onClick={handleLogout}
      disabled={pending}
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Keluar..." : "Keluar"}
    </Button>
  );
}
