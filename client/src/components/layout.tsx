import { TempMainLayout } from "./layout/temp-main-layout";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <TempMainLayout>
      {children}
    </TempMainLayout>
  );
}