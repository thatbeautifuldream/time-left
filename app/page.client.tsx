"use client"

import { SettingsDialog } from "@/components/settings-dialog"
import { StateDebugger } from "@/components/state-debugger"
import { ThemeToggle } from "@/components/theme-toggle"
import { WeeksGrid } from "@/components/weeks-grid"
import { useStore } from "@/lib/store"
import { differenceInWeeks } from "date-fns"
import { useEffect, useState } from "react"

const WEEKS_IN_YEAR = 52

export function HomeClient() {
    const { birthdate, lifeExpectancy } = useStore()
    const [mounted, setMounted] = useState(false)

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)

        // Force a re-render when hydration is complete
        const unsubscribe = useStore.persist.onHydrate(() => {
            console.log("Hydration started")
        })

        const unsubFinished = useStore.persist.onFinishHydration(() => {
            console.log("Hydration finished")
            setMounted(false)
            setTimeout(() => setMounted(true), 0)
        })

        return () => {
            unsubscribe()
            unsubFinished()
        }
    }, [])

    // Wait for component to mount before calculating
    if (!mounted) return null

    const weeksLived = birthdate ? differenceInWeeks(new Date(), new Date(birthdate)) : 0
    const totalWeeks = lifeExpectancy * WEEKS_IN_YEAR

    return (
        <div className="flex min-h-screen flex-col bg-background text-foreground">
            <header className="flex items-center justify-between border-b p-4">
                <p className="text-muted-foreground">
                    You've lived <span className="font-semibold">{weeksLived.toLocaleString()}</span> weeks out of <span className="font-semibold">{totalWeeks.toLocaleString()}</span> weeks
                </p>
                <div className="flex items-center gap-2">
                    <ThemeToggle />
                    <SettingsDialog
                        birthdate={birthdate ?? ""}
                        lifeExpectancy={lifeExpectancy}
                    />
                </div>
            </header>

            <main className="flex-1 p-4">
                <WeeksGrid weeksLived={weeksLived} totalWeeks={totalWeeks} />
            </main>

            <StateDebugger />
        </div>
    )
} 