import React, { useState } from 'react';
import siffaOfficialLogo from '../assets/images/siffa_official_logo_1791900555840.jpg';
import { useImageManager } from '../context/ImageManagerContext';

interface SiffaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  rounded?: string;
  border?: boolean;
}

export const SiffaLogo: React.FC<SiffaLogoProps> = ({
  className = '',
  size = 'md',
  rounded = 'rounded-2xl',
  border = true,
}) => {
  const [hasError, setHasError] = useState(false);
  const { getImage, openEditor, isEditMode, isAdmin } = useImageManager();

  // Generous sizes designed for high visibility with zero excess margin
  const sizeMap = {
    xs: 'w-8 h-8',
    sm: 'w-11 h-11 sm:w-12 sm:h-12',
    md: 'w-16 h-16 sm:w-20 sm:h-20',
    lg: 'w-28 h-28 sm:w-32 sm:h-32',
    xl: 'w-44 h-44 sm:w-52 sm:h-52',
    '2xl': 'w-56 h-56 sm:w-64 sm:h-64',
    '3xl': 'w-72 h-72 sm:w-80 sm:h-80',
  };

  const currentSrc = getImage('logo-oficial-siffa') || (hasError ? '/siffa_logo.jpg' : siffaOfficialLogo);
  const canEdit = isAdmin && isEditMode;

  const handleClick = (e: React.MouseEvent) => {
    if (canEdit) {
      e.preventDefault();
      e.stopPropagation();
      openEditor({
        key: 'logo-oficial-siffa',
        originalSrc: siffaOfficialLogo,
        title: 'Logo Oficial SIFFA',
        hint: 'Logo institucional principal de la plataforma SIFFA.',
      });
    }
  };

  return (
    <div
      data-editable-image-key="logo-oficial-siffa"
      data-editable-image-title="Logo Oficial SIFFA"
      onClick={handleClick}
      className={`relative group/logo-edit ${sizeMap[size]} ${rounded} bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-xs ${
        border ? 'border-2 border-emerald-400/40' : ''
      } ${canEdit ? 'cursor-pointer hover:ring-2 hover:ring-emerald-400 transition-all' : ''} ${className}`}
      title={canEdit ? 'Clic para cambiar el logo institucional' : 'SIFFA'}
    >
      <img
        src={currentSrc}
        alt="SIFFA - Sindicato Internacional de Fútbol Femenino y Afines"
        className="w-full h-full object-contain p-0.5"
        onError={() => setHasError(true)}
      />
      {canEdit && size !== 'xs' && (
        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/logo-edit:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold p-1 text-center pointer-events-none">
          <i className="fa-solid fa-camera"></i>
        </div>
      )}
    </div>
  );
};
