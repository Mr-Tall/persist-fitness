"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";

const focusableSelector = [
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

type ActiveDialog = {
  close: () => void;
  id: symbol;
};

let activeDialog: ActiveDialog | null = null;
let restoreDocumentState: (() => void) | null = null;

function isolateDialog(portalElement: HTMLElement) {
  const previousOverflow = document.body.style.overflow;
  const backgroundState = new Map<
    Element,
    { hadInert: boolean; inertValue: string | null; ariaHidden: string | null }
  >();

  function hideBackgroundElement(element: Element) {
    if (element === portalElement || backgroundState.has(element)) {
      return;
    }

    backgroundState.set(element, {
      hadInert: element.hasAttribute("inert"),
      inertValue: element.getAttribute("inert"),
      ariaHidden: element.getAttribute("aria-hidden"),
    });
    element.setAttribute("inert", "");
    element.setAttribute("aria-hidden", "true");
  }

  for (const element of Array.from(document.body.children)) {
    hideBackgroundElement(element);
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of Array.from(record.addedNodes)) {
        if (node instanceof Element && node.parentElement === document.body) {
          hideBackgroundElement(node);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true });

  document.body.style.overflow = "hidden";

  return () => {
    observer.disconnect();
    document.body.style.overflow = previousOverflow;
    for (const [
      element,
      { hadInert, inertValue, ariaHidden },
    ] of backgroundState) {
      if (hadInert) {
        element.setAttribute("inert", inertValue ?? "");
      } else {
        element.removeAttribute("inert");
      }

      if (ariaHidden === null) {
        element.removeAttribute("aria-hidden");
      } else {
        element.setAttribute("aria-hidden", ariaHidden);
      }
    }
  };
}

export type AccessibleDialogProps = {
  children: ReactNode;
  descriptionId?: string;
  escapeDisabled?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  initialFocusSelector?: string;
  inlineClassName?: string;
  onClose: () => void;
  onEscape?: () => void;
  open: boolean;
  overlayClassName?: string;
  panelClassName?: string;
  renderInlineWhenClosed?: boolean;
  restoreFocus?: () => void;
  restoreFocusRef?: RefObject<HTMLElement | null>;
  titleId: string;
};

export function AccessibleDialog({
  children,
  descriptionId,
  escapeDisabled = false,
  initialFocusRef,
  initialFocusSelector,
  inlineClassName = "",
  onClose,
  onEscape,
  open,
  overlayClassName = "",
  panelClassName = "",
  renderInlineWhenClosed = false,
  restoreFocus,
  restoreFocusRef,
  titleId,
}: AccessibleDialogProps) {
  const instanceId = useRef(Symbol("accessible-dialog"));
  const escapeDisabledRef = useRef(escapeDisabled);
  const onCloseRef = useRef(onClose);
  const onEscapeRef = useRef(onEscape);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    escapeDisabledRef.current = escapeDisabled;
    onCloseRef.current = onClose;
    onEscapeRef.current = onEscape;
  }, [escapeDisabled, onClose, onEscape]);

  const requestClose = useCallback(() => {
    onCloseRef.current();
  }, []);

  const restoreExactFocus = useCallback(() => {
    window.setTimeout(() => {
      if (restoreFocus) {
        restoreFocus();
        return;
      }

      const target = restoreFocusRef?.current ?? previouslyFocusedRef.current;
      if (target?.isConnected) {
        target.focus();
      }
    }, 0);
  }, [restoreFocus, restoreFocusRef]);

  useLayoutEffect(() => {
    const portalElement = overlayRef.current;
    if (!open || !portalElement) {
      return;
    }

    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const id = instanceId.current;
    if (activeDialog && activeDialog.id !== id) {
      activeDialog.close();
      restoreDocumentState?.();
    }

    activeDialog = { close: requestClose, id };
    restoreDocumentState = isolateDialog(portalElement);

    const focusTimer = window.setTimeout(() => {
      const selectedTarget = initialFocusSelector
        ? panelRef.current?.querySelector<HTMLElement>(initialFocusSelector)
        : null;
      (initialFocusRef?.current ?? selectedTarget ?? panelRef.current)?.focus();
    }, 0);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !escapeDisabledRef.current) {
        event.preventDefault();
        (onEscapeRef.current ?? requestClose)();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) {
        return;
      }

      const focusableElements = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => {
        const style = window.getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden";
      });
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (!firstElement || !lastElement) {
        event.preventDefault();
        panelRef.current.focus();
      } else if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);

      if (activeDialog?.id === id) {
        activeDialog = null;
        restoreDocumentState?.();
        restoreDocumentState = null;
        restoreExactFocus();
      }
    };
  }, [
    initialFocusRef,
    initialFocusSelector,
    open,
    requestClose,
    restoreExactFocus,
  ]);

  if (!open) {
    return renderInlineWhenClosed ? (
      <section className={inlineClassName}>{children}</section>
    ) : null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={`fixed inset-0 z-[70] flex items-end bg-black/80 px-2 pt-3 backdrop-blur-sm motion-reduce:transition-none sm:items-center sm:justify-center sm:p-4 ${overlayClassName}`}
      data-dialog-overlay
      data-dialog-portal
      ref={overlayRef}
    >
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className={`flex h-[calc(100dvh-0.75rem)] w-full scroll-pb-[env(safe-area-inset-bottom)] flex-col overflow-hidden rounded-t-[2rem] border border-white/10 bg-neutral-950 shadow-[0_-24px_80px_-35px_rgba(16,185,129,0.55)] motion-reduce:transition-none sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-xl sm:rounded-3xl ${panelClassName}`}
        data-dialog-panel
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        {children}
      </section>
    </div>,
    document.body,
  );
}
