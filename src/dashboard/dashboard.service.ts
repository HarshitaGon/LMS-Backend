import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { log } from 'console';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboardStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const loanFilter = {
      user: { isActive: true },
      book: { isActive: true },
    };

    const totalLoans = await this.prisma.loan.count({
      where: loanFilter,
    });

    const activeLoans = await this.prisma.loan.count({
      where: {
        ...loanFilter,
        returnedAt: null,
      },
    });

    const returnedLoans = await this.prisma.loan.count({
      where: {
        ...loanFilter,
        returnedAt: { not: null },
      },
    });

    const overdueLoans = await this.prisma.loan.count({
      where: {
        ...loanFilter,
        returnedAt: null,
        issuedAt: { lt: thirtyDaysAgo },
      },
    });

    const totalUsers = await this.prisma.user.count({
      where: { isActive: true },
    });

    const loanStatusChart = [
      { name: 'Active', value: activeLoans },
      { name: 'Returned', value: returnedLoans },
      { name: 'Overdue', value: overdueLoans },
    ];

    const allLoans = await this.prisma.loan.findMany({
      where: loanFilter,
      select: { issuedAt: true },
      orderBy: { issuedAt: 'asc' },
    });

    const dateMap = new Map<string, number>();

    allLoans.forEach((loan) => {
      const date = loan.issuedAt.toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    const loansOverTime = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    return {
      totalLoans,
      activeLoans,
      returnedLoans,
      overdueLoans,
      totalUsers,
      loanStatusChart,
      loansOverTime,
    };
  }

  async getUserDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('Inactive user cannot access dashboard');
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userLoans = await this.prisma.loan.findMany({
      where: {
        userId,
        book: { isActive: true },
      },
    });

    const myTotalLoans = userLoans.length;
    const myActiveLoans = userLoans.filter((l) => !l.returnedAt).length;
    const myReturnedLoans = userLoans.filter((l) => l.returnedAt).length;
    const myOverdueLoans = userLoans.filter(
      (l) => !l.returnedAt && l.issuedAt < thirtyDaysAgo,
    ).length;

    const myLoanStatusChart = [
      { name: 'Active', value: myActiveLoans },
      { name: 'Returned', value: myReturnedLoans },
      ...(myOverdueLoans > 0
        ? [{ name: 'Overdue', value: myOverdueLoans }]
        : []),
    ];

    return {
      myTotalLoans,
      myActiveLoans,
      myReturnedLoans,
      myOverdueLoans,
      myLoanStatusChart,
    };
  }
}
