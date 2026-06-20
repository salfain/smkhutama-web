import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function QuestionsPage() {
  redirect("/teacher/question-sets");
}
