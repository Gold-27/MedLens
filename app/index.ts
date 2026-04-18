import 'react-native-gesture-handler';
import * as Reanimated from 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import { registerRootComponent } from 'expo';

// Polyfill for useAnimatedGestureHandler (removed in Reanimated 3/4)
// This is required for @react-navigation/drawer compatibility with Reanimated 4
if (!(Reanimated as any).useAnimatedGestureHandler) {
  (Reanimated as any).useAnimatedGestureHandler = (handlers: any) => {
    return (event: any) => {
      'worklet';
      if (handlers.onStart) handlers.onStart(event, {});
      if (handlers.onActive) handlers.onActive(event, {});
      if (handlers.onEnd) handlers.onEnd(event, {});
      if (handlers.onFinish) handlers.onFinish(event, true);
    };
  };
}

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
