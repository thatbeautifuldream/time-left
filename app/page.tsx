"use client"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { WeeksGrid } from "@/components/weeks-grid"
import { useStore } from "@/lib/store"
import { differenceInWeeks } from "date-fns"
import { Cog } from "lucide-react"
import { useEffect, useState } from "react"

const WEEKS_IN_YEAR = 52

export default function Home() {
  const { birthdate, lifeExpectancy, setBirthdate, setLifeExpectancy } = useStore()
  const [date, setDate] = useState<Date | undefined>(birthdate ? new Date(birthdate) : undefined)
  const [expectancy, setExpectancy] = useState<number>(lifeExpectancy)
  const [showSettings, setShowSettings] = useState(false)
  const [mounted, setMounted] = useState(false)

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSaveBirthdate = () => {
    if (date) {
      setBirthdate(date.toISOString())
    }
  }

  const handleSaveLifeExpectancy = () => {
    setLifeExpectancy(expectancy)
    setShowSettings(false)
  }

  const weeksLived = birthdate ? differenceInWeeks(new Date(), new Date(birthdate)) : 0
  const totalWeeks = lifeExpectancy * WEEKS_IN_YEAR

  if (!birthdate) {
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

            <Button onClick={handleSaveBirthdate} disabled={!date}>
              Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b p-4">
        <p className="text-muted-foreground">
          You've lived <span className="font-semibold">{weeksLived.toLocaleString()}</span> weeks out of <span className="font-semibold">{totalWeeks.toLocaleString()}</span> weeks
        </p>
        <div className="flex items-center gap-2">
          {mounted && <ThemeToggle />}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
            aria-label="Settings"
          >
            <Cog className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {showSettings && (
        <div className="border-b p-4">
          <div className="mx-auto flex max-w-md flex-col gap-4">
            <div>
              <Label htmlFor="life-expectancy">Life Expectancy (years)</Label>
              <div className="flex gap-2">
                <Input
                  id="life-expectancy"
                  type="number"
                  min={1}
                  max={120}
                  value={expectancy}
                  onChange={(e) => setExpectancy(Number(e.target.value))}
                />
                <Button onClick={handleSaveLifeExpectancy}>Save</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="birth-date-settings">Birth Date</Label>
              <div className="min-h-[350px] mt-1">
                <Calendar
                  mode="single"
                  selected={new Date(birthdate)}
                  onSelect={(date) => date && setBirthdate(date.toISOString())}
                  disabled={{ after: new Date() }}
                  className="mx-auto"
                  showYearSwitcher={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-4">
        <WeeksGrid weeksLived={weeksLived} totalWeeks={totalWeeks} />
      </main>
    </div>
  )
}
