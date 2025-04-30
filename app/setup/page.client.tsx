"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { StateDebugger } from "@/components/state-debugger"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function SetupClient() {
    const { birthdate, validateAndSetBirthdate } = useStore()
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [mounted, setMounted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    // useEffect only runs on the client, so now we can safely show the UI
    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSaveBirthdate = () => {
        if (date) {
            setIsLoading(true)

            try {
                // Store the birthdate
                const isoDate = date.toISOString();
                console.log("Setting birthdate:", isoDate);
                const success = validateAndSetBirthdate(isoDate);

                if (success) {
                    console.log("Successfully set birthdate, redirecting to home");
                    // Add a slightly longer delay to ensure store is updated and cookie is set
                    setTimeout(() => {
                        router.push("/")
                    }, 300)
                } else {
                    console.error("Failed to validate birthdate");
                    setIsLoading(false)
                }
            } catch (error) {
                console.error("Error setting birthdate:", error);
                setIsLoading(false);
            }
        }
    }

    if (!mounted) return null

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>When were you born?</CardTitle>
                    <CardDescription>
                        We'll use this to calculate how many weeks you've lived and how many you have left.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="flex flex-col space-y-2">
                        <Label htmlFor="birth-date">Select your birth date</Label>
                        <div className="min-h-[350px]">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                disabled={{ after: new Date() }}
                                className="mx-auto"
                                initialFocus
                                showYearSwitcher={true}
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveBirthdate}
                        disabled={!date || isLoading}
                    >
                        {isLoading ? "Saving..." : "Continue"}
                    </Button>
                </CardContent>
            </Card>

            <StateDebugger />
        </div>
    )
} 