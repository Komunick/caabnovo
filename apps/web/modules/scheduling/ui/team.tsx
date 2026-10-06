"use client";
import { useState } from "react";
import { useModulePermission } from "@/components/workspace-permissions";
import { useDraftState, useDraftCache } from "@/components/workspace-drafts";
import { Button } from "@/components/ui/button";
import { Choice, DataState, useSchedulingData, useSchedulingMutation } from "./shared";
type Team = { version: number; items: Array<{ id: string; name: string }> };
export function SchedulingTeam({ unitId }: { unitId: string }) {
  const canWrite = useModulePermission("scheduling:write");
  const canReadUsers = useModulePermission("users:read");
  return canWrite || canReadUsers ? <SchedulingTeamDirectory unitId={unitId} /> : null;
}
function SchedulingTeamDirectory({ unitId }: { unitId: string }) {
  const result = useSchedulingData<Team>(`units/${unitId}/team`);
  return (
    <section className="panel scheduling-form">
      <h2>Equipe responsável</h2>
      <p>
        Vincule colaboradores que já tenham acesso de alteração. Outros colaboradores autorizados
        continuam disponíveis como backup.
      </p>
      {result.data ? (
        <TeamEditor
          key={`${unitId}:${result.data.version}`}
          unitId={unitId}
          data={result.data}
          reload={result.reload}
        />
      ) : (
        <DataState error={result.error} reload={result.reload} />
      )}
    </section>
  );
}
function TeamEditor({ unitId, data, reload }: { unitId: string; data: Team; reload(): void }) {
  const drafts = useDraftCache();
  const [version, setVersion] = useDraftState(`team:${unitId}:version`, data.version);
  const [names, setNames] = useDraftState<Record<string, string>>(
    `team:${unitId}:names`,
    Object.fromEntries(data.items.map((item) => [item.id, item.name])),
  );
  const [members, setMembers] = useDraftState(
    `team:${unitId}:members`,
    data.items.map((p) => p.id),
  );
  const [candidate, setCandidate] = useDraftState(`team:${unitId}:candidate`, "");
  const [notice, setNotice] = useState("");
  const canWrite = useModulePermission("scheduling:write");
  const mutation = useSchedulingMutation(`team:${unitId}`);
  return (
    <>
      <ul>
        {members.map((id) => (
          <li key={id}>
            {names[id] ?? data.items.find((p) => p.id === id)?.name ?? "Colaborador"}{" "}
            <Button
              disabled={!canWrite || mutation.pending}
              onClick={() => setMembers(members.filter((p) => p !== id))}
            >
              Remover vínculo
            </Button>
          </li>
        ))}
      </ul>
      <Choice
        label="Adicionar colaborador"
        resource="team-candidates"
        value={candidate}
        onChange={setCandidate}
        onSelected={(item) => setNames({ ...names, [item.id]: item.name })}
        disabled={!canWrite || mutation.pending}
      />
      <div className="scheduling-actions">
        <Button
          disabled={!canWrite || !candidate || mutation.pending || members.includes(candidate)}
          onClick={() => {
            setMembers([...members, candidate]);
            setCandidate("");
          }}
        >
          Adicionar à equipe
        </Button>
        <Button
          intent="primary"
          disabled={!canWrite || mutation.pending}
          onClick={async () => {
            const saved = await mutation.mutate<{ version: number }>(
              `units/${unitId}/team`,
              "POST",
              {
                expectedVersion: version,
                userIds: members,
              },
            );
            if (saved) {
              setVersion(saved.version);
              setNotice("Equipe salva.");
              reload();
            }
          }}
        >
          Salvar equipe
        </Button>
        <Button
          onClick={() => {
            drafts.clear(`team:${unitId}:`);
            reload();
          }}
        >
          Descartar alterações e atualizar
        </Button>
      </div>
      {mutation.error && <p role="alert">{mutation.error}</p>}
      {notice && <p role="status">{notice}</p>}
    </>
  );
}
