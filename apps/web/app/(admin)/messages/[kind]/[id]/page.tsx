import { notFound } from "next/navigation";
import { messageKindSchema, idSchema } from "@caab/contracts";
import { MessageEditorPage } from "@/modules/messaging/ui/editor";
export default async function Page({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  const parsed = messageKindSchema.safeParse(kind);
  if (!parsed.success || (id !== "new" && !idSchema.safeParse(id).success)) notFound();
  return <MessageEditorPage kind={parsed.data} id={id} />;
}
