import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

@Module({
  imports: [PrismaModule],
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
