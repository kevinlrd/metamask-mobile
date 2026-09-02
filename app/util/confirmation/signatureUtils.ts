/* eslint-disable @typescript-eslint/no-explicit-any -- TODO: Replace legacy signature payloads with controller request types. */
import Engine from '../../core/Engine';
import { MetaMetricsEvents } from '../../core/Analytics/MetaMetrics.events';
import { getAddressAccountType } from '../address';
import NotificationManager from '../../core/NotificationManager';
import { WALLET_CONNECT_ORIGIN } from '../walletconnect';
import AppConstants from '../../core/AppConstants';
import { InteractionManager } from 'react-native';
import { strings } from '../../../locales/i18n';
import { selectEvmChainId } from '../../selectors/networkController';
import { store } from '../../store';
import { getBlockaidMetricsParams } from '../blockaid';
import Device from '../device';
import { getDecimalChainId } from '../networks';
import Logger from '../Logger';
import { analytics } from '../analytics/analytics';
import { AnalyticsEventBuilder } from '../analytics/AnalyticsEventBuilder';

export const typedSign = {
  V1: 'eth_signTypedData',
  V3: 'eth_signTypedData_v3',
  V4: 'eth_signTypedData_v4',
};

export const getAnalyticsParams = (
  messageParams: any,
  signType: any,
  securityAlertResponse?: any,
) => {
  if (!messageParams || typeof messageParams !== 'object') {
    throw new Error('Invalid messageParams provided');
  }

  const { currentPageInformation = {}, meta = {} } = messageParams;
  const pageInfo = { ...currentPageInformation, ...meta };

  const analyticsParams = {
    account_type: getAddressAccountType(messageParams.from),
    dapp_host_name: 'N/A',
    chain_id: null,
    signature_type: signType,
    version: messageParams?.version || 'N/A',
    ...pageInfo.analytics,
  };

  try {
    const chainId = selectEvmChainId(store.getState());
    analyticsParams.chain_id = getDecimalChainId(chainId);

    if (pageInfo.url) {
      const url = new URL(pageInfo.url);
      analyticsParams.dapp_host_name = url.host;
    }

    if (securityAlertResponse) {
      const blockaidParams = getBlockaidMetricsParams(securityAlertResponse);
      Object.assign(analyticsParams, blockaidParams);
    }
  } catch (error) {
    // @ts-expect-error TS(2345): Argument of type 'unknown' is not assignable to pa... Remove this comment to see the full error message
    Logger.error(error, 'Error processing analytics parameters:');
  }

  return analyticsParams;
};

export const walletConnectNotificationTitle = (
  confirmation: any,
  isError: any,
) => {
  if (isError) return strings('notifications.wc_signed_failed_title');
  return confirmation
    ? strings('notifications.wc_signed_title')
    : strings('notifications.wc_signed_rejected_title');
};

export const showWalletConnectNotification = (
  messageParams = {},
  confirmation = false,
  isError = false,
) => {
  InteractionManager.runAfterInteractions(() => {
    /**
     * FIXME: need to rewrite the way BackgroundBridge sets the origin.
     */
    const origin = (messageParams as any).origin
      .toLowerCase()
      .split(':')
      .join('');
    const isWCOrigin = origin.startsWith(
      WALLET_CONNECT_ORIGIN.split(':').join('').toLowerCase(),
    );
    // Check for both V1 and V2 SDK origins
    const v1OriginPrefix = AppConstants.MM_SDK.SDK_REMOTE_ORIGIN.split(':')
      .join('')
      .toLowerCase();
    const v2OriginPrefix = AppConstants.MM_SDK.SDK_CONNECT_V2_ORIGIN.split(':')
      .join('')
      .toLowerCase();
    const isSDKOrigin =
      origin.startsWith(v1OriginPrefix) || origin.startsWith(v2OriginPrefix);
    if (isWCOrigin || isSDKOrigin) {
      NotificationManager.showSimpleNotification({
        status: `simple_notification${!confirmation ? '_rejected' : ''}`,
        duration: 5000,
        title: walletConnectNotificationTitle(confirmation, isError),
        description: strings('notifications.wc_description'),
      });
    }
  });
};

export const handleSignatureAction = async (
  onAction: any,
  messageParams: any,
  signType: any,
  securityAlertResponse: any,
  confirmation?: any,
) => {
  await onAction();
  showWalletConnectNotification(messageParams, confirmation);
  analytics.trackEvent(
    AnalyticsEventBuilder.createEventBuilder(
      confirmation
        ? MetaMetricsEvents.SIGNATURE_APPROVED
        : MetaMetricsEvents.SIGNATURE_REJECTED,
    )
      .addProperties(
        getAnalyticsParams(messageParams, signType, securityAlertResponse),
      )
      .build(),
  );
};

export const addSignatureErrorListener = (
  metamaskId: any,
  onSignatureError: any,
) => {
  Engine.context.SignatureController.hub.on(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const removeSignatureErrorListener = (
  metamaskId: any,
  onSignatureError: any,
) => {
  Engine.context.SignatureController.hub.removeListener(
    `${metamaskId}:signError`,
    onSignatureError,
  );
};

export const shouldTruncateMessage = (e: any) => {
  if (
    (Device.isIos() && e.nativeEvent.layout.height > 70) ||
    (Device.isAndroid() && e.nativeEvent.layout.height > 100)
  ) {
    return true;
  }

  return false;
};
