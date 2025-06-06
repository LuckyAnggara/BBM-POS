
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
        icon: LayoutDashboard, // Changed from Playground to Dashboard
        href: '/',
        isActive: (pathname) => pathname === '/',
      },
      {
        label: 'Inventory', // Changed from Inventory Models
        icon: Warehouse, // Changed from FolderKanban
        isInitiallyOpen: false, 
        subItems: [
          {
            href: '/inventory',
            label: 'All Products',
            icon: Package, // Consistent icon
            isActive: (pathname) => pathname === '/inventory' || pathname.startsWith('/inventory/') && !pathname.endsWith('/add') && !pathname.endsWith('/history'),
          },
          {
            href: '/inventory/add',
            label: 'Add New Product',
            icon: Package, // Consistent icon (or PlusCircle)
            isActive: (pathname) => pathname === '/inventory/add',
          },
          // Stock History is usually per product, linked from product detail.
          // Global stock log could be a report if needed.
        ],
        isActive: (pathname) => pathname.startsWith('/inventory'),
      },
      {
        label: 'Sales', // Simplified from Sales & Reports
        icon: DollarSign, // Changed from BarChart3
        isInitiallyOpen: false,
        subItems: [
          { href: '/sales/history', label: 'Sales History', icon: HistoryIcon },
          // Future: { href: '/reports/profit-loss', label: 'Profit & Loss', icon: TrendingUp },
        ],
        isActive: (pathname) => pathname.startsWith('/sales') || pathname.startsWith('/reports'),
      },
      {
        label: 'System Settings', 
        icon: Settings,
        href: '/admin/settings', // Points to the specific settings page in admin
        isActive: (pathname) => pathname === '/admin/settings',
      },
      // Removed placeholder "History (General)", "Starred", "Documentation"
    ],
  },
  // Removed "Projects" group
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
      { href: '/admin', label: 'Overview', icon: Home, isActive: (pathname) => pathname === '/admin' && pathname !== '/admin/settings'}, // Ensure settings isn't highlighted
      { href: '/admin/users', label: 'Users', icon: Users, isActive: (pathname) => pathname === '/admin/users' },
      { href: '/admin/products', label: 'Product Catalog', icon: Package, isActive: (pathname) => pathname === '/admin/products' },
      { href: '/admin/categories', label: 'Categories', icon: ListTree, isActive: (pathname) => pathname === '/admin/categories' },
      // System Settings is now a top-level item in "Platform" group.
      // If it should also appear here, it can be duplicated, or the structure rethought.
      // For now, keeping it distinct as per user's image where settings is often top-level or clearly separated.
    ],
    isActive: (pathname) => pathname.startsWith('/admin') && pathname !== '/admin/settings',
  },
];

