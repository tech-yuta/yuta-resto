import { tools } from '@yuta/core';
import { Button, Card } from '@yuta/ui';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-6 py-10 md:px-10">
      <nav className="flex items-center justify-between">
        <Link href="/" className="text-xl font-black tracking-tight">YuTa</Link>
        <Button variant="secondary">Đăng nhập</Button>
      </nav>

      <section className="grid gap-8 py-20 md:grid-cols-[1.2fr_0.8fr] md:items-end">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-yuta-ink/60">YuTa ecosystem</p>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Một nhà cho những công cụ làm việc tử tế.
          </h1>
        </div>
        <p className="max-w-md text-lg leading-8 text-yuta-ink/70">
          Mỗi tool có không gian riêng, nhưng cùng một hệ UI, logic và trải nghiệm.
        </p>
      </section>

      <section aria-labelledby="tools-heading">
        <div className="mb-5 flex items-center justify-between">
          <h2 id="tools-heading" className="text-xl font-bold">Công cụ</h2>
          <span className="text-sm text-yuta-ink/60">{tools.length} sản phẩm</span>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {tools.map((tool) => (
            <Card key={tool.slug} className="flex min-h-52 flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-yuta-ink/55">{tool.category}</span>
                <h3 className="mt-4 text-2xl font-bold">{tool.name}</h3>
                <p className="mt-2 leading-6 text-yuta-ink/65">{tool.description}</p>
              </div>
              {tool.status === 'ready' ? (
                <Link href={`/tools/${tool.slug}`} className="mt-6 text-sm font-bold underline underline-offset-4">
                  Mở công cụ →
                </Link>
              ) : (
                <span className="mt-6 text-sm font-semibold text-yuta-ink/45">Đang phát triển</span>
              )}
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
