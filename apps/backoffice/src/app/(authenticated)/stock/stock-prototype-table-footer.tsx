export function StockPrototypeTableFooter({
  visibleCount,
  itemLabel,
}: {
  visibleCount: number;
  itemLabel: string;
}) {
  return (
    <footer className="border-t border-border-default px-5 py-4">
      <p className="text-sm text-muted">
        <strong className="text-primary">{visibleCount}</strong> {itemLabel}
        {visibleCount === 1 ? '' : 's'} de démonstration affiché
        {visibleCount === 1 ? '' : 's'}.
      </p>
    </footer>
  );
}
