import { Navbar } from "@/components/landing/navbar"
import { HeroSlider } from "@/components/landing/hero-slider"
import { FeaturedServices } from "@/components/landing/featured-services"
import { InfoBanner } from "@/components/landing/info-banner"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar />
      <HeroSlider />
      <FeaturedServices />
      <InfoBanner />

      {/* Latest News */}
      <section id="about" className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Latest from DC DMV</h2>
            <p className="mt-2 text-muted-foreground">Stay informed about DC DMV news and updates</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                date: "Jan 15, 2026",
                title: "Modified District Government Services for Martin Luther King Jr. Day",
                excerpt: "On Monday, January 19, District Government will observe the Martin Luther King Jr. Day holiday.",
              },
              {
                date: "Dec 10, 2025",
                title: "DC DMV Makes Knowledge Testing Available in Nine Additional Languages",
                excerpt: "Beginning December 15, 2025, the DC DMV Knowledge Testing System will be available in 9 new languages.",
              },
              {
                date: "Oct 1, 2025",
                title: "DC DMV Launches Intelligent Speed Assistance (ISA) Program",
                excerpt: "The DC Department of Motor Vehicles launches the ISA Program to combat aggravated reckless driving.",
              },
            ].map((news) => (
              <article
                key={news.title}
                className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md"
              >
                <time className="text-xs font-medium text-primary">{news.date}</time>
                <h3 className="text-sm font-semibold leading-snug text-foreground">
                  {news.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{news.excerpt}</p>
                <a href="#" className="mt-auto inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                  Read more
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
