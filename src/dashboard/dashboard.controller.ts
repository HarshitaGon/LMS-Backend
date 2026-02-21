import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin/dashboard-stats')
  @Roles(UserRole.ADMIN)
  getAdminStats() {
    return this.dashboardService.getAdminDashboardStats();
  }

  @Get('users/dashboard-stats')
  @Roles(UserRole.MEMBER)
  getUserStats(@CurrentUser() user) {
    return this.dashboardService.getUserDashboardStats(user.sub);
  }
}
