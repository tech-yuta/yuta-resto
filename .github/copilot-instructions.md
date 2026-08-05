# YUTA Copilot Instructions

Follow, in order:

1. `/AGENTS.md`
2. `/docs/README.md` and `/docs/CURRENT_STATE.md`
3. the nearest nested `AGENTS.md`
4. relevant current architecture, feature, product, or operations documentation
5. current code and tests as implementation evidence

Do not treat completed implementation plans, pre-reset audits, or historical
reports as current authority. Keep cloud, POS, and display database boundaries
separate. Do not treat existing local products as legacy unless an approved
architectural decision explicitly changes their ownership.

All applications use `@yuta/ui`, semantic tokens, and `lucide-react`. Do not
introduce another component or icon library. App `globals.css` starts with
`@import '@yuta/ui/styles/global.css';` and uses the Tailwind 4 PostCSS plugin
defined in root `AGENTS.md`.

## Available `@yuta/ui` components

```text
Button, IconButton, Badge, StatusBadge, Avatar, AvatarGroup, Card, Input,
Label, Textarea, FormField, FieldError, FieldHint, FormSection, Select,
SelectTrigger, SelectContent, SelectItem, SelectValue, SelectGroup, Checkbox,
RadioGroup, RadioGroupItem, Switch, Tabs, TabsList, TabsTrigger, TabsContent,
Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle,
DialogDescription, ConfirmDialog, DropdownMenu, Popover, Tooltip, Alert,
Progress, Skeleton, LoadingOverlay, ErrorState, SimpleTable, DataTable,
Pagination, FilterBar, SearchInput, BulkActionBar, OrderCard, OrderItemRow,
PaymentSummary, KitchenTicket, KitchenItemStatus, TableCard, Separator,
MetricCard, StatCard, ActionPanel, PageHeader, Panel, PanelHeader, ListRow,
IconTile, EmptyState, AppShell, AppSidebar, AppSidebarHeader, AppSidebarFooter,
AppTopbar, AppMain, AppFooter, SegmentedNav, Toaster, cn
```

Whenever exports under `packages/ui/src/` change, update this catalog and the
matching catalog in `/AGENTS.md` in the same change.

Before completion, run the relevant validation commands from `AGENTS.md`,
update current documentation when behavior changes, and report commands that
were not run.
