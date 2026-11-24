import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createApiStub, renderRoute } from "../test/render";

describe("route fallbacks", () => {
  it("shows the not-found page inside the app shell for an unknown path", async () => {
    renderRoute("/no-such-page");

    expect(await screen.findByText("Page not found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to projects" })).toHaveAttribute("href", "/");
  });

  it("shows only the code of a main-process error in the content pane, and Try again clears it", async () => {
    let report: ((code: string) => void) | undefined;
    renderRoute(
      "/",
      createApiStub({
        app: {
          ...createApiStub().app,
          onError: (listener) => {
            report = listener;
            return () => undefined;
          },
        },
      }),
    );
    expect(await screen.findByRole("navigation", { name: "Main" })).toBeInTheDocument();

    act(() => {
      report?.("main.uncaught");
    });

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("main.uncaught")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(screen.queryByText("main.uncaught")).not.toBeInTheDocument();
  });
});
