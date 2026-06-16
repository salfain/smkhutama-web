import { getTokens, getExamsForToken } from "./actions";
import { TokenManager } from "./TokenManager";

export const dynamic = "force-dynamic";

export default async function TokenPage() {
  const [tokens, exams] = await Promise.all([
    getTokens().catch(() => []),
    getExamsForToken().catch(() => []),
  ]);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-gray-900">Manajemen Token Ujian</h1>
        <p className="text-sm text-gray-500">Generate dan kelola token akses ujian · {tokens.length} token</p>
      </div>
      <TokenManager tokens={tokens} exams={exams} />
    </div>
  );
}
