// @ts-nocheck
"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

export interface DatalistOption {
  value: string
  label: string
}

export interface DatalistProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "list"> {
  options: DatalistOption[]
  listId?: string
  error?: boolean
  icon?: React.ReactNode
}

const Datalist = React.forwardRef<HTMLInputElement, DatalistProps>(
  ({ className, options, listId = "datalist", error, icon, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState(props.defaultValue || "")
    const [filteredOptions, setFilteredOptions] = React.useState(options?.filter((option) => option?.label?.toLowerCase()?.includes(inputValue?.toLowerCase())))
    const wrapperRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setInputValue(value)
      setIsOpen(true)

      // Filter options based on input value
      const filtered = options.filter((option) => option.label.toLowerCase().includes(value.toLowerCase()))
      setFilteredOptions(filtered)

      if (props.onChange) {
        props.onChange(e)
      }
    }

    const handleOptionClick = (option: DatalistOption) => {
      setInputValue(option.value)
      setIsOpen(false)
      if (props.onChange) {
        const event = {
          target: { value: option.value },
        } as React.ChangeEvent<HTMLInputElement>
        props.onChange(event)
      }
      if (props.onSelect) {
        const event = {
          target: { value: option.value },
        } as React.ChangeEvent<HTMLInputElement>
        props.onSelect(event)
      }
    }

    return (
      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <input
            {...props}
            ref={ref}
            value={inputValue}
            onChange={handleInputChange}
            onClick={() => setIsOpen(true)}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-destructive focus-visible:ring-destructive",
              icon && "pl-8",
              className,
            )}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listId}
            aria-autocomplete="list"
          />
          {icon && <div className="absolute left-2.5 top-2.5 h-5 w-5 text-muted-foreground">{icon}</div>}
          <ChevronDown
            className={cn(
              "absolute right-2.5 top-2.5 h-5 w-5 transition-transform text-muted-foreground",
              isOpen && "transform rotate-180",
            )}
          />
        </div>
        {isOpen && filteredOptions.length > 0 && (
          <ul
            id={listId}
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            role="listbox"
          >
            {filteredOptions.map((option) => (
              <li
                key={option.value}
                className={cn(
                  "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                )}
                role="option"
                aria-selected={inputValue === option.value}
                onClick={() => handleOptionClick(option)}
              >
                {option.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  },
)
Datalist.displayName = "Datalist"

export { Datalist }

