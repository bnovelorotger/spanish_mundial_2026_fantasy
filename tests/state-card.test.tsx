import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { StateCard } from "@/components/ui/StateCard";

describe("StateCard", () => {
  it("renders neutral Spanish defaults when no props are passed", () => {
    const markup = renderToStaticMarkup(<StateCard />);

    expect(markup).toContain("Sin movimiento todavía");
    expect(markup).toContain("Esta tarjeta espera su primer dato.");
    expect(markup).toContain(
      "Cuando haya algo que mostrar en esta zona, lo verás aquí.",
    );
  });

  it("does not fall back to the legacy generic 'Tu torneo empieza aquí.' eyebrow", () => {
    const markup = renderToStaticMarkup(<StateCard />);

    expect(markup).not.toContain("Tu torneo empieza aquí.");
  });

  it("renders contextual copy when caller provides eyebrow/title/description", () => {
    const markup = renderToStaticMarkup(
      <StateCard
        description="Ajusta la fase o el grupo para ver más cruces."
        eyebrow="Sin coincidencias"
        title="Ningún partido cumple esos filtros."
      />,
    );

    expect(markup).toContain("Sin coincidencias");
    expect(markup).toContain("Ningún partido cumple esos filtros.");
    expect(markup).toContain("Ajusta la fase o el grupo para ver más cruces.");
  });
});
