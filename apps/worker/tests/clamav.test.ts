import { createServer } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { ClamAvScanner } from "../src/clamav";

const servers: ReturnType<typeof createServer>[] = [];

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map((server) => new Promise<void>((resolve) => server.close(() => resolve()))),
  );
});

async function fakeClamd(response: string): Promise<number> {
  const server = createServer({ allowHalfOpen: true }, (socket) => {
    let received = Buffer.alloc(0);
    socket.on("data", (chunk: Buffer) => {
      received = Buffer.concat([received, chunk]);
      if (hasInstreamTerminator(received)) socket.end(`${response}\0`);
    });
  });
  servers.push(server);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Synthetic clamd did not bind TCP");
  return address.port;
}

function hasInstreamTerminator(value: Buffer): boolean {
  const command = Buffer.from("zINSTREAM\0");
  if (
    value.byteLength < command.byteLength ||
    !value.subarray(0, command.byteLength).equals(command)
  ) {
    return false;
  }
  let offset = command.byteLength;
  while (value.byteLength >= offset + 4) {
    const length = value.readUInt32BE(offset);
    offset += 4;
    if (length === 0) return true;
    if (value.byteLength < offset + length) return false;
    offset += length;
  }
  return false;
}

describe("ClamAV INSTREAM client", () => {
  it("maps clean and infected protocol responses", async () => {
    const cleanPort = await fakeClamd("stream: OK");
    await expect(
      new ClamAvScanner("127.0.0.1", cleanPort).scan(Buffer.from("clean")),
    ).resolves.toBe("clean");

    const infectedPort = await fakeClamd("stream: Eicar-Signature FOUND");
    await expect(
      new ClamAvScanner("127.0.0.1", infectedPort).scan(Buffer.from("synthetic-virus")),
    ).resolves.toBe("infected");
  });

  it("rejects unavailable scanners without exposing socket details", async () => {
    const port = await fakeClamd("stream: OK");
    await new Promise<void>((resolve) => servers.pop()!.close(() => resolve()));
    await expect(
      new ClamAvScanner("127.0.0.1", port, 100).scan(Buffer.from("data")),
    ).rejects.toThrow("Antivirus scanner unavailable");
  });
});
