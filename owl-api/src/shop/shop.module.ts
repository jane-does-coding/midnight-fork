import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ShopService } from './shop.service';
import { ShopController, ShopAuthController, ShopAdminController } from './shop.controller';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [ShopController, ShopAuthController, ShopAdminController],
  providers: [ShopService, PrismaService],
  exports: [ShopService],
})
export class ShopModule {}

