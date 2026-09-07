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

export type ShippableCoverage = 'Covered' | 'Partial' | 'Blocked';

export interface ShippableItemsRow {
  title: string;
  sku: string;
  orderedQty: number;
  onHandQty: number;
  shippableQty: number;
  shortQty: number;
  coverage: ShippableCoverage;
}

export interface UnmatchedDemandRow {
  sku: string | null;
  title: string;
  orderedQty: number;
  orderCount: number;
}

export type ShippableOrderStatus = 'Shippable' | 'Partial' | 'Blocked' | 'NeedsCheck';

export interface ShippableOrderShortLine {
  title: string;
  sku: string | null;
  orderedQty: number;
  availableQty: number;
}

export interface ShippableOrderRow {
  orderId: string;
  orderNumber: string;
  marketplace: Marketplace;
  isPriority: boolean;
  lineCount: number;
  coveredLineCount: number;
  status: ShippableOrderStatus;
  shortLines: ShippableOrderShortLine[];
}

export interface ShippableItemsResponse {
  rows: ShippableItemsRow[];
  unmatchedDemand: UnmatchedDemandRow[];
  orders: ShippableOrderRow[];
  generatedAt: string;
  openOrderCount: number;
  csvRowCount: number;
  matchedRowCount: number;
  ordersShippable: number;
  ordersPartial: number;
  ordersBlocked: number;
  ordersNeedsCheck: number;
  unitsShippable: number;
}

// --- Admin order lookup (admin-only, hidden feature) ----------------------

/** Which reference list an inventory upload populates. */
export type InventoryKind = 'inStock' | 'purchaseOrders';

/** Per-line-item cross-reference against the reference lists. */
export type InventoryLineStatus = 'InStock' | 'PreOrdered' | 'Unknown';

export interface LookupLineItem {
  title: string;
  quantity: number;
  sku: string | null;
  /** Only set when the order is awaiting shipment. */
  inventoryStatus: InventoryLineStatus | null;
}

export interface LookupDigitalBox {
  orderId: string;
  status: OrderStatus;
  marketplace: Marketplace;
  shipDate: string | null;
  isPriority: boolean;
  notes: string | null;
  parseStatus: ParseStatus;
  summary: string;
  lineItems: LookupLineItem[];
  duplicateCount: number;
}

export interface LookupShipTo {
  name: string | null;
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
}

export interface LookupShipStation {
  orderStatus: string;
  orderDate: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  shipTo: LookupShipTo | null;
  items: LookupLineItem[];
}

export interface LookupResult {
  found: boolean;
  source: 'DigitalBox' | 'ShipStation' | null;
  orderNumber: string;
  digitalBox: LookupDigitalBox | null;
  shipStation: LookupShipStation | null;
  shipStationConfigured: boolean;
  shipStationError: string | null;
}

export interface InventorySnapshot {
  fileName: string;
  rowCount: number;
  uploadedAt: string;
  uploadedBy: string | null;
}

export interface InventoryStatus {
  inStock: InventorySnapshot | null;
  purchaseOrders: InventorySnapshot | null;
}
