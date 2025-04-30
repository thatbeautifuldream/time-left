import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { Cog } from "lucide-react"
import { useState } from "react"

interface SettingsDialogProps {
    birthdate: string
    lifeExpectancy: number
}

export function SettingsDialog({
    birthdate,
    lifeExpectancy,
}: SettingsDialogProps) {
    const [open, setOpen] = useState(false)
    const validateAndSetLifeExpectancy = useStore(state => state.validateAndSetLifeExpectancy)
    const validateAndSetBirthdate = useStore(state => state.validateAndSetBirthdate)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(birthdate ? new Date(birthdate) : undefined)

    const handleClose = () => {
        setOpen(false)
    }

    const handleDateChange = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(date)
            validateAndSetBirthdate(date.toISOString())
        }
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
                                max={200}
                                value={lifeExpectancy}
                                onChange={(e) => validateAndSetLifeExpectancy(Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="birth-date-settings">Birth Date</Label>
                        <div className="min-h-[350px] mt-1">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={handleDateChange}
                                disabled={{ after: new Date() }}
                                className="mx-auto"
                                showYearSwitcher={true}
                            />
                        </div>
                    </div>
                    <Button onClick={handleClose} className="mt-4">Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    )
} 