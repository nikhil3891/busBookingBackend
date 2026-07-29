import { User, IUser } from '../user/user.model';

export class AdminRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async save(user: IUser): Promise<IUser> {
    return user.save();
  }
}

export const adminRepository = new AdminRepository();
