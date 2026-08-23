import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import { Tabs } from "expo-router/js-tabs";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Loading } from "@/components/ui";

type Icon = keyof typeof Ionicons.glyphMap;

const tabs: { name: string; title: string; icon: Icon; iconActive: Icon }[] = [
  { name: "index", title: "Hoje", icon: "checkmark-circle-outline", iconActive: "checkmark-circle" },
  { name: "goals", title: "Metas", icon: "flag-outline", iconActive: "flag" },
  { name: "progress", title: "Progresso", icon: "stats-chart-outline", iconActive: "stats-chart" },
  { name: "trophies", title: "Troféus", icon: "trophy-outline", iconActive: "trophy" },
  { name: "fo", title: "Fô", icon: "leaf-outline", iconActive: "leaf" },
];

export default function TabsLayout() {
  const { ready, user } = useAuth();
  const { colors } = useTheme();

  if (!ready) return <Loading />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "500" },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      {tabs.map((t) => (
        <Tabs.Screen
          key={t.name}
          name={t.name}
          options={{
            title: t.title,
            tabBarIcon: ({ color, focused, size }) => <Ionicons name={focused ? t.iconActive : t.icon} size={size} color={color} />,
          }}
        />
      ))}
    </Tabs>
  );
}
