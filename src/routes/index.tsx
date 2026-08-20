import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/omnilens/landing-page";

const TITLE = "OmniLens AI — Source-Grounded Project Intelligence";
const DESC =
  "Upload project documents into an immutable source pool, surface hard contradictions across them, and generate lens-specific executive posters without touching the originals.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: LandingPage,
});
