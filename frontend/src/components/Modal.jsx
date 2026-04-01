import { useEffect, useRef } from "react";

export function Modal({ open, title, description, children, onClose, size = "medium" }) {
  const backdropRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        onClose?.();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll while modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function handleBackdropClick(e) {
    if (e.target === backdropRef.current) {
      onClose?.();
    }
  }

  return (
    <div
      className="modal-overlay"
      ref={backdropRef}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`modal modal-${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">Configuration</p>
            <h3>{title}</h3>
            {description ? <p className="muted" style={{ marginTop: 4 }}>{description}</p> : null}
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            type="button"
            aria-label="Close modal"
            style={{ flexShrink: 0 }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style={{ padding: "0 24px 4px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
