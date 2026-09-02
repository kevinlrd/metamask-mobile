/* eslint-disable @typescript-eslint/no-explicit-any -- TODO: Replace legacy dynamic ENS values with typed controller interfaces. */
import Engine from '../core/Engine';
// @ts-expect-error TS(7016): Could not find a declaration file for module 'ethj... Remove this comment to see the full error message
import ENS from 'ethjs-ens';
import { areAddressesEqual } from './address';
import {
  ChainId,
  InfuraNetworkType,
  NetworkType,
} from '@metamask/controller-utils';
const ENS_NAME_NOT_DEFINED_ERROR = 'ENS name not defined';
const INVALID_ENS_NAME_ERROR = 'invalid ENS name';
// One hour cache threshold.
const CACHE_REFRESH_THRESHOLD = 60 * 60 * 1000;
import { EMPTY_ADDRESS } from '../constants/transaction';
import { regex } from '../../app/util/regex';

/**
 * Utility class with the single responsibility
 * of caching ENS names
 *
 * TODO: Replace this entire module and cache with the core ENS controller
 */
export class ENSCache {
  static cache = {};
}

/**
 * A list of all chain IDs supported by the current legacy ENS library we are
 * using.
 *
 * Ropsten is excluded because we no longer support Ropsten.
 */
const ENS_SUPPORTED_CHAIN_IDS: string[] = [ChainId[NetworkType.mainnet]];

/**
 * We still need it to support the legacy ENS library that we are using.
 */
const ENS_SUPPORTED_NETWORK_IDS = {
  [InfuraNetworkType.mainnet]: '1',
};

/**
 * A map of chain ID to network ID for networks supported by the current
 * legacy ENS library we are using.
 */
const CHAIN_ID_TO_NETWORK_ID = {
  [ChainId[NetworkType.mainnet]]:
    ENS_SUPPORTED_NETWORK_IDS[NetworkType.mainnet],
};

/**
 * Get a cached ENS name.
 *
 * @param {string} address - The address to lookup.
 * @param {string} chainId - The chain ID for the cached ENS name.
 * @returns {string|undefined} The cached ENS name, or undefined if the name
 * was not found in the cache.
 */
export function getCachedENSName(address: any, chainId: any) {
  const networkHasEnsSupport =
    chainId !== undefined && ENS_SUPPORTED_CHAIN_IDS.includes(chainId);
  if (!networkHasEnsSupport) {
    return undefined;
  }

  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const cacheEntry = ENSCache.cache[networkId + address];

  return cacheEntry?.name;
}

export async function doENSReverseLookup(
  this: any,
  address: any,
  chainId?: string,
) {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();
  const { name: cachedName, timestamp } =
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    ENSCache.cache[chainId + address] || {};
  const nowTimestamp = Date.now();
  if (timestamp && nowTimestamp - timestamp < CACHE_REFRESH_THRESHOLD) {
    return Promise.resolve(cachedName);
  }

  const networkHasEnsSupport =
    chainId !== undefined && ENS_SUPPORTED_CHAIN_IDS.includes(chainId);

  if (networkHasEnsSupport) {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
    this.ens = new ENS({ provider, network: networkId });
    try {
      const name = await this.ens.reverse(address);
      const resolvedAddress = await this.ens.lookup(name);
      if (areAddressesEqual(address, resolvedAddress)) {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        ENSCache.cache[networkId + address] = { name, timestamp: Date.now() };
        return name;
      }
    } catch (e) {
      if (
        (e as any).message.includes(ENS_NAME_NOT_DEFINED_ERROR) ||
        (e as any).message.includes(INVALID_ENS_NAME_ERROR)
      ) {
        // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        ENSCache.cache[networkId + address] = { timestamp: Date.now() };
      }
    }
  }
}

export async function doENSLookup(this: any, ensName: any, chainId: any) {
  const { provider } =
    Engine.context.NetworkController.getProviderAndBlockTracker();

  const networkHasEnsSupport = ENS_SUPPORTED_CHAIN_IDS.includes(chainId);

  if (networkHasEnsSupport) {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const networkId = CHAIN_ID_TO_NETWORK_ID[chainId];
    this.ens = new ENS({ provider, network: networkId });
    try {
      const resolvedAddress = await this.ens.lookup(ensName);
      if (resolvedAddress === EMPTY_ADDRESS) return;
      return resolvedAddress;
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

export function isDefaultAccountName(name: any) {
  return regex.defaultAccount.test(name);
}
