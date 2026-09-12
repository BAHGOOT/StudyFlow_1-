import { createRouteHandler } from 'uploadthing/server';
import { uploadRouter } from '../../../../server/uploadthing';

const handler = createRouteHandler({
  router: uploadRouter,
  config: {
    token: process.env.UPLOADTHING_TOKEN,
  },
});

export const GET = (req: Request) => (typeof handler === 'function' ? handler(req) : (handler as any).GET(req));
export const POST = (req: Request) => (typeof handler === 'function' ? handler(req) : (handler as any).POST(req));

