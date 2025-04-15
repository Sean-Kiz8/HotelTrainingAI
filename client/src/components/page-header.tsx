import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function PageHeader({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 md:flex-row md:justify-between md:gap-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeaderHeading({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "text-3xl font-bold tracking-tight md:text-4xl mb-1",
        className
      )}
      {...props}
    />
  );
}

export function PageHeaderDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-muted-foreground text-sm md:text-base", className)}
      {...props}
    />
  );
}