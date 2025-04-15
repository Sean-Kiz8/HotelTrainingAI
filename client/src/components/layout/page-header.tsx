import { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  headerRight?: ReactNode;
  children?: ReactNode;
}

export function PageHeader({ title, subtitle, action, headerRight, children }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <div className="flex flex-wrap items-center justify-between">
        <div>
          <h2 className="text-2xl font-sans font-bold text-neutral-900">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="mt-2 md:mt-0 flex items-center space-x-2">
          {headerRight}
          {action}
          {children}
        </div>
      </div>
    </header>
  );
}

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchInput({ placeholder = "Поиск...", value, onChange, className }: SearchInputProps) {
  return (
    <div className={`relative mr-2 ${className || ''}`}>
      <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
        <span className="material-icons text-neutral-400 text-sm">search</span>
      </span>
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10 pr-4 py-2 w-full md:w-64"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
      />
    </div>
  );
}

interface CreateButtonProps {
  label: string;
  onClick: () => void;
}

export function CreateButton({ label, onClick }: CreateButtonProps) {
  return (
    <Button className="bg-primary hover:bg-primary-dark text-white" onClick={onClick}>
      <span className="material-icons text-sm mr-1">add</span>
      {label}
    </Button>
  );
}
