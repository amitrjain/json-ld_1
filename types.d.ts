import 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    role?: string; // Optional to handle cases where it's not set
  }
}
