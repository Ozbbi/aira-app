// Required for Reanimated 4 + Worklets on native builds.
// `react-native-worklets/plugin` MUST be the last plugin in the list.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'],
  };
};
