import React, { useEffect } from 'react';
import styles from './BottomSheet.module.css';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {isOpen && <div className={styles.overlay} onClick={onClose} />}
      
      <div className={`${styles.bottomSheet} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sheetHandle}></div>
        <button className={styles.btnClose} onClick={onClose} aria-label="Fermer la fiche">
          &times;
        </button>
        
        <div className={styles.sheetContent}>
          {children}
        </div>
      </div>
    </>
  );
}
