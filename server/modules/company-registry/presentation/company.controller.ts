import { Controller, Get, Query, Inject } from '@nestjs/common';
import { VerifySirenUseCase } from '../application/verify-siren.use-case';

@Controller('api')
export class CompanyController {
  constructor(
    @Inject(VerifySirenUseCase)
    private readonly verifySirenUseCase: VerifySirenUseCase
  ) {}

  @Get('verify-siren')
  verifySiren(@Query('q') q?: string) {
    return this.verifySirenUseCase.execute(q);
  }
}
