import { createFileRoute } from "@tanstack/react-router"
import {
  Calendar,
  CreditCard,
  LifeBuoy,
  MessageSquare,
  Search,
  Ship,
  UserRound,
  UserRoundCog,
} from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const Route = createFileRoute("/help")({
  component: HelpPage,
})

const TOPICS = [
  {
    icon: Calendar,
    title: "Booking a Trip",
    description:
      "Find help with bookings, rescheduling, cancellations, and trip changes.",
  },
  {
    icon: Ship,
    title: "Your Charter Experience",
    description: "Learn what to expect on your trip and how to prepare.",
  },
  {
    icon: LifeBuoy,
    title: "Safety & Gear",
    description: "Information about safety, required gear, and what's provided.",
  },
  {
    icon: UserRoundCog,
    title: "For Captains",
    description: "Manage your listing, bookings, and account settings.",
  },
  {
    icon: CreditCard,
    title: "Payments & Refunds",
    description: "Get help with payments, refunds, and billing questions.",
  },
  {
    icon: UserRound,
    title: "Account & Profile",
    description: "Update your profile, preferences, and account settings.",
  },
]

const FAQS = [
  {
    q: "How do I book a fishing charter?",
    a: "Browse charters on the Find a Boat page, pick a date, choose your party size, and click Book. You can either sign in for a faster checkout or book as a guest with just your name and email.",
  },
  {
    q: "What is your cancellation policy?",
    a: "Most captains offer free cancellation up to 7 days prior to the trip. The specific policy is listed on each charter's detail page.",
  },
  {
    q: "What should I bring on my fishing trip?",
    a: "Sunscreen, a hat, sunglasses, layers, a water bottle, and non-marking shoes. Check the listing to see whether food, drinks, and fishing gear are provided.",
  },
  {
    q: "How do I contact my captain before the trip?",
    a: "After booking, you'll see a Message Captain button on the confirmation page and in your Inbox.",
  },
  {
    q: "How do I get a refund?",
    a: "Cancel the booking from the Trips page within the cancellation window. Refunds are processed to the original payment method.",
  },
]

function HelpPage() {
  return (
    <div className="space-y-16 pb-20">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 to-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-5xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            How can we help you?
          </h1>
          <p className="text-lg opacity-90">
            Find answers, get support, and make the most of your fishing adventures.
          </p>
          <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full bg-background p-1.5 text-foreground shadow-lg">
            <Search className="ml-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help articles, topics, or questions…"
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
              aria-label="Search help"
            />
            <Button disabled className="rounded-full">
              Search
            </Button>
          </div>
          <p className="text-xs opacity-70">Search lands post-launch.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Browse help topics
          </h2>
          <p className="text-sm text-muted-foreground">
            Find support and guides by topic.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOPICS.map((t) => (
            <Card key={t.title} className="space-y-2 p-6">
              <t.icon className="h-8 w-8 text-primary" />
              <div className="font-semibold">{t.title}</div>
              <p className="text-sm text-muted-foreground">{t.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Common questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Quick answers to the most common questions.
          </p>
        </div>
        <Accordion className="w-full">
          {FAQS.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left">{faq.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Card className="flex flex-col items-center justify-between gap-4 bg-muted/40 p-8 sm:flex-row">
          <div className="flex items-center gap-4">
            <MessageSquare className="h-10 w-10 text-primary" />
            <div>
              <div className="font-semibold">Still need help?</div>
              <p className="text-sm text-muted-foreground">
                Our support team is here for you. Reach out and we'll get back to
                you as soon as possible.
              </p>
            </div>
          </div>
          <a href="mailto:hello@daytrip.app" className={cn(buttonVariants())}>
            Contact support
          </a>
        </Card>
      </section>
    </div>
  )
}
