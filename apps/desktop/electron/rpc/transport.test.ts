// @vitest-environment node
import { MessageChannel } from "node:worker_threads";

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/message-port";
import { type ContractRouterClient, eventIterator, oc } from "@orpc/contract";
import { implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/message-port";
import { expect, it } from "vitest";
import { z } from "zod";

// A long action is a stream of progress that the renderer can cancel. This
// proves both work over a real MessagePort, with a router made for the test.
const contract = {
  count: oc
    .input(z.object({ to: z.number() }))
    .output(eventIterator(z.object({ done: z.number() }))),
};

it("streams progress over the port, and an abort in the client reaches the handler's signal", async () => {
  let aborted = false;
  const os = implement(contract);
  const router = os.router({
    count: os.count.handler(async function* ({ input, signal }) {
      signal?.addEventListener("abort", () => {
        aborted = true;
      });
      for (let done = 1; done <= input.to; done++) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        yield { done };
      }
    }),
  });
  const { port1, port2 } = new MessageChannel();
  new RPCHandler(router).upgrade(port1, { context: {} });
  port1.start();
  const client: ContractRouterClient<typeof contract> = createORPCClient(
    new RPCLink({ port: port2 }),
  );
  port2.start();

  const controller = new AbortController();
  const progress: number[] = [];
  try {
    for await (const event of await client.count({ to: 100 }, { signal: controller.signal })) {
      progress.push(event.done);
      if (event.done === 3) {
        controller.abort();
      }
    }
  } catch {
    // The aborted stream ends with an error on the client side.
  }

  await expect.poll(() => aborted).toBe(true);
  expect(progress).toEqual([1, 2, 3]);
  port1.close();
  port2.close();
});
