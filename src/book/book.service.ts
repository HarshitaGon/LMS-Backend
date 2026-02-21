import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBookDto } from './dto/search-book.dto';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateBookDto) {
    return this.prisma.book.create({
      data: dto,
    });
  }

  findAll(search: SearchBookDto) {
    const { title, isbn } = search;

    return this.prisma.book.findMany({
      where: {
        AND: [
          title ? { title: { contains: title, mode: 'insensitive' } } : {},
          isbn ? { isbn: { contains: isbn } } : {},
        ],
      },
    });
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findUnique({
      where: { id },
    });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    return book;
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.findOne(id);

    return this.prisma.book.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const activeLoans = await this.prisma.loan.count({
      where: { bookId: id },
    });

    if (activeLoans > 0) {
      throw new BadRequestException(
        'Cannot delete book: book is currently issued',
      );
    }

    return this.prisma.book.delete({
      where: { id },
    });
  }
}
