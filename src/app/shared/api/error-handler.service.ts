import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { Injectable } from '@angular/core';
import { GlobalMessageService } from '@shared/global-message.service';
import { ErrorPayloadInterface } from '@interfaces/error-payload.interface';
import { TranslationService } from '@services/translation.service';
import { MessagesTranslation } from '@translations/messages.enum';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  constructor(
    private readonly globalMessageService: GlobalMessageService,
    private readonly translationService: TranslationService
  ) {}

  async errorHandler(error: HttpErrorResponse) {
    const errorPayload: ErrorPayloadInterface = error.error;
    const errorMessage = errorPayload.message;
    let displayErrorMessage = '';

    function tryParseJSON(value: string): any {
      try {
        const parsed = JSON.parse(value);
        if (typeof parsed === 'object' && parsed !== null) return parsed;
      } catch (error) {}
      return value;
    }

    const parsedErrorMessage = tryParseJSON(errorMessage as string);

    if (typeof parsedErrorMessage === 'string') {
      await this.globalMessageService.handleError({
        message: parsedErrorMessage
      });
    } else if (Array.isArray(parsedErrorMessage)) {
      for (const messageItem of parsedErrorMessage) {
        for (const message of messageItem.error) {
          const errorText = await this.translationService.translateText(
            `validation.${message}`,
            MessagesTranslation.ERRORS
          );

          displayErrorMessage += `${errorText}<br>`;
        }
      }

      this.globalMessageService.handle({
        message: displayErrorMessage,
        isError: true
      });
    }

    setTimeout(() => {
      this.globalMessageService.clear();
    }, 10000);

    return throwError(() => displayErrorMessage);
  }
}
