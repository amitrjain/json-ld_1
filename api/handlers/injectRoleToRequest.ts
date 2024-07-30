import { FastifyReply, FastifyRequest } from "fastify";

export const injectRoleToRequest = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const authHeader = request.headers['user-role'];

  if (!authHeader) {
    reply.status(401).send({ error: 'Unauthorized' });
    return;
  }

  request.role = authHeader as string;

};