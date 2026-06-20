import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function EditQuestionPage() {
  redirect("/teacher/question-sets");
}
