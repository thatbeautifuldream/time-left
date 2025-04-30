"use client"

import { useCallback, useEffect, useRef, useState } from "react"
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

// Helper function to get CSS variable value
function getCssVariableValue(variableName: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  return value;
}

interface WeeksGridProps {
  weeksLived: number
  totalWeeks: number
}

export function WeeksGrid({ weeksLived, totalWeeks }: WeeksGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [boxSize, setBoxSize] = useState(8)
  const [gapSize, setGapSize] = useState(1)
  const [columns, setColumns] = useState(52)
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ show: boolean; week: number; x: number; y: number }>({
    show: false,
    week: 0,
    x: 0,
    y: 0
  })
  const { birthdate } = useStore()

  // Store color values
  const [colors, setColors] = useState({
    primary: '#3b82f6', // Default blue fallback
    primaryHover: 'rgba(59, 130, 246, 0.8)', // Default blue with opacity
    muted: '#e5e7eb', // Default gray fallback
    mutedHover: 'rgba(107, 114, 128, 0.3)' // Default gray with opacity
  });

  // Update colors from DOM elements - more reliable than CSS variables
  const updateColors = useCallback(() => {
    try {
      // Create test elements to extract actual computed colors
      const testEl = document.createElement('div');

      // Get primary color
      testEl.className = 'bg-primary';
      document.body.appendChild(testEl);
      const primaryColor = window.getComputedStyle(testEl).backgroundColor;

      // Get primary hover color by creating a semi-transparent version
      // Convert from rgb to rgba with 0.8 opacity
      let primaryHoverColor = primaryColor;
      if (primaryColor.startsWith('rgb(')) {
        primaryHoverColor = primaryColor.replace('rgb(', 'rgba(').replace(')', ', 0.8)');
      }

      // Get muted color
      testEl.className = 'bg-muted';
      const mutedColor = window.getComputedStyle(testEl).backgroundColor;

      // Get muted hover - set this to a semi-transparent version of muted-foreground
      testEl.className = 'text-muted-foreground';
      const mutedForeground = window.getComputedStyle(testEl).color;
      let mutedHoverColor = 'rgba(107, 114, 128, 0.3)'; // Fallback
      if (mutedForeground.startsWith('rgb(')) {
        mutedHoverColor = mutedForeground.replace('rgb(', 'rgba(').replace(')', ', 0.3)');
      }

      document.body.removeChild(testEl);

      setColors({
        primary: primaryColor,
        primaryHover: primaryHoverColor,
        muted: mutedColor,
        mutedHover: mutedHoverColor
      });
    } catch (error) {
      console.error("Error updating colors:", error);
      // Keep existing colors
    }
  }, []);

  // Update colors when component mounts and when theme changes
  useEffect(() => {
    // Initial color update
    updateColors();

    // Set up a mutation observer to watch for theme changes
    // This detects when the <html> element's class changes (common for theme toggling)
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          // Theme likely changed, update colors
          updateColors();
        }
      });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.documentElement, { attributes: true });

    // Clean up
    return () => observer.disconnect();
  }, [updateColors]);

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

  // Draw grid on canvas
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !containerRef.current) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas dimensions to match container
    canvas.width = containerRef.current.clientWidth
    canvas.height = containerRef.current.clientHeight

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1
    if (dpr > 1) {
      canvas.width = canvas.width * dpr
      canvas.height = canvas.height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${containerRef.current.clientWidth}px`
      canvas.style.height = `${containerRef.current.clientHeight}px`
    }

    // Draw weeks
    for (let week = 1; week <= totalWeeks; week++) {
      const isLived = week <= weeksLived
      const isHovered = week === hoveredWeek

      const x = ((week - 1) % columns) * (boxSize + gapSize)
      const y = Math.floor((week - 1) / columns) * (boxSize + gapSize)

      // Set fill style based on state
      if (isLived) {
        ctx.fillStyle = isHovered ? colors.primaryHover : colors.primary
      } else {
        ctx.fillStyle = isHovered ? colors.mutedHover : colors.muted
      }

      // Draw rounded rectangle
      ctx.beginPath()
      const radius = 1
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + boxSize - radius, y)
      ctx.quadraticCurveTo(x + boxSize, y, x + boxSize, y + radius)
      ctx.lineTo(x + boxSize, y + boxSize - radius)
      ctx.quadraticCurveTo(x + boxSize, y + boxSize, x + boxSize - radius, y + boxSize)
      ctx.lineTo(x + radius, y + boxSize)
      ctx.quadraticCurveTo(x, y + boxSize, x, y + boxSize - radius)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.fill()
    }
  }, [boxSize, gapSize, columns, weeksLived, totalWeeks, hoveredWeek, colors])

  // Update canvas when parameters change
  useEffect(() => {
    drawGrid()
  }, [drawGrid])

  useEffect(() => {
    updateGridSize()
    window.addEventListener("resize", updateGridSize)
    return () => window.removeEventListener("resize", updateGridSize)
  }, [updateGridSize])

  // Redraw canvas when grid size updates
  useEffect(() => {
    drawGrid()
  }, [boxSize, gapSize, columns, drawGrid])

  // Handle mouse events
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate which week the mouse is over
    const col = Math.floor(x / (boxSize + gapSize))
    const row = Math.floor(y / (boxSize + gapSize))
    const week = row * columns + col + 1

    if (week > 0 && week <= totalWeeks) {
      setHoveredWeek(week)
      setTooltip({
        show: true,
        week,
        x: e.clientX,
        y: e.clientY - 40
      })
    } else {
      setHoveredWeek(null)
      setTooltip({ ...tooltip, show: false })
    }
  }, [boxSize, gapSize, columns, totalWeeks, tooltip])

  const handleMouseLeave = useCallback(() => {
    setHoveredWeek(null)
    setTooltip({ ...tooltip, show: false })
  }, [tooltip])

  return (
    <div ref={containerRef} className="h-[calc(100vh-150px)] w-full overflow-hidden relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

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
