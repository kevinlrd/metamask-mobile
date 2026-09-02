/* eslint-disable jsdoc/check-indentation */
import Logger from './Logger';
import trackErrorAsAnalytics from './metrics/TrackError/trackErrorAsAnalytics';

interface MiddlewareOptions {
  origin: string;
}

interface MiddlewareRequest {
  isMetamaskInternal?: boolean;
  origin?: string;
  params?: unknown[];
  [key: string]: unknown;
}

interface RpcError {
  code?: unknown;
  data?: {
    message?: string;
  };
  message?: string;
}

interface MiddlewareResponse {
  error?: RpcError;
  [key: string]: unknown;
}

type EndCallback = () => void;
type NextCallback = (callback: (end: EndCallback) => void) => void;

/**
 * List of rpc errors caused by the user rejecting a certain action.
 * Errors that include these phrases should not be logged to Sentry.
 * Examples of these errors include:
 * - User rejected the transaction
 * - User cancelled the transaction
 * - User rejected the request.
 * - MetaMask Message Signature: User denied message signature.
 * - MetaMask Personal Message Signature: User denied message signature.
 */
const USER_REJECTED_ERRORS = ['user rejected', 'user denied', 'user cancelled'];

const USER_REJECTED_ERROR_CODE = 4001;

/**
 * Returns a middleware that appends the DApp origin to request
 * @param {{ origin: string }} opts - The middleware options
 * @returns {Function}
 */
export function createOriginMiddleware(opts: MiddlewareOptions) {
  return function originMiddleware(
    req: MiddlewareRequest,
    _: unknown,
    next: EndCallback,
  ) {
    req.origin = opts.origin;

    // web3-provider-engine compatibility
    // TODO:provider delete this after web3-provider-engine deprecation
    if (!req.params) {
      req.params = [];
    }

    next();
  };
}

/**
 * Checks if the error code or message contains a user rejected error
 * @param {String} errorMessage
 * @returns {boolean}
 */
export function containsUserRejectedError(
  errorMessage: unknown,
  errorCode?: unknown,
): boolean {
  try {
    if (!errorMessage || !(typeof errorMessage === 'string')) return false;

    const userRejectedErrorMessage = USER_REJECTED_ERRORS.some(
      (userRejectedError) =>
        errorMessage.toLowerCase().includes(userRejectedError.toLowerCase()),
    );

    if (userRejectedErrorMessage) return true;

    if (errorCode === USER_REJECTED_ERROR_CODE) return true;

    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Returns a middleware that logs RPC activity
 * @param {{ origin: string }} opts - The middleware options
 * @returns {Function}
 */
export function createLoggerMiddleware(opts: MiddlewareOptions) {
  return function loggerMiddleware(
    req: MiddlewareRequest,
    res: MiddlewareResponse,
    next: NextCallback,
  ) {
    next((cb) => {
      if (res.error) {
        const { error } = res;
        if (error) {
          if (containsUserRejectedError(error.message, error.code)) {
            trackErrorAsAnalytics(
              `Error in RPC response: User rejected`,
              error.message ?? '',
            );
          } else {
            /**
             * Example of a rpc error:
             * { "code":-32603,
             *   "message":"Internal JSON-RPC error.",
             *   "data":{"code":-32000,"message":"gas required exceeds allowance (59956966) or always failing transaction"}
             * }
             * This will track the error to analytics with the error message for better differentiation.
             */
            const errorMessage =
              error.data?.message || error.message || 'Unknown RPC error';
            trackErrorAsAnalytics('Error in RPC response', errorMessage);
          }
        }
      }
      if (req.isMetamaskInternal) {
        return;
      }
      Logger.log(`RPC (${opts.origin}):`, req, '->', res);
      cb();
    });
  };
}
