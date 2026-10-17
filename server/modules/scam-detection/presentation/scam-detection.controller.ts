import { Controller, Post, Body, HttpCode, Inject } from '@nestjs/common';
import { AnalyzeUrlUseCase } from '../application/analyze-url.use-case';
import { AnalyzeTextUseCase } from '../application/analyze-text.use-case';
import { AnalyzeProfileUseCase } from '../application/analyze-profile.use-case';
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
    private readonly analyzeProfileUseCase: AnalyzeProfileUseCase
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
}
