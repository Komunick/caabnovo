import { redirect } from "next/navigation";

export default async function LegacyJobPage({
  params,
}: Readonly<{ params: Promise<{ jobId: string }> }>) {
  redirect(`/audit/jobs/${encodeURIComponent((await params).jobId)}`);
}
