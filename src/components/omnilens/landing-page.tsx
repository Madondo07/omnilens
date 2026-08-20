import { Link } from "@tanstack/react-router";
import {
  Aperture,
  Upload,
  Search,
  Sparkles,
  FileText,
  FileOutput,
  Users,
  Wand2,
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  TriangleAlert,
  Clock,
  ShieldCheck,
  MessagesSquare,
  Layers,
  Github,
  Twitter,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ThemeToggle } from "@/components/omnilens/theme-toggle";
import { useAuth } from "@/lib/use-auth";
import { useReveal } from "@/lib/use-reveal";

const LENSES = [
  {
    label: "Executive",
    score: 45,
    suggested: false,
    brief: "High-level strategic overview — ROI, timelines, and critical blockers for leadership.",
  },
  {
    label: "IT / Engineering",
    score: 95,
    suggested: true,
    brief:
      "Deep technical framing — architecture decisions, dependencies, and implementation details.",
  },
  {
    label: "HR / People Ops",
    score: 30,
    suggested: false,
    brief: "Human-centric view — resourcing, training needs, and organizational impact.",
  },
  {
    label: "Sales / GTM",
    score: 20,
    suggested: false,
    brief: "Market-facing translation — value propositions, competitive edge, and release timing.",
  },
  {
    label: "Support / Operations",
    score: 60,
    suggested: true,
    brief: "Frontline enablement — known issues, SLA impact, and customer communication.",
  },
] as const;

const CUSTOM_LENS_BRIEF =
  "Describe your own audience or decision — OmniLens frames the poster around it.";

const CAPABILITIES = [
  {
    icon: FileText,
    title: "Immutable source pool",
    description:
      "Upload PDFs, docs, and notes into a shared, read-only pool. Originals are never modified — only read and cited.",
  },
  {
    icon: ShieldCheck,
    title: "Hard-conflict detection",
    description:
      "Contradictory dates, budgets, and named technologies are flagged once across the whole pool. Informative, not blocking.",
  },
  {
    icon: MessagesSquare,
    title: "Grounded chat",
    description:
      "Ask questions answered strictly from your uploaded sources, with inline citations — never fabricated.",
  },
  {
    icon: Layers,
    title: "Lens-generated artifacts",
    description:
      "Generate 1-Page Executive Posters framed for any audience. Every version is cached and comparable side-by-side.",
  },
] as const;

export function LandingPage() {
  const { user } = useAuth();
  const hero = useReveal<HTMLElement>();
  const problem = useReveal<HTMLElement>();
  const howItWorks = useReveal<HTMLElement>();
  const lenses = useReveal<HTMLElement>();
  const capabilities = useReveal<HTMLElement>();
  const cta = useReveal<HTMLElement>();

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 glass-soft">
        <div className="container flex h-16 max-w-7xl items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-2">
            <Aperture className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">OmniLens AI</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Button asChild>
                <Link to="/workbench">Go to Workbench</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section
          ref={hero.ref}
          className={`reveal ${hero.visible ? "is-visible" : ""} container mx-auto px-4 pt-16 pb-16 md:pt-24 md:pb-20 flex flex-col items-center text-center max-w-5xl`}
        >
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm mb-8 glass-soft label-mono text-muted-foreground">
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            <span>The intelligent truth layer for your organization</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Stop rewriting the same <span className="text-primary">project truth</span> for every
            department.
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl leading-relaxed">
            OmniLens is a fully source-grounded intelligence platform. Upload your documents,
            surface hard contradictions, and generate tailored, lens-specific artifacts—without
            hallucinating or touching the originals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button size="lg" className="h-12 px-8 text-base rounded-full" asChild>
              <Link to="/auth">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-8 text-base rounded-full"
              asChild
            >
              <a href="#problem">
                Learn more <ChevronDown className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>

          {/* Workbench mockup */}
          <div className="mt-12 w-full max-w-3xl">
            <div className="glass rounded-2xl p-5 sm:p-6 text-left">
              <div className="flex items-center gap-2 mb-5">
                <span className="flex gap-1.5">
                  <span className="size-2.5 rounded-full bg-destructive/70" />
                  <span className="size-2.5 rounded-full bg-advisory/70" />
                  <span className="size-2.5 rounded-full bg-primary/70" />
                </span>
                <span className="label-mono ml-2">Workbench · Sources</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="glass-soft rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="size-4 text-primary shrink-0" />
                    <span className="truncate">plan.md</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted">
                    <div className="h-full w-4/5 rounded-full bg-verified/60" />
                  </div>
                  <Badge variant="outline" className="mt-3 gap-1 border-verified/40 text-verified">
                    <CheckCircle2 className="size-3" /> clean
                  </Badge>
                </div>
                <div className="glass-soft rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="size-4 text-primary shrink-0" />
                    <span className="truncate">update.docx</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted">
                    <div className="h-full w-3/5 rounded-full bg-advisory/60" />
                  </div>
                  <Badge variant="outline" className="mt-3 gap-1 border-advisory/50 text-advisory">
                    <TriangleAlert className="size-3" /> conflict
                  </Badge>
                </div>
                <div className="glass-soft rounded-xl p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileOutput className="size-4 text-primary shrink-0" />
                    <span className="truncate">Executive poster</span>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-muted">
                    <div className="h-full w-full rounded-full bg-primary/60" />
                  </div>
                  <Badge
                    variant="outline"
                    className="mt-3 gap-1 border-border text-muted-foreground"
                  >
                    <Clock className="size-3" /> 4 / 4 fields
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section
          id="problem"
          ref={problem.ref}
          className={`reveal ${problem.visible ? "is-visible" : ""} py-16 md:py-20`}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="glass rounded-3xl border border-border/50 p-8 md:p-12">
              <div className="max-w-3xl mx-auto text-center mb-16">
                <h2 className="label-mono text-amber-500 mb-4">The Problem</h2>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">
                  Translation loss is destroying your alignment.
                </h3>
                <p className="text-lg text-muted-foreground">
                  Teams spend hours manually rewriting technical briefs for executives, product
                  specs for marketing, and timelines for support. In the process, crucial context is
                  lost, and conflicting information slips through unnoticed until it derails the
                  project.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="glass-soft p-8 rounded-2xl">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                    <FileText className="h-6 w-6 text-destructive" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">Endless Rewriting</h4>
                  <p className="text-muted-foreground">
                    Creating different versions of the same document for different stakeholders
                    drains productivity and morale.
                  </p>
                </div>
                <div className="glass-soft p-8 rounded-2xl">
                  <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                    <Users className="h-6 w-6 text-amber-500" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">Silent Contradictions</h4>
                  <p className="text-muted-foreground">
                    The engineering spec says Q3, but the sales deck promises Q2. No one notices
                    until the client asks.
                  </p>
                </div>
                <div className="glass-soft p-8 rounded-2xl">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Wand2 className="h-6 w-6 text-primary" />
                  </div>
                  <h4 className="text-xl font-bold mb-3">AI Hallucinations</h4>
                  <p className="text-muted-foreground">
                    Generic AI tools make up facts when summarizing across complex documents,
                    introducing dangerous liabilities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          ref={howItWorks.ref}
          className={`reveal ${howItWorks.visible ? "is-visible" : ""} py-16 md:py-20`}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="glass rounded-3xl border border-border/50 p-8 md:p-12">
              <div className="max-w-3xl mb-16">
                <h2 className="label-mono text-primary mb-4">How it works</h2>
                <h3 className="text-3xl md:text-4xl font-bold">
                  From chaos to clarity in four steps.
                </h3>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="relative p-6 glass-soft rounded-2xl">
                  <div className="text-4xl font-bold text-muted/30 absolute top-6 right-6">01</div>
                  <Upload className="h-8 w-8 text-primary mb-6" />
                  <h4 className="text-lg font-bold mb-2">Upload sources</h4>
                  <p className="text-sm text-muted-foreground">
                    Ingest your raw project documents (PDF, MD, TXT, DOCX) into an immutable source
                    pool.
                  </p>
                </div>
                <div className="relative p-6 glass-soft rounded-2xl">
                  <div className="text-4xl font-bold text-muted/30 absolute top-6 right-6">02</div>
                  <Search className="h-8 w-8 text-primary mb-6" />
                  <h4 className="text-lg font-bold mb-2">Detect conflicts</h4>
                  <p className="text-sm text-muted-foreground">
                    OmniLens automatically cross-references sources to surface and flag hard
                    contradictions.
                  </p>
                </div>
                <div className="relative p-6 glass-soft rounded-2xl">
                  <div className="text-4xl font-bold text-muted/30 absolute top-6 right-6">03</div>
                  <Aperture className="h-8 w-8 text-primary mb-6" />
                  <h4 className="text-lg font-bold mb-2">Apply a lens</h4>
                  <p className="text-sm text-muted-foreground">
                    Choose a specific framing perspective—from executive summaries to technical
                    specs.
                  </p>
                </div>
                <div className="relative p-6 glass-soft rounded-2xl">
                  <div className="text-4xl font-bold text-muted/30 absolute top-6 right-6">04</div>
                  <Sparkles className="h-8 w-8 text-primary mb-6" />
                  <h4 className="text-lg font-bold mb-2">Generate artifacts</h4>
                  <p className="text-sm text-muted-foreground">
                    Produce perfectly tailored, 100% source-grounded deliverables that you can
                    trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lenses section */}
        <section
          ref={lenses.ref}
          className={`reveal ${lenses.visible ? "is-visible" : ""} py-16 md:py-20`}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="glass rounded-3xl border border-border/50 p-8 md:p-12">
              <div className="mb-12 max-w-2xl">
                <h2 className="label-mono text-primary mb-4">Lenses</h2>
                <h3 className="text-3xl md:text-4xl font-bold mb-6">One pool, five audiences.</h3>
                <p className="text-lg text-muted-foreground">
                  The same source pool reads differently for an exec than for engineering. Each lens
                  reframes the verified content into a 1-Page Executive Poster — and ranks which
                  lens fits your documents best. Hover a lens for a quick brief.
                </p>
              </div>

              {/* Lens pill selector */}
              <div className="flex flex-wrap gap-2 mb-6">
                {LENSES.map(({ label, brief }) => (
                  <HoverCard key={label} openDelay={120} closeDelay={80}>
                    <HoverCardTrigger asChild>
                      <span className="glass-soft cursor-default rounded-full px-4 py-2 text-sm font-medium">
                        {label}
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <p className="text-sm font-medium">{label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{brief}</p>
                    </HoverCardContent>
                  </HoverCard>
                ))}
                <HoverCard openDelay={120} closeDelay={80}>
                  <HoverCardTrigger asChild>
                    <span className="inline-flex cursor-default items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-4 py-2 text-sm font-medium text-primary">
                      <Wand2 className="size-4" /> Custom lens
                    </span>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-64">
                    <p className="text-sm font-medium">Custom lens</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {CUSTOM_LENS_BRIEF}
                    </p>
                  </HoverCardContent>
                </HoverCard>
              </div>

              {/* Suggested-lens ranking card */}
              <div className="glass-soft rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <p className="label-mono">Lens · 1-Page Executive Poster</p>
                  <span className="flex items-center gap-1 text-xs text-primary">
                    <Sparkles className="size-3" /> suggested
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LENSES.map(({ label, score, suggested, brief }) => (
                    <HoverCard key={label} openDelay={120} closeDelay={80}>
                      <HoverCardTrigger asChild>
                        <span
                          className={`inline-flex cursor-default items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-medium ${
                            suggested
                              ? "bg-primary text-primary-foreground shadow-lift"
                              : "glass text-foreground"
                          }`}
                        >
                          {suggested && <Sparkles className="size-3" />}
                          {label}
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-64">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{label}</p>
                          <span className="label-mono shrink-0">{score}% fit</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {brief}
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  ))}
                  <HoverCard openDelay={120} closeDelay={80}>
                    <HoverCardTrigger asChild>
                      <span className="glass inline-flex cursor-default items-center gap-1.5 rounded-full border border-dashed border-primary/50 px-3.5 py-2 text-xs font-medium text-primary">
                        <Wand2 className="size-3" /> Custom lens
                      </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-64">
                      <p className="text-sm font-medium">Custom lens</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {CUSTOM_LENS_BRIEF}
                      </p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Capabilities section — same boxed-panel treatment as every other
            section, following the global theme like its siblings. */}
        <section
          ref={capabilities.ref}
          className={`reveal ${capabilities.visible ? "is-visible" : ""} py-16 md:py-20`}
        >
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="glass rounded-3xl border border-border/50 p-8 md:p-12">
              <div className="text-center mb-16 max-w-2xl mx-auto">
                <h2 className="label-mono text-primary mb-4">Capabilities</h2>
                <h3 className="text-3xl md:text-4xl font-bold">
                  Built to keep the originals honest.
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                {CAPABILITIES.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="glass-soft rounded-2xl p-6">
                    <div className="h-11 w-11 rounded-xl bg-primary/15 flex items-center justify-center mb-5">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-lg font-bold mb-2">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section
          ref={cta.ref}
          className={`reveal ${cta.visible ? "is-visible" : ""} py-16 md:py-20`}
        >
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="glass rounded-3xl border border-border/50 p-10 md:p-14">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">Ready to stop rewriting?</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join forward-thinking teams who use OmniLens to maintain a single source of truth
                across all their departments.
              </p>
              <Button size="lg" className="h-14 px-10 text-lg rounded-full" asChild>
                <Link to="/auth">Sign up for OmniLens AI</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer — deliberately static/muted in both themes, but still driven by
          the theme's own `--muted` token (not a hardcoded color), and fully
          opaque so the fixed background grid never shows through it. */}
      <footer className="border-t border-border/40 bg-muted py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2">
                <Aperture className="h-5 w-5 text-primary" />
                <span className="font-bold tracking-tight">OmniLens AI</span>
              </div>
              <p className="mt-4 max-w-xs text-sm text-muted-foreground">
                A source-grounded workbench for extracting insights, detecting conflicts, and
                generating comparable project artifacts.
              </p>
              <div className="mt-5 flex items-center gap-2">
                <a
                  href="#"
                  aria-label="GitHub"
                  className="glass-soft flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Github className="size-4" />
                </a>
                <a
                  href="#"
                  aria-label="Twitter"
                  className="glass-soft flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Twitter className="size-4" />
                </a>
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="glass-soft flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Linkedin className="size-4" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="label-mono mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/workbench"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Workbench
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Lenses
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Conflict detection
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Artifact export
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="label-mono mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Manifesto
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Changelog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="label-mono mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Security
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Data handling
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-2 border-t border-border/40 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 OmniLens AI. All rights reserved.</p>
            <p>Conflicts and staleness are informative states, not errors.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
