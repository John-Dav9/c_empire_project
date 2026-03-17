import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../auth/enums/user-role.enum';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getAllUsers(
    page: number = 1,
    limit: number = 10,
    search?: string,
    role?: UserRole,
    isActive?: boolean,
  ) {
    const query = this.userRepository.createQueryBuilder('user');

    if (search) {
      query.andWhere(
        '(user.email ILIKE :search OR user.firstname ILIKE :search OR user.lastname ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (role) {
      query.andWhere('user.role = :role', { role });
    }

    if (isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive });
    }

    query
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await query.getManyAndCount();

    return {
      data: users.map((user) => {
        const {
          password,
          resetPasswordToken,
          resetPasswordExpires,
          refreshTokenHash,
          ...userWithoutSensitiveData
        } = user;
        return userWithoutSensitiveData;
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      refreshTokenHash,
      ...userWithoutSensitiveData
    } = user;
    return userWithoutSensitiveData;
  }

  async updateUserRole(userId: string, newRole: UserRole, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Empêcher un admin de se modifier lui-même
    if (userId === adminId) {
      throw new BadRequestException('You cannot change your own role');
    }

    // Empêcher de modifier le SUPER_ADMIN initial
    if (
      user.email === 'admin@cempire.com' &&
      user.role === UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException('Cannot modify the main super admin');
    }

    user.role = newRole;
    await this.userRepository.save(user);

    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      refreshTokenHash,
      ...userWithoutSensitiveData
    } = user;
    return userWithoutSensitiveData;
  }

  async toggleUserStatus(userId: string, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Empêcher un admin de se désactiver lui-même
    if (userId === adminId) {
      throw new BadRequestException('You cannot deactivate yourself');
    }

    // Empêcher de désactiver le SUPER_ADMIN initial
    if (
      user.email === 'admin@cempire.com' &&
      user.role === UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException('Cannot deactivate the main super admin');
    }

    user.isActive = !user.isActive;
    await this.userRepository.save(user);

    const {
      password,
      resetPasswordToken,
      resetPasswordExpires,
      refreshTokenHash,
      ...userWithoutSensitiveData
    } = user;
    return userWithoutSensitiveData;
  }

  async deleteUser(userId: string, adminId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Empêcher un admin de se supprimer lui-même
    if (userId === adminId) {
      throw new BadRequestException('You cannot delete yourself');
    }

    // Empêcher de supprimer le SUPER_ADMIN initial
    if (
      user.email === 'admin@cempire.com' &&
      user.role === UserRole.SUPER_ADMIN
    ) {
      throw new BadRequestException('Cannot delete the main super admin');
    }

    await this.userRepository.remove(user);
    return { message: 'User deleted successfully' };
  }

  async getStats() {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({
      where: { isActive: true },
    });
    const inactiveUsers = totalUsers - activeUsers;

    const adminCount = await this.userRepository.count({
      where: { role: UserRole.ADMIN },
    });
    const superAdminCount = await this.userRepository.count({
      where: { role: UserRole.SUPER_ADMIN },
    });
    const employeeCount = await this.userRepository.count({
      where: { role: UserRole.EMPLOYEE },
    });
    const clientCount = await this.userRepository.count({
      where: { role: UserRole.CLIENT },
    });

    // Nouveaux utilisateurs ce mois
    const firstDayOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1,
    );
    const newUsersThisMonth = await this.userRepository
      .createQueryBuilder('user')
      .where('user.createdAt >= :firstDay', { firstDay: firstDayOfMonth })
      .getCount();

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      adminCount,
      superAdminCount,
      employeeCount,
      clientCount,
      newUsersThisMonth,
    };
  }
}
