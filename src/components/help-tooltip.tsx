"use client";

import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const emptySubscribe = () => () => {};

export type HelpTooltipProps = {
  /** Titolo opzionale per l'intestazione del popover */
  title?: string;
  /** Testo descrittivo della spiegazione in italiano */
  text: string;
  /** Nome dell'impostazione/campo per l'accessibilità (aria-label) */
  label?: string;
  /** Classi CSS opzionali per il wrapper */
  className?: string;
};

export function HelpTooltip({ title, text, className = "" }: HelpTooltipProps) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [coords, setCoords] = useState<{ left: number; top?: number; bottom?: number; width: number } | null>(null);

  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const tooltipId = useId();

  const isVisible = isOpen || isHovered || isFocused;

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const padding = 12;
    const popoverWidth = Math.min(320, window.innerWidth - padding * 2);

    // Centra orizzontalmente rispetto all'icona, con clamping ai bordi del viewport
    let left = triggerRect.left + triggerRect.width / 2 - popoverWidth / 2;
    left = Math.max(padding, Math.min(window.innerWidth - popoverWidth - padding, left));

    // Determina se posizionare sopra o sotto l'icona
    const spaceAbove = triggerRect.top;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const preferAbove = spaceAbove >= 180 || spaceAbove >= spaceBelow;

    if (preferAbove) {
      setCoords({
        left,
        bottom: window.innerHeight - triggerRect.top + 8,
        width: popoverWidth,
      });
    } else {
      setCoords({
        left,
        top: triggerRect.bottom + 8,
        width: popoverWidth,
      });
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    updatePosition();

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setIsHovered(false);
      setIsFocused(false);
    }

    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        setIsHovered(false);
        setIsFocused(false);
        triggerRef.current?.focus();
      }
    }

    function handleScrollOrResize() {
      updatePosition();
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener("resize", handleScrollOrResize, { passive: true });

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isVisible, updatePosition]);

  function handleTriggerClick(e: React.MouseEvent<HTMLSpanElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function handleTriggerKeyDown(e: React.KeyboardEvent<HTMLSpanElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen((prev) => !prev);
    }
  }

  function handleCloseClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setIsHovered(false);
    setIsFocused(false);
    triggerRef.current?.focus();
  }

  return (
    <span className={`help-tooltip-wrap ${className}`}>
      <span
        ref={triggerRef}
        role="button"
        tabIndex={0}
        className="help-tooltip-trigger"
        aria-label="Maggiori informazioni"
        aria-expanded={isVisible}
        aria-controls={isVisible ? tooltipId : undefined}
        aria-haspopup="dialog"
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        onMouseDown={(e) => {
          // Impedisce di attivare l'eventuale label padre che circonda il campo
          e.stopPropagation();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => {
          setIsFocused(true);
          updatePosition();
        }}
        onBlur={() => setIsFocused(false)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="help-tooltip-icon"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </span>

      {isClient && isVisible && coords && createPortal(
        <div
          ref={popoverRef}
          id={tooltipId}
          role="tooltip"
          aria-live="polite"
          className="help-tooltip-popover"
          style={{
            position: "fixed",
            left: `${coords.left}px`,
            top: coords.top !== undefined ? `${coords.top}px` : undefined,
            bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
            width: `${coords.width}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {title && <strong className="help-tooltip-title">{title}</strong>}
          <p className="help-tooltip-text">{text}</p>
          <button
            type="button"
            className="help-tooltip-close"
            onClick={handleCloseClick}
            aria-label="Chiudi spiegazione"
          >
            ×
          </button>
        </div>,
        document.body
      )}
    </span>
  );
}
