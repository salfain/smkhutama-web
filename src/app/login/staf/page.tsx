import type { Metadata } from "next";
import { LoginForm } from "../LoginForm";

export const metadata: Metadata = {
  title: "Login Staf",
  description: "Masuk sebagai Admin, Kurikulum, Kesiswaan, atau Admin CBT.",
};

export default function StafLoginPage() {
  return <LoginForm portal="staf" />;
}
