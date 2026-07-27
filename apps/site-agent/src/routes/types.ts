import type { IncomingMessage, ServerResponse } from 'node:http';
import type { SiteAgentService } from '../services/site-agent-service';

export type RouteContext = {
  request: IncomingMessage;
  response: ServerResponse;
  url: URL;
  service: SiteAgentService;
};

export type RouteHandler = (context: RouteContext) => Promise<boolean>;
