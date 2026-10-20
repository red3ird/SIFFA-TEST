import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { db } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

export interface ImageEditTarget {
  key: string;
  originalSrc: string;
  title: string;
  hint?: string;
}

interface ImageManagerContextType {
  customImages: Record<string, string>;
  getImage: (keyOrSrc: string) => string;
  openEditor: (target: ImageEditTarget) => void;
  closeEditor: () => void;
  activeTarget: ImageEditTarget | null;
  saveImage: (key: string, dataUrl: string, title?: string) => Promise<void>;
  resetImage: (key: string) => Promise<void>;
  isEditMode: boolean;
  setIsEditMode: (active: boolean) => void;
  isAdmin: boolean;
  catalogOpen: boolean;
  setCatalogOpen: (open: boolean) => void;
}

const ImageManagerContext = createContext<ImageManagerContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'siffa_custom_image_overrides';

// Normalize keys to prevent slight path mismatches
export function normalizeImageKey(keyOrSrc: string): string {
  if (!keyOrSrc) return 'default';
  // If it's a data URL, don't use it as a key
  if (keyOrSrc.startsWith('data:')) return 'data-url';
  // Strip protocol/domain if present for clean matching
  let clean = keyOrSrc.replace(/^https?:\/\/[^/]+/, '');
  clean = clean.split('?')[0].split('#')[0];
  return clean;
}

// Helper to create safe Firestore doc IDs
function getFirestoreImageDocId(normKey: string): string {
  return encodeURIComponent(normKey)
    .replace(/%/g, '_')
    .replace(/\//g, '__')
    .slice(0, 800) || 'default_img';
}

export const ImageManagerProvider: React.FC<{
  children: ReactNode;
  currentUser: UserProfile | null;
  showToast?: (msg: string) => void;
}> = ({ children, currentUser, showToast }) => {
  const [customImages, setCustomImages] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [activeTarget, setActiveTarget] = useState<ImageEditTarget | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const isAdmin = Boolean(
    currentUser &&
    (currentUser.role === 'SUPER_ADMIN' ||
     currentUser.role === 'ADMIN_CREDENTIALS' ||
     currentUser.email === 'matiasmedina.n@gmail.com')
  );

  // Edit capability is automatically active for administrators without requiring any mode toggle button
  const [isEditMode, setIsEditMode] = useState<boolean>(true);

  // 1. Cargar imágenes guardadas desde Firebase Firestore y backend al iniciar
  useEffect(() => {
    let isMounted = true;

    const loadPersistedImages = async () => {
      const loaded: Record<string, string> = {};

      // A) Consulta directa a la base de datos de Firebase Firestore
      try {
        const snap = await getDocs(collection(db, 'siteImages'));
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.dataUrl) {
            if (data.key) loaded[data.key] = data.dataUrl;
            if (data.normKey) loaded[data.normKey] = data.dataUrl;
          }
        });
      } catch (fErr) {
        console.warn('SIFFA Firebase Firestore siteImages load:', fErr);
      }

      // B) Consulta al backend de la aplicación
      try {
        const serverImages = await api.getSiteImages();
        if (serverImages && Object.keys(serverImages).length > 0) {
          Object.assign(loaded, serverImages);
        }
      } catch (sErr) {
        console.warn('SIFFA server siteImages load:', sErr);
      }

      if (isMounted && Object.keys(loaded).length > 0) {
        setCustomImages((prev) => {
          const merged = { ...prev, ...loaded };
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }
    };

    loadPersistedImages();

    return () => {
      isMounted = false;
    };
  }, []);

  const getImage = useCallback((keyOrSrc: string): string => {
    if (!keyOrSrc) return '';
    // Direct match
    if (customImages[keyOrSrc]) return customImages[keyOrSrc];
    // Normalized key match
    const norm = normalizeImageKey(keyOrSrc);
    if (customImages[norm]) return customImages[norm];
    return keyOrSrc;
  }, [customImages]);

  const openEditor = useCallback((target: ImageEditTarget) => {
    setActiveTarget(target);
  }, []);

  const closeEditor = useCallback(() => {
    setActiveTarget(null);
  }, []);

  // 2. Guardar imagen en Firebase Firestore y sincronizar con backend
  const saveImage = useCallback(async (key: string, dataUrl: string, title?: string) => {
    const normKey = normalizeImageKey(key);

    // Update local state and localStorage immediately
    setCustomImages((prev) => {
      const next = { ...prev, [key]: dataUrl, [normKey]: dataUrl };
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.warn('LocalStorage limit reached for custom images:', e);
      }
      return next;
    });

    // Guardado persistente en Firebase Firestore
    try {
      const docId = getFirestoreImageDocId(normKey);
      await setDoc(doc(db, 'siteImages', docId), {
        key,
        normKey,
        dataUrl,
        title: title || key,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (fErr) {
      console.warn('Error guardando imagen en Firebase Firestore:', fErr);
    }

    // Sincronización en backend
    try {
      await api.updateSiteImage(normKey, dataUrl, title);
    } catch (err) {
      console.warn('Backend sync warning:', err);
    }

    if (showToast) {
      showToast(`Imagen "${title || 'seleccionada'}" guardada en la base de datos de Firebase.`);
    }
    setActiveTarget(null);
  }, [showToast]);

  // 3. Restablecer imagen en Firebase Firestore y backend
  const resetImage = useCallback(async (key: string) => {
    const normKey = normalizeImageKey(key);

    setCustomImages((prev) => {
      const next = { ...prev };
      delete next[key];
      delete next[normKey];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const docId = getFirestoreImageDocId(normKey);
      await deleteDoc(doc(db, 'siteImages', docId));
    } catch (fErr) {
      console.warn('Error eliminando imagen de Firebase Firestore:', fErr);
    }

    try {
      await api.resetSiteImage(normKey);
    } catch (err) {
      console.warn('Backend reset warning:', err);
    }

    if (showToast) {
      showToast('Imagen restablecida a la versión original de fábrica.');
    }
    setActiveTarget(null);
  }, [showToast]);

  // Synchronize all <img> tags in the DOM with active overrides
  useEffect(() => {
    const syncDOMImages = () => {
      const allImgs = document.querySelectorAll('img');
      allImgs.forEach((img) => {
        // Skip modal internal preview images
        if (img.closest('#siffa-image-edit-modal') || img.closest('#siffa-admin-image-toolbar')) {
          return;
        }

        // Store original src once if not already saved
        if (!img.getAttribute('data-original-src')) {
          const current = img.getAttribute('src');
          if (current && !current.startsWith('data:')) {
            img.setAttribute('data-original-src', current);
          }
        }

        const orig = img.getAttribute('data-original-src') || img.src;
        const wrapper = img.closest('[data-editable-image-key]');
        const customKey = wrapper ? wrapper.getAttribute('data-editable-image-key') : null;

        const effectiveKey = customKey || orig;
        const normKey = normalizeImageKey(effectiveKey);

        const replacement = customImages[effectiveKey] || customImages[normKey];
        if (replacement && img.src !== replacement) {
          img.src = replacement;
        } else if (!replacement && img.getAttribute('data-original-src') && img.src !== img.getAttribute('data-original-src')) {
          img.src = img.getAttribute('data-original-src')!;
        }
      });
    };

    syncDOMImages();

    // Observe dynamic elements
    const observer = new MutationObserver(syncDOMImages);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
    };
  }, [customImages]);

  // Global click listener for any standard web <img> element when user is Administrator
  // EXCLUYENDO rigurosamente las fotos de carnet/credencial
  useEffect(() => {
    if (!isAdmin) {
      const existing = document.getElementById('siffa-admin-image-hover-style');
      if (existing) existing.remove();
      return;
    }

    // Dynamic hover stylesheet for admin: only highlight web images, excluding carnets
    const styleEl = document.createElement('style');
    styleEl.id = 'siffa-admin-image-hover-style';
    styleEl.innerHTML = `
      img:not(#siffa-image-edit-modal img):not([data-carnet-photo]):not([data-carnet-photo] img):not(#siffa-credencial-card img):not(#modal-credencial-qr img):not(#acreditaciones-qr img):not(.carnet-foto) {
        cursor: pointer !important;
        transition: outline 0.15s ease, filter 0.15s ease;
      }
      img:not(#siffa-image-edit-modal img):not([data-carnet-photo]):not([data-carnet-photo] img):not(#siffa-credencial-card img):not(#modal-credencial-qr img):not(#acreditaciones-qr img):not(.carnet-foto):hover {
        outline: 3px solid #10b981 !important;
        outline-offset: 2px !important;
        filter: brightness(0.95);
      }
    `;
    document.head.appendChild(styleEl);

    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Ignore clicks inside our own modals
      if (target.closest('#siffa-image-edit-modal') || target.closest('#siffa-admin-image-toolbar')) {
        return;
      }

      // IMPORTANTE: Excluir fotos de carnet/credencial.
      // Las fotos de carnet solo pueden editarse desde el menú de Gestión SIFFA al agregar o modificar un perfil.
      const isCarnetPhoto = Boolean(
        target.closest('[data-carnet-photo]') ||
        target.closest('#siffa-credencial-card') ||
        target.closest('#modal-credencial-qr') ||
        target.closest('#acreditaciones-qr') ||
        target.closest('.carnet-foto')
      );
      if (isCarnetPhoto) {
        return;
      }

      // Check if clicked element or parent has data-editable-image-key or is an <img>
      const wrapper = target.closest('[data-editable-image-key]') as HTMLElement | null;
      let imgElement: HTMLImageElement | null = null;
      let customKey: string | null = null;
      let customTitle: string | null = null;

      if (wrapper) {
        customKey = wrapper.getAttribute('data-editable-image-key');
        customTitle = wrapper.getAttribute('data-editable-image-title');
        imgElement = wrapper.querySelector('img');
      } else if (target.tagName.toLowerCase() === 'img') {
        imgElement = target as HTMLImageElement;
      }

      // Double-check customKey to prevent carnet edits
      if (customKey && (
        customKey.includes('credencial') ||
        customKey.includes('docente-qr') ||
        customKey.includes('acreditado') ||
        customKey.includes('carnet')
      )) {
        return;
      }

      if (imgElement) {
        // Also check if image element itself is within a carnet container
        if (
          imgElement.closest('[data-carnet-photo]') ||
          imgElement.closest('#siffa-credencial-card') ||
          imgElement.closest('#modal-credencial-qr') ||
          imgElement.closest('#acreditaciones-qr') ||
          imgElement.closest('.carnet-foto')
        ) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        const orig = imgElement.getAttribute('data-original-src') || imgElement.currentSrc || imgElement.src;
        const alt = imgElement.alt || customTitle || 'Imagen institucional';
        const key = customKey || normalizeImageKey(orig);

        openEditor({
          key,
          originalSrc: orig,
          title: customTitle || alt || 'Imagen de la Web',
          hint: `Dimensión en pantalla: ${imgElement.clientWidth}x${imgElement.clientHeight}px`,
        });
      }
    };

    // Use capture phase to intercept before buttons or links trigger
    document.addEventListener('click', handleDocumentClick, true);
    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      const existing = document.getElementById('siffa-admin-image-hover-style');
      if (existing) existing.remove();
    };
  }, [isAdmin, openEditor]);

  return (
    <ImageManagerContext.Provider
      value={{
        customImages,
        getImage,
        openEditor,
        closeEditor,
        activeTarget,
        saveImage,
        resetImage,
        isEditMode,
        setIsEditMode,
        isAdmin,
        catalogOpen,
        setCatalogOpen,
      }}
    >
      {children}
    </ImageManagerContext.Provider>
  );
};

export const useImageManager = () => {
  const context = useContext(ImageManagerContext);
  if (!context) {
    throw new Error('useImageManager must be used within an ImageManagerProvider');
  }
  return context;
};
