import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CAPTURE_CHANNEL = 'captura';
export const CAPTURE_CATEGORY = 'captura-rapida';
export const CAPTURE_ACTION_TEXT = 'captura-texto';
export const CAPTURE_ACTION_OPEN = 'captura-abrir';
const PERSISTENT_ID = 'captura-persistente';

/**
 * Notificacion persistente para la Nota al yo futuro.
 *
 * En Android la notificacion es "sticky" (no se puede deslizar para quitarla)
 * y lleva un boton con entrada de texto: capturas sin abrir la app. El tap
 * sobre la notificacion abre la app en la hoja de captura, que es el camino
 * garantizado en cualquier version de Android.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.LOW,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

async function ensureChannelAndCategory(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CAPTURE_CHANNEL, {
      name: 'Captura rapida',
      importance: Notifications.AndroidImportance.LOW,
      sound: null,
      vibrationPattern: null,
      enableVibrate: false,
      enableLights: false,
      showBadge: false,
    });
  }

  await Notifications.setNotificationCategoryAsync(CAPTURE_CATEGORY, [
    {
      identifier: CAPTURE_ACTION_TEXT,
      buttonTitle: 'Apuntar',
      textInput: { submitButtonTitle: 'Guardar', placeholder: 'Que no quieres perder' },
      options: { opensAppToForeground: false },
    },
    {
      identifier: CAPTURE_ACTION_OPEN,
      buttonTitle: 'Abrir captura',
      options: { opensAppToForeground: true },
    },
  ]);
}

export async function showPersistentCapture(): Promise<void> {
  if (!(await ensurePermissions())) return;
  await ensureChannelAndCategory();
  await Notifications.dismissNotificationAsync(PERSISTENT_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: PERSISTENT_ID,
    content: {
      title: 'Nota al yo futuro',
      body: 'Apunta lo que se te acaba de cruzar. No lo sostengas en la cabeza.',
      categoryIdentifier: CAPTURE_CATEGORY,
      sticky: true,
      autoDismiss: false,
      sound: false,
      priority: Notifications.AndroidNotificationPriority.LOW,
      color: '#F2A93B',
    },
    trigger: Platform.OS === 'android' ? { channelId: CAPTURE_CHANNEL } : null,
  });
}

export async function hidePersistentCapture(): Promise<void> {
  await Notifications.dismissNotificationAsync(PERSISTENT_ID).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(PERSISTENT_ID).catch(() => {});
}
