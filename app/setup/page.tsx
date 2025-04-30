import { Metadata } from "next"
import { SetupClient } from "./page.client"

export const metadata: Metadata = {
    title: "Setup - Time Left",
    description: "Set up your birth date to visualize your life in weeks.",
}

export default function SetupPage() {
    return <SetupClient />
} 