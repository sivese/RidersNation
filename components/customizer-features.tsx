import { Eye, Zap, Palette, Shield } from "lucide-react"
import { Card } from "@/components/ui/card"

const features = [
  {
    icon: Eye,
    title: "Real-Time Preview",
    description: "See exactly how parts will look on your bike before you buy. No surprises, just confidence.",
  },
  {
    icon: Zap,
    title: "Instant Results",
    description: "Upload and visualize in seconds. Fast, responsive, and built for riders who move quick.",
  },
  {
    icon: Palette,
    title: "Unlimited Combinations",
    description: "Try as many parts as you want. Experiment freely until you find your perfect setup.",
  },
  {
    icon: Shield,
    title: "Your Images, Your Privacy",
    description: "All processing happens in your browser. Your bike photos never leave your device.",
  },
]

export function CustomizerFeatures() {
  return (
    <section id="features" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-balance text-3xl font-bold text-foreground md:text-4xl">Built for Riders</h2>
            <p className="text-pretty text-muted-foreground">Everything you need to visualize your custom build</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="border-border bg-card p-6 transition-colors hover:border-primary/50">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-card-foreground">{feature.title}</h3>
                <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
