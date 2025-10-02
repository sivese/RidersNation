import { Wrench } from "lucide-react"

export function CustomizerHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(70,100,255,0.08),transparent_50%)]" />

      <div className="container relative mx-auto px-4 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Logo/Brand */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
            <Wrench className="h-5 w-5 text-primary" />
            <span className="font-mono text-sm font-medium text-primary">CUSTOM GARAGE</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 text-balance font-sans text-5xl font-bold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
            Visualize Your Dream <span className="text-primary">Motorcycle</span>
          </h1>

          {/* Subheading */}
          <p className="mx-auto mb-8 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground md:text-xl">
            Upload your bike and custom parts to see exactly how they'll look together. No guesswork, just pure
            customization power.
          </p>

          {/* CTA */}
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <a
              href="#customizer"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-8 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start Customizing
            </a>
            <a
              href="#features"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-secondary px-8 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
