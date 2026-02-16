import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-orange-600 text-white shadow-sm hover:bg-orange-700 hover:shadow-md active:translate-y-0 transition-all duration-200",
                destructive:
                    "bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600 hover:shadow-red-500/30 hover:-translate-y-0.5",
                outline:
                    "border-2 border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:text-orange-700 hover:bg-orange-50 shadow-sm",
                secondary:
                    "bg-slate-100/80 text-secondary-foreground hover:bg-slate-200 shadow-inner",
                ghost: "hover:bg-slate-100 hover:text-slate-900",
                link: "text-primary underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2 rounded-md",
                xs: "h-7 rounded-md px-2 text-xs font-medium",
                sm: "h-9 rounded-md px-3 text-xs font-semibold",
                lg: "h-11 rounded-md px-8 text-base",
                icon: "h-10 w-10 rounded-md",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button"
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
