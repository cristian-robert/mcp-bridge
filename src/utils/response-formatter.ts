import { BridgeResponse, CallToolResult } from '../protocol/types.js';
import { createChildLogger } from './logger.js';

const logger = createChildLogger('response-formatter');

export class ResponseFormatter {
  /**
   * Compress response by removing verbose metadata and formatting for token efficiency
   */
  static compressResponse(response: CallToolResult): CallToolResult {
    const compressed: CallToolResult = {
      content: response.content.map(item => {
        if (item.type === 'text' && item.text) {
          return {
            type: 'text',
            text: this.compressText(item.text),
          };
        }
        return item;
      }),
      isError: response.isError,
    };

    const originalSize = JSON.stringify(response).length;
    const compressedSize = JSON.stringify(compressed).length;
    const savings = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

    logger.debug(`Response compressed: ${originalSize} → ${compressedSize} bytes (${savings}% reduction)`);

    return compressed;
  }

  /**
   * Compress text content by removing redundant formatting
   */
  private static compressText(text: string): string {
    return text
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  /**
   * Format bridge response with metadata
   */
  static formatBridgeResponse(
    result: CallToolResult,
    metadata: {
      serverName: string;
      operationName: string;
      durationMs: number;
      cached: boolean;
    }
  ): BridgeResponse {
    const tokensEstimate = this.estimateTokens(result);

    return {
      success: !result.isError,
      data: result.content,
      metadata: {
        ...metadata,
        tokensEstimate,
      } as BridgeResponse['metadata'],
    };
  }

  /**
   * Estimate token count for response (rough approximation: 1 token ≈ 4 characters)
   */
  static estimateTokens(result: CallToolResult): number {
    const text = JSON.stringify(result);
    return Math.ceil(text.length / 4);
  }

  /**
   * Format error response
   */
  static formatError(error: Error, code: string = 'UNKNOWN_ERROR'): BridgeResponse {
    return {
      success: false,
      error: {
        message: error.message,
        code,
        details: error.stack,
      },
    };
  }

  /**
   * Truncate large responses if needed (safety measure)
   */
  static truncateIfNeeded(response: CallToolResult, maxSize: number = 50000): CallToolResult {
    const size = JSON.stringify(response).length;

    if (size <= maxSize) {
      return response;
    }

    logger.warn(`Response truncated: ${size} → ${maxSize} bytes`);

    return {
      content: [
        {
          type: 'text',
          text: `[Response truncated - original size: ${size} bytes]\n\n` +
                JSON.stringify(response).substring(0, maxSize - 100) + '\n\n[... truncated]',
        },
      ],
      isError: response.isError,
    };
  }
}
