import type { HTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import { cn } from './utils';

export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  sidebar?: ReactNode;
}

export function AppShell({
  sidebar,
  children,
  className,
  ...props
}: PropsWithChildren<AppShellProps>) {
  return (
    <div
      className={cn(
        'h-screen overflow-hidden bg-yuta-paper text-yuta-ink md:grid md:grid-cols-[256px_minmax(0,1fr)]',
        className,
      )}
      {...props}
    >
      {sidebar}
      {children}
    </div>
  );
}

export interface AppSidebarProps extends HTMLAttributes<HTMLElement> {
  header?: ReactNode;
  footer?: ReactNode;
}

export function AppSidebar({
  header,
  footer,
  children,
  className,
  ...props
}: PropsWithChildren<AppSidebarProps>) {
  return (
    <aside
      className={cn(
        'hidden h-screen min-h-0 flex-col border-r border-yuta-line bg-white md:flex',
        className,
      )}
      {...props}
    >
      {header}
      <nav className="min-h-0 flex-1 overflow-y-auto p-4">{children}</nav>
      {footer}
    </aside>
  );
}

export function AppSidebarHeader({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn(
        'flex h-16 shrink-0 items-center gap-3 border-b border-yuta-line px-5',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AppSidebarFooter({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn('shrink-0 border-t border-yuta-line px-4 py-2', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AppTopbarProps extends HTMLAttributes<HTMLElement> {
  search?: ReactNode;
  actions?: ReactNode;
}

export function AppTopbar({
  search,
  actions,
  className,
  ...props
}: AppTopbarProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-yuta-line bg-white px-5 md:gap-4 md:px-7',
        className,
      )}
      {...props}
    >
      {search}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function AppMain({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <main
      className={cn('min-h-0 flex-1 overflow-y-auto px-5 pb-16 pt-8 md:px-8', className)}
      {...props}
    >
      {children}
    </main>
  );
}

export function AppFooter({
  children,
  className,
  ...props
}: PropsWithChildren<HTMLAttributes<HTMLElement>>) {
  return (
    <footer
      className={cn(
        'flex h-10 shrink-0 items-center justify-center border-t border-yuta-line bg-yuta-paper px-4 text-xs font-medium text-yuta-ink/45',
        className,
      )}
      {...props}
    >
      {children}
    </footer>
  );
}
