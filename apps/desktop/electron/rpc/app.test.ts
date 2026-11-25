// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { createMainErrors } from "./app";

vi.mock("electron", () => ({ app: {} }));

describe("main errors", () => {
  it("keeps a code reported while no page listens and hands it to the next page once", async () => {
    const errors = createMainErrors();
    errors.report("main.uncaught");

    const first = errors.subscribe();
    await expect(first.next()).resolves.toEqual({ done: false, value: "main.uncaught" });
    await first.return(undefined);

    const second = errors.subscribe();
    errors.report("main.second");
    await expect(second.next()).resolves.toEqual({ done: false, value: "main.second" });
    await second.return(undefined);
  });

  it("sends a code to every page that listens, and keeps none for later", async () => {
    const errors = createMainErrors();
    const a = errors.subscribe();
    const b = errors.subscribe();
    // Starts both generators, so their subscriptions exist before the report.
    const nextA = a.next();
    const nextB = b.next();

    errors.report("main.uncaught");

    await expect(nextA).resolves.toEqual({ done: false, value: "main.uncaught" });
    await expect(nextB).resolves.toEqual({ done: false, value: "main.uncaught" });
    await a.return(undefined);
    await b.return(undefined);

    const later = errors.subscribe();
    const nextLater = later.next();
    errors.report("main.later");
    await expect(nextLater).resolves.toEqual({ done: false, value: "main.later" });
    await later.return(undefined);
  });

  it("stops listening when the page goes away", async () => {
    const errors = createMainErrors();
    const controller = new AbortController();
    const page = errors.subscribe(controller.signal);
    const next = page.next();

    controller.abort();
    await expect(next).rejects.toThrow("aborted");

    errors.report("main.uncaught");
    const reloaded = errors.subscribe();
    await expect(reloaded.next()).resolves.toEqual({ done: false, value: "main.uncaught" });
  });
});
