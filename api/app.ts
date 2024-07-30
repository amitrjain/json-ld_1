import fastify from "fastify";
import fastifyCors from '@fastify/cors';
import { routes } from "@api/routes";

const app = fastify({
  bodyLimit: 1_000_000,
  trustProxy: true,
  logger: true,
});

app.register(fastifyCors, {
  maxAge: 600,
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", 'x-requested-with', 'user-type'],
  methods: ["GET", "PUT", "POST", "DELETE"],
});

app.register(routes);


export default app;