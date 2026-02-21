import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { FindUserDto } from './dto/find-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email already exists');
    }

    return this.prisma.user.create({
      data: dto,
    });
  }

  findAll(query: FindUserDto) {
    const { name, email } = query;

    return this.prisma.user.findMany({
      where: {
        isActive: true, // 🔥 key line
        AND: [
          name ? { name: { contains: name, mode: 'insensitive' } } : {},
          email ? { email: { contains: email, mode: 'insensitive' } } : {},
        ],
      },
    });
  }

  async findOne(id: string) {
    // const user = await this.prisma.user.findUnique({
    //   where: { id },
    // });

    const user = await this.prisma.user.findFirst({
      where: {
        id: id,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const user = await this.findOne(id);

    if (!user.isActive) {
      throw new BadRequestException('User already deleted');
    }

    const activeLoansCount = await this.prisma.loan.count({
      where: {
        userId: id,
        returnedAt: null,
      },
    });

    if (activeLoansCount > 0) {
      throw new BadRequestException(
        'User cannot be deleted: active loans exist',
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateProfileImage(userId: string, imagePath: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: imagePath,
      },
    });
  }
}
