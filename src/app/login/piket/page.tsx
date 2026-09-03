import type { Metadata } from "next";
import { LoginForm } from "../LoginForm";

export const metadata: Metadata = {
  title: "Login Piket",
  description: "Masuk ke sistem piket harian SMK Hutama.",
};

export default function PiketLoginPage() {
  return <LoginForm portal="piket" />;
}
