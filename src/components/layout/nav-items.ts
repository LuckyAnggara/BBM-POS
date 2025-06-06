
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Warehouse,
  ShoppingCart,
  ShoppingBag,
  Users,
  Settings,
  Package,
  Home,
  ListTree,
  PenTool,
  BarChart3,
  Plane,
  MoreHorizontal,
  Star,
  History,
  HelpCircle,
  FolderKanban,
  SlidersHorizontal,
  DollarSign, // For Sales
  TrendingUp // For Reports
} from 'lucide-react';

export interface NavSubItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  isActive?: (pathname: string) => boolean;
}

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  subItems?: NavSubItem[];
  isInitiallyOpen?: boolean;
  isActive?: (pathname: string) => boolean;
}

export interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

export const sidebarNavGroups: NavGroup[] = [
  {
    groupTitle: 'Platform',
    items: [
      {
        label: 'Playground', 
        icon: LayoutDashboard,
        href: '/',
        isActive: (pathname) => pathname === '/',
      },
      {
        label: 'Inventory Models',
        icon: FolderKanban, // Using FolderKanban for "Inventory" like group
        isInitiallyOpen: false,
        subItems: [
          {
            href: '/inventory',
            label: 'All Products',
            icon: Package,
            isActive: (pathname) => pathname === '/inventory' || pathname.startsWith('/inventory/add') || /^\/inventory\/[^/]+(\/edit)?$/.test(pathname),
          },
        ],
        isActive: (pathname) => pathname.startsWith('/inventory'),
      },
      {
        label: 'Sales & Reports',
        icon: BarChart3, 
        isInitiallyOpen: false,
        subItems: [
          { href: '/sales/history', label: 'Sales History', icon: History },
          // { href: '/reports/profit-loss', label: 'Profit & Loss', icon: TrendingUp },
        ],
        isActive: (pathname) => pathname.startsWith('/sales') || pathname.startsWith('/reports'),
      },
      {
        label: 'System Settings', 
        icon: Settings,
        href: '/admin/settings',
        isActive: (pathname) => pathname === '/admin/settings',
      },
      { label: 'History', icon: History, href: '#history-placeholder' },
      { label: 'Starred', icon: Star, href: '#starred-placeholder' },
      { label: 'Documentation', icon: HelpCircle, href: '#docs-placeholder' },
    ],
  },
  {
    groupTitle: 'Projects', 
    items: [
      { label: 'Design Engineering', icon: PenTool, href: '#design-placeholder' },
      { label: 'Sales & Marketing', icon: BarChart3, href: '#sales-market-placeholder' }, // Made unique
      { label: 'Travel', icon: Plane, href: '#travel-placeholder' },
      { label: 'More', icon: MoreHorizontal, href: '#more-projects-placeholder' },
    ],
  },
];

export const standaloneNavItems: NavItem[] = [
  {
    href: '/pos',
    label: 'Point of Sale',
    icon: ShoppingCart,
    isActive: (pathname) => pathname === '/pos',
  },
  {
    href: '/purchasing',
    label: 'Purchasing',
    icon: ShoppingBag,
    isActive: (pathname) => pathname.startsWith('/purchasing'),
  },
  {
    label: 'Admin Tools',
    icon: SlidersHorizontal,
    isInitiallyOpen: false,
    subItems: [
      { href: '/admin', label: 'Overview', icon: Home, isActive: (pathname) => pathname === '/admin' },
      { href: '/admin/users', label: 'Users', icon: Users, isActive: (pathname) => pathname === '/admin/users' },
      { href: '/admin/products', label: 'Product Catalog', icon: Package, isActive: (pathname) => pathname === '/admin/products' },
      { href: '/admin/categories', label: 'Categories', icon: ListTree, isActive: (pathname) => pathname === '/admin/categories' },
    ],
    isActive: (pathname) => pathname.startsWith('/admin') && pathname !== '/admin/settings',
  },
];
