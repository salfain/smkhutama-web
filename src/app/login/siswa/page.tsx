import type { Metadata } from "next";
import { LoginForm } from "../LoginForm";

export const metadata: Metadata = {
  title: "Login Siswa",
  description: "Masuk untuk mengerjakan ujian dan melihat hasil belajar.",
};

export default function SiswaLoginPage() {
  return <LoginForm portal="siswa" />;
}
