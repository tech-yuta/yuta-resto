import { getTool } from '@yuta/core';
import { Button, Card } from '@yuta/ui';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = getTool(slug);

  if (!tool || tool.status !== 'ready') notFound();

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-10">
      <Link href="/" className="text-sm font-semibold text-primary/60 hover:text-primary">← Tất cả công cụ</Link>
      <section className="py-16">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary/60">{tool.category}</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight">{tool.name}</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-primary/70">{tool.description}</p>
      </section>
      <Card>
        <h2 className="text-xl font-bold">Tool shell sẵn sàng</h2>
        <p className="mt-2 text-primary/65">Đây là nơi để cắm feature riêng của {tool.name}, trong khi component và logic chung vẫn nằm ở packages.</p>
        <Button className="mt-6">Bắt đầu</Button>
      </Card>
    </main>
  );
}
