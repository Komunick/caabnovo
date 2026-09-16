import { MessageShell } from "@/modules/messaging/ui/shared";
export default function Page() {
  return (
    <MessageShell
      active="channels"
      title="Meios de envio"
      description="Os meios serão definidos na próxima etapa."
    >
      <section className="panel">
        <h2>Nenhum meio configurado</h2>
        <p>
          Campanhas, modelos, públicos e programações já podem ser preparados. Solicitações
          imediatas ou vencidas registram o impedimento no histórico.
        </p>
        <p>
          Adicionar um meio no futuro não enviará automaticamente campanhas bloqueadas. Será
          necessária uma nova solicitação.
        </p>
      </section>
    </MessageShell>
  );
}
