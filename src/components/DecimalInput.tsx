"use client";

import { useEffect, useState } from "react";

type DecimalInputProps = {
  className?: string;
  value: number;
  onValueChange: (value: number) => void;
};

const formatDecimalValue = (value: number) => (value === 0 ? "" : String(value));

export function DecimalInput({ className, value, onValueChange }: DecimalInputProps) {
  const [draft, setDraft] = useState(formatDecimalValue(value));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(formatDecimalValue(value));
    }
  }, [isFocused, value]);

  const handleChange = (nextValue: string) => {
    const normalized = nextValue.replace(/,/g, "").trim();

    if (!/^\d*\.?\d*$/.test(normalized)) {
      return;
    }

    setDraft(normalized);

    const numericValue =
      normalized === "" || normalized === "." ? 0 : Number(normalized);

    if (Number.isFinite(numericValue)) {
      onValueChange(numericValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numericValue = draft === "" || draft === "." ? 0 : Number(draft);
    setDraft(Number.isFinite(numericValue) ? formatDecimalValue(numericValue) : "");
  };

  return (
    <input
      className={className}
      type="text"
      inputMode="decimal"
      pattern="[0-9]*[.]?[0-9]*"
      value={draft}
      onFocus={() => setIsFocused(true)}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
    />
  );
}
