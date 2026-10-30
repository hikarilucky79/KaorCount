const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);

const shimPath = path.resolve(__dirname, 'react-native-gesture-handler-web-shim.js');
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

// Write the shim file to disk so Metro's file watcher and hasher can track it
fs.writeFileSync(shimPath, noopSource);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-gesture-handler') {
    return {
      type: 'sourceFile',
      filePath: shimPath,
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer.babelTransformerPath = require.resolve('react-native-svg-transformer/expo');
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'svg');
config.resolver.sourceExts.push('svg');
module.exports = config;