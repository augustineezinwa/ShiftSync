import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { env } from "@/env";
import { Role } from "@/lib/mock-data";

class UserController {

  /**
   * Login a user with email and password
   * @param email - The email of the user
   * @param password - The password of the user
   * @returns The user if found, otherwise null
   */
  static async loginUser(email: string, password: string) {
    const user = await db.query.users.findFirst({
      where: { email },
    });
    if (!user) return null;
    const isPasswordValid = await this.isPasswordValid(password, user.password);
    if (!isPasswordValid) return null;
    const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, { expiresIn: "1h" });
    return { user, token };
  }

  /**
   * Create a new user
   * @param email - The email of the user
   * @param password - The password of the user
   * @returns The user if created, otherwise null
   */
  static async createUser(name: string, email: string, password: string, role: Role) {
    const user = await db.query.users.findFirst({
      where: { email },
    });
    if (user) return user;
    const newUser = await db.insert(users).values({ name, email, password, role }).returning();
    return newUser[0];
  }

  /**
   * Compare a password with a hashed password
   * @param password - The password to compare
   * @param hashedPassword - The hashed password to compare
   * @returns True if the password is valid, otherwise false
   */
  static async isPasswordValid(password: string, hashedPassword: string) {
    return await bcrypt.compare(password, hashedPassword);
  }


  static async getUser(id: number) {
    return await db.query.users.findFirst({
      with: {
        skills: true,
        locations: true,
        setting: true,
        availabilities: true,
      },
      where: { id },
    });
  }
}

export default UserController;
