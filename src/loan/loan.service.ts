import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LoanService {
  constructor(private readonly prisma: PrismaService) {}

  async issueBook(userId: string, bookId: string) {
    return this.prisma.$transaction(async (tx) => {
      const book = await tx.book.findUnique({
        where: { id: bookId },
      });

      if (!book) throw new NotFoundException('Book not found');

      if (book.quantity < 1) {
        throw new BadRequestException('Book not available');
      }

      const existingLoan = await tx.loan.findFirst({
        where: {
          userId,
          bookId,
          returnedAt: null,
        },
      });

      if (existingLoan) {
        throw new BadRequestException(
          'You already have this book issued. Return it first.',
        );
      }

      const loan = await tx.loan.create({
        data: {
          userId,
          bookId,
        },
      });

      await tx.book.update({
        where: { id: bookId },
        data: {
          quantity: { decrement: 1 },
        },
      });

      return loan;
    });
  }

  async returnBook(loanId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
      });

      if (!loan) throw new NotFoundException('Loan not found');

      if (loan.userId !== userId) {
        throw new ForbiddenException('You cannot return this book');
      }

      if (loan.returnedAt) {
        throw new BadRequestException('Book already returned');
      }

      await tx.loan.update({
        where: { id: loanId },
        data: {
          returnedAt: new Date(),
        },
      });

      await tx.book.update({
        where: { id: loan.bookId },
        data: {
          quantity: { increment: 1 },
        },
      });

      return { message: 'Book returned successfully' };
    });
  }

  async activeLoans() {
    return this.prisma.loan.findMany({
      where: { returnedAt: null },
      include: {
        user: true,
        book: true,
      },
    });
  }

  async myLoans(userId: string) {
    return this.prisma.loan.findMany({
      where: { userId },
      include: { book: true },
    });
  }
}
