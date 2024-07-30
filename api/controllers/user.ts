// Import necessary modules and types.
import { UserBody } from "@api/routes/schema";
import { context } from "@api/utils/context";
import { FastifyReply, FastifyRequest } from "fastify";
import * as jsonld from 'jsonld';

// Define the UserController class.
class UserController {
  // Singleton instance of UserController.
  private static instance: UserController;
  // Array to store user information.
  private userInfo: UserBody[] = [];

  // Singleton pattern to get the instance of UserController.
  public static getInstance(): UserController {
    if (!UserController.instance) {
      UserController.instance = new UserController();
    }
    return UserController.instance;
  }

  // Method to add user info to the array.
  public setUserInfo(userInfo: UserBody): void {
    this.userInfo.push(userInfo);
  }

  // Method to get the number of users stored.
  public getUserInfoLength(): number {
    return this.userInfo.length;
  }

  // Method to retrieve all user information.
  public getUserInfo(): UserBody[] {
    return this.userInfo;
  }

  // Private method to compact user info using JSON-LD context.
  private async compactWithContext(user: UserBody) {
    return await jsonld.compact(user, context["@context"]);
  }

  // Static method to save user info from a Fastify request.
  public static async saveUserInfo(request: FastifyRequest<{ Body: UserBody }>, reply: FastifyReply) {
    // Extract user data from the request body.
    const { first_name, last_name, phone_no, ssn, card_no, cvv_no, expiry_date } = request.body;

    // Create a new user object with JSON-LD context.
    const user: UserBody = {
      "@context": context["@context"],
      "first_name": first_name,
      "last_name": last_name,
      "phone_no": phone_no,
      "ssn": ssn,
      "cardNumber": card_no,
      "cvvNumber": cvv_no,
      "expiryDate": expiry_date
    };

    // Get the singleton instance and add user to the store.
    const instance = UserController.getInstance();
    user.id = instance.getUserInfoLength() + 1;
    instance.setUserInfo(user);

    // Compact the user data using JSON-LD and send the response.
    const data = await instance.compactWithContext(user);
    reply.send({
      success: true,
      data
    });
  }

  // Static method to get all user info in JSON-LD format and include the context.
  public static async getUserJSONLD(_: FastifyRequest, reply: FastifyReply) {
    const instance = UserController.getInstance();
    const users = await Promise.all(instance.getUserInfo().map(contact => instance.compactWithContext(contact)));
    return {
      success: true,
      data: users,
      showContext: true
    };
  }

  // Static method to get all user info in JSON-LD format without the context.
  public static async sendUserInfo(_: FastifyRequest, reply: FastifyReply) {
    const instance = UserController.getInstance();
    const users = await Promise.all(instance.getUserInfo().map(contact => instance.compactWithContext(contact)));
    return {
      success: true,
      data: users,
      showContext: false
    };
  }
}

// Export the UserController to make it available for use elsewhere.
export default UserController;
