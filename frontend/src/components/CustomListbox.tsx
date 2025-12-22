// components/CustomListbox.tsx
import { Fragment } from 'react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption, Transition } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

export interface ListboxOption {
  value: string;
  label: string;
}

interface CustomListboxProps {
  value: string;
  onChange: (value: string) => void;
  options: ListboxOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
}

export function CustomListbox({
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  label,
  error,
}: CustomListboxProps) {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </label>
      )}

      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => (
          <>
            <div className="relative">
              <ListboxButton
                className={`
                  relative w-full rounded-md border px-3 py-2.5 text-left text-sm
                  flex items-center justify-between transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary/50
                  bg-card text-foreground shadow-sm
                  ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-primary/30'}
                  ${error ? 'border-destructive focus:ring-destructive' : 'border-input'}
                  ${open ? 'ring-2 ring-ring border-primary' : ''}
                `}
              >
                <span className="block truncate font-medium">
                  {selectedOption?.label || placeholder}
                </span>
                <ChevronDown 
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} 
                />
              </ListboxButton>
            </div>

            {/* Render with anchor to effectively Portal out of stacking contexts */}
            <ListboxOptions
              anchor="bottom start"
              transition
              className={`
                z-[9999] mt-1 max-h-60 overflow-auto rounded-lg 
                bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 
                shadow-xl ring-1 ring-black/5 dark:ring-white/10
                focus:outline-none
                origin-top transition duration-200 ease-out 
                data-[closed]:scale-95 data-[closed]:opacity-0
                min-w-[var(--button-width)] w-[var(--button-width)]
              `}
            >
              {options.map((option) => (
                <ListboxOption
                  key={option.value}
                  value={option.value}
                  className={({ focus, selected }) =>
                    `
                      relative cursor-pointer select-none py-2.5 pl-3 pr-9 transition-colors
                      ${focus ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50' : 'text-zinc-900 dark:text-zinc-300'}
                      ${selected ? 'font-semibold bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white' : 'font-normal'}
                    `
                  }
                >
                  {({ selected }) => (
                    <>
                      <span className="block truncate">{option.label}</span>
                      {selected && (
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-900 dark:text-white">
                          <Check className="h-4 w-4" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </>
        )}
      </Listbox>

      {error && <p className="mt-1 text-sm text-destructive font-medium">{error}</p>}
    </div>
  );
}