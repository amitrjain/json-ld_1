import UserController from '@api/controllers/user';
import { handleMaskingData } from '@api/handlers/handleMaskingData';
import { injectRoleToRequest } from '@api/handlers/injectRoleToRequest';
import { FastifyPluginCallback } from 'fastify';

export const routes: FastifyPluginCallback = (fastify, _, done) => {

  fastify.get(`/`, async function () {
    return { health: 'OK' }
  });

  fastify.post(`/users`, UserController.saveUserInfo);

  fastify.get(
    `/jsonld/users`,
    {
      preHandler: injectRoleToRequest,
      onSend: handleMaskingData
    },
    UserController.getUserJSONLD
  );

  fastify.get(
    `/users`,
    {
      preHandler: injectRoleToRequest,
      onSend: handleMaskingData
    },
    UserController.sendUserInfo
  );

  done();
};

