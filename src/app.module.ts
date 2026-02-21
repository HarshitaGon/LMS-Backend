import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { BookModule } from './book/book.module';
import { LoanModule } from './loan/loan.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    BookModule,
    UsersModule,
    LoanModule,
    AuthModule,
    DashboardModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'src'),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
