import { Controller, Post, Body, HttpCode, Inject } from '@nestjs/common';
import { AnalyzeUrlUseCase } from '../application/analyze-url.use-case';
import { AnalyzeTextUseCase } from '../application/analyze-text.use-case';
import { AnalyzeProfileUseCase } from '../application/analyze-profile.use-case';
import { AnalyzePhoneUseCase } from '../application/analyze-phone.use-case';
import { AnalyzeEmailUseCase } from '../application/analyze-email.use-case';
import { AnalyzeCryptoUseCase } from '../application/analyze-crypto.use-case';
import type { ProfileEvaluationInput } from '../domain/rules/profile-rules';
import type { ListingContextInput } from '../domain/rules/listing-rules';

@Controller('api')
export class ScamDetectionController {
  constructor(
    @Inject(AnalyzeUrlUseCase)
    private readonly analyzeUrlUseCase: AnalyzeUrlUseCase,
    @Inject(AnalyzeTextUseCase)
    private readonly analyzeTextUseCase: AnalyzeTextUseCase,
    @Inject(AnalyzeProfileUseCase)
    private readonly analyzeProfileUseCase: AnalyzeProfileUseCase,
    @Inject(AnalyzePhoneUseCase)
    private readonly analyzePhoneUseCase: AnalyzePhoneUseCase,
    @Inject(AnalyzeEmailUseCase)
    private readonly analyzeEmailUseCase: AnalyzeEmailUseCase,
    @Inject(AnalyzeCryptoUseCase)
    private readonly analyzeCryptoUseCase: AnalyzeCryptoUseCase
  ) {}

  @Post('analyze-url')
  @HttpCode(200)
  analyzeUrl(
    @Body('url') url?: string,
    @Body('listingContext') listingContext?: ListingContextInput
  ) {
    return this.analyzeUrlUseCase.execute(url, listingContext);
  }

  @Post('analyze-text')
  @HttpCode(200)
  analyzeText(@Body('text') text?: string) {
    return this.analyzeTextUseCase.execute(text);
  }

  @Post('analyze-profile')
  @HttpCode(200)
  analyzeProfile(@Body() body: ProfileEvaluationInput) {
    return this.analyzeProfileUseCase.execute(body);
  }

  @Post('analyze-phone')
  @HttpCode(200)
  analyzePhone(@Body('phone') phone?: string) {
    return this.analyzePhoneUseCase.execute(phone);
  }

  @Post('analyze-email')
  @HttpCode(200)
  analyzeEmail(@Body('email') email?: string) {
    return this.analyzeEmailUseCase.execute(email);
  }

  @Post('analyze-crypto')
  @HttpCode(200)
  analyzeCrypto(@Body('address') address?: string) {
    return this.analyzeCryptoUseCase.execute(address);
  }
}

