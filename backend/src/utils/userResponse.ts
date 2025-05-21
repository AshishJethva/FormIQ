import { IUser } from '../models/User';

export const createAuthResponse = (user: IUser) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
};
