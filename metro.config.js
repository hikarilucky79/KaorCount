const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const noopSource = `
module.exports = {
  enableExperimentalWebImplementation: true,
  GestureHandlerRootView: ({ children }) => children,
  Swipeable: ({ children }) => children,
  DrawerLayout: ({ children }) => children,
  Pressable: require('react-native').Pressable,
  ScrollView: require('react-native').ScrollView,
  TextInput: require('react-native').TextInput,
  TouchableHighlight: require('react-native').TouchableHighlight,
  TouchableNativeFeedback: require('react-native').TouchableNativeFeedback,
  TouchableOpacity: require('react-native').TouchableOpacity,
  TouchableWithoutFeedback: require('react-native').TouchableWithoutFeedback,
  State: {},
  PanGestureHandler: () => null,
  TapGestureHandler: () => null,
  LongPressGestureHandler: () => null,
  NativeViewGestureHandler: () => null,
  PinchGestureHandler: () => null,
  RotationGestureHandler: () => null,
  FlingGestureHandler: () => null,
  ForceTouchGestureHandler: () => null,
  Directions: {},
  gestureHandlerRootHOC: (Component) => Component,
};
`;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-gesture-handler') {
    return {
      type: 'source',
      filePath: 'react-native-gesture-handler-web-shim.js',
      content: noopSource,
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.resolver.platforms = ['ios', 'android', 'web', 'native'];

module.exports = config;
