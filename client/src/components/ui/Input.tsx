import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  /** When true or when type="tel", automatically restricts input to max 10 numeric digits */
  isPhone?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, isPhone, type, maxLength, onChange, onKeyDown, onPaste, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    const isPhoneNumberField = isPhone || type === 'tel';

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (isPhoneNumberField) {
        // Allow navigation, deletion and clipboard shortcuts
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', 'Home', 'End'];
        if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
          onKeyDown?.(e);
          return;
        }
        // Block any non-digit character
        if (!/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          return;
        }
        // Block if already 10 digits and no selection is being replaced
        const input = e.currentTarget;
        const selectionLength = (input.selectionEnd ?? 0) - (input.selectionStart ?? 0);
        if (input.value.length >= 10 && selectionLength === 0) {
          e.preventDefault();
          return;
        }
      }
      onKeyDown?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isPhoneNumberField) {
        // Enforce digits only and max 10 characters
        const sanitized = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (sanitized !== e.target.value) {
          e.target.value = sanitized;
        }
      }
      onChange?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      if (isPhoneNumberField) {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const digitsOnly = pastedText.replace(/\D/g, '');
        const input = e.currentTarget;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const currentValue = input.value;
        const nextValue = (currentValue.slice(0, start) + digitsOnly + currentValue.slice(end)).slice(0, 10);
        
        // Native setter call so React Hook Form / synthetic events detect the change
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        nativeInputValueSetter?.call(input, nextValue);
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      }
      onPaste?.(e);
    };

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            type={type}
            maxLength={isPhoneNumberField ? 10 : maxLength}
            inputMode={isPhoneNumberField ? 'numeric' : props.inputMode}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            className={cn(
              'flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-rose-500 focus-visible:ring-rose-500 text-rose-900',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
