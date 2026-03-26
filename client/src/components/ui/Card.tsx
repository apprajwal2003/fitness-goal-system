import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${className}`}>
      {title && (
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-slate-800">{title}</h2>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
