import { CustomizerHero } from "@/components/customizer-hero"
import { CustomizerTool } from "@/components/customizer-tool"
import { CustomizerFeatures } from "@/components/customizer-features"

export default function Home() {
  return (
    <main className="min-h-screen">
      <CustomizerHero />
      <CustomizerTool />
      <CustomizerFeatures />
    </main>
  )
}
