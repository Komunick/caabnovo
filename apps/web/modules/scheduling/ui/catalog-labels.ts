import type { SchedulingKind } from "@caab/contracts";

export const catalogLabels: Record<
  SchedulingKind,
  { title: string; add: string; edit: string; description: string }
> = {
  units: {
    title: "Unidades",
    add: "Nova unidade",
    edit: "Editar unidade",
    description: "Locais de atendimento e informações de contato.",
  },
  services: {
    title: "Serviços",
    add: "Novo serviço",
    edit: "Editar serviço",
    description: "Serviços disponíveis em cada unidade de atendimento.",
  },
  procedures: {
    title: "Procedimentos",
    add: "Novo procedimento",
    edit: "Editar procedimento",
    description: "Procedimentos de cada serviço e duração dos atendimentos.",
  },
  professionals: {
    title: "Profissionais",
    add: "Novo profissional",
    edit: "Editar profissional",
    description: "Profissionais que realizam os atendimentos da agenda.",
  },
  assignments: {
    title: "Habilitações",
    add: "Nova habilitação",
    edit: "Editar habilitação",
    description: "Vincule profissionais aos procedimentos que atendem em cada unidade.",
  },
};
