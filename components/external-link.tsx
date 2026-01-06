import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { Linking, type GestureResponderEvent, type PressableProps, Pressable } from 'react-native';

type Props = Omit<PressableProps, 'onPress'> & {
  href: string;
  onPress?: (event: GestureResponderEvent) => void | Promise<void>;
};

export function ExternalLink({ href, onPress, ...rest }: Props) {
  const handlePress = async (event: GestureResponderEvent) => {
    await onPress?.(event);

    if (process.env.EXPO_OS === 'web') {
      await Linking.openURL(href);
      return;
    }

    await openBrowserAsync(href, {
      presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
    });
  };

  return <Pressable accessibilityRole="link" {...rest} onPress={handlePress} />;
}
