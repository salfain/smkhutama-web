import type { Metadata } from "next";
import { LoginForm } from "../LoginForm";

export const metadata: Metadata = {
  title: "Login SIBIKONS",
  description: "Masuk ke sistem bimbingan konseling SMK Hutama.",
};

export default function SibikonsLoginPage() {
  return <LoginForm portal="sibikons" />;
}
