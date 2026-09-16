import { notFound } from "next/navigation";
import { messageKindSchema } from "@caab/contracts";
import { MessageListPage } from "@/modules/messaging/ui/list-page";
export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const parsed = messageKindSchema.safeParse((await params).kind);
  if (!parsed.success) notFound();
  return <MessageListPage kind={parsed.data} />;
}
