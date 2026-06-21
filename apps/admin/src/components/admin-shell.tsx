'use client';

import { tools } from '@yuta/core';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined';
import AppsRoundedIcon from '@mui/icons-material/AppsRounded';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import MenuRoundedIcon from '@mui/icons-material/MenuRounded';
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Drawer,
  IconButton,
  InputBase,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material';

const drawerWidth = 264;

const navigation = [
  { label: 'Tổng quan', icon: <DashboardRoundedIcon />, selected: true },
  { label: 'Công cụ', icon: <AppsRoundedIcon /> },
  { label: 'Phân tích', icon: <AnalyticsOutlinedIcon /> },
  { label: 'Thiết lập', icon: <SettingsOutlinedIcon /> },
];

export function AdminShell() {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed" color="inherit" elevation={0} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, borderBottom: '1px solid #e1e7de' }}>
        <Toolbar sx={{ gap: 2, minHeight: '68px !important' }}>
          <IconButton edge="start" aria-label="Mở điều hướng" sx={{ display: { md: 'none' } }}><MenuRoundedIcon /></IconButton>
          <Box sx={{ width: { md: drawerWidth - 24 }, display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 2, bgcolor: '#b7ef5b', color: '#16211d', fontWeight: 900 }}>Y</Box>
            <Typography fontWeight={800}>YuTa Admin</Typography>
          </Box>
          <Paper component="label" variant="outlined" sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', px: 1.5, py: 0.4, width: 320, boxShadow: 'none' }}>
            <SearchRoundedIcon fontSize="small" color="action" />
            <InputBase placeholder="Tìm công cụ, workspace..." sx={{ ml: 1, flex: 1, fontSize: 14 }} />
          </Paper>
          <Box sx={{ flex: 1 }} />
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#365314', fontSize: 14 }}>YT</Avatar>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid #e1e7de', pt: '84px', px: 1.5 } }}>
        <List disablePadding>
          {navigation.map((item) => (
            <ListItemButton key={item.label} selected={item.selected} sx={{ mb: 0.5, borderRadius: 2, '&.Mui-selected': { bgcolor: '#eaf6d7', color: '#1f3d0d', '&:hover': { bgcolor: '#eaf6d7' } } }}>
              <ListItemIcon sx={{ minWidth: 38, color: 'inherit' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: item.selected ? 750 : 600 }} />
            </ListItemButton>
          ))}
        </List>
        <Box sx={{ mt: 'auto', mb: 2, p: 2, borderRadius: 3, bgcolor: '#eef1ea' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700}>YU TA PLATFORM</Typography>
          <Typography variant="body2" mt={0.75} fontWeight={700}>Xây công cụ tử tế, cùng một hệ thống.</Typography>
        </Box>
      </Drawer>

      <Box component="main" sx={{ flex: 1, minWidth: 0, pt: '68px' }}>
        <Box sx={{ maxWidth: 1440, mx: 'auto', p: { xs: 3, md: 5 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'end' }} gap={2} mb={4}>
            <Box>
              <Typography color="text.secondary" variant="body2">Thứ bảy, 21 tháng 6</Typography>
              <Typography variant="h4" mt={0.5}>Chào buổi sáng, YuTa.</Typography>
              <Typography color="text.secondary" mt={1}>Không gian điều hành cho các sản phẩm trong hệ sinh thái.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddRoundedIcon />} disableElevation>Thêm công cụ</Button>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} gap={2} mb={3}>
            <Metric label="Công cụ đang hoạt động" value="1" detail="Workspace đang sẵn sàng" />
            <Metric label="Phiên làm việc tuần này" value="18" detail="Tăng 12% so với tuần trước" />
            <Metric label="Hạng mục cần chú ý" value="2" detail="Hoàn thiện Content Lab và Insights" />
          </Stack>

          <Paper sx={{ overflow: 'hidden' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" px={3} py={2.5} borderBottom="1px solid #e1e7de">
              <Box><Typography variant="h6">Công cụ</Typography><Typography variant="body2" color="text.secondary">Trạng thái phát triển của hệ YuTa</Typography></Box>
              <IconButton aria-label="Tùy chọn"><MoreHorizRoundedIcon /></IconButton>
            </Stack>
            <Box>
              {tools.map((tool, index) => (
                <Stack key={tool.slug} direction="row" alignItems="center" gap={2} px={3} py={2.25} borderBottom={index < tools.length - 1 ? '1px solid #e9ede7' : undefined}>
                  <Box sx={{ width: 42, height: 42, display: 'grid', placeItems: 'center', borderRadius: 2.5, bgcolor: tool.status === 'ready' ? '#b7ef5b' : '#eef1ea', fontWeight: 900 }}>{tool.name.charAt(0)}</Box>
                  <Box sx={{ minWidth: 0, flex: 1 }}><Typography fontWeight={750}>{tool.name}</Typography><Typography variant="body2" color="text.secondary">{tool.category} · {tool.description}</Typography></Box>
                  <Chip label={tool.status === 'ready' ? 'Sẵn sàng' : 'Bản nháp'} size="small" color={tool.status === 'ready' ? 'success' : 'default'} variant={tool.status === 'ready' ? 'filled' : 'outlined'} />
                  <IconButton aria-label={`Mở ${tool.name}`}><ArrowOutwardRoundedIcon fontSize="small" /></IconButton>
                </Stack>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <Paper sx={{ flex: 1, p: 2.5 }}><Typography variant="body2" color="text.secondary">{label}</Typography><Typography variant="h4" mt={0.75}>{value}</Typography><Typography variant="caption" color="text.secondary">{detail}</Typography></Paper>;
}
