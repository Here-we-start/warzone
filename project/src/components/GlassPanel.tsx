import React from 'react';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  animate?: boolean;
}

export default function GlassPanel({ children, className = '', animate = true }: GlassPanelProps) {
  return (
    <div className={`
      backdrop-blur-lg bg-black/20 border border-ice-blue/30 rounded-2xl
      shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(161,224,255,0.1)]
      ${animate ? 'animate-fade-in-up' : ''}
      ${className}
    `}>
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-ice-blue/5 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}