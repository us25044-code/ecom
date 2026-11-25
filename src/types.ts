export type ProductCategory = 'boys' | 'girls' | 'pe';

export interface ProductImage {
  id: string;
  url: string;
  label: string;
}

export interface ProductSizeStock {
  sizeLabel: string;
  footLengthCm: number;
  stockQty: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  category: ProductCategory;
  color: string;
  price: number;
  originalPrice: number | null;
  shortDescription: string;
  description: string;
  materialsConstruction: string;
  adaptiveFitMechanism: string;
  careInstructions: string;
  shippingReturnsSummary: string;
  features: string[];
  images: ProductImage[];
  sizes: ProductSizeStock[];
  isActive: boolean;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  color: string;
  sizeLabel: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
}

export interface Review {
  id: string;
  productId: string;
  productName: string;
  authorName: string;
  city: string;
  rating: number;
  comment: string;
  isSample: boolean;
  status: 'published' | 'hidden';
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'flat' | 'percent';
  discountValue: number;
  minOrderAmount: number;
  isActive: boolean;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sizeLabel: string;
  unitPrice: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cod_pending';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  state: string;
  pinCode: string;
  deliveryOption: 'standard';
  estimatedDelivery: string;
  subtotal: number;
  shippingCharge: number;
  discountCode: string | null;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'razorpay' | 'cod';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  isTestTransaction?: boolean;
  items: OrderItem[];
  createdAt: string;
}

export interface ReturnRequest {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  requestType: 'return_reward' | 'size_exchange' | 'damaged_return';
  reason: string;
  status: 'requested' | 'approved' | 'pickup_scheduled' | 'completed' | 'rejected';
  rewardCreditInr: number | null;
  createdAt: string;
}

export interface CustomerSummary {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  orderCount: number;
}

export interface SiteConfig {
  heroHeadline: string;
  heroSubheading: string;
  announcementText: string;
  shippingFlatRate: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  codFee: number;
  estimatedDeliveryWindow: string;
  returnRewardMinInr: number;
  returnRewardMaxInr: number;
  returnRewardPartnerStatus: string;
  returnWindowDaysConfigurable: string;
  returnPolicyNote: string;
  supportEmail: string;
  supportPhone: string;
  instagramHandle: string;
  businessAddress: string;
  sizeChartNote: string;
}

export interface StorefrontPayload {
  products: Product[];
  reviews: Review[];
  config: SiteConfig;
  razorpayConfigured: boolean;
  razorpayKeyId: string | null;
}
