import { Link } from "@tanstack/react-router"
import { Anchor } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8">
        <div className="space-y-3">
          <Link to="/" className="inline-flex items-center gap-2">
            <Anchor className="h-5 w-5" />
            <span className="text-base font-semibold tracking-tight">
              DayTrip
            </span>
          </Link>
          <p className="max-w-sm text-sm text-muted-foreground">
            Find a fishing charter, book a private trip, or split the cost
            with anglers heading the same way you are.
          </p>
        </div>

        <FooterCol title="Explore">
          <FooterLink to="/search">Find a boat</FooterLink>
          <FooterLink to="/search">Shared trips</FooterLink>
        </FooterCol>

        <FooterCol title="Captains">
          <FooterLink to="/captain/onboarding">List your boat</FooterLink>
          <FooterLink to="/captain">Captain dashboard</FooterLink>
        </FooterCol>

        <FooterCol title="Support">
          <FooterLink to="/help">Help center</FooterLink>
          <ExternalFooterLink href="mailto:hello@daytrip.app">
            Contact us
          </ExternalFooterLink>
        </FooterCol>
      </div>

      <div className="border-t py-4">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} DayTrip. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <ExternalFooterLink
              href="mailto:hello@daytrip.app"
              variant="muted"
            >
              hello@daytrip.app
            </ExternalFooterLink>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold">{title}</div>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  )
}

function FooterLink({
  to,
  children,
}: {
  to: "/search" | "/captain" | "/captain/onboarding" | "/help"
  children: React.ReactNode
}) {
  return (
    <li>
      <Link
        to={to}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  )
}

function ExternalFooterLink({
  href,
  children,
  variant,
}: {
  href: string
  children: React.ReactNode
  variant?: "muted"
}) {
  return (
    <li className={variant === "muted" ? "list-none" : undefined}>
      <a
        href={href}
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </a>
    </li>
  )
}
