import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'YUTA — Suite de gestion pour restaurants';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const logoData = await readFile(
    join(process.cwd(), 'public/images/web-app-manifest-192x192.png'),
    'base64',
  );
  const logoSrc = `data:image/png;base64,${logoData}`;

  return new ImageResponse(
    <div
      style={{
        alignItems: 'center',
        background:
          'linear-gradient(135deg, rgb(245, 253, 249), white 52%, rgb(222, 247, 236))',
        color: 'rgb(15, 35, 45)',
        display: 'flex',
        fontFamily: 'Arial, sans-serif',
        height: '100%',
        justifyContent: 'space-between',
        padding: '72px 82px',
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 690,
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            fontSize: 34,
            fontWeight: 700,
            gap: 18,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt="" height={72} src={logoSrc} width={72} />
          YUTA
        </div>
        <div
          style={{
            fontSize: 68,
            fontWeight: 700,
            letterSpacing: '-2.5px',
            lineHeight: 1.06,
            marginTop: 44,
          }}
        >
          Suite de gestion pour restaurants
        </div>
        <div
          style={{
            color: 'rgb(64, 84, 91)',
            fontSize: 26,
            lineHeight: 1.45,
            marginTop: 28,
          }}
        >
          Des outils modulaires pour la relation client, les opérations,
          l’équipe et le pilotage quotidien.
        </div>
      </div>
      <div
        style={{
          alignItems: 'center',
          background: 'rgb(18, 156, 107)',
          borderRadius: 56,
          boxShadow: '0 24px 70px rgba(18, 156, 107, 0.24)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          height: 360,
          justifyContent: 'center',
          width: 310,
        }}
      >
        <div style={{ fontSize: 86, fontWeight: 700 }}>4</div>
        <div
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginTop: 8,
            textAlign: 'center',
          }}
        >
          espaces de gestion
        </div>
        <div
          style={{
            fontSize: 19,
            lineHeight: 1.45,
            marginTop: 26,
            textAlign: 'center',
            width: 230,
          }}
        >
          Relation client · Opérations · Équipe · Pilotage
        </div>
      </div>
    </div>,
    size,
  );
}
