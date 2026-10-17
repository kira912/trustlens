import { Injectable, BadRequestException } from '@nestjs/common';
import { evaluateTextRisk } from '../domain/rules/text-heuristics';

@Injectable()
export class AnalyzeTextUseCase {
  execute(text?: string) {
    if (!text || typeof text !== 'string' || !text.trim()) {
      throw new BadRequestException('Texte requis');
    }

    return evaluateTextRisk(text);
  }
}
