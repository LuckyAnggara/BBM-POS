
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
  Plus,
  History as HistoryIcon,
  FileText,
  ReceiptText, 
  WalletCards, 
  ClipboardList, // Added for Shift History
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
        href: '/dashboard', // Changed from '/'
        isActive: (pathname) => pathname === '/dashboard', // Changed from '/'
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
        label: 'Expenses', 
        icon: ReceiptText,
        isInitiallyOpen: false,
        subItems: [
          { href: '/expenses', label: 'Expense Log', icon: HistoryIcon },
          { href: '/expenses/add', label: 'Add New Expense', icon: Plus }, 
        ],
        isActive: (pathname) => pathname.startsWith('/expenses'),
      },
      {
        label: 'Reports',
        icon: BarChart3,
        isInitiallyOpen: false,
        subItems: [
          { href: '/reports/income-statement', label: 'Income Statement', icon: FileText },
          { href: '/reports/shift-history', label: 'Shift History', icon: ClipboardList },
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
      { href: '/admin/categories', label: 'Product Categories', icon: ListTree, isActive: (pathname) => pathname === '/admin/categories' },
      { href: '/admin/expenses/categories', label: 'Expense Categories', icon: WalletCards, isActive: (pathname) => pathname === '/admin/expenses/categories' },
    ],
    isActive: (pathname) => pathname.startsWith('/admin') && pathname !== '/admin/settings',
  },
];

// Helper icon for PlusCircle if not imported above
const PlusCircle = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);
