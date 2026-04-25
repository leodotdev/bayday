import { useEffect, useRef, useState } from "react"
import { Link, Navigate, createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { ChevronLeft, Send } from "lucide-react"
import { format } from "date-fns"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useCurrentUser } from "@/hooks/use-current-user"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/conversation/$id")({
  component: ConversationPage,
})

function ConversationPage() {
  const { id } = Route.useParams()
  const conversationId = id as Id<"conversations">

  const { user, isAuthenticated, isLoading } = useCurrentUser()
  const conversation = useQuery(
    api.conversations.getById,
    isAuthenticated ? { id: conversationId } : "skip",
  )
  const messages = useQuery(
    api.messages.getByConversation,
    isAuthenticated ? { conversationId } : "skip",
  )
  const sendMessage = useMutation(api.messages.send)
  const markRead = useMutation(api.messages.markRead)

  const [body, setBody] = useState("")
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (isAuthenticated && conversation) {
      markRead({ conversationId }).catch(() => {})
    }
  }, [isAuthenticated, conversation, conversationId, markRead])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages?.length])

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }
  if (!isAuthenticated) return <Navigate to="/sign-in" />

  if (conversation === undefined || messages === undefined) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }
  if (conversation === null) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Conversation not found</h1>
      </div>
    )
  }

  const other = conversation.otherUser
  const listing = conversation.listing
  const name =
    other?.firstName ?? other?.name ?? other?.email ?? "User"

  async function onSend(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setBody("")
    try {
      await sendMessage({
        conversationId,
        body: trimmed,
        type: "text",
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed")
      setBody(trimmed)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-4">
      <div className="mb-3 flex items-center gap-3 border-b pb-3">
        <Link
          to="/inbox"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
          {other?.avatarUrl ? (
            <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{name}</div>
          {listing ? (
            <Link
              to="/listings/$id"
              params={{ id: listing._id }}
              className="line-clamp-1 text-xs text-muted-foreground hover:text-foreground"
            >
              {listing.title}
            </Link>
          ) : null}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto pr-1"
      >
        {messages.length === 0 ? (
          <Card className="mx-auto mt-10 max-w-sm p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Start the conversation — say hi!
            </p>
          </Card>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === user?._id
            return (
              <div
                key={m._id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {m.body}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-xs",
                      mine
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    {format(m.createdAt, "p")}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <form
        onSubmit={onSend}
        className="mt-3 flex items-center gap-2 border-t pt-3"
      >
        <Input
          value={body}
          onChange={(e) => setBody(e.currentTarget.value)}
          placeholder={`Message ${name}…`}
          className="flex-1"
          autoFocus
        />
        <Button type="submit" size="icon" disabled={!body.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}
