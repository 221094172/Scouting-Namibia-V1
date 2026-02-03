import type React from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Video, Users, Trophy, MapPin, Star, TrendingUp } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="absolute top-0 left-0 right-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Trophy className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-white">Scouting Namibia</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:bg-white/20">Login</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero with Full-Width Image */}
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Hero Background Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero-football-namibia.jpg"
              alt="Football players in action in Namibia"
              fill
              className="object-cover"
              priority
            />
            {/* Gradient Overlay - lighter to show player faces */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/70" />
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white border border-white/20">
              <Star className="h-4 w-4 text-yellow-400" />
              Where Talent Meets Opportunity
            </div>
            <h1 className="mb-6 text-balance text-5xl font-bold tracking-tight text-white md:text-7xl drop-shadow-lg">
              Discover Football Talent Across Namibia
            </h1>
            <p className="mb-8 text-pretty text-lg text-white/90 md:text-xl max-w-2xl mx-auto">
              A modern platform connecting players, coaches, and clubs. Share your skills, scout talent, and build your
              football career.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/auth/register?role=player">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Join as Player
                </Button>
              </Link>
              <Link href="/auth/register?role=coach">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 bg-white/10 border-white/30 text-white hover:bg-white/20">
                  Join as Coach
                </Button>
              </Link>
              <Link href="/auth/register?role=club">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto text-base px-8">
                  Join as Club
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
              <div className="w-1.5 h-3 bg-white/70 rounded-full" />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Everything You Need to Succeed</h2>
              <p className="text-lg text-muted-foreground">Built for the Namibian football community</p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon={<Video className="h-8 w-8" />}
                title="Share Your Skills"
                description="Upload training videos, match highlights, and skill showcases. Let your talent speak for itself."
              />
              <FeatureCard
                icon={<Users className="h-8 w-8" />}
                title="Connect & Chat"
                description="Direct messaging between players, coaches, and clubs. Build your network and opportunities."
              />
              <FeatureCard
                icon={<MapPin className="h-8 w-8" />}
                title="Regional Discovery"
                description="Filter by region and town. Find talent or opportunities in your area across all 14 regions."
              />
              <FeatureCard
                icon={<TrendingUp className="h-8 w-8" />}
                title="Track Performance"
                description="Build your talent portfolio with stats, achievements, and coach endorsements."
              />
              <FeatureCard
                icon={<Trophy className="h-8 w-8" />}
                title="Club Recruitment"
                description="Clubs can post positions, scout talent, and manage recruitment all in one place."
              />
              <FeatureCard
                icon={<Star className="h-8 w-8" />}
                title="Get Discovered"
                description="Regional leaderboards showcase the most active and viewed players in your area."
              />
            </div>
          </div>
        </section>

        {/* User Roles */}
        <section className="bg-muted/50 px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Join as</h2>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <RoleCard
                role="Player"
                description="Showcase your skills with videos, connect with coaches and clubs, and take your career to the next level."
                features={["Upload skill videos", "Build your portfolio", "Get coach endorsements", "Chat with scouts"]}
                href="/auth/register?role=player"
              />
              <RoleCard
                role="Coach"
                description="Discover and promote talent, post training content, and connect with players and clubs across Namibia."
                features={[
                  "Scout by region & position",
                  "Post player highlights",
                  "Save & review prospects",
                  "Endorse talent",
                ]}
                href="/auth/register?role=coach"
                highlighted
              />
              <RoleCard
                role="Club"
                description="Find the right talent for your team, post vacancies, and streamline your recruitment process."
                features={["Post open positions", "Browse player profiles", "Shortlist candidates", "Manage trials"]}
                href="/auth/register?role=club"
              />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Ready to Get Started?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join thousands of players, coaches, and clubs discovering talent across Namibia
            </p>
            <Link href="/auth/register">
              <Button size="lg">Create Your Account</Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-8">
        <div className="mx-auto max-w-7xl text-center text-sm text-muted-foreground">
          <p>&copy; 2025 Scouting Namibia. Where Talent Meets Opportunity.</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold text-card-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function RoleCard({
  role,
  description,
  features,
  href,
  highlighted = false,
}: {
  role: string
  description: string
  features: string[]
  href: string
  highlighted?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-8 transition-all ${
        highlighted ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <h3 className="mb-4 text-2xl font-bold text-foreground">{role}</h3>
      <p className="mb-6 text-muted-foreground">{description}</p>
      <ul className="mb-8 space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2">
            <div className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-sm text-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Link href={href}>
        <Button className="w-full" variant={highlighted ? "default" : "outline"}>
          Join as {role}
        </Button>
      </Link>
    </div>
  )
}
