"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Eye, EyeOff, KeyRound, CheckCircle2 } from "lucide-react";
import { changePasswordAction } from "./actions";

export function ChangePasswordForm() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    setSuccess(false);

    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await changePasswordAction(fd);
      if (res.error) {
        setErr(res.error);
      } else {
        setSuccess(true);
        e.currentTarget.reset();
      }
    });
  }

  return (
    <Card className="max-w-md border shadow-md dark:border-slate-800 dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-500" />
          Ganti Password
        </CardTitle>
        <CardDescription>Ubah kata sandi akun Anda demi keamanan</CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-4 border border-green-200 dark:border-green-800/40 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-8 w-8 text-green-500" />
            <p className="text-sm font-semibold text-green-800 dark:text-green-400">Password Berhasil Diubah!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gunakan password baru Anda untuk login berikutnya.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5 relative">
              <Label htmlFor="currentPassword">Password Saat Ini *</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••"
                  required
                  disabled={pending}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <Label htmlFor="newPassword">Password Baru *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="••••••"
                  required
                  disabled={pending}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 relative">
              <Label htmlFor="confirmPassword">Konfirmasi Password Baru *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••"
                  required
                  disabled={pending}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {err && <p className="text-xs text-red-600 dark:text-red-400">{err}</p>}

            <Button type="submit" disabled={pending} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold shadow">
              {pending ? "Menyimpan..." : "Ubah Password"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
