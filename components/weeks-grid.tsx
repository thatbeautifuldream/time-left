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

// Function to interpolate between colors
function interpolateColor(color1: [number, number, number], color2: [number, number, number], factor: number): string {
  const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
  const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
  const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

// Function to generate a color from the heatmap gradient
function getHeatmapColor(percentage: number, isDarkMode: boolean): string {
  // Color ranges from cold (blue) to hot (red)
  // Different palettes for light and dark mode
  const lightModeColors: Array<[number, number, number]> = [
    [65, 105, 225],   // Royal Blue
    [30, 144, 255],   // Dodger Blue
    [0, 191, 255],    // Deep Sky Blue
    [32, 178, 170],   // Light Sea Green
    [46, 139, 87],    // Sea Green
    [50, 205, 50],    // Lime Green
    [255, 215, 0],    // Gold
    [255, 165, 0],    // Orange
    [255, 69, 0],     // Red-Orange
    [255, 0, 0]       // Red
  ];

  const darkModeColors: Array<[number, number, number]> = [
    [25, 25, 112],    // Midnight Blue
    [0, 0, 139],      // Dark Blue
    [0, 139, 139],    // Dark Cyan
    [0, 100, 0],      // Dark Green
    [107, 142, 35],   // Olive Drab
    [154, 205, 50],   // Yellow Green
    [218, 165, 32],   // Goldenrod
    [210, 105, 30],   // Chocolate
    [178, 34, 34],    // Firebrick
    [220, 20, 60]     // Crimson
  ];

  const colors = isDarkMode ? darkModeColors : lightModeColors;

  // Get the segment this percentage falls into
  const numSegments = colors.length - 1;
  const segment = Math.min(Math.floor(percentage * numSegments), numSegments - 1);

  // Calculate how far into this segment we are (0-1)
  const segmentPercentage = (percentage * numSegments) - segment;

  // Interpolate between the colors in this segment
  return interpolateColor(colors[segment], colors[segment + 1], segmentPercentage);
}

// Add an alpha channel to a color
function addAlpha(color: string, alpha: number): string {
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  return color;
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
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { birthdate } = useStore()

  // Check if dark mode is active 
  const updateThemeMode = useCallback(() => {
    // Check for dark mode
    // First try to check if a 'dark' class exists on html or body
    const isDark = document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark');

    // If that doesn't work, check if background is dark by creating a test element
    if (!isDark) {
      const testEl = document.createElement('div');
      testEl.className = 'bg-background';
      document.body.appendChild(testEl);
      const bgColor = window.getComputedStyle(testEl).backgroundColor;
      document.body.removeChild(testEl);

      // Parse RGB values
      const rgb = bgColor.match(/\d+/g)?.map(Number);
      if (rgb && rgb.length >= 3) {
        // Simple brightness formula (0-255)
        const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
        setIsDarkMode(brightness < 128); // If brightness is less than 128, consider it dark mode
        return;
      }
    }

    setIsDarkMode(isDark);
  }, []);

  // Update theme mode when component mounts and when theme changes
  useEffect(() => {
    // Initial theme check
    updateThemeMode();

    // Set up a mutation observer to watch for theme changes
    const observer = new MutationObserver(() => {
      updateThemeMode();
    });

    // Start observing the document with the configured parameters
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // Clean up
    return () => observer.disconnect();
  }, [updateThemeMode]);

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

      // Calculate the percentage through life for heatmap
      const percentage = isLived ? week / totalWeeks : 0;

      // Get color from the heatmap gradient
      let fillColor;
      if (isLived) {
        // Cold to hot gradient for lived weeks
        fillColor = getHeatmapColor(percentage, isDarkMode);
        // Add hover effect if needed
        if (isHovered) {
          fillColor = addAlpha(fillColor, 0.8);
        }
      } else {
        // Use a muted color for future weeks
        fillColor = isDarkMode ? 'rgba(50, 50, 50, 0.5)' : 'rgba(220, 220, 220, 0.5)';
        if (isHovered) {
          fillColor = isDarkMode ? 'rgba(70, 70, 70, 0.7)' : 'rgba(200, 200, 200, 0.7)';
        }
      }

      ctx.fillStyle = fillColor;

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
  }, [boxSize, gapSize, columns, weeksLived, totalWeeks, hoveredWeek, isDarkMode])

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
