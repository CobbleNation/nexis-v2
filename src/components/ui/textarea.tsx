import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
    ({ className, ...props }, ref) => {
        return (
            <textarea
                className={cn(
                    "flex min-h-[80px] w-full rounded-md border border-slate-200 dark:border-border bg-white dark:bg-secondary/20 px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground/50 dark:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/10 focus-visible:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none",
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Textarea.displayName = "Textarea"

export { Textarea }
