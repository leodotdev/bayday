import { createFileRoute } from "@tanstack/react-router"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"
import { CheckCircle2, ShieldAlert, UserRound } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDateOnly } from "@/lib/format"

type Role = "guest" | "host" | "admin"

const ROLE_LABEL: Record<Role, string> = {
  guest: "User",
  host: "Captain",
  admin: "Admin",
}

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
})

function AdminUsers() {
  const users = useQuery(api.admin.listUsers, {})
  const setRole = useMutation(api.admin.setUserRole)
  const setBanned = useMutation(api.admin.setUserBanned)
  const setVerified = useMutation(api.admin.setUserVerified)

  async function onChangeRole(id: Id<"users">, role: Role) {
    try {
      await setRole({ id, role })
      toast.success(`Role set to ${ROLE_LABEL[role]}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  async function onToggleBanned(id: Id<"users">, banned: boolean) {
    try {
      await setBanned({ id, banned })
      toast.success(banned ? "User banned" : "User reinstated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  async function onToggleVerified(id: Id<"users">, verified: boolean) {
    try {
      await setVerified({ id, verified })
      toast.success(verified ? "Marked verified" : "Removed verification")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Promote captains, ban accounts, mark verified.
        </p>
      </div>

      {users === undefined ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const name =
                  u.firstName ?? u.name ?? u.email?.split("@")[0] ?? "User"
                const isLeo = u.email === "leo@leo.dev"
                return (
                  <TableRow key={u._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted">
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{name}</span>
                        {isLeo ? (
                          <Badge variant="secondary">super-user</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {u.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={(u.role ?? "guest")}
                        onValueChange={(v) =>
                          v && onChangeRole(u._id, v)
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="w-32"
                          disabled={isLeo}
                        >
                          <SelectValue>
                            {(v: string) =>
                              v === "guest"
                                ? "User"
                                : v === "host"
                                  ? "Captain"
                                  : "Admin"
                            }
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="guest">User</SelectItem>
                          <SelectItem value="host">Captain</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {u.isBanned ? (
                          <Badge variant="destructive" className="gap-1">
                            <ShieldAlert className="h-3 w-3" />
                            Banned
                          </Badge>
                        ) : null}
                        {u.isVerified ? (
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : null}
                        {!u.isBanned && !u.isVerified ? (
                          <Badge variant="outline">Active</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.createdAt
                        ? formatDateOnly(
                            new Date(u.createdAt).toISOString().slice(0, 10),
                          )
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            onToggleVerified(u._id, !u.isVerified)
                          }
                        >
                          {u.isVerified ? "Unverify" : "Verify"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isLeo}
                          onClick={() => onToggleBanned(u._id, !u.isBanned)}
                        >
                          {u.isBanned ? "Unban" : "Ban"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
