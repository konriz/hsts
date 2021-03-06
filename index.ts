import { IncomingMessage, ServerResponse } from 'http';
import depd from 'depd';

const deprecate = depd('hsts');

const DEFAULT_MAX_AGE = 180 * 24 * 60 * 60;

interface HstsOptions {
  includeSubDomains?: boolean;
  maxAge?: number | null;
  preload?: boolean;
  setIf?: (req: IncomingMessage, res: ServerResponse) => boolean;
}

function alwaysTrue () {
  return true;
}

export = function hsts (options: HstsOptions = {}) {
  if ('includeSubdomains' in options) {
    deprecate('The "includeSubdomains" parameter is deprecated. Use "includeSubDomains" (with a capital D) instead.');
  }

  if ('setIf' in options) {
    deprecate('The "setIf" parameter is deprecated. Refer to the documentation to see how to set the header conditionally.');
  }

  if (Object.prototype.hasOwnProperty.call(options, 'maxage')) {
    throw new Error('maxage is not a supported property. Did you mean to pass "maxAge" instead of "maxage"?');
  }

  const maxAge = options.maxAge !== null && options.maxAge !== undefined ? options.maxAge : DEFAULT_MAX_AGE;
  if (typeof maxAge !== 'number') {
    throw new TypeError('HSTS must be passed a numeric maxAge parameter.');
  }
  if (maxAge < 0) {
    throw new RangeError('HSTS maxAge must be nonnegative.');
  }

  const { setIf = alwaysTrue } = options;
  if (typeof setIf !== 'function') {
    throw new TypeError('setIf must be a function.');
  }

  if (
    Object.prototype.hasOwnProperty.call(options, 'includeSubDomains') &&
    Object.prototype.hasOwnProperty.call(options, 'includeSubdomains')
  ) {
    throw new Error('includeSubDomains and includeSubdomains cannot both be specified.');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const includeSubDomains = options.includeSubDomains !== false && (options as any).includeSubdomains !== false;

  let header = `max-age=${Math.round(maxAge)}`;
  if (includeSubDomains) {
    header += '; includeSubDomains';
  }
  if (options.preload) {
    header += '; preload';
  }

  return function hsts (req: IncomingMessage, res: ServerResponse, next: () => void) {
    if (setIf(req, res)) {
      res.setHeader('Strict-Transport-Security', header);
    }
    next();
  };
}
