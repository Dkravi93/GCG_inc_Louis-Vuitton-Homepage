// components/CustomListbox.tsx
import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          {label}
        </label>
      )}

      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative">
          {/* Button */}
          <Listbox.Button
            className={`
              relative w-full rounded-md border px-3 py-2.5 text-left text-sm
              flex items-center justify-between transition
              focus:outline-none focus:ring-2 focus:ring-indigo-500 
              ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
              ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
          >
            <span className="block truncate">
              {selectedOption?.label || placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
          </Listbox.Button>

          {/* The dropdown — rendered in the portal (on body) */}
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Listbox.Options
              className="absolute mt-1 w-full z-[9999] max-h-60 bg-white rounded-md shadow-lg ring-1 ring-black/10 dark:ring-white/10"
            >
              {options.map((option) => (
                <Listbox.Option
                  key={option.value}
                  value={option.value}
                  className={({ active }) =>
                    `
                      relative cursor-default select-none py-2 pl-10 pr-4
                      ${
                        active
                          ? 'bg-indigo-600 text-white overflow-visible'
                          : 'text-gray-900 overflow-hidden'
                      }
                    `
                  }
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-medium' : 'font-normal'
                        }`}
                      >
                        {option.label}
                      </span>
                      {selected && (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                          <Check
                            className="h-4 w-4 text-indigo-600 dark:text-indigo-400"
                            aria-hidden="true"
                          />
                        </span>
                      )}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>

      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}