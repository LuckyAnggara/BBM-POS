
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
  SlidersHorizontal
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
        label: 'Playground', // Maps to Dashboard
        icon: LayoutDashboard,
        href: '/',
        isActive: (pathname) => pathname === '/',
      },
      {
        label: 'Inventory Models',
        icon: FolderKanban,
        isInitiallyOpen: false,
        subItems: [
          {
            href: '/inventory',
            label: 'All Products',
            icon: Package,
            isActive: (pathname) => pathname === '/inventory' || pathname.startsWith('/inventory/add') || /^\/inventory\/[^/]+(\/edit)?$/.test(pathname),
          },
          // { href: '/inventory/categories-overview', label: 'Categories View', icon: ListTree }, // Example
        ],
        isActive: (pathname) => pathname.startsWith('/inventory'),
      },
      {
        label: 'System Settings', // Maps to Admin Settings
        icon: Settings,
        href: '/admin/settings',
        isActive: (pathname) => pathname === '/admin/settings',
      },
      // Placeholders from image example
      { label: 'History', icon: History, href: '#history-placeholder' },
      { label: 'Starred', icon: Star, href: '#starred-placeholder' },
      { label: 'Documentation', icon: HelpCircle, href: '#docs-placeholder' },
    ],
  },
  {
    groupTitle: 'Projects', // Placeholder group from image
    items: [
      { label: 'Design Engineering', icon: PenTool, href: '#design-placeholder' },
      { label: 'Sales & Marketing', icon: BarChart3, href: '#sales-placeholder' },
      { label: 'Travel', icon: Plane, href: '#travel-placeholder' },
      { label: 'More', icon: MoreHorizontal, href: '#more-projects-placeholder' },
    ],
  },
];

// Standalone items (not under a group title in the new design, but essential for the app)
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
    // isActive for the main Admin Tools item if any of its subItems are active, excluding settings
    isActive: (pathname) => pathname.startsWith('/admin') && pathname !== '/admin/settings',
  },
];
