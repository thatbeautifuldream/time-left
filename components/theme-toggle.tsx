"use client"

import { useId } from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
    const id = useId()
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex items-center">
            <input
                type="checkbox"
                name={id}
                id={id}
                className="peer sr-only"
                checked={theme === "dark"}
                onChange={() =>
                    setTheme(theme === "dark" ? "light" : "dark")
                }
            />
            <label
                className="group border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground peer-focus-visible:border-ring peer-focus-visible:ring-ring/50 relative inline-flex size-9 items-center justify-center rounded-md border shadow-xs transition-[color,box-shadow] outline-none peer-focus-visible:ring-[3px]"
                htmlFor={id}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
                <MoonIcon
                    size={16}
                    className="shrink-0 scale-0 opacity-0 transition-all dark:scale-100 dark:opacity-100"
                    aria-hidden="true"
                />
                <SunIcon
                    size={16}
                    className="absolute shrink-0 scale-100 opacity-100 transition-all dark:scale-0 dark:opacity-0"
                    aria-hidden="true"
                />
            </label>
        </div>
    )
} 