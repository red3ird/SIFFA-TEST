import React, { ImgHTMLAttributes } from 'react';
import { useImageManager } from '../context/ImageManagerContext';

export interface EditableImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  imageKey?: string;
  imageTitle?: string;
  hint?: string;
  containerClassName?: string;
  showHoverBadge?: boolean;
}

export const EditableImage: React.FC<EditableImageProps> = ({
  src = '',
  alt = 'Imagen institucional',
  imageKey,
  imageTitle,
  hint,
  className = '',
  containerClassName = '',
  showHoverBadge = true,
  onClick,
  ...rest
}) => {
  const { getImage, openEditor, isAdmin } = useImageManager();

  const key = imageKey || src;
  const currentSrc = getImage(key) || src;
  const canEdit = isAdmin;

  const handleClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (canEdit) {
      e.preventDefault();
      e.stopPropagation();
      openEditor({
        key,
        originalSrc: src,
        title: imageTitle || alt || 'Imagen',
        hint,
      });
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      data-editable-image-key={key}
      data-editable-image-title={imageTitle || alt}
      className={`relative inline-block group/edit-img ${containerClassName} ${
        canEdit ? 'cursor-pointer' : ''
      }`}
      onClick={canEdit ? (e) => {
        e.preventDefault();
        e.stopPropagation();
        openEditor({
          key,
          originalSrc: src,
          title: imageTitle || alt || 'Imagen',
          hint,
        });
      } : undefined}
    >
      <img
        src={currentSrc}
        alt={alt}
        className={`${className} ${
          canEdit ? 'transition-all duration-200 group-hover/edit-img:brightness-95 group-hover/edit-img:ring-2 group-hover/edit-img:ring-emerald-400/80' : ''
        }`}
        onClick={handleClick}
        {...rest}
      />

      {/* Admin Hover Indicator Badge */}
      {canEdit && showHoverBadge && (
        <div
          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/edit-img:opacity-100 transition-opacity duration-200 flex items-center justify-center p-2 rounded-[inherit] pointer-events-none z-20"
        >
          <div className="bg-[#001738]/95 text-white border border-emerald-400/60 shadow-lg px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 backdrop-blur-xs transform scale-95 group-hover/edit-img:scale-100 transition-transform">
            <i className="fa-solid fa-camera text-emerald-400"></i>
            <span>Cambiar imagen</span>
          </div>
        </div>
      )}
    </div>
  );
};
