import type {
  LocalCatalogResponse,
  LocalOrderSummary,
} from '@yuta/contracts/local-pos';
import { siteAgentClient } from './site-agent-client';

type IsoOrder = LocalOrderSummary;
type IsoOrderDetail = Awaited<
  ReturnType<typeof siteAgentClient.getOrderDetail>
>;
type IsoOrderItem = IsoOrderDetail['items'][number];

export type PosOrder = Omit<
  IsoOrder,
  | 'createdAt'
  | 'updatedAt'
  | 'sentAt'
  | 'paidAt'
  | 'cancelledAt'
  | 'allergyAcknowledgedAt'
> & {
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  allergyAcknowledgedAt: Date | null;
};

export type PosOrderItem = Omit<
  IsoOrderItem,
  | 'createdAt'
  | 'updatedAt'
  | 'sentAt'
  | 'readyAt'
  | 'servedAt'
  | 'cancelledAt'
  | 'allergyAcknowledgedAt'
  | 'allergyKitchenConfirmedAt'
> & {
  createdAt: Date;
  updatedAt: Date;
  sentAt: Date | null;
  readyAt: Date | null;
  servedAt: Date | null;
  cancelledAt: Date | null;
  allergyAcknowledgedAt: Date | null;
  allergyKitchenConfirmedAt: Date | null;
};

export type PosOrderDetail = {
  order: PosOrder;
  items: PosOrderItem[];
  discounts: IsoOrderDetail['discounts'];
};

export const posApi = {
  listLocalUsers: () => siteAgentClient.listLocalUsers(),
  getCatalog: (): Promise<LocalCatalogResponse> => siteAgentClient.getCatalog(),
  createOrder: siteAgentClient.createOrder,
  addOrderItem: siteAgentClient.addOrderItem,
  updateOrderItem: siteAgentClient.updateOrderItem,
  executeOrderItemCommand: siteAgentClient.executeOrderItemCommand,
  executeOrderCommand: siteAgentClient.executeOrderCommand,
  splitOrderEqually: siteAgentClient.splitOrderEqually,
  createChecksByItems: siteAgentClient.createChecksByItems,
  cancelOrderSplit: siteAgentClient.cancelOrderSplit,
  payOrder: siteAgentClient.payOrder,
  payCheck: siteAgentClient.payCheck,

  async getOrderDetail(orderId: string): Promise<PosOrderDetail> {
    const detail = await siteAgentClient.getOrderDetail(orderId);
    return {
      order: hydrateOrder(detail.order),
      items: detail.items.map(hydrateOrderItem),
      discounts: detail.discounts,
    };
  },

  async listOrderDetails(limit = 200): Promise<PosOrderDetail[]> {
    const { orders } = await siteAgentClient.listOrders({ limit });
    return Promise.all(orders.map(({ id }) => posApi.getOrderDetail(id)));
  },

  async getPaymentViewData(orderId: string) {
    const [summary, catalog] = await Promise.all([
      siteAgentClient.getPaymentSummary(orderId),
      siteAgentClient.getCatalog(),
    ]);
    const detail = await posApi.getOrderDetail(orderId);
    return {
      order: {
        ...detail.order,
        items: detail.items,
        discounts: detail.discounts,
        checks: summary.checks,
        payments: summary.payments,
      },
      activeComboRules: catalog.comboRules.filter((rule) => rule.isActive),
      catalog,
      paidCents: summary.paidCents,
      remainingCents: summary.remainingCents,
    };
  },
};

function hydrateOrder(order: IsoOrder): PosOrder {
  return {
    ...order,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
    sentAt: toNullableDate(order.sentAt),
    paidAt: toNullableDate(order.paidAt),
    cancelledAt: toNullableDate(order.cancelledAt),
    allergyAcknowledgedAt: toNullableDate(order.allergyAcknowledgedAt),
  };
}

function hydrateOrderItem(item: IsoOrderItem): PosOrderItem {
  return {
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
    sentAt: toNullableDate(item.sentAt),
    readyAt: toNullableDate(item.readyAt),
    servedAt: toNullableDate(item.servedAt),
    cancelledAt: toNullableDate(item.cancelledAt),
    allergyAcknowledgedAt: toNullableDate(item.allergyAcknowledgedAt),
    allergyKitchenConfirmedAt: toNullableDate(item.allergyKitchenConfirmedAt),
  };
}

function toNullableDate(value: string | null): Date | null {
  return value ? new Date(value) : null;
}
