import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RuntimeInfo } from "@michigo/core/schemas";
import { ORPCError } from "@orpc/client";

import { createApiStub, renderRoute, runtimeInfo } from "../test/render";

describe("settings route", () => {
  it("renders runtime details fetched from the main process", async () => {
    renderRoute("/settings");

    expect(await screen.findByText("Michigo 1.0.0")).toBeInTheDocument();
    expect(screen.getByText("24.21.0")).toBeInTheDocument();
    expect(screen.getByText("darwin-x64")).toBeInTheDocument();
    expect(screen.getByText("44.4.5")).toBeInTheDocument();
  });

  it("lists every module the main process reported", async () => {
    renderRoute("/settings");

    expect(await screen.findByText("@michigo/vocab")).toBeInTheDocument();
    expect(screen.getByText("@michigo/anki")).toBeInTheDocument();
    expect(screen.getAllByText("scaffold")).toHaveLength(2);
  });

  it("shows the code of a failure in main instead of rendering stale chrome", async () => {
    renderRoute(
      "/settings",
      createApiStub({
        app: {
          ...createApiStub().app,
          info: vi
            .fn<() => Promise<RuntimeInfo>>()
            .mockRejectedValue(new ORPCError("anki.closed", { message: "anki.closed" })),
        },
      }),
    );

    expect(await screen.findByText("anki.closed")).toBeInTheDocument();
  });

  it("omits the electron row when not running inside Electron", async () => {
    const { electron: _electron, ...withoutElectron } = runtimeInfo;

    renderRoute(
      "/settings",
      createApiStub({
        app: { ...createApiStub().app, info: () => Promise.resolve(withoutElectron) },
      }),
    );

    expect(await screen.findByText("Michigo 1.0.0")).toBeInTheDocument();
    expect(screen.queryByText("electron")).not.toBeInTheDocument();
  });
});
