/**
 * FASE 2N — navegação lateral (desktop) e inferior (mobile) do painel da propriedade.
 */
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import type { PanelTab } from "@/lib/propriedades/property-workspace";
import {
  DESKTOP_NAV_ITEMS,
  MOBILE_BOTTOM_NAV,
  MOBILE_MORE_MENU_ITEMS,
  resolveMobilePrimaryHighlight,
  type MobilePrimaryTab,
} from "@/lib/propriedades/property-navigation";

type Props = {
  isWide: boolean;
  activeTab: PanelTab;
  onSelectTab: (tab: PanelTab) => void;
  /** Mobile: dentro de Mais, voltar ao menu hub */
  onMobileMoreBack?: () => void;
  showMobileMoreMenu: boolean;
};

export function PropertyWorkspaceNav({
  isWide,
  activeTab,
  onSelectTab,
  onMobileMoreBack,
  showMobileMoreMenu,
}: Props) {
  const colors = useColors();
  const mobileHighlight = resolveMobilePrimaryHighlight(activeTab);

  if (isWide) {
    return (
      <View
        style={[
          styles.desktopSidebar,
          { backgroundColor: colors.surface, borderRightColor: colors.border },
        ]}
        accessibilityRole="tablist"
      >
        <ScrollView contentContainerStyle={{ paddingVertical: 8 }}>
          {DESKTOP_NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => onSelectTab(item.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
                style={[
                  styles.desktopItem,
                  active && { backgroundColor: colors.primary + "18", borderLeftColor: colors.primary },
                ]}
              >
                <IconSymbol
                  name={item.icon as "house.fill"}
                  size={18}
                  color={active ? colors.primary : colors.muted}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? "700" : "500",
                    color: active ? colors.primary : colors.foreground,
                    flex: 1,
                  }}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  if (showMobileMoreMenu) {
    return (
      <View
        style={[
          styles.mobileBar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
        accessibilityRole="tablist"
      >
        {MOBILE_BOTTOM_NAV.map((item) => {
          const primary = item.mobilePrimary as MobilePrimaryTab;
          const active = mobileHighlight === primary;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.mobileTab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              onPress={() => onSelectTab(item.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={item.label}
            >
              <IconSymbol
                name={item.icon as "house.fill"}
                size={18}
                color={active ? colors.primary : colors.muted}
              />
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: active ? "700" : "500",
                  color: active ? colors.primary : colors.muted,
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  if (onMobileMoreBack) {
    return (
      <View>
        <TouchableOpacity
          onPress={onMobileMoreBack}
          accessibilityRole="button"
          accessibilityLabel="Voltar ao menu Mais"
          style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8, minHeight: 44, paddingHorizontal: 4 }}
        >
          <IconSymbol name="chevron.left" size={18} color={colors.primary} />
          <Text style={{ color: colors.primary, fontWeight: "700" }}>Mais</Text>
        </TouchableOpacity>
        <View
          style={[
            styles.mobileBar,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
          accessibilityRole="tablist"
        >
          {MOBILE_BOTTOM_NAV.map((item) => {
            const primary = item.mobilePrimary as MobilePrimaryTab;
            const active = mobileHighlight === primary;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.mobileTab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
                onPress={() => onSelectTab(item.id)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                accessibilityLabel={item.label}
              >
                <IconSymbol
                  name={item.icon as "house.fill"}
                  size={18}
                  color={active ? colors.primary : colors.muted}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: active ? "700" : "500",
                    color: active ? colors.primary : colors.muted,
                  }}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.mobileBar,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
      ]}
      accessibilityRole="tablist"
    >
      {MOBILE_BOTTOM_NAV.map((item) => {
        const primary = item.mobilePrimary as MobilePrimaryTab;
        const active = mobileHighlight === primary;
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.mobileTab, active && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => onSelectTab(item.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
          >
            <IconSymbol
              name={item.icon as "house.fill"}
              size={18}
              color={active ? colors.primary : colors.muted}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: active ? "700" : "500",
                color: active ? colors.primary : colors.muted,
              }}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  desktopSidebar: {
    width: 220,
    borderRightWidth: 1,
    maxHeight: "100%",
  },
  desktopItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderLeftWidth: 3,
    borderLeftColor: "transparent",
    minHeight: 44,
  },
  mobileBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  mobileTab: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 2,
  },
  moreCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
});
