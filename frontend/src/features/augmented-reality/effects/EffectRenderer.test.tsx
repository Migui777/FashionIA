import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EffectRenderer } from "./EffectRenderer";

describe("EffectRenderer", () => {
  it("renders the glow effect for the given intensity", () => {
    render(
      <EffectRenderer
        effect={{
          type: "glow",
          intensity: 0.8,
          assetUrl: null,
        }}
        dressName="Aurora"
      />,
    );

    // El nombre del vestido lo pinta AROverlay por fuera de este componente
    // (ver AROverlay.tsx); EffectRenderer solo dibuja el efecto visual.
    expect(screen.getByTestId("effect-glow")).toBeInTheDocument();
  });

  it("renders the dress name as the floating text effect itself", () => {
    render(
      <EffectRenderer
        effect={{
          type: "floating_text",
          intensity: 0.8,
          assetUrl: null,
        }}
        dressName="Aurora"
      />,
    );

    expect(screen.getByText("Aurora")).toBeInTheDocument();
    expect(screen.getByTestId("effect-floating-text")).toBeInTheDocument();
  });
});
