export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Tenant {
  id: string;
  name: string;
  role: "owner" | "admin" | "editor" | "viewer" | "customer";
}

export interface CustomerDesignerOptions {
  productColors: boolean;
  printTextColors: boolean;
  text: boolean;
  artwork: boolean;
  sides: boolean;
  transform: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "processing" | "ready" | "published" | "sync_error" | "archived";
  providerCode: string | null;
  externalProductId: string | null;
  fulfillmentMode: "in_house" | "printful";
  productType: string;
  designConfig: {
    color: string;
    text: string;
    textColor: string;
    textColorOptions?: string[];
    customerDesignerOptions?: Partial<CustomerDesignerOptions>;
    defaultProductColor?: string;
    scale: number;
    x: number;
    y: number;
    rotation: number;
    side: "front" | "back";
    labelShape?: "rectangle" | "rounded" | "circle" | "oval";
    garmentLabelEnabled?: boolean;
    garmentLabelText?: string;
    garmentLabelUsesArtwork?: boolean;
  } | null;
  productionMethod: string | null;
  productionMinutes: number | null;
  manufacturingNotes: string | null;
  artworkUrl: string | null;
  artworkAsset?: { id: string } | null;
  baseCost: number;
  salePrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
  variants?: Array<{ id: string; sku: string | null; name: string; size: string | null; color: string | null; providerCost: number; salePrice: number; currency: string }>;
}

export type OrderStatus =
  | "received"
  | "validation_pending"
  | "awaiting_approval"
  | "submitted"
  | "accepted"
  | "in_production"
  | "shipped"
  | "delivered"
  | "cancel_requested"
  | "cancelled"
  | "failed"
  | "action_required";

export interface OrderItem {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitSalePrice: number;
  unitProviderCost: number | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeName: string;
  customerName: string;
  customerEmail: string | null;
  customerUserId: string | null;
  customer: { id: string; name: string; email: string } | null;
  customerTotal: number;
  providerTotal: number | null;
  shippingTotal: number;
  shippingAddress: {
    recipient: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  currency: string;
  status: OrderStatus;
  paymentStatus: "not_required" | "pending" | "paid" | "failed" | "refunded";
  createdAt: string;
  shipments?: Array<{
    id: string;
    carrier: string;
    trackingNumber: string | null;
    packageTrackingNumbers: string[];
    trackingUrl: string | null;
    status: string;
    trackingStatus: string | null;
    shippedAt: string;
    deliveredAt: string | null;
    labelCount: number;
    labelUrls: string[];
  }>;
  items: Array<OrderItem & {
    variantName: string | null;
    unitSalePrice: number;
    unitProviderCost: number | null;
    designConfig: ({
      color?: string;
      text?: string;
      textColor?: string;
      scale?: number;
      x?: number;
      y?: number;
      rotation?: number;
      side?: "front" | "back";
      labelShape?: "rectangle" | "rounded" | "circle" | "oval";
      garmentLabelEnabled?: boolean;
      garmentLabelText?: string;
      garmentLabelUsesArtwork?: boolean;
      options?: Record<string, string>;
      artworkSides?: Partial<Record<"front" | "back", string>>;
      design?: {
        text: string;
        textColor: string;
        sides: Record<"front" | "back", { artwork: boolean; positionX: number; positionY: number; scale: number; rotation?: number }>;
      };
    } | null);
    printInstructions: string | null;
    artworkUrl: string | null;
    artworkSides?: Partial<Record<"front" | "back", string>>;
  }>;
}

export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";
export type SupportTicketStatus = "open" | "in_progress" | "waiting_customer" | "resolved" | "closed";

export interface SupportTicketComment {
  id: string;
  authorUserId: string | null;
  authorName: string;
  authorRole: Tenant["role"] | null;
  activityType: "created" | "comment" | "status_changed" | "priority_changed";
  previousStatus: SupportTicketStatus | null;
  newStatus: SupportTicketStatus | null;
  previousPriority: SupportTicketPriority | null;
  newPriority: SupportTicketPriority | null;
  body: string;
  createdAt: string;
}

export interface ProductionJobSummary {
  id: string;
  code: string;
  status: string;
  productionMethod: string | null;
}

export interface SupportTicket {
  id: string;
  orderId: string | null;
  productionJobId: string | null;
  orderNumber: string | null;
  customerName: string;
  subject: string;
  description: string;
  priority: SupportTicketPriority;
  status: SupportTicketStatus;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    orderNumber: string;
    customerName: string;
    status: OrderStatus;
    createdAt: string;
  } | null;
  productionJob: ProductionJobSummary | null;
  comments: SupportTicketComment[];
  hasMoreComments?: boolean;
}

export interface SupportSlaMetrics {
  total: number;
  active: number;
  resolved: number;
  responseTargetHours: number;
  resolutionTargetHours: number;
  responseSlaEligible: number;
  responseSlaMet: number;
  responseSlaPercent: number | null;
  resolutionSlaEligible: number;
  resolutionSlaMet: number;
  resolutionSlaPercent: number | null;
  averageFirstResponseMinutes: number | null;
  averageResolutionMinutes: number | null;
  responseSlaBreaches: number;
  resolutionSlaBreaches: number;
  days: number;
  from: string;
  daily: Array<{ date: string; created: number; resolved: number }>;
}

export interface PrintfulProduct {
  externalId: string;
  name: string;
  type: string | null;
  imageUrl: string | null;
  variantCount: number | null;
  description: string | null;
  providerCode: string;
  baseCost?: number;
  salePrice?: number;
  currency?: string;
}
