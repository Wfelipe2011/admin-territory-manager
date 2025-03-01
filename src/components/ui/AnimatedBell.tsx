"use client"

import type React from "react"
import { Bell } from "lucide-react"

type AnimatedBellProps = {
    isActive: boolean
}

export const AnimatedBell: React.FC<AnimatedBellProps> = ({ isActive }) => {
    return (
        <div className={`relative ${isActive ? "animate-ring" : ""}`}>
            <Bell className="h-6 w-6" />
        </div>
    )
}

