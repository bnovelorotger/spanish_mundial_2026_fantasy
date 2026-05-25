import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StateCard } from "@/components/ui/StateCard";

describe("StateCard", () => {
  it("renders Spanish empty-state defaults", () => {
    const markup = renderToStaticMarkup(<StateCard />);

    expect(markup).toContain("Tu torneo empieza aquí.");
    expect(markup).toContain("El marcador espera su próximo movimiento.");
    expect(markup).toContain(
      "En cuanto lleguen más partidos, puntos o movimientos, esta tarjeta volverá a encenderse.",
    );
  });
});
