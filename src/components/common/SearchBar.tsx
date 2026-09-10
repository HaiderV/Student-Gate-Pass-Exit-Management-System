import { useId } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  buttonText?: string;
  hint?: string;
  /** Restrict input to digits (junior unique numbers). */
  numeric?: boolean;
  disabled?: boolean;
}

export default function SearchBar({
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  buttonText = 'Search',
  hint,
  numeric = false,
  disabled = false,
}: SearchBarProps) {
  const id = useId();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!disabled && value.trim()) {
      onSubmit();
    }
  };

  return (
    <form role="search" onSubmit={handleSubmit} noValidate>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          />
          <input
            id={id}
            type="text"
            inputMode={numeric ? 'numeric' : undefined}
            autoComplete="off"
            value={value}
            onChange={(e) => onChange(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="input py-3.5 pl-12 pr-4 text-base"
          />
        </div>
        <button type="submit" disabled={disabled || !value.trim()} className="btn-primary px-6 py-3.5">
          <Search className="h-4 w-4" aria-hidden />
          {buttonText}
        </button>
      </div>
      {hint && <p className="mt-2.5 text-xs leading-relaxed text-slate-500">{hint}</p>}
    </form>
  );
}
