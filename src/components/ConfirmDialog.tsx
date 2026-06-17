"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Trash2, LogOut, Info } from "lucide-react";

type Variant = "danger" | "warning" | "info";
type ConfirmOptions = {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: Variant;
  icon?: "trash" | "logout" | "warning" | "info";
};

type ConfirmFn = (opts?: ConfirmOptions | string) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

function normalize(input?: ConfirmOptions | string): ConfirmOptions {
  if (typeof input === "string") return { description: input };
  return input ?? {};
}

const variantStyle: Record<Variant, { iconBg: string; iconColor: string; btn: string }> = {
  danger: { iconBg: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-400", btn: "bg-red-600 hover:bg-red-700 text-white" },
  warning: { iconBg: "bg-sky-100 dark:bg-sky-900/30", iconColor: "text-sky-600 dark:text-sky-400", btn: "bg-sky-600 hover:bg-sky-700 text-white" },
  info: { iconBg: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
};

const iconMap = { trash: Trash2, logout: LogOut, warning: AlertTriangle, info: Info };

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions>({});
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    setOpts(normalize(options));
    setOpen(true);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  function close(result: boolean) {
    setOpen(false);
    resolver.current?.(result);
    resolver.current = null;
  }

  const variant = opts.variant ?? "danger";
  const vs = variantStyle[variant];
  const Icon = iconMap[opts.icon ?? (variant === "danger" ? "trash" : "warning")];

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(o) => { if (!o) close(false); }}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${vs.iconBg}`}>
                <Icon className={`h-5 w-5 ${vs.iconColor}`} />
              </div>
              <div className="space-y-1 pt-0.5">
                <DialogTitle>{opts.title ?? "Konfirmasi"}</DialogTitle>
                <DialogDescription>{opts.description ?? "Apakah Anda yakin?"}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => close(false)}>{opts.cancelText ?? "Batal"}</Button>
            <Button className={vs.btn} onClick={() => close(true)}>{opts.confirmText ?? "Ya, Lanjutkan"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async (opts?: ConfirmOptions | string) => {
      const o = normalize(opts);
      return window.confirm(o.description ?? o.title ?? "Apakah Anda yakin?");
    };
  }
  return ctx;
}
