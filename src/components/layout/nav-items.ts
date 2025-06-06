
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
  BarChart3,
  SlidersHorizontal,
  DollarSign, 
  TrendingUp,
  History as HistoryIcon,
  FileText, // Added for Reports
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
        label: 'Dashboard', 
        icon: LayoutDashboard, 
        href: '/',
        isActive: (pathname) => pathname === '/',
      },
      {
        label: 'Inventory', 
        icon: Warehouse, 
        isInitiallyOpen: false, 
        subItems: [
          {
            href: '/inventory',
            label: 'All Products',
            icon: Package, 
            isActive: (pathname) => pathname === '/inventory' || pathname.startsWith('/inventory/') && !pathname.endsWith('/add') && !pathname.endsWith('/history'),
          },
          {
            href: '/inventory/add',
            label: 'Add New Product',
            icon: Package, 
            isActive: (pathname) => pathname === '/inventory/add',
          },
        ],
        isActive: (pathname) => pathname.startsWith('/inventory'),
      },
      {
        label: 'Sales', 
        icon: DollarSign, 
        isInitiallyOpen: false,
        subItems: [
          { href: '/sales/history', label: 'Sales History', icon: HistoryIcon },
        ],
        isActive: (pathname) => pathname.startsWith('/sales'),
      },
      {
        label: 'Reports',
        icon: BarChart3, // Using BarChart3 for reports group
        isInitiallyOpen: false,
        subItems: [
          { href: '/reports/income-statement', label: 'Income Statement', icon: FileText },
          // Add more report links here
        ],
        isActive: (pathname) => pathname.startsWith('/reports'),
      },
      {
        label: 'System Settings', 
        icon: Settings,
        href: '/admin/settings', 
        isActive: (pathname) => pathname === '/admin/settings',
      },
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
      { href: '/admin', label: 'Overview', icon: Home, isActive: (pathname) => pathname === '/admin' && pathname !== '/admin/settings'},
      { href: '/admin/users', label: 'Users', icon: Users, isActive: (pathname) => pathname === '/admin/users' },
      { href: '/admin/products', label: 'Product Catalog', icon: Package, isActive: (pathname) => pathname === '/admin/products' },
      { href: '/admin/categories', label: 'Categories', icon: ListTree, isActive: (pathname) => pathname === '/admin/categories' },
    ],
    isActive: (pathname) => pathname.startsWith('/admin') && pathname !== '/admin/settings',
  },
];
