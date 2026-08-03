import type { Metadata } from "next";
import { LoginForm } from "../LoginForm";

export const metadata: Metadata = {
  title: "Login Guru",
  description: "Masuk untuk mengelola soal, ujian, dan penilaian.",
};

export default function GuruLoginPage() {
  return <LoginForm portal="guru" />;
}
