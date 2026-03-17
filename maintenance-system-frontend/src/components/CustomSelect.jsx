import { useEffect, useRef, useState } from 'react'

export default function CustomSelect({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = 'Select option',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((option) => String(option.value) === String(value))

  return (
    <div className="field">
      {label ? <label htmlFor={id}>{label}</label> : null}
      <div className={`custom-select ${disabled ? 'custom-select-disabled' : ''}`} ref={rootRef}>
        <button
          id={id}
          type="button"
          className={`custom-select-trigger ${open ? 'custom-select-open' : ''}`}
          onClick={() => {
            if (!disabled) {
              setOpen((current) => !current)
            }
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <span className="custom-select-chevron">{open ? '−' : '+'}</span>
        </button>

        {open ? (
          <div className="custom-select-menu" role="listbox">
            {options.map((option) => (
              <button
                key={String(option.value)}
                type="button"
                className={`custom-select-option ${String(option.value) === String(value) ? 'custom-select-option-active' : ''}`}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <strong>{option.label}</strong>
                {option.description ? <span>{option.description}</span> : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
