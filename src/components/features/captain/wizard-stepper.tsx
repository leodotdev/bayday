import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  steps: ReadonlyArray<string>
  active: number
}

export function WizardStepper({ steps, active }: Props) {
  return (
    <ol className="flex w-full items-center justify-between gap-2 sm:gap-4">
      {steps.map((label, i) => {
        const state = i < active ? "done" : i === active ? "active" : "todo"
        const isLast = i === steps.length - 1
        return (
          <li
            key={label}
            className="flex flex-1 items-center gap-2 sm:gap-4"
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold ring-1 transition-colors",
                  state === "done" &&
                    "bg-primary text-primary-foreground ring-primary",
                  state === "active" &&
                    "bg-primary text-primary-foreground ring-primary",
                  state === "todo" &&
                    "bg-background text-muted-foreground ring-border",
                )}
              >
                {state === "done" ? (
                  <Check className="h-4 w-4" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={cn(
                  "hidden text-center text-xs font-medium sm:block",
                  state === "todo"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {isLast ? null : (
              <div
                className={cn(
                  "mt-[-18px] h-px flex-1 transition-colors sm:mt-[-22px]",
                  state === "done" ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
