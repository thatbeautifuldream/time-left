import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Cog } from "lucide-react"
import { useState } from "react"

interface SettingsDialogProps {
    birthdate: string
    lifeExpectancy: number
    setBirthdate: (date: string) => void
    setLifeExpectancy: (years: number) => void
}

export function SettingsDialog({
    birthdate,
    lifeExpectancy,
    setBirthdate,
    setLifeExpectancy,
}: SettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const [expectancy, setExpectancy] = useState<number>(lifeExpectancy)

    const handleSaveLifeExpectancy = () => {
        setLifeExpectancy(expectancy)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Settings">
                    <Cog className="h-5 w-5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                    <div>
                        <Label htmlFor="life-expectancy">Life Expectancy (years)</Label>
                        <div className="flex gap-2 mt-1">
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
            </DialogContent>
        </Dialog>
    )
} 