/* eslint-disable @typescript-eslint/default-param-last */
import { createSelector } from 'reselect';
import { getSwapsLiveness, CHAIN_ID_TO_NAME_MAP } from './utils';
import { invert, omit } from 'lodash';
import { toHex } from '@metamask/controller-utils';

export const getFeatureFlagChainId = (chainId: string): string => chainId;

// * Constants
export const SWAPS_SET_LIVENESS = 'SWAPS_SET_LIVENESS';
export const SWAPS_SET_HAS_ONBOARDED = 'SWAPS_SET_HAS_ONBOARDED';

// * Action Creator
export const setSwapsLiveness = (
  chainId: string,
  featureFlags: Record<string, unknown>,
) => ({
  type: SWAPS_SET_LIVENESS as typeof SWAPS_SET_LIVENESS,
  payload: { chainId, featureFlags },
});
export const setSwapsHasOnboarded = (hasOnboarded: boolean) => ({
  type: SWAPS_SET_HAS_ONBOARDED as typeof SWAPS_SET_HAS_ONBOARDED,
  payload: hasOnboarded,
});

// * Selectors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const swapsStateSelector = (state: any) => state.swaps;

/**
 * Returns the swaps onboarded state
 */
export const swapsHasOnboardedSelector = createSelector(
  swapsStateSelector,
  (swapsState: SwapsState) => swapsState.hasOnboarded,
);

interface ChainSwapsState {
  isLive: boolean;
  featureFlags: Record<string, unknown> | undefined;
}

export interface SwapsState {
  isLive: boolean;
  hasOnboarded: boolean;
  featureFlags: Record<string, unknown> | undefined;
  [chainId: string]: unknown;
}

// * Reducer
export const initialState: SwapsState = {
  isLive: true, // TODO: should we remove it?
  hasOnboarded: true, // TODO: Once we have updated UI / content for the modal, we should enable it again.

  featureFlags: undefined,
  '0x1': {
    isLive: true,
    featureFlags: undefined,
  },
};

interface SetLivenessAction {
  type: typeof SWAPS_SET_LIVENESS;
  payload: { chainId: string; featureFlags: Record<string, unknown> | null };
}

interface SetHasOnboardedAction {
  type: typeof SWAPS_SET_HAS_ONBOARDED;
  payload: boolean;
}

type SwapsAction = SetLivenessAction | SetHasOnboardedAction;

function swapsReducer(
  state: SwapsState = initialState,
  action: SwapsAction,
): SwapsState {
  switch (action.type) {
    case SWAPS_SET_LIVENESS: {
      const { chainId: rawChainId, featureFlags } = action.payload;
      const chainId = getFeatureFlagChainId(rawChainId);

      const data = state[chainId] as ChainSwapsState | undefined;

      const chainNoFlags: ChainSwapsState = {
        ...data,
        featureFlags: undefined,
        isLive: false,
      };

      if (!featureFlags) {
        return {
          ...state,
          [chainId]: chainNoFlags,
          [rawChainId]: chainNoFlags,
          featureFlags: undefined,
        };
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const featureFlagsRecord = featureFlags as Record<string, any>;

      const newState: SwapsState = {
        ...state,
        featureFlags: {
          smart_transactions: featureFlagsRecord.smart_transactions,
          smartTransactions: featureFlagsRecord.smartTransactions,
        },
      };

      // Testnet has the same name as mainnet, but occurs later in the map,
      // so we need to omit it from the mapping, otherwise it will override 0x1
      const noTestnetChainIdToNameMap = omit(
        CHAIN_ID_TO_NAME_MAP,
        toHex('1337'),
      );
      // Invert CHAIN_ID_TO_NAME_MAP to get chain name to ID mapping
      // It will be e.g. { 'ethereum': '0x1', 'bsc': '0x38' }
      const chainNameToIdMap = invert(noTestnetChainIdToNameMap);

      // Save chain-specific feature flags for each chain
      Object.keys(featureFlagsRecord).forEach((chainName) => {
        const chainIdForName = chainNameToIdMap[chainName];

        if (
          chainIdForName &&
          featureFlagsRecord[chainName] &&
          typeof featureFlagsRecord[chainName] === 'object'
        ) {
          const chainFeatureFlags = featureFlagsRecord[chainName] as Record<
            string,
            unknown
          >;
          const chainLiveness = getSwapsLiveness(
            featureFlagsRecord,
            chainIdForName,
          );

          newState[chainIdForName] = {
            ...(state[chainIdForName] as ChainSwapsState | undefined),
            featureFlags: chainFeatureFlags,
            isLive: chainLiveness,
          };

          if (chainIdForName === chainId && rawChainId !== chainId) {
            newState[rawChainId] = newState[chainIdForName];
          }
        }
      });

      return newState;
    }
    case SWAPS_SET_HAS_ONBOARDED: {
      return {
        ...state,
        hasOnboarded: Boolean(action.payload),
      };
    }
    default: {
      return state;
    }
  }
}

export default swapsReducer;
