import React, { useEffect, useState } from 'react';

const Modal = ({ isOpen, onClose, children }) => {
  const [visible, setVisible] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth <= 1200);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  useEffect(() => {
    if (isOpen && !isSmallScreen) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onClose, 500); 
      }, 7000);

      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [isOpen, onClose, isSmallScreen]);

  if (!isOpen && !visible) return null;

  return (
    <div
      className="modal-container"
      onClick={() => {
        setVisible(false);
        setTimeout(onClose, 500); 
      }}
      style={{
        position: "fixed", 
        bottom: 0, 
        right: 0,
        display: isSmallScreen ? 'none' : 'flex',
        alignItems: "flex-end", 
        justifyContent: "flex-end",
        zIndex: 1000,
        transition: 'opacity 0.5s ease-in-out',
        opacity: visible ? 1 : 0,
        paddingBottom: '80px', 
        paddingRight: '30px', 
        width: '20%'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()} 
        style={{
          background: "white",
          width: 250,
          padding: "5%",
          border: "1px solid #000",
          borderRadius: "5px",
          boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
          position: 'relative'
        }}
      >
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onClose, 500); 
          }}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path d="M19.3 5.71a1 1 0 0 0-1.42 0L12 11.59 6.11 5.71A1 1 0 0 0 4.69 7.11L10.59 13l-5.88 5.88a1 1 0 1 0 1.42 1.42L12 14.41l5.88 5.88a1 1 0 0 0 1.42-1.42L13.41 13l5.88-5.88a1 1 0 0 0 0-1.42z" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;