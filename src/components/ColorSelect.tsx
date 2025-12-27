import type { ColorOption } from "../config/options";

export function ColorSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ColorOption[];
  onChange: (next: string) => void;
}) {
  return (
    <select
      className="select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((c) => (
        <option key={c.value} value={c.value}>
          {/* Note: native <select> can't render custom HTML swatches inside options in a consistent way */}
          {c.label}
        </option>
      ))}
      <option value="__custom__">Custom…</option>
    </select>
  );
}
