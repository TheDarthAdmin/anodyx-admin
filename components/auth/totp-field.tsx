"use client";

import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeTotpInput } from "@/lib/auth-flow";

/** Six-digit code input: numeric keyboard, OTP autofill, paste-friendly. */
export function TotpField({
  value,
  onChange,
  onComplete,
  disabled,
  label = "Code uit je authenticator-app",
  autoFocus,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  label?: string;
  autoFocus?: boolean;
}) {
  const id = useId();
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="\d{6}"
        maxLength={7}
        autoFocus={autoFocus}
        disabled={disabled}
        value={value}
        className="num h-12 text-center text-xl tracking-[0.4em]"
        onChange={(e) => {
          const code = normalizeTotpInput(e.target.value);
          onChange(code);
          if (code.length === 6) onComplete?.(code);
        }}
      />
    </div>
  );
}
