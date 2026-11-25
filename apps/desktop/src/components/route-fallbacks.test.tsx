import { EventPublisher } from "@orpc/client";
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { createApiStub, renderRoute } from "../test/render";

describe("route fallbacks", () => {
  it("shows the not-found page inside the app shell for an unknown path", async () => {
    renderRoute("/no-such-page");

    expect(await screen.findByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to projects" })).toHaveAttribute("href", "/");
  });

  it("shows only the code of a main-process error in the content pane, and Try again clears it", async () => {
    const errors = new EventPublisher<{ error: string }>();
    renderRoute(
      "/",
      createApiStub({
        app: {
          ...createApiStub().app,
          errors: () => Promise.resolve(errors.subscribe("error")),
        },
      }),
    );
    expect(await screen.findByRole("navigation", { name: "Main" })).toBeInTheDocument();
    // The page subscribes through the async client, so wait until it listens.
    await vi.waitFor(() => {
      expect(errors.size).toBe(1);
    });

    act(() => {
      errors.publish("error", "main.uncaught");
    });

    expect(await screen.findByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("main.uncaught")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.queryByText("main.uncaught")).not.toBeInTheDocument();
  });
});
