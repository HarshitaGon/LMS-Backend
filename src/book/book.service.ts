// import {
//   BadRequestException,
//   Injectable,
//   NotFoundException,
// } from '@nestjs/common';
// import { PrismaService } from '../prisma/prisma.service';
// import { CreateBookDto } from './dto/create-book.dto';
// import { UpdateBookDto } from './dto/update-book.dto';
// import { SearchBookDto } from './dto/search-book.dto';

// @Injectable()
// export class BooksService {
//   constructor(private readonly prisma: PrismaService) {}

//   async create(dto: CreateBookDto) {
//     return this.prisma.book.create({ data: dto });
//   }

//   async findAll(search: SearchBookDto) {
//     const { title, isbn } = search;

//     return this.prisma.book.findMany({
//       where: {
//         isActive: true,
//         AND: [
//           title ? { title: { contains: title, mode: 'insensitive' } } : {},
//           isbn ? { isbn: { contains: isbn } } : {},
//         ],
//       },
//       orderBy: { title: 'asc' },
//     });
//   }

//   async findOne(id: string) {
//     const book = await this.prisma.book.findFirst({
//       where: { id, isActive: true },
//     });

//     if (!book) {
//       throw new NotFoundException('Book not found');
//     }

//     return book;
//   }

//   async update(id: string, dto: UpdateBookDto) {
//     await this.findOne(id);

//     return this.prisma.book.update({
//       where: { id },
//       data: dto,
//     });
//   }

//   async remove(id: string) {
//     const book = await this.prisma.book.findFirst({
//       where: { id, isActive: true },
//     });

//     if (!book) {
//       throw new NotFoundException('Book not found or already deleted');
//     }

//     const activeLoans = await this.prisma.loan.count({
//       where: { bookId: id, returnedAt: null },
//     });

//     if (activeLoans > 0) {
//       throw new BadRequestException(
//         'Cannot delete book: book is currently issued',
//       );
//     }

//     return this.prisma.book.update({
//       where: { id },
//       data: { isActive: false },
//     });
//   }
// }

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBookDto } from './dto/search-book.dto';
import Fuse from 'fuse.js';

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBookDto) {
    return this.prisma.book.create({ data: dto });
  }

  async findAll(search: SearchBookDto) {
    const { q } = search;

    const books = await this.prisma.book.findMany({
      where: { isActive: true },
      orderBy: { title: 'asc' },
    });

    // if (!q || q.trim().length < 2) {
    //   return books;
    // }

    const fuse = new Fuse(books, {
      keys: ['title', 'isbn'],
      threshold: 0.35,
      ignoreLocation: true,
    });

    return fuse.search(q).map((r) => r.item);
  }

  async findOne(id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, isActive: true },
    });

    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async update(id: string, dto: UpdateBookDto) {
    await this.findOne(id);
    return this.prisma.book.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const book = await this.prisma.book.findFirst({
      where: { id, isActive: true },
    });

    if (!book) {
      throw new NotFoundException('Book not found or already deleted');
    }

    const activeLoans = await this.prisma.loan.count({
      where: { bookId: id, returnedAt: null },
    });

    if (activeLoans > 0) {
      throw new BadRequestException(
        'Cannot delete book: book is currently issued',
      );
    }

    return this.prisma.book.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
