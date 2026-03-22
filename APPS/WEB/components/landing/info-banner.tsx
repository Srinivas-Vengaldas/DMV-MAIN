import Link from "next/link"
import { Button } from "@/components/ui/button"

export function InfoBanner() {
  return (
    <section className="bg-secondary py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:justify-between">
          {/* Know Before You Go */}
          <div className="flex flex-1 flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <h3 className="text-lg font-bold text-secondary-foreground">Know Before You Go!</h3>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              55+ online services are available to customers. If your transaction requires an
              in-person visit, know what documents you need before you go.
            </p>
            <Link href="/application">
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5">
                Learn More
              </Button>
            </Link>
          </div>

          <div className="hidden h-16 w-px bg-border lg:block" />

          {/* License & ID */}
          <div className="flex flex-1 flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <h3 className="text-lg font-bold text-secondary-foreground">License & ID</h3>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Obtain, convert, renew or get a duplicate Driver License or Identification Card.
            </p>
            <Link href="/application">
              <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5">
                Get Started
              </Button>
            </Link>
          </div>

          <div className="hidden h-16 w-px bg-border lg:block" />

          {/* Vehicles */}
          <div className="flex flex-1 flex-col items-center gap-3 text-center lg:items-start lg:text-left">
            <h3 className="text-lg font-bold text-secondary-foreground">Vehicles</h3>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Title, register, and inspect your vehicle through our online portal.
            </p>
            <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/5">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
