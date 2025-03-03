import { cn } from "@/lib/utils"

interface ColorOption {
    primary: string
    secondary: string
}

interface ColorSelectorProps {
    options: ColorOption[]
    selectedIndex: number
    onSelect: (index: number) => void
}

export function ColorSelector({ options, selectedIndex, onSelect }: ColorSelectorProps) {
    return (
        <div className="flex flex-wrap gap-4 justify-center">
            {options.map((option, index) => (
                <button
                    key={index}
                    className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        selectedIndex === index ? "border-blue-500 scale-110" : "border-transparent",
                    )}
                    style={{ backgroundColor: option.primary }}
                    onClick={() => onSelect(index)}
                    aria-label={`Selecionar tema de cor ${index + 1}`}
                />
            ))}
        </div>
    )
}

