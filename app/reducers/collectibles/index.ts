/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/* eslint-disable @typescript-eslint/default-param-last, @typescript-eslint/no-explicit-any */
import { toHex } from '@metamask/controller-utils';
import { createSelector } from 'reselect';
import { selectChainId } from '../../selectors/networkController';
import {
  selectAllNftContracts,
  selectAllNfts,
} from '../../selectors/nftController';
import { selectSelectedInternalAccountAddress } from '../../selectors/accountsController';
import { compareTokenIds } from '../../util/tokens';
import { createDeepEqualSelector } from '../../selectors/util';
import { selectEnabledNetworksByNamespace } from '../../selectors/networkEnablementController';

interface NftItem {
  tokenId: string;
  address: string;
  [key: string]: unknown;
}

interface FavoriteItem {
  tokenId: string;
  address: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RootState = any;

/**
 * Builds a set of chain IDs for filtering. When chainIds include CAIP-2 (e.g. from listPopularNetworks),
 * adds Hex form for eip155:* so we match NFT keys which are Hex.
 * @param chainIds - CAIP-2 or Hex chain IDs
 */
function buildAllowedChainIdSet(chainIds: string[]): Set<string> {
  const set = new Set(chainIds);
  for (const id of chainIds) {
    if (id.startsWith('eip155:')) {
      const reference = id.slice(7);
      if (reference) set.add(toHex(reference));
    }
  }
  return set;
}

const favoritesSelector = (state: RootState) => state.collectibles.favorites;

export const isNftFetchingProgressSelector = (state: RootState): boolean =>
  state.collectibles.isNftFetchingProgress;

export const collectibleContractsSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNftContracts,
  (
    address: string,
    chainId: string,
    allNftContracts: Record<string, Record<string, unknown[]>>,
  ) => allNftContracts[address]?.[chainId] || [],
);

/**
 * @deprecated - this does not return all collectibles if multiple networks are selected
 */
export const collectiblesSelector = createDeepEqualSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  selectAllNfts,
  (
    address: string,
    chainId: string,
    allNfts: Record<string, Record<string, NftItem[]>>,
  ) => allNfts[address]?.[chainId] || [],
);

/**
 * Multichain collectibles filtered by chain IDs. When addressesOverride is passed (e.g. all
 * addresses in the selected account group), aggregates NFTs from those addresses so that when
 * Solana is selected we still include NFTs keyed by EVM address. When preferredChainIds is
 * passed (e.g. from listPopularNetworks()), uses that list; otherwise falls back to
 * selectEnabledNetworksByNamespace.
 */
export const multichainCollectiblesByEnabledNetworksSelector =
  createDeepEqualSelector(
    [
      selectSelectedInternalAccountAddress,
      selectAllNfts,
      selectEnabledNetworksByNamespace,
      (state: RootState, preferredChainIds: string[] | undefined) =>
        preferredChainIds,
      (
        state: RootState,
        _preferredChainIds: string[] | undefined,
        addressesOverride: string[] | undefined,
      ) => addressesOverride,
    ],
    (
      selectedAddress: string,
      allNfts: Record<string, Record<string, NftItem[]>>,
      enabledNetworks: Record<string, Record<string, boolean>>,
      preferredChainIds: string[] | undefined,
      addressesOverride: string[] | undefined,
    ) => {
      const addresses =
        addressesOverride != null &&
        Array.isArray(addressesOverride) &&
        addressesOverride.length > 0
          ? addressesOverride
          : selectedAddress
            ? [selectedAddress]
            : [];

      let allowedChainIdsSet: Set<string>;

      if (
        preferredChainIds != null &&
        Array.isArray(preferredChainIds) &&
        preferredChainIds.length > 0
      ) {
        allowedChainIdsSet = buildAllowedChainIdSet(preferredChainIds);
      } else {
        const enabledChainIds: string[] = [];
        for (const namespace of Object.keys(enabledNetworks || {})) {
          const networkMap = enabledNetworks[namespace] || {};
          for (const chainId of Object.keys(networkMap)) {
            if (networkMap[chainId]) enabledChainIds.push(chainId);
          }
        }

        if (enabledChainIds.length === 0) {
          return {};
        }

        allowedChainIdsSet = new Set(enabledChainIds);
      }

      const result: Record<string, NftItem[]> = {};
      for (const address of addresses) {
        const addressNfts = allNfts?.[address];
        if (!addressNfts) continue;
        for (const chainId of Object.keys(addressNfts)) {
          if (!allowedChainIdsSet.has(chainId)) continue;
          const nfts = addressNfts[chainId];
          if (!Array.isArray(nfts)) continue;
          result[chainId] = (result[chainId] || []).concat(nfts);
        }
      }

      return result;
    },
  );

export const favoritesCollectiblesSelector = createSelector(
  selectSelectedInternalAccountAddress,
  selectChainId,
  favoritesSelector,
  (
    address: string,
    chainId: string,
    favorites: Record<string, Record<string, FavoriteItem[]>>,
  ) => favorites[address]?.[chainId] || [],
);

export const isCollectibleInFavoritesSelector = createSelector(
  favoritesCollectiblesSelector,
  (state: RootState, collectible: NftItem) => collectible,
  (favoriteCollectibles: FavoriteItem[], collectible: NftItem) =>
    Boolean(
      favoriteCollectibles.find(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      ),
    ),
);

const getFavoritesCollectibles = (
  favoriteCollectibles: Record<string, Record<string, FavoriteItem[]>>,
  selectedAddress: string,
  chainId: string,
): FavoriteItem[] => favoriteCollectibles[selectedAddress]?.[chainId] || [];

export const ADD_FAVORITE_COLLECTIBLE = 'ADD_FAVORITE_COLLECTIBLE';
export const REMOVE_FAVORITE_COLLECTIBLE = 'REMOVE_FAVORITE_COLLECTIBLE';
export const SHOW_NFT_FETCHING_LOADER = 'SHOW_NFT_FETCHING_LOADER';
export const HIDE_NFT_FETCHING_LOADER = 'HIDE_NFT_FETCHING_LOADER';

export interface CollectiblesState {
  favorites: Record<string, Record<string, FavoriteItem[]>>;
  isNftFetchingProgress: boolean;
}

const initialState: CollectiblesState = {
  favorites: {},
  isNftFetchingProgress: false,
};

interface AddFavoriteAction {
  type: typeof ADD_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteItem;
}

interface RemoveFavoriteAction {
  type: typeof REMOVE_FAVORITE_COLLECTIBLE;
  selectedAddress: string;
  chainId: string;
  collectible: FavoriteItem;
}

interface ShowNftFetchingLoaderAction {
  type: typeof SHOW_NFT_FETCHING_LOADER;
}

interface HideNftFetchingLoaderAction {
  type: typeof HIDE_NFT_FETCHING_LOADER;
}

type CollectiblesAction =
  | AddFavoriteAction
  | RemoveFavoriteAction
  | ShowNftFetchingLoaderAction
  | HideNftFetchingLoaderAction;

const collectiblesFavoritesReducer = (
  state: CollectiblesState = initialState,
  action: CollectiblesAction,
): CollectiblesState => {
  switch (action.type) {
    case ADD_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress,
        chainId,
      );
      collectibles.push({
        tokenId: collectible.tokenId,
        address: collectible.address,
      });
      const selectedAddressCollectibles =
        state.favorites[selectedAddress] || {};
      return {
        ...state,
        favorites: {
          ...state.favorites,
          [selectedAddress]: {
            ...selectedAddressCollectibles,
            [chainId]: collectibles.slice(),
          },
        },
      };
    }
    case REMOVE_FAVORITE_COLLECTIBLE: {
      const { selectedAddress, chainId, collectible } = action;
      const collectibles = getFavoritesCollectibles(
        state.favorites,
        selectedAddress,
        chainId,
      );
      const indexToRemove = collectibles.findIndex(
        ({ tokenId, address }) =>
          // TO DO: Remove after moving favorites to controllers.
          compareTokenIds(tokenId, collectible.tokenId) &&
          address === collectible.address,
      );
      collectibles.splice(indexToRemove, 1);
      const selectedAddressCollectibles =
        state.favorites[selectedAddress] || {};
      return {
        ...state,
        favorites: {
          ...state.favorites,
          [selectedAddress]: {
            ...selectedAddressCollectibles,
            [chainId]: collectibles.slice(),
          },
        },
      };
    }
    case SHOW_NFT_FETCHING_LOADER: {
      return {
        ...state,
        isNftFetchingProgress: true,
      };
    }
    case HIDE_NFT_FETCHING_LOADER: {
      return {
        ...state,
        isNftFetchingProgress: false,
      };
    }
    default: {
      return state;
    }
  }
};

export const showNftFetchingLoadingIndicator =
  (): ShowNftFetchingLoaderAction => ({
    type: SHOW_NFT_FETCHING_LOADER,
  });

export const hideNftFetchingLoadingIndicator =
  (): HideNftFetchingLoaderAction => ({
    type: HIDE_NFT_FETCHING_LOADER,
  });

export default collectiblesFavoritesReducer;
