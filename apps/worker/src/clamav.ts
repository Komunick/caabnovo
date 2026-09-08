import { createConnection, type Socket } from "node:net";
import type { VirusScanner } from "./jobs/scan-file.js";

const STREAM_CHUNK_BYTES = 64 * 1024;

export class ClamAvScanner implements VirusScanner {
  constructor(
    private readonly host: string,
    private readonly port: number,
    private readonly timeoutMs = 15_000,
  ) {}

  scan(body: Uint8Array): Promise<"clean" | "infected"> {
    return new Promise((resolve, reject) => {
      const socket = createConnection({ host: this.host, port: this.port });
      let response = "";
      let settled = false;

      const fail = (error: Error) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        reject(new Error("Antivirus scanner unavailable", { cause: error }));
      };
      const finish = () => {
        if (settled) return;
        const normalized = response.replaceAll("\0", "").trim();
        if (normalized.endsWith(" OK")) {
          settled = true;
          socket.destroy();
          resolve("clean");
        } else if (normalized.endsWith(" FOUND")) {
          settled = true;
          socket.destroy();
          resolve("infected");
        } else {
          fail(new Error("Unexpected antivirus response"));
        }
      };

      socket.setTimeout(this.timeoutMs, () => fail(new Error("Antivirus scanner timed out")));
      socket.once("error", fail);
      socket.on("data", (chunk: Buffer) => {
        response += chunk.toString("utf8");
        if (response.includes("\0") || response.includes("\n")) finish();
      });
      socket.once("end", finish);
      socket.once("connect", () => writeInstream(socket, body));
    });
  }
}

function writeInstream(socket: Socket, body: Uint8Array): void {
  socket.write("zINSTREAM\0");
  for (let offset = 0; offset < body.byteLength; offset += STREAM_CHUNK_BYTES) {
    const chunk = body.subarray(offset, offset + STREAM_CHUNK_BYTES);
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(chunk.byteLength);
    socket.write(length);
    socket.write(chunk);
  }
  socket.end(Buffer.alloc(4));
}
