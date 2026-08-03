import type { AvatarAccountType } from '../../component-library/components/Avatars/Avatar/variants/AvatarAccount/AvatarAccount.types';
import type { Dispatch } from 'redux';

interface SetSearchEngineAction {
  type: 'SET_SEARCH_ENGINE';
  searchEngine: string;
}

interface SetShowHexDataAction {
  type: 'SET_SHOW_HEX_DATA';
  showHexData: boolean;
}

interface SetShowFiatOnTestnetsAction {
  type: 'SET_SHOW_FIAT_ON_TESTNETS';
  showFiatOnTestnets: boolean;
}

interface SetHideZeroBalanceTokensAction {
  type: 'SET_HIDE_ZERO_BALANCE_TOKENS';
  hideZeroBalanceTokens: boolean;
}

interface SetLockTimeAction {
  type: 'SET_LOCK_TIME';
  lockTime: number;
}

interface SetPrimaryCurrencyAction {
  type: 'SET_PRIMARY_CURRENCY';
  primaryCurrency: string;
}

interface SetAvatarAccountTypeAction {
  type: 'SET_AVATAR_ACCOUNT_TYPE';
  avatarAccountType: AvatarAccountType;
}

interface SetBasicFunctionalityAction {
  type: 'TOGGLE_BASIC_FUNCTIONALITY';
  basicFunctionalityEnabled: boolean;
}

interface ToggleDeviceNotificationAction {
  type: 'TOGGLE_DEVICE_NOTIFICATIONS';
  deviceNotificationEnabled: boolean;
}

interface SetTokenSortConfigAction {
  type: 'SET_TOKEN_SORT_CONFIG';
  tokenSortConfig: Record<string, unknown>;
}

interface SetDeepLinkModalDisabledAction {
  type: 'SET_DEEP_LINK_MODAL_DISABLED';
  deepLinkModalDisabled: boolean;
}

interface SetHapticsEnabledAction {
  type: 'SET_HAPTICS_ENABLED';
  hapticsEnabled: boolean;
}

interface SetPerpsChartPreferredCandlePeriodAction {
  type: 'SET_PERPS_CHART_PREFERRED_CANDLE_PERIOD';
  preferredCandlePeriod: string;
}

export type SettingsAction =
  | SetSearchEngineAction
  | SetShowHexDataAction
  | SetShowFiatOnTestnetsAction
  | SetHideZeroBalanceTokensAction
  | SetLockTimeAction
  | SetPrimaryCurrencyAction
  | SetAvatarAccountTypeAction
  | SetBasicFunctionalityAction
  | ToggleDeviceNotificationAction
  | SetTokenSortConfigAction
  | SetDeepLinkModalDisabledAction
  | SetHapticsEnabledAction
  | SetPerpsChartPreferredCandlePeriodAction;

export function setSearchEngine(searchEngine: string): SetSearchEngineAction {
  return {
    type: 'SET_SEARCH_ENGINE',
    searchEngine,
  };
}

export function setShowHexData(showHexData: boolean): SetShowHexDataAction {
  return {
    type: 'SET_SHOW_HEX_DATA',
    showHexData,
  };
}

export function setShowFiatOnTestnets(
  showFiatOnTestnets: boolean,
): SetShowFiatOnTestnetsAction {
  return {
    type: 'SET_SHOW_FIAT_ON_TESTNETS',
    showFiatOnTestnets,
  };
}

export function setHideZeroBalanceTokens(
  hideZeroBalanceTokens: boolean,
): SetHideZeroBalanceTokensAction {
  return {
    type: 'SET_HIDE_ZERO_BALANCE_TOKENS',
    hideZeroBalanceTokens,
  };
}

export function setLockTime(lockTime: number): SetLockTimeAction {
  return {
    type: 'SET_LOCK_TIME',
    lockTime,
  };
}

export function setPrimaryCurrency(
  primaryCurrency: string,
): SetPrimaryCurrencyAction {
  return {
    type: 'SET_PRIMARY_CURRENCY',
    primaryCurrency,
  };
}

export function setAvatarAccountType(
  avatarAccountType: AvatarAccountType,
): SetAvatarAccountTypeAction {
  return {
    type: 'SET_AVATAR_ACCOUNT_TYPE',
    avatarAccountType,
  };
}

// Plain action creator for state updates (used during store initialization)
export function setBasicFunctionality(
  basicFunctionalityEnabled: boolean,
): SetBasicFunctionalityAction {
  return {
    type: 'TOGGLE_BASIC_FUNCTIONALITY',
    basicFunctionalityEnabled,
  };
}

// Thunk action creator for user-initiated toggles (includes MultichainAccountService integration)
export function toggleBasicFunctionality(basicFunctionalityEnabled: boolean) {
  return async (dispatch: Dispatch<SetBasicFunctionalityAction>) => {
    // First dispatch the Redux state update
    dispatch(setBasicFunctionality(basicFunctionalityEnabled));

    const Engine =
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('../../core/Engine').default;
    Engine.context.MultichainAccountService.setBasicFunctionality(
      basicFunctionalityEnabled,
    ).catch((error: unknown) => {
      console.error(
        'Failed to set basic functionality on MultichainAccountService:',
        error,
      );
    });
  };
}

export function toggleDeviceNotification(
  deviceNotificationEnabled: boolean,
): ToggleDeviceNotificationAction {
  return {
    type: 'TOGGLE_DEVICE_NOTIFICATIONS',
    deviceNotificationEnabled,
  };
}

export function setTokenSortConfig(
  tokenSortConfig: Record<string, unknown>,
): SetTokenSortConfigAction {
  return {
    type: 'SET_TOKEN_SORT_CONFIG',
    tokenSortConfig,
  };
}

export function setDeepLinkModalDisabled(
  deepLinkModalDisabled: boolean,
): SetDeepLinkModalDisabledAction {
  return {
    type: 'SET_DEEP_LINK_MODAL_DISABLED',
    deepLinkModalDisabled,
  };
}

export function setHapticsEnabled(
  hapticsEnabled: boolean,
): SetHapticsEnabledAction {
  return {
    type: 'SET_HAPTICS_ENABLED',
    hapticsEnabled,
  };
}

export function setPerpsChartPreferredCandlePeriod(
  preferredCandlePeriod: string,
): SetPerpsChartPreferredCandlePeriodAction {
  return {
    type: 'SET_PERPS_CHART_PREFERRED_CANDLE_PERIOD',
    preferredCandlePeriod,
  };
}
