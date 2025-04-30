"use client"

import { useStore } from "@/lib/store"
import { useEffect, useState } from "react"

export function StateDebugger() {
    const { birthdate, lifeExpectancy } = useStore()
    const [mounted, setMounted] = useState(false)
    const [cookieInfo, setCookieInfo] = useState<Record<string, string>>({})
    const [hydrationState, setHydrationState] = useState("Initializing")
    const [isDev, setIsDev] = useState(false)

    useEffect(() => {
        setMounted(true)
        // Check if we're in development mode
        setIsDev(process.env.NODE_ENV === 'development')

        // Get all cookies to display
        loadCookies()

        // Listen to hydration events
        const unsubHydrate = useStore.persist.onHydrate(() => {
            setHydrationState("Hydrating")
        })

        const unsubFinished = useStore.persist.onFinishHydration(() => {
            setHydrationState("Hydrated")
        })

        // Check if hasHydrated
        const hasHydrated = useStore.persist.hasHydrated()
        if (hasHydrated) {
            setHydrationState("Already Hydrated")
        }

        return () => {
            unsubHydrate()
            unsubFinished()
        }
    }, [])

    const loadCookies = () => {
        const allCookies = document.cookie.split(';')
            .reduce((acc, cookie) => {
                const [name, value] = cookie.trim().split('=')
                if (name) {
                    acc[name] = value || ''
                }
                return acc
            }, {} as Record<string, string>)

        setCookieInfo(allCookies)
    }

    const deleteCookie = (name: string) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        loadCookies()
    }

    const deleteAllCookies = () => {
        Object.keys(cookieInfo).forEach(name => {
            deleteCookie(name)
        })
    }

    // Don't render anything if not in development mode or not mounted
    if (!mounted || !isDev) return null

    // Format the birthdate for display if it exists
    const formattedBirthdate = birthdate ? new Date(birthdate).toLocaleDateString() : 'not set'

    return (
        <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-md shadow-lg opacity-70 hover:opacity-100 transition-opacity max-w-xs overflow-auto">
            <h3 className="font-bold mb-2">Debug Info</h3>
            <div className="space-y-1 text-xs">
                <p><span className="font-semibold">Birthdate:</span> {formattedBirthdate}</p>
                <p><span className="font-semibold">Life Expectancy:</span> {lifeExpectancy}</p>
                <p><span className="font-semibold">Hydration:</span> {hydrationState}</p>
                <div className="mt-2">
                    <div className="flex justify-between items-center">
                        <p className="font-semibold">Cookies:</p>
                        {Object.keys(cookieInfo).length > 0 && (
                            <button
                                onClick={deleteAllCookies}
                                className="text-xs px-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
                            >
                                Delete All
                            </button>
                        )}
                    </div>
                    {Object.keys(cookieInfo).length > 0 ? (
                        <div className="mt-1 max-h-32 overflow-y-auto">
                            {Object.entries(cookieInfo).map(([name, value]) => (
                                <div key={name} className="flex justify-between items-center mb-1 border-b border-gray-100 pb-1">
                                    <div className="break-all">
                                        <span className="font-semibold">{name}:</span> {value}
                                    </div>
                                    <button
                                        onClick={() => deleteCookie(name)}
                                        className="ml-2 text-xs px-1 bg-red-100 text-red-600 rounded hover:bg-red-200 flex-shrink-0"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 mt-1">No cookies</p>
                    )}
                </div>
            </div>
        </div>
    )
} 