import type { PluginClientContext, PluginSidebarItemProps } from "@getpaseo/plugin/client";
import { SidebarRow } from "@getpaseo/plugin/client/ui";
import { Dashboard } from "./client/dashboard";
function Item({ currentScreen, openScreen }: PluginSidebarItemProps) {
  return <SidebarRow icon="Trash2" active={currentScreen?.screenId === "care"} onPress={() => openScreen({ screenId: "care" })} />;
}
export default function contribute(client: PluginClientContext) {
  client.addScreen({ id: "care", title: "Cache Care", Component: Dashboard });
  client.addSidebarHeaderItem({ id: "care", title: "Cache Care", Component: Item });
  return () => {};
}
