import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MobileTodayHeader } from "./mobile-today-header";

describe("MobileTodayHeader", () => {
  it("keeps a long greeting and its status readable without duplicating status text", () => {
    const firstName =
      "Alexanderthegreatwithanexceptionallylongunbrokenfirstname";
    const statusLabel = "High output week";

    render(
      <MobileTodayHeader firstName={firstName} statusLabel={statusLabel} />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: `Hey, ${firstName}.` })
    ).toBeVisible();
    expect(screen.getByText("Today")).toBeVisible();
    expect(screen.getAllByText(statusLabel)).toHaveLength(1);
  });

  it.each(["Good momentum", "Week started", "Fresh week"])(
    "keeps the %s status explicit",
    (statusLabel) => {
      render(
        <MobileTodayHeader firstName="Taylor" statusLabel={statusLabel} />
      );

      expect(screen.getByText(statusLabel)).toBeVisible();
    }
  );
});
