import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PrototypeBackofficeNotice } from '../src/components/prototype-backoffice-notice';

describe('PrototypeBackofficeNotice', () => {
  it('identifies fixture-backed surfaces and unavailable persisted actions', () => {
    const markup = renderToStaticMarkup(<PrototypeBackofficeNotice />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('Prototype avec données de démonstration');
    expect(markup).toContain('ne proviennent pas des données');
    expect(markup).toContain('création, modification et export');
  });
});
