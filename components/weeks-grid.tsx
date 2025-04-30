"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import React from "react"
import { useStore } from "@/lib/store"
import { addWeeks, format } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"

// Custom debounce function
function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

interface WeeksGridProps {
  weeksLived: number
  totalWeeks: number
}

export function WeeksGrid({ weeksLived, totalWeeks }: WeeksGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [boxSize, setBoxSize] = useState(8)
  const [gapSize, setGapSize] = useState(1)
  const [columns, setColumns] = useState(52)
  const [tooltip, setTooltip] = useState<{ show: boolean; week: number; x: number; y: number }>({
    show: false,
    week: 0,
    x: 0,
    y: 0
  })
  const { birthdate } = useStore()

  // Calculate date for a specific week number
  const getDateForWeek = useCallback((weekNum: number) => {
    if (!birthdate) return null;

    try {
      const birthDate = new Date(birthdate);
      const weekDate = addWeeks(birthDate, weekNum - 1); // -1 because week numbers start at 1
      return weekDate;
    } catch (error) {
      console.error("Error calculating date for week:", error);
      return null;
    }
  }, [birthdate]);

  // Format the week and year for display
  const formatWeekAndYear = useCallback((weekNum: number) => {
    const date = getDateForWeek(weekNum);
    if (!date) return `Week ${weekNum}`;

    // Get the year
    const year = format(date, 'yyyy');

    // Calculate the week number within the year (1-52)
    // For the first year, we start at week 1 regardless of the birthdate
    // For subsequent years, we keep counting from 1-52
    const weekInYear = ((weekNum - 1) % 52) + 1;

    return `Week ${weekInYear}, ${year}`;
  }, [getDateForWeek]);

  // Calculate optimal grid layout based on container size
  const updateGridSize = useCallback(
    debounce(() => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth
      const containerHeight = Math.max(
        containerRef.current.clientHeight,
        window.innerHeight - 150
      )

      // Calculate optimal columns and rows
      let cols = Math.ceil(Math.sqrt(totalWeeks * (containerWidth / containerHeight)))

      // Ensure we have enough cells
      while (cols * (Math.ceil(totalWeeks / cols)) < totalWeeks) {
        cols++
      }

      // Calculate box size accounting for gaps
      const gap = 1;
      const availableWidth = containerWidth - (gap * (cols - 1))
      const availableHeight = containerHeight - (gap * (Math.ceil(totalWeeks / cols) - 1))

      const size = Math.floor(Math.min(
        availableWidth / cols,
        availableHeight / Math.ceil(totalWeeks / cols)
      ))

      setBoxSize(size)
      setGapSize(gap)
      setColumns(cols)
    }, 150),
    [totalWeeks]
  )

  useEffect(() => {
    updateGridSize()
    window.addEventListener("resize", updateGridSize)
    return () => window.removeEventListener("resize", updateGridSize)
  }, [updateGridSize])

  // Handle mouse events for tooltip
  const handleMouseEnter = (week: number) => (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      show: true,
      week,
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 100 // Reduced offset to position tooltip closer to cursor
    })
  }

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, show: false })
  }

  // Generate grid items
  const gridItems = useMemo(() => {
    const items = []
    for (let week = 1; week <= totalWeeks; week++) {
      const isLived = week <= weeksLived;
      items.push(
        <motion.div
          key={week}
          className={`
            absolute 
            ${isLived ? 'bg-primary hover:bg-primary/80' : 'bg-muted hover:bg-muted-foreground/30'}
            hover:scale-125
            hover:shadow-md
            hover:z-10
            cursor-pointer
            rounded-sm
          `}
          style={{
            width: boxSize,
            height: boxSize,
            left: ((week - 1) % columns) * (boxSize + gapSize),
            top: Math.floor((week - 1) / columns) * (boxSize + gapSize),
          }}
          layout
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
          onMouseEnter={handleMouseEnter(week)}
          onMouseLeave={handleMouseLeave}
        />
      )
    }
    return items
  }, [boxSize, gapSize, columns, weeksLived, totalWeeks])

  return (
    <div ref={containerRef} className="h-[calc(100vh-150px)] w-full overflow-hidden relative">
      <div className="relative w-full h-full">
        {gridItems}
      </div>

      <AnimatePresence>
        {tooltip.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{
              type: "spring",
              stiffness: 500,
              damping: 30,
              mass: 0.5
            }}
            layout
            className="absolute bg-background border border-border rounded-md p-2 text-sm shadow-lg z-20 pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transformOrigin: "center bottom",
            }}
          >
            <p className="font-medium">{formatWeekAndYear(tooltip.week)}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
