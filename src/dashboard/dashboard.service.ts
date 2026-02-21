import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getAdminDashboardStats() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalLoans = await this.prisma.loan.count();
    const activeLoans = await this.prisma.loan.count({
      where: { returnedAt: null },
    });
    const returnedLoans = await this.prisma.loan.count({
      where: { returnedAt: { not: null } },
    });
    const overdueLoans = await this.prisma.loan.count({
      where: {
        returnedAt: null,
        issuedAt: { lt: thirtyDaysAgo },
      },
    });
    const totalUsers = await this.prisma.user.count();

    const loanStatusChart = [
      { name: 'Active', value: activeLoans },
      { name: 'Returned', value: returnedLoans },
      { name: 'Overdue', value: overdueLoans },
    ];

    const allLoans = await this.prisma.loan.findMany({
      select: { issuedAt: true },
      orderBy: { issuedAt: 'asc' },
    });

    const loansOverTime: { date: string; count: number }[] = [];
    const dateMap = new Map<string, number>();

    allLoans.forEach((loan) => {
      const date = loan.issuedAt.toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    Array.from(dateMap.entries())
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .forEach(([date, count]) => {
        loansOverTime.push({ date, count });
      });

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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const userLoans = await this.prisma.loan.findMany({
      where: { userId },
    });

    const myTotalLoans = userLoans.length;
    const myActiveLoans = userLoans.filter((loan) => !loan.returnedAt).length;
    const myReturnedLoans = userLoans.filter((loan) => loan.returnedAt).length;
    const myOverdueLoans = userLoans.filter(
      (loan) => !loan.returnedAt && loan.issuedAt < thirtyDaysAgo,
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
