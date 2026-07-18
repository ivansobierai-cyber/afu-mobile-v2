import React, { useId, useState } from "react";
import { View, TextInput, TouchableOpacity, Text, Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";

type AuthAutoComplete =
  | "off"
  | "email"
  | "password"
  | "current-password"
  | "new-password"
  | "name"
  | "tel"
  | "username";

interface AuthTextInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  icon?: string;
  error?: string;
  editable?: boolean;
  autoComplete?: AuthAutoComplete;
}

function textContentTypeFor(
  autoComplete: AuthAutoComplete,
  secureTextEntry: boolean,
): "none" | "emailAddress" | "password" | "newPassword" | "name" | "telephoneNumber" | "username" {
  if (autoComplete === "email") return "emailAddress";
  if (autoComplete === "current-password" || autoComplete === "password") return "password";
  if (autoComplete === "new-password") return "newPassword";
  if (autoComplete === "name") return "name";
  if (autoComplete === "tel") return "telephoneNumber";
  if (autoComplete === "username") return "username";
  if (secureTextEntry) return "password";
  return "none";
}

/**
 * AuthTextInput — input de autenticação com label associado e autofill correto.
 */
export function AuthTextInput({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = "default",
  icon,
  error,
  editable = true,
  autoComplete = "off",
}: AuthTextInputProps) {
  const colors = useColors();
  const reactId = useId();
  const inputId = `auth-input-${reactId.replace(/:/g, "")}`;
  const [showPassword, setShowPassword] = useState(!secureTextEntry);
  const contentType = textContentTypeFor(autoComplete, secureTextEntry);

  return (
    <View className="mb-4">
      <Text
        nativeID={`${inputId}-label`}
        accessibilityRole="text"
        className="text-sm font-semibold text-foreground mb-2"
        {...(Platform.OS === "web"
          ? ({
              // @ts-expect-error web htmlFor association
              htmlFor: inputId,
              as: "label",
            } as object)
          : {})}
      >
        {label}
      </Text>

      <View
        className={`flex-row items-center border rounded-lg px-3 py-3 ${
          error ? "border-error bg-error/5" : "border-border bg-background"
        }`}
      >
        {icon && <Text className="text-lg mr-2">{icon}</Text>}

        <TextInput
          nativeID={inputId}
          accessibilityLabel={label}
          accessibilityLabelledBy={Platform.OS === "web" ? undefined : `${inputId}-label`}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          editable={editable}
          autoCorrect={false}
          autoCapitalize="none"
          autoComplete={autoComplete as any}
          textContentType={contentType}
          importantForAutofill="yes"
          className="flex-1 text-foreground text-base"
          style={{ color: colors.foreground }}
          {...(Platform.OS === "web" ? ({ id: inputId } as object) : {})}
        />

        {secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            className="ml-2"
            accessibilityRole="button"
            accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            <Text className="text-lg">{showPassword ? "👁️" : "👁️‍🗨️"}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text className="text-xs text-error mt-1" accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
}
