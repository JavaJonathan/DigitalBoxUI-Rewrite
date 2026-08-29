export type UserRole = 'User' | 'Admin';

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface LoginResponse {
  token: string;
  /** from the API; the UI relies on the JWT's own expiry, not this field */
  expiresAtUtc: string;
  user: AppUser;
}

/** Shape of `GET /api/auth/me` — identical to {@link AppUser}. */
export type MeResponse = AppUser;

export interface AdminUserListItem {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface GeneratedPasswordResponse {
  user: AdminUserListItem;
  generatedPassword: string;
}

export type Marketplace = 'Unknown' | 'Amazon' | 'Ebay' | 'Walmart' | 'Shopify';
export type OrderStatus = 'Open' | 'Shipped' | 'Cancelled';
export type ParseStatus = 'Parsed' | 'NeedsReview' | 'Failed';

export const MARKETPLACES: Marketplace[] = ['Amazon', 'Ebay', 'Walmart', 'Shopify', 'Unknown'];

export interface LineItem {
  id: string;
  title: string;
  quantity: number;
  sku: string | null;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  marketplace: Marketplace;
  shipDate: string | null;
  status: OrderStatus;
  parseStatus: ParseStatus;
  lineItemCount: number;
  totalQuantity: number;
  firstItemTitle: string | null;
  isPriority: boolean;
  notes: string | null;
  actionedBy: string | null;
  createdAt: string;
  shippedAt: string | null;
  cancelledAt: string | null;
}

export interface OrderEvent {
  type: string;
  actor: string | null;
  detail: string | null;
  occurredAt: string;
}

export interface OrderDetail extends OrderListItem {
  lineItems: LineItem[];
  /** from the API; the slip is fetched separately via fetchPackingSlipObjectUrl */
  packingSlip: { id: string; fileName: string; byteSize: number };
  events: OrderEvent[];
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface UploadFileResult {
  fileName: string;
  outcome: 'created' | 'duplicate' | 'error';
  orderId: string | null;
  orderNumber: string | null;
  parseStatus: ParseStatus | null;
  message: string | null;
}

export interface UploadResponse {
  created: number;
  duplicates: number;
  errors: number;
  files: UploadFileResult[];
}

export interface ActionResult {
  /** from the API; the UI shows `message` and refetches rather than reading these */
  updated: number;
  skippedIds: string[];
  message: string;
}

export interface UpdateOrderPayload {
  orderNumber: string;
  marketplace: Marketplace;
  shipDate: string | null;
  lineItems: { title: string; quantity: number; sku?: string | null }[];
}

export interface OrderQuery {
  q?: string;
  marketplace?: Marketplace | '';
  priority?: boolean;
  status: OrderStatus;
  sort?: 'shipDate' | 'title';
  page?: number;
  pageSize?: number;
}

export interface ShippableItemsRow {
  title: string;
  sku: string;
  orderedQty: number;
  onHandQty: number;
  shippableQty: number;
}

export interface ShippableItemsResponse {
  rows: ShippableItemsRow[];
  generatedAt: string;
  openOrderCount: number;
  csvRowCount: number;
  matchedRowCount: number;
}
