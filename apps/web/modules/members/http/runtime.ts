import "server-only";
import { resolveRequestActor } from "../../auth/request-actor";
import { getDatabase } from "../../shared/database";
import { getObjectStorage } from "../../files/object-storage";
import {
  commandMember,
  createMember,
  getMember,
  listMembers,
  memberDownload,
  memberFiles,
  memberHistory,
} from "../member-service";
import { createMemberRoute } from "./routes";

export const memberRoute = createMemberRoute({
  resolveActor: resolveRequestActor,
  service: {
    list: (actor, input) => listMembers(getDatabase().pool, actor, input),
    get: (actor, id) => getMember(getDatabase().pool, actor, id),
    create: (context, input) => createMember(getDatabase().pool, context, input),
    command: (context, id, input) => commandMember(getDatabase().pool, context, id, input),
    history: (actor, id, page) => memberHistory(getDatabase().pool, actor, id, page),
    files: (actor, id, page) => memberFiles(getDatabase().pool, actor, id, page),
    download: (actor, id, fileId) =>
      memberDownload(getDatabase().pool, actor, id, fileId, getObjectStorage()),
  },
});
