const activeLocks = new Set();

let savedScrollY = 0;
let previousBodyStyles = null;
let previousHtmlStyles = null;

const canUseDom = () =>
  typeof window !== "undefined" &&
  typeof document !== "undefined" &&
  document.body &&
  document.documentElement;

export function lockBodyScroll(lockId) {
  if (!lockId || !canUseDom()) return;

  activeLocks.add(lockId);
  if (activeLocks.size > 1) return;

  const { body, documentElement } = document;
  savedScrollY = window.scrollY || window.pageYOffset || 0;

  previousBodyStyles = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
    touchAction: body.style.touchAction,
  };

  previousHtmlStyles = {
    overflow: documentElement.style.overflow,
    overscrollBehavior: documentElement.style.overscrollBehavior,
  };

  documentElement.style.overflow = "hidden";
  documentElement.style.overscrollBehavior = "none";

  body.classList.add("prime-overlay-scroll-lock");
  body.style.position = "fixed";
  body.style.top = `-${savedScrollY}px`;
  body.style.left = "0";
  body.style.right = "0";
  body.style.width = "100%";
  body.style.overflow = "hidden";
  body.style.touchAction = "none";
}

export function unlockBodyScroll(lockId) {
  if (!lockId || !canUseDom()) return;

  activeLocks.delete(lockId);
  if (activeLocks.size > 0) return;

  const { body, documentElement } = document;
  const restoreY = Math.abs(parseInt(body.style.top || "0", 10)) || savedScrollY;

  body.classList.remove("prime-overlay-scroll-lock");
  body.style.position = previousBodyStyles?.position || "";
  body.style.top = previousBodyStyles?.top || "";
  body.style.left = previousBodyStyles?.left || "";
  body.style.right = previousBodyStyles?.right || "";
  body.style.width = previousBodyStyles?.width || "";
  body.style.overflow = previousBodyStyles?.overflow || "";
  body.style.touchAction = previousBodyStyles?.touchAction || "";

  documentElement.style.overflow = previousHtmlStyles?.overflow || "";
  documentElement.style.overscrollBehavior = previousHtmlStyles?.overscrollBehavior || "";

  previousBodyStyles = null;
  previousHtmlStyles = null;
  savedScrollY = 0;

  window.scrollTo(0, restoreY);
}
