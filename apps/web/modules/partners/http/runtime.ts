import "server-only";
import { resolveRequestActor } from "../../auth/request-actor";
import { getDatabase } from "../../shared/database";
import { getObjectStorage } from "../../files/object-storage";
import {
  commandPartner,
  createPartner,
  getPartner,
  listPartners,
  listBenefits,
  partnerDownload,
  partnerFiles,
  partnerHistory,
} from "../partner-service";
import { createPartnerRoute } from "./routes";

export const partnerRoute = createPartnerRoute({
  resolveActor: resolveRequestActor,
  service: {
    benefits: (actor, input) => listBenefits(getDatabase().pool, actor, input),
    list: (actor, input) => listPartners(getDatabase().pool, actor, input),
    get: (actor, id) => getPartner(getDatabase().pool, actor, id),
    create: (context, input) => createPartner(getDatabase().pool, context, input),
    command: (context, id, input) => commandPartner(getDatabase().pool, context, id, input),
    history: (actor, id, page) => partnerHistory(getDatabase().pool, actor, id, page),
    files: (actor, id, page) => partnerFiles(getDatabase().pool, actor, id, page),
    download: (actor, id, fileId) =>
      partnerDownload(getDatabase().pool, actor, id, fileId, getObjectStorage()),
  },
});
