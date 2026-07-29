import {
  createLocalCatalogCategoryInputSchema,
  createLocalCatalogItemInputSchema,
  createLocalComboGroupInputSchema,
  createLocalComboGroupItemInputSchema,
  createLocalComboRuleInputSchema,
  localCatalogCategorySchema,
  localCatalogItemSchema,
  localComboRuleGroupItemSchema,
  localComboRuleGroupSchema,
  localComboRuleSchema,
  localPosRoutes,
  updateLocalCatalogCategoryInputSchema,
  updateLocalCatalogItemInputSchema,
  updateLocalComboGroupInputSchema,
  updateLocalComboGroupItemInputSchema,
  updateLocalComboRuleInputSchema,
} from '@yuta/contracts/local-pos';
import { readJsonBody, sendJson } from '../http';
import { requireLocalManagementSession } from './auth';
import type { RouteHandler } from './types';

export const handleCatalogRoute: RouteHandler = async ({
  request,
  response,
  url,
  service,
}) => {
  if (request.method === 'GET' && url.pathname === localPosRoutes.catalog) {
    sendJson(response, 200, await service.getCatalog());
    return true;
  }

  if (
    request.method === 'POST' &&
    url.pathname === localPosRoutes.catalogCategories
  ) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const input = await readJsonBody(
      request,
      createLocalCatalogCategoryInputSchema,
    );
    sendJson(response, 201, await service.createCatalogCategory(input));
    return true;
  }

  const categoryMatch = new RegExp(
    `^${localPosRoutes.catalogCategories}/([^/]+)$`,
  ).exec(url.pathname);
  if (request.method === 'PATCH' && categoryMatch) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const categoryId = localCatalogCategorySchema.shape.id.parse(
      categoryMatch[1],
    );
    const input = await readJsonBody(
      request,
      updateLocalCatalogCategoryInputSchema,
    );
    sendJson(
      response,
      200,
      await service.updateCatalogCategory(categoryId, input),
    );
    return true;
  }

  if (
    request.method === 'POST' &&
    url.pathname === localPosRoutes.catalogItems
  ) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const input = await readJsonBody(
      request,
      createLocalCatalogItemInputSchema,
    );
    sendJson(response, 201, await service.createCatalogItem(input));
    return true;
  }

  const itemMatch = new RegExp(`^${localPosRoutes.catalogItems}/([^/]+)$`).exec(
    url.pathname,
  );
  if (request.method === 'PATCH' && itemMatch) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const itemId = localCatalogItemSchema.shape.id.parse(itemMatch[1]);
    const input = await readJsonBody(
      request,
      updateLocalCatalogItemInputSchema,
    );
    sendJson(response, 200, await service.updateCatalogItem(itemId, input));
    return true;
  }

  if (request.method === 'POST' && url.pathname === localPosRoutes.comboRules) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const input = await readJsonBody(request, createLocalComboRuleInputSchema);
    sendJson(response, 201, await service.createComboRule(input));
    return true;
  }

  const ruleMatch = new RegExp(`^${localPosRoutes.comboRules}/([^/]+)$`).exec(
    url.pathname,
  );
  if (request.method === 'PATCH' && ruleMatch) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const ruleId = localComboRuleSchema.shape.id.parse(ruleMatch[1]);
    const input = await readJsonBody(request, updateLocalComboRuleInputSchema);
    sendJson(response, 200, await service.updateComboRule(ruleId, input));
    return true;
  }

  if (
    request.method === 'POST' &&
    url.pathname === localPosRoutes.comboRuleGroups
  ) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const input = await readJsonBody(request, createLocalComboGroupInputSchema);
    sendJson(response, 201, await service.createComboGroup(input));
    return true;
  }

  const groupMatch = new RegExp(
    `^${localPosRoutes.comboRuleGroups}/([^/]+)$`,
  ).exec(url.pathname);
  if (groupMatch && ['PATCH', 'DELETE'].includes(request.method ?? '')) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const groupId = localComboRuleGroupSchema.shape.id.parse(groupMatch[1]);
    if (request.method === 'DELETE') {
      sendJson(response, 200, await service.deleteComboGroup(groupId));
      return true;
    }
    const input = await readJsonBody(request, updateLocalComboGroupInputSchema);
    sendJson(response, 200, await service.updateComboGroup(groupId, input));
    return true;
  }

  if (
    request.method === 'POST' &&
    url.pathname === localPosRoutes.comboRuleGroupItems
  ) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const input = await readJsonBody(
      request,
      createLocalComboGroupItemInputSchema,
    );
    sendJson(response, 201, await service.createComboGroupItem(input));
    return true;
  }

  const groupItemMatch = new RegExp(
    `^${localPosRoutes.comboRuleGroupItems}/([^/]+)$`,
  ).exec(url.pathname);
  if (groupItemMatch && ['PATCH', 'DELETE'].includes(request.method ?? '')) {
    await requireLocalManagementSession(request.headers.authorization, service);
    const groupItemId = localComboRuleGroupItemSchema.shape.id.parse(
      groupItemMatch[1],
    );
    if (request.method === 'DELETE') {
      sendJson(response, 200, await service.deleteComboGroupItem(groupItemId));
      return true;
    }
    const input = await readJsonBody(
      request,
      updateLocalComboGroupItemInputSchema,
    );
    sendJson(
      response,
      200,
      await service.updateComboGroupItem(groupItemId, input),
    );
    return true;
  }

  return false;
};
