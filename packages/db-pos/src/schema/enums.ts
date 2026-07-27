import { pgEnum } from 'drizzle-orm/pg-core';

export const localUserRoleEnum = pgEnum('local_user_role', [
  'admin',
  'manager',
  'staff',
  'kitchen',
]);
export const kitchenStationEnum = pgEnum('kitchen_station', [
  'kitchen',
  'bar',
  'dessert',
  'none',
]);
export const orderTypeEnum = pgEnum('order_type', [
  'dine_in',
  'takeaway',
  'delivery',
]);
export const orderStatusEnum = pgEnum('order_status', [
  'draft',
  'sent',
  'preparing',
  'ready',
  'served',
  'paid',
  'cancelled',
]);
export const orderItemStatusEnum = pgEnum('order_item_status', [
  'pending',
  'sent',
  'preparing',
  'ready',
  'served',
  'cancelled',
]);
export const paymentModeEnum = pgEnum('payment_mode', [
  'single',
  'split_by_items',
  'split_equally',
]);
export const checkSplitModeEnum = pgEnum('check_split_mode', [
  'items',
  'equal',
]);
export const checkStatusEnum = pgEnum('check_status', ['open', 'paid', 'void']);
export const paymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'ticket_resto',
  'other',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'paid',
  'failed',
  'refunded',
]);
export const printJobSourceEnum = pgEnum('print_job_source', [
  'pos',
  'kitchen',
  'delivery',
  'manual',
]);
export const printJobTypeEnum = pgEnum('print_job_type', [
  'kitchen_ticket',
  'customer_receipt',
  'test',
]);
export const printJobStatusEnum = pgEnum('print_job_status', [
  'pending',
  'printing',
  'printed',
  'failed',
]);
export const comboPricingModeEnum = pgEnum('combo_pricing_mode', [
  'fixed',
  'base_item_plus_delta',
]);
export const allergySeverityEnum = pgEnum('allergy_severity', [
  'intolerance',
  'allergy',
  'severe_no_traces',
]);
