import React from 'react';

interface FormFieldProps {
  label: string;
  type?: 'text' | 'password' | 'email' | 'select';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  style?: React.CSSProperties;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  options = [],
  style,
}) => {
  return (
    <div className="form-group" style={{ marginBottom: 0, ...style }}>
      <label className="form-label">{label}</label>
      {type === 'select' ? (
        <select
          className="form-input"
          style={{
            appearance: 'none',
            background: 'hsl(var(--bg-secondary) / 0.8) url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>\') no-repeat right 14px center',
            backgroundSize: '16px',
          }}
          value={value}
          onChange={onChange}
          required={required}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          className="form-input"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
        />
      )}
    </div>
  );
};
