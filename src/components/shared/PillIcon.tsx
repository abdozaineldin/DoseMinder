'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { MedForm } from '@/db/database.types';

export interface PillIconProps extends React.SVGProps<SVGSVGElement> {
  form?: MedForm;
  color?: string;
  size?: number;
}

export function PillIcon({
  form = 'tablet',
  color = '#0F6B70',
  size = 28,
  className,
  ...props
}: PillIconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    className: cn('shrink-0 select-none transition-transform', className),
    ...props,
  };

  switch (form) {
    case 'capsule':
      return (
        <svg {...common}>
          {/* Angled two-tone capsule */}
          <g transform="rotate(-45 12 12)">
            <rect x="2.5" y="7.5" width="19" height="9" rx="4.5" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="2" />
            <path d="M12 7.5 H7 a4.5 4.5 0 0 0 0 9 H12 Z" fill={color} />
          </g>
        </svg>
      );

    case 'syrup':
      return (
        <svg {...common}>
          {/* Medicine Bottle */}
          <rect x="7" y="2" width="10" height="3" rx="1" fill={color} />
          <path d="M 9 5 L 9 8 L 6 10 L 6 21 C 6 21.55 6.45 22 7 22 L 17 22 C 17.55 22 18 21.55 18 21 L 18 10 L 15 8 L 15 5 Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
          <line x1="6" y1="14" x2="18" y2="14" stroke={color} strokeWidth="1.5" strokeDasharray="2 2" />
          <rect x="9" y="16" width="6" height="4" rx="1" fill={color} />
        </svg>
      );

    case 'injection':
      return (
        <svg {...common}>
          {/* Syringe */}
          <path d="M 18 2 L 22 6 L 19 9 L 15 5 Z" fill={color} />
          <rect x="6" y="8" width="10" height="8" rx="1" transform="rotate(45 11 12)" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
          <line x1="4.5" y1="19.5" x2="2" y2="22" stroke={color} strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="9" x2="11" y2="11" stroke={color} strokeWidth="1.5" />
          <line x1="11" y1="7" x2="13" y2="9" stroke={color} strokeWidth="1.5" />
        </svg>
      );

    case 'drops':
      return (
        <svg {...common}>
          {/* Dropper */}
          <path
            d="M 12 2 C 12 2 5 10 5 15 C 5 18.87 8.13 22 12 22 C 15.87 22 19 18.87 19 15 C 19 10 12 2 12 2 Z"
            fill={color}
            fillOpacity="0.25"
            stroke={color}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="14" r="2" fill={color} />
        </svg>
      );

    case 'cream':
      return (
        <svg {...common}>
          {/* Tube */}
          <path d="M 5 21 L 19 21 L 17 8 L 7 8 Z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
          <rect x="8" y="3" width="8" height="5" rx="1" fill={color} />
          <line x1="7" y1="14" x2="17" y2="14" stroke={color} strokeWidth="2" />
        </svg>
      );

    case 'inhaler':
      return (
        <svg {...common}>
          {/* Inhaler */}
          <path
            d="M 6 4 C 6 2.9 6.9 2 8 2 L 14 2 C 15.1 2 16 2.9 16 4 L 16 14 L 20 18 C 20.6 18.6 20.6 19.4 20 20 L 19 21 C 18.4 21.6 17.6 21.6 17 21 L 6 21 C 4.9 21 4 20.1 4 19 L 4 6 C 4 4.9 4.9 4 6 4 Z"
            fill={color}
            fillOpacity="0.2"
            stroke={color}
            strokeWidth="2"
          />
          <circle cx="10" cy="8" r="2" fill={color} />
        </svg>
      );

    case 'tablet':
    default:
      return (
        <svg {...common}>
          {/* Round tablet with highlight */}
          <circle cx="12" cy="12" r="9" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />
          <path d="M7.5 10 A5 5 0 0 1 11 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}
