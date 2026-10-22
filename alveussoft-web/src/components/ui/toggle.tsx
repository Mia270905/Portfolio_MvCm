"use client"

import { useState } from "react"

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export default function Toggle({ checked, onChange, disabled = false, className = "" }: ToggleProps) {
  const [isChecked, setIsChecked] = useState(checked)

  const handleToggle = () => {
    if (disabled) return
    
    const newValue = !isChecked
    setIsChecked(newValue)
    onChange(newValue)
  }

  return (
    <label className="relative inline-flex items-center cursor-pointer select-none">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <div
        className={`w-10 h-5 rounded-full transition-colors duration-300 ${
          checked ? "bg-green-500" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${
            checked ? "translate-x-5" : ""
          }`}
        ></div>
      </div>
    </label>
  );
}