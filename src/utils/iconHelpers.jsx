// Premium icon utility using Lucide React
import React from 'react';
import {
  Heart,
  ShoppingBasket,
  MapPin,
  Headphones,
  Mail,
  Clock,
  RotateCcw,
  Gift,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Package,
  User,
  Zap,
  Medal,
  Compass,
  Crown,
  Flame,
  Smartphone,
  University,
  Wallet,
  DollarSign,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Minus,
  Check,
  Star,
  Home,
  Apple,
  Carrot,
  Milk,
  Cookie,
  Wine,
  Zap as Lightning,
  Baby,
  Droplet,
  Users,
  Lock,
  Eye,
  EyeOff,
  Search,
  Menu,
  Moon,
  Sun,
  Settings,
  LogIn,
  Truck,
  Calendar,
  MapPinOff,
  Filter,
  Grid,
  List,
  AlertTriangle,
  Info,
  ArrowRight,
  ArrowLeft,
  Download,
  Upload,
  FileText,
  Phone,
  MessageSquare,
  Trash2,
  Edit,
  Copy,
  CheckSquare,
  Square,
  Radio,
  RadioButton,
  Target,
  Smartphone as Mobile,
  Wifi,
  MapPinCheck,
  ThumbsUp,
  Activity,
  BarChart3,
} from 'lucide-react';

// Icon mapping from Font Awesome style to Lucide components
export const lucideIcons = {
  // Heart
  'fa-heart': Heart,
  'far fa-heart': Heart,
  'fas fa-heart': Heart,

  // Cart & Shopping
  'fa-basket-shopping': ShoppingBasket,
  'fa-shopping-basket': ShoppingBasket,
  'fa-shopping-cart': ShoppingBasket,

  // Location
  'fa-location-dot': MapPin,
  'fa-location': MapPin,
  'fa-map-pin': MapPin,

  // Communication
  'fa-headset': Headphones,
  'fa-envelope-open-text': Mail,
  'fa-envelope': Mail,
  'fa-phone': Phone,
  'fa-mobile-alt': Smartphone,
  'fa-mobile': Smartphone,

  // Time & Status
  'fa-clock': Clock,
  'fa-hourglass': Clock,
  'fa-business-time': Clock,
  'fa-check-circle': CheckCircle,
  'fa-check': Check,

  // Money & Payments
  'fa-rotate-left': RotateCcw,
  'fa-undo': RotateCcw,
  'fa-gift': Gift,
  'fa-bell': Bell,
  'fa-credit-card': CreditCard,
  'fa-circle-question': HelpCircle,
  'fa-question-circle': HelpCircle,
  'fa-right-from-bracket': LogOut,
  'fa-sign-out': LogOut,
  'fa-wallet': Wallet,
  'fa-money-bill-wave': DollarSign,
  'fa-university': University,

  // Navigation
  'fa-chevron-down': ChevronDown,
  'fa-chevron-right': ChevronRight,
  'fa-chevron-left': ChevronLeft,
  'fa-arrow-right': ArrowRight,
  'fa-arrow-left': ArrowLeft,
  'fa-times': X,
  'fa-close': X,
  'fa-times-circle': AlertTriangle,

  // Actions
  'fa-plus': Plus,
  'fa-minus': Minus,
  'fa-star': Star,

  // Product Status
  'fa-truck': Truck,
  'fa-truck-loading': Truck,
  'fa-box': Package,
  'fa-box-open': Package,
  'fa-clipboard-check': CheckCircle,

  // User & Account
  'fa-user': User,
  'fa-user-cog': Settings,
  'fa-profile': User,

  // Premium features
  'fa-bolt': Zap,
  'fa-fire-flame-curved': Flame,
  'fa-medal': Medal,
  'fa-compass': Compass,
  'fa-crown': Crown,

  // Theme
  'fa-moon': Moon,
  'fa-sun': Sun,

  // Icons from home page
  'fa-apple-alt': Apple,
  'fa-carrot': Carrot,
  'fa-cheese': Milk,
  'fa-cookie-bite': Cookie,
  'fa-glass-cheers': Wine,
  'fa-baby': Baby,
  'fa-spa': Droplet,
  'fa-female': Users,

  // Form & Misc
  'fa-lock': Lock,
  'fa-eye': Eye,
  'fa-eye-slash': EyeOff,
  'fa-search': Search,
  'fa-menu': Menu,
  'fa-bars': Menu,
  'fa-home': Home,
  'fa-settings': Settings,
  'fa-login': LogIn,

  // Additional
  'fa-file-text': FileText,
  'fa-trash': Trash2,
  'fa-trash-2': Trash2,
  'fa-edit': Edit,
  'fa-pencil': Edit,
  'fa-copy': Copy,
  'fa-check-square': CheckSquare,
  'fa-square': Square,
  'fa-thumbs-up': ThumbsUp,
  'fa-activity': Activity,
  'fa-chart-bar': BarChart3,
};

// Icon component wrapper
export const Icon = ({ name, size = 24, className = '', ...props }) => {
  // If it's a Lucide icon component already, render it
  if (React.isValidElement(name)) {
    return name;
  }

  // Find the icon from lucideIcons map
  const IconComponent = lucideIcons[name] || Heart;

  return (
    <IconComponent
      size={size}
      className={className}
      strokeWidth={2}
      {...props}
    />
  );
};

// Premium icon button component
export const IconButton = ({ 
  icon, 
  onClick, 
  className = '', 
  size = 24, 
  active = false,
  ...props 
}) => {
  const IconComponent = lucideIcons[icon] || Heart;

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center justify-center 
        transition-all duration-200 ease-out
        hover:scale-110 active:scale-95
        rounded-lg
        ${active ? 'bg-red-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
        ${className}
      `}
      {...props}
    >
      <IconComponent size={size} strokeWidth={2} />
    </button>
  );
};

// Get icon name from Font Awesome format
export const getIconComponent = (faIconName) => {
  return lucideIcons[faIconName] || Heart;
};

// Helper to render Lucide icon inline
export const renderIcon = (name, size = 20) => {
  const IconComponent = getIconComponent(name);
  return <IconComponent size={size} strokeWidth={2} />;
};

export default Icon;
