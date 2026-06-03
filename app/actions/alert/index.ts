interface ShowAlertParams {
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

interface ShowAlertAction {
  type: 'SHOW_ALERT';
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

interface HideAlertAction {
  type: 'HIDE_ALERT';
}

export type AlertAction = ShowAlertAction | HideAlertAction;

export function dismissAlert(): HideAlertAction {
  return {
    type: 'HIDE_ALERT',
  };
}

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: ShowAlertParams): ShowAlertAction {
  return {
    type: 'SHOW_ALERT',
    isVisible,
    autodismiss,
    content,
    data,
  };
}
