'use client';

import { tools } from '@yuta/core';
import { Badge, Button, Card, Separator } from '@yuta/ui';
import {
  LayoutDashboard,
  Wrench,
  BarChart2,
  Settings,
  Plus,
  Search,
  ArrowUpRight,
  MoreHorizontal,
  Menu,
} from 'lucide-react';

const navigation = [
  { label: 'Tổng quan', icon: LayoutDashboard, selected: true },
  { label: 'Công cụ', icon: Wrench },
  { label: 'Phân tích', icon: BarChart2 },
  { label: 'Thiết lập', icon: Settings },
];

export function AdminShell() {
  return (
    <div className="flex min-h-screen bg-yuta-paper">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-yuta-line bg-white md:flex md:flex-col">
        {/* Logo */}
        <div className="flex h-[68px] items-center gap-3 border-b border-yuta-line px-5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-yuta-accent font-black text-yuta-ink">Y</div>
          <span className="text-base font-extrabold text-yuta-ink">YuTa Admin</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 p-3">
          {navigation.map(({ label, icon: Icon, selected }) => (
            <button
              key={label}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                selected
                  ? 'bg-yuta-mist text-yuta-ink'
                  : 'text-yuta-ink/60 hover:bg-yuta-mist hover:text-yuta-ink'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Bottom tagline */}
        <div className="m-3 rounded-2xl bg-yuta-mist p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-yuta-ink/50">Yu Ta Platform</p>
          <p className="mt-2 text-sm font-bold text-yuta-ink">Xây công cụ tử tế, cùng một hệ thống.</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-[68px] items-center gap-4 border-b border-yuta-line bg-white px-6">
          <button className="rounded-xl p-2 text-yuta-ink/60 hover:bg-yuta-mist md:hidden">
            <Menu className="h-5 w-5" />
          </button>

          <label className="hidden items-center gap-2 rounded-xl border border-yuta-line bg-yuta-paper px-3 py-2 sm:flex" style={{ width: 320 }}>
            <Search className="h-4 w-4 text-yuta-ink/40" />
            <input
              type="text"
              placeholder="Tìm công cụ, workspace..."
              className="flex-1 bg-transparent text-sm text-yuta-ink placeholder:text-yuta-ink/40 focus:outline-none"
            />
          </label>

          <div className="flex-1" />

          <div className="grid h-9 w-9 place-items-center rounded-full bg-yuta-ink text-sm font-bold text-white">
            YT
          </div>
        </header>

        {/* Main */}
        <main className="mx-auto w-full max-w-screen-xl p-6 md:p-10">
          {/* Page header */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm text-yuta-ink/50">Thứ bảy, 21 tháng 6</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-yuta-ink">Chào buổi sáng, YuTa.</h1>
              <p className="mt-2 text-sm text-yuta-ink/60">Không gian điều hành cho các sản phẩm trong hệ sinh thái.</p>
            </div>
            <Button variant="accent">
              <Plus className="h-4 w-4" />
              Thêm công cụ
            </Button>
          </div>

          {/* Metric cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Công cụ đang hoạt động" value="1" detail="Workspace đang sẵn sàng" />
            <MetricCard label="Phiên làm việc tuần này" value="18" detail="Tăng 12% so với tuần trước" />
            <MetricCard label="Hạng mục cần chú ý" value="2" detail="Hoàn thiện Content Lab và Insights" />
          </div>

          {/* Tools table */}
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between px-5 py-4">
              <div>
                <h2 className="font-semibold text-yuta-ink">Công cụ</h2>
                <p className="text-sm text-yuta-ink/50">Trạng thái phát triển của hệ YuTa</p>
              </div>
              <button className="rounded-xl p-2 text-yuta-ink/50 hover:bg-yuta-mist">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
            <Separator />
            <div>
              {tools.map((tool, index) => (
                <div key={tool.slug}>
                  <div className="flex items-center gap-4 px-5 py-4">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl font-black text-yuta-ink ${tool.status === 'ready' ? 'bg-yuta-accent' : 'bg-yuta-mist'}`}>
                      {tool.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-yuta-ink">{tool.name}</p>
                      <p className="text-sm text-yuta-ink/50">{tool.category} · {tool.description}</p>
                    </div>
                    <Badge variant={tool.status === 'ready' ? 'active' : 'neutral'}>
                      {tool.status === 'ready' ? 'Sẵn sàng' : 'Bản nháp'}
                    </Badge>
                    <button className="rounded-xl p-2 text-yuta-ink/50 hover:bg-yuta-mist">
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                  </div>
                  {index < tools.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <p className="text-sm text-yuta-ink/50">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-yuta-ink">{value}</p>
      <p className="mt-1 text-xs text-yuta-ink/50">{detail}</p>
    </Card>
  );
}
