import { UserBody } from "@api/routes/schema";
import { context } from "@api/utils/context";
import { FastifyReply, FastifyRequest } from "fastify";
import * as jsonld from 'jsonld';

class UserController {

  private static instance: UserController;
  private userInfo: UserBody[] = [];

  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    } UserController
    return UserController.instance;
  }

  public setUserInfo(userInfo: UserBody): void {
    this.userInfo.push(userInfo);
  }

  public getUserInfoLength(): number {
    return this.userInfo.length;
  }

  public getUserInfo(): UserBody[] {
    return this.userInfo;
  }

  private async compactWithContext(user: UserBody) {
    return await jsonld.compact(user, context["@context"]);
  }

  public static async saveUserInfo(request: FastifyRequest<{ Body: UserBody }>, reply: FastifyReply) {
    const { first_name, last_name, phone_no, ssn, cardNumber, cvvNumber, expiryDate } = request.body;

    const user: UserBody = {
      "@context": context["@context"],
      "first_name": first_name,
      "last_name": last_name,
      "phone_no": phone_no,
      "ssn": ssn,
      "cardNumber": cardNumber,
      "cvvNumber": cvvNumber,
      "expiryDate": expiryDate
    };

    const instance = UserController.getInstance();

    user.id = instance.getUserInfoLength() + 1;
    instance.setUserInfo(user);

    const data = await instance.compactWithContext(user);

    reply.send({
      success: true,
      data
    })
  }

  public static async getUserJSONLD(_: FastifyRequest, reply: FastifyReply) {

    const instance = UserController.getInstance();

    const users = await Promise.all(instance.getUserInfo().map(contact => instance.compactWithContext(contact)));

    return {
      success: true,
      data: users,
      showContext: true
    }
  }

  public static async sendUserInfo(_: FastifyRequest, reply: FastifyReply) {

    const instance = UserController.getInstance();

    const users = await Promise.all(instance.getUserInfo().map(contact => instance.compactWithContext(contact)));

    return {
      success: true,
      data: users,
      showContext: false
    }
  }
}

export default UserController;