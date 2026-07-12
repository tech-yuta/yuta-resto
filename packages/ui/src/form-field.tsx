import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './utils';

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
}

export function FormField({
  label,
  hint,
  error,
  children,
  className,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('grid gap-2', className)} {...props}>
      {label}
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
      {!error && hint ? <FieldHint>{hint}</FieldHint> : null}
    </div>
  );
}

export function FieldError({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm font-medium text-status-danger', className)}
      {...props}
    />
  );
}

export function FieldHint({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-muted', className)} {...props} />
  );
}

export interface FormSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title?: ReactNode;
  description?: ReactNode;
}

export function FormSection({
  title,
  description,
  children,
  className,
  ...props
}: FormSectionProps) {
  return (
    <section className={cn('grid gap-4', className)} {...props}>
      {(title || description) && (
        <div>
          {title && <h2 className="font-bold text-primary">{title}</h2>}
          {description && (
            <p className="mt-1 text-sm font-medium text-muted">
              {description}
            </p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
