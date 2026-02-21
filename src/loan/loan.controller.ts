import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { LoanService } from './loan.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoanController {
  constructor(private readonly loanService: LoanService) {}

  @Post('issue')
  @Roles(UserRole.MEMBER)
  issueBook(@Body() dto: CreateLoanDto, @CurrentUser() user) {
    return this.loanService.issueBook(user.sub, dto.bookId);
  }

  @Post('return/:id')
  @Roles(UserRole.MEMBER)
  returnBook(@Param('id') loanId: string, @CurrentUser() user) {
    return this.loanService.returnBook(loanId, user.sub);
  }

  @Get('active')
  @Roles(UserRole.ADMIN)
  activeLoans() {
    return this.loanService.activeLoans();
  }

  @Get('my-loans')
  @Roles(UserRole.MEMBER)
  myLoans(@CurrentUser() user) {
    return this.loanService.myLoans(user.sub);
  }
}
