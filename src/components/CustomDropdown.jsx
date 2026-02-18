'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Search, Check, X } from 'lucide-react'

const CustomDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select...",
  icon: Icon,
  className = "",
  renderOption,
  multiple = false,
  searchable = false,
  disabled = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = searchable && searchTerm
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.description && option.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : options

  const isSelected = (optionValue) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(optionValue)
    }
    return value === optionValue
  }

  const getSelectedLabel = () => {
    if (multiple) {
      if (!value || value.length === 0) return placeholder
      if (value.length === 1) {
        const option = options.find(opt => opt.value === value[0])
        return option?.label || placeholder
      }
      return `${value.length} selected`
    } else {
      const selectedOption = options.find(option => option.value === value)
      return selectedOption ? selectedOption.label : placeholder
    }
  }

  const handleSelect = (optionValue) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : []
      const newValues = currentValues.includes(optionValue)
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue)
      setIsOpen(false)
      setSearchTerm('')
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (multiple) {
      onChange([])
    } else {
      onChange('')
    }
  }

  const handleRemoveItem = (itemValue, e) => {
    e.stopPropagation()
    e.preventDefault()
    if (multiple) {
      const newValues = value.filter(v => v !== itemValue)
      onChange(newValues)
    }
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full h-14 px-3 border border-zinc-200 dark:border-zinc-900 rounded-2xl text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-[#1A1B1F] focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent focus:outline-none transition-all flex items-center justify-between ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${className}`}
        {...props}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          {Icon && (
            <div className="pointer-events-none flex-shrink-0">
              <Icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
            </div>
          )}
          
          {multiple && Array.isArray(value) && value.length > 0 ? (
            <div className="flex items-center gap-1 overflow-x-auto">
              {value.slice(0, 2).map(val => {
                const option = options.find(opt => opt.value === val)
                return option ? (
                  <span
                    key={val}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded text-xs flex-shrink-0"
                  >
                    {option.label}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => handleRemoveItem(val, e)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleRemoveItem(val, e)
                        }
                      }}
                      className="hover:text-blue-900 dark:hover:text-blue-300 cursor-pointer"
                      aria-label={`Remove ${option.label}`}
                    >
                      <X className="w-3 h-3" />
                    </span>
                  </span>
                ) : null
              })}
              {value.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                  +{value.length - 2} more
                </span>
              )}
            </div>
          ) : (
            <span className={value ? "text-gray-900 dark:text-white truncate" : "text-gray-400 dark:text-gray-500 truncate"}>
              {getSelectedLabel()}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {(value && (multiple ? value.length > 0 : value !== '')) && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleClear(e)
                }
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-[#1A1B1F] rounded cursor-pointer"
              aria-label="Clear selection"
            >
              <X className="w-3 h-3 text-gray-400 dark:text-gray-500" />
            </span>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          } ${disabled ? 'opacity-50' : ''}`} />
        </div>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-[#0c0c0c] border border-zinc-200 dark:border-[#202227] rounded-2xl shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-3 border-b border-gray-100 dark:border-[#202227]">
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-[#202227] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-[#1A1B1F] text-gray-900 dark:text-white"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>
              </div>
            </div>
          )}

          <div className="py-2 max-h-64 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1A1B1F] transition-colors ${
                    isSelected(option.value) ? 'bg-gray-50 dark:bg-[#1A1B1F] text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    {multiple && (
                      <div className={`w-4 h-4 border-2 rounded flex-shrink-0 ${
                        isSelected(option.value)
                          ? 'bg-blue-600 dark:bg-blue-400 border-blue-600 dark:border-blue-400'
                          : 'border-gray-300 dark:border-gray-600'
                      } flex items-center justify-center`}>
                        {isSelected(option.value) && (
                          <Check className="w-3 h-3 text-white dark:text-gray-900" />
                        )}
                      </div>
                    )}
                    
                    {renderOption ? (
                      renderOption(option)
                    ) : (
                      <>
                        {option.icon && (
                          <option.icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{option.label}</div>
                          {option.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {option.description}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {!multiple && isSelected(option.value) && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomDropdown