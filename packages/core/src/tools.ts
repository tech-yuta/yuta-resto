export type ToolStatus = 'ready' | 'coming-soon';

export type ToolDefinition = {
  slug: string;
  name: string;
  description: string;
  category: string;
  status: ToolStatus;
};

/** The single source of truth for tools shown across YuTa apps. */
export const tools: ToolDefinition[] = [
  {
    slug: 'workspace',
    name: 'Workspace',
    description: 'Không gian khởi đầu cho các luồng công việc YuTa.',
    category: 'Nền tảng',
    status: 'ready',
  },
  {
    slug: 'display',
    name: 'Yuta Display',
    description: 'Digital signage — affichage de médias en boucle sur TV restaurant.',
    category: 'Restaurant',
    status: 'ready',
  },
  {
    slug: 'content-lab',
    name: 'Content Lab',
    description: 'Tạo, tổ chức và tinh chỉnh nội dung trong một luồng làm việc.',
    category: 'Sáng tạo',
    status: 'coming-soon',
  },
  {
    slug: 'insights',
    name: 'Insights',
    description: 'Theo dõi tín hiệu và biến dữ liệu thành quyết định rõ ràng.',
    category: 'Phân tích',
    status: 'coming-soon',
  },
];

export function getTool(slug: string) {
  return tools.find((tool) => tool.slug === slug);
}
