/** Today's takings, as reported by the mock analytics API. */
export interface SalesSummary {
  totalToday: number;
  ordersToday: number;
}

export interface ActiveUsersPoint {
  /** Epoch ms of the sample. */
  at: number;
  count: number;
}

export type OrderStatus = 'paid' | 'shipped' | 'refunded';

export interface Order {
  id: string;
  customer: string;
  amount: number;
  status: OrderStatus;
  placedAt: number;
}

/** Wire shape of `GET /api/dashboard`. */
export interface DashboardResponse {
  /** Epoch ms when the server took this snapshot; newer snapshots have larger values. */
  generatedAt: number;
  sales: SalesSummary;
  /** Rolling series of the most recent samples, oldest first. */
  activeUsers: ActiveUsersPoint[];
  /** Newest first. */
  recentOrders: Order[];
}
