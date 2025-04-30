import { Metadata } from "next"
import { cookies } from "next/headers"
import { HomeClient } from "./page.client"

export const metadata: Metadata = {
  title: "Time Left - Visualize Your Life in Weeks",
  description: "A simple app to visualize how much time you have left to live, represented in weeks.",
  keywords: ["life calendar", "weeks", "visualization", "mortality", "productivity"],
}

export default function Home() {
  // Server-side check - if no birthdate is found in cookies, middleware will redirect
  return <HomeClient />
}
