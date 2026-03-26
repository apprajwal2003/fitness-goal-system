import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary-500 text-white hover:bg-primary-600 border-transparent',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border-transparent',
  danger: 'bg-red-500 text-white hover:bg-red-600 border-transparent',
};

export function Button({
  children,
  variant = 'primary',
  loading,
  fullWidth,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
        border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
}
