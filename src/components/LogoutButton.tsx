"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/login/actions";
import { useConfirm } from "@/components/ConfirmDialog";

export function LogoutButton({ variant = "ghost", className = "" }: { variant?: "ghost" | "outline"; className?: string }) {
  const [pending, setPending] = useState(false);
  const confirm = useConfirm();

  async function handleLogout() {
    if (pending) return;
    const ok = await confirm({
      title: "Keluar dari akun?",
      description: "Anda akan keluar dari sesi ini dan kembali ke halaman login.",
      confirmText: "Ya, Keluar",
      cancelText: "Batal",
      variant: "danger",
      icon: "logout",
    });
    if (!ok) return;
    setPending(true);
    try {
      await logoutAction();
    } catch {
      setPending(false);
    }
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
