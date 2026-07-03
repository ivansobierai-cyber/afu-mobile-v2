/**
 * NativeWind's css-interop registers `SafeAreaView` from `react-native`, which
 * triggers RN's deprecation warning. Redirect to react-native-safe-area-context.
 */
import { SafeAreaView as SafeAreaViewContext } from "react-native-safe-area-context";
import { cssInterop } from "nativewind";

const ReactNative = require("react-native") as typeof import("react-native");

const existing = Object.getOwnPropertyDescriptor(ReactNative, "SafeAreaView");
// On web / HMR the property may already be non-configurable — skip redefine.
if (!existing || existing.configurable) {
  Object.defineProperty(ReactNative, "SafeAreaView", {
    value: SafeAreaViewContext,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

cssInterop(SafeAreaViewContext, { className: "style" });
