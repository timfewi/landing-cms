import { Model } from "./base-types";

export interface User extends Model {
  email: string;
  firstName: string;
  lastName: string;
  role: string
}
