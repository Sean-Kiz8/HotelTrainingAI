import { ReactNode } from "react";
import { createPortal } from "react-dom";

interface PortalProps {
  children: ReactNode;
}

export function Portal({ children }: PortalProps) {
  return typeof document === "undefined" 
    ? null 
    : createPortal(children, document.body);
}