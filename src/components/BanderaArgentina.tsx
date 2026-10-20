import React from 'react';

interface BanderaArgentinaProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  labelClassName?: string;
}

export const BanderaArgentina: React.FC<BanderaArgentinaProps> = ({
  className = '',
  size = 'sm',
  showLabel = false,
  label = 'Argentina',
  labelClassName = '',
}) => {
  const sizeMap = {
    xs: 'w-5 h-3.5',
    sm: 'w-7 h-4.5',
    md: 'w-9 h-6',
    lg: 'w-12 h-8',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className={`relative ${sizeMap[size]} rounded-xs overflow-hidden shadow-xs border border-slate-300/80 shrink-0 inline-block align-middle`}
        title="Bandera Oficial de la República Argentina"
      >
        <svg
          viewBox="0 0 768 480"
          className="w-full h-full block"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Franja Celeste Superior */}
          <rect width="768" height="160" fill="#75AADB" />
          {/* Franja Blanca Central */}
          <rect y="160" width="768" height="160" fill="#FFFFFF" />
          {/* Franja Celeste Inferior */}
          <rect y="320" width="768" height="160" fill="#75AADB" />
          
          {/* Sol de Mayo Oficial */}
          <g transform="translate(384, 240)">
            {/* Rayos del Sol */}
            {[...Array(16)].map((_, i) => (
              <g key={i} transform={`rotate(${i * 22.5})`}>
                {/* Rayo recto */}
                <polygon points="0,-16 5,-60 0,-70 -5,-60" fill="#F6B40E" stroke="#843511" strokeWidth="1" />
                {/* Rayo ondulado secundario */}
                <path
                  d="M0,-16 Q8,-38 0,-52 Q-8,-62 0,-68"
                  fill="none"
                  stroke="#F6B40E"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              </g>
            ))}
            {/* Disco solar dorado exterior */}
            <circle r="34" fill="#F6B40E" stroke="#843511" strokeWidth="2.5" />
            {/* Ojos y rostro estilizado del Sol de Mayo */}
            <circle cx="-10" cy="-6" r="3.5" fill="#843511" />
            <circle cx="10" cy="-6" r="3.5" fill="#843511" />
            {/* Nariz */}
            <path d="M-2,0 L2,0 L0,7 Z" fill="#843511" />
            {/* Sonrisa serena */}
            <path
              d="M-12,12 Q0,21 12,12"
              fill="none"
              stroke="#843511"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </span>

      {showLabel && (
        <span className={`text-[10px] font-bold tracking-wider uppercase text-slate-700 ${labelClassName}`}>
          {label}
        </span>
      )}
    </span>
  );
};
