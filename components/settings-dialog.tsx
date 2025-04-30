import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStore } from "@/lib/store"
import { Cog, Plus, Minus } from "lucide-react"
import { useState } from "react"
import moment from "moment"
import NumberFlow from '@number-flow/react'

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
                        <div className="flex items-center gap-2 mt-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => validateAndSetLifeExpectancy(Math.max(1, lifeExpectancy - 1))}
                                aria-label="Decrease life expectancy"
                            >
                                <Minus className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 text-center text-7xl">
                                <NumberFlow value={lifeExpectancy} />
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => validateAndSetLifeExpectancy(Math.min(200, lifeExpectancy + 1))}
                                aria-label="Increase life expectancy"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="birth-date-settings">Birth Date ({birthdate ? moment(birthdate).format('LL') : 'N/A'})</Label>
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
                </div>
            </DialogContent>
        </Dialog>
    )
} 