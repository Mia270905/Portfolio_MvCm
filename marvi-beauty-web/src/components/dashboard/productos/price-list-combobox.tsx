"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface PriceList {
  id: string
  name: string
  code?: string
}

interface PriceListComboboxProps {
  priceLists: PriceList[]
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function PriceListCombobox({
  priceLists,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Buscar lista de precios...",
}: PriceListComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selectedPriceList = priceLists.find((list) => list.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-transparent"
          disabled={disabled}
        >
          {selectedPriceList ? selectedPriceList.name : placeholder}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
          <CommandEmpty>No se encontró lista de precios.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {priceLists
                .filter((list) => list.name.toLowerCase().includes(search.toLowerCase()))
                .map((list) => (
                  <CommandItem
                    key={list.id}
                    value={list.id}
                    onSelect={(currentValue: string) => {
                      onValueChange(currentValue === value ? "" : currentValue)
                      setOpen(false)
                      setSearch("")
                    }}
                  >
                    <Check className={cn("mr-2 h-4 w-4", value === list.id ? "opacity-100" : "opacity-0")} />
                    {list.name}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}