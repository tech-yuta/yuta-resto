export function reservationFieldErrorId(
  inputId: string,
  error: string | undefined,
): string | undefined {
  return error ? `${inputId}-error` : undefined;
}

export function reservationFieldError(
  inputId: string,
  error: string | undefined,
) {
  return error ? <span id={`${inputId}-error`}>{error}</span> : undefined;
}
