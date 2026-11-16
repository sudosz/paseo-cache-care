import type { PluginServerContext } from "@getpaseo/plugin/server";
import { scan, clean } from "./shared/contracts";
import { inspect, cleanup } from "./server/engine";
export default function contribute(server: PluginServerContext) {
  server.handle(scan, inspect);
  server.handle(clean, cleanup);
  return () => {};
}
