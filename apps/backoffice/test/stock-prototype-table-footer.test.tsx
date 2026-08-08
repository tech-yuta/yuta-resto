import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { StockPrototypeTableFooter } from '../src/app/(authenticated)/stock/stock-prototype-table-footer';

describe('StockPrototypeTableFooter', () => {
  it('reports only the visible fixture count without fake pagination', () => {
    const markup = renderToStaticMarkup(
      <StockPrototypeTableFooter visibleCount={3} itemLabel="article" />,
    );

    expect(markup).toContain('3');
    expect(markup).toContain('articles de démonstration affichés');
    expect(markup).not.toContain('button');
    expect(markup).not.toContain('select');
  });

  it('uses the singular form for one fixture', () => {
    const markup = renderToStaticMarkup(
      <StockPrototypeTableFooter visibleCount={1} itemLabel="mouvement" />,
    );

    expect(markup).toContain('mouvement de démonstration affiché');
    expect(markup).not.toContain('affichés');
  });
});
