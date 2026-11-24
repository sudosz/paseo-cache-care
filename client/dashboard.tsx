import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { useRpc, type PluginScreenProps } from "@getpaseo/plugin/client";
import { scan, clean, type Entry } from "../shared/contracts";
import { formatBytes } from "../shared/format";

const size = (n: number | null, native = false) => formatBytes(n, { native });
const sizeLabel = (e: Entry) => size(e.bytes, !e.path);
const layers = ["All", "Downloads", "Build", "System", "Containers", "Environments", "Android"];

export function Dashboard({ theme, layout }: PluginScreenProps) {
  const scanRpc = useRpc(scan);
  const cleanRpc = useRpc(clean);
  const inspect = useMutation({ mutationFn: scanRpc, onSuccess: () => { setSelected([]); setConfirm(false); } });
  const cleanup = useMutation({ mutationFn: cleanRpc, onSuccess: () => { setSelected([]); setConfirm(false); inspect.mutate({}); } });
  const [selected, setSelected] = useState<string[]>([]);
  const [layer, setLayer] = useState("All");
  const [query, setQuery] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [detail, setDetail] = useState<Entry | null>(null);
  const c = theme.colors;
  const text = { color: c.foreground };
  const muted = { color: c.foregroundMuted, fontSize: 12 };
  const border = c.foregroundMuted + "30";
  const entries = inspect.data?.entries ?? [];
  const visible = entries.filter(e => (unavailable || e.available) && (layer === "All" || e.layer === layer) && `${e.name} ${e.path ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const picked = entries.filter(e => selected.includes(e.id));
  const selectable = visible.filter(e => e.cleanable);
  const visibleSelected = selectable.filter(e => selected.includes(e.id)).length;
  const hiddenSelected = selected.filter(id => !visible.some(e => e.id === id)).length;
  const allVisibleSelected = selectable.length > 0 && visibleSelected === selectable.length;
  const measuredTotal = entries.filter(e => e.cleanable).reduce((n, e) => n + (e.bytes ?? 0), 0);
  const unmeasuredPaths = entries.filter(e => e.cleanable && e.path && e.bytes === null).length;
  const disk = inspect.data?.disk;
  const lowDisk = !!disk && disk.total > 0 && disk.free < 10 * 1024 ** 3;
  const working = inspect.isPending || cleanup.isPending;
  function selectVisible(nonOptional = false) {
    if (working) return;
    setConfirm(false);
    setSelected(s => [...new Set([...s, ...selectable.filter(e => !nonOptional || !e.optional).map(e => e.id)])]);
  }
  function clearVisible() {
    if (working) return;
    setConfirm(false);
    setSelected(s => s.filter(id => !selectable.some(e => e.id === id)));
  }
  function toggle(e: Entry) {
    if (!e.cleanable || working) return;
    setConfirm(false);
    setSelected(s => s.includes(e.id) ? s.filter(id => id !== e.id) : [...s, e.id]);
  }
  function button(label: string, action: () => void, primary = false, disabled = false) {
    return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={action} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 7, borderWidth: 1, borderColor: border, backgroundColor: primary ? c.accent : c.surface0, opacity: disabled ? 0.45 : 1 }}><Text style={{ color: primary ? c.accentForeground : c.foreground, fontWeight: "600", fontSize: 13 }}>{label}</Text></Pressable>;
  }
  return <ScrollView style={{ flex: 1, backgroundColor: c.surface0 }} contentContainerStyle={{ padding: layout.compact ? 16 : 24, gap: 20 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <View style={{ gap: 5 }}><Text style={{ ...text, fontSize: 25, fontWeight: "700" }}>Cache Care</Text><Text style={muted}>A little maintenance. More room to build.</Text></View>
      {button(inspect.isPending ? "Scanning host…" : "Scan host", () => { inspect.mutate({}); }, true, working)}
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", borderWidth: 1, borderColor: border, borderRadius: 10 }}>
      {[["MEASURED CACHES", inspect.data ? `${size(measuredTotal)}${unmeasuredPaths ? ` + ${unmeasuredPaths} unmeasured` : ""}` : "—"], ["FREE DISK", disk ? size(disk.free) : "—"], ["AVAILABLE", inspect.data ? `${entries.filter(e => e.available).length} adapters` : "Not scanned"], ["SELECTED", `${selected.length} actions`]].map(([label, value]) => <View key={label} style={{ flex: 1, minWidth: 140, padding: 18, gap: 8 }}><Text style={{ ...muted, letterSpacing: 1 }}>{label}</Text><Text style={{ ...text, fontSize: 22, fontWeight: "600" }}>{value}</Text></View>)}
    </View>
    {lowDisk && <View style={{ borderWidth: 1, borderColor: border, borderRadius: 10, padding: 14, gap: 5 }}><Text style={{ ...text, fontWeight: "600" }}>Low disk: {size(disk.free)} free of {size(disk.total)}</Text><Text style={muted}>Scan and review before cleaning. Nothing is deleted until you confirm; in-use files are skipped where possible.</Text></View>}
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <TextInput accessibilityLabel="Search caches" placeholder="Search tools, caches, or paths" placeholderTextColor={c.foregroundMuted} value={query} onChangeText={setQuery} style={{ ...text, minWidth: 220, flex: 1, borderWidth: 1, borderColor: border, borderRadius: 7, padding: 10 }} />
      {button(unavailable ? "Hide unavailable" : "Show unavailable", () => setUnavailable(!unavailable))}
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={{ flexDirection: "row", gap: 7 }}>{layers.map(value => <View key={value}>{button(value, () => setLayer(value), layer === value)}</View>)}</View></ScrollView>
    {(inspect.error || cleanup.error) && <Text accessibilityRole="alert" style={text}>{inspect.error?.message ?? cleanup.error?.message}</Text>}
    <View style={{ flexDirection: layout.compact ? "column" : "row", alignItems: "flex-start", gap: 20 }}>
      <View style={{ flex: 1, alignSelf: "stretch", borderWidth: 1, borderColor: border, borderRadius: 10, overflow: "hidden" }}>
        <View style={{ padding: 14, borderBottomWidth: 1, borderColor: border, gap: 12 }}>
          <Text style={{ ...text, fontWeight: "600" }}>{inspect.data ? `${visible.length} cache locations & tools` : "Your host, neatly sorted"}</Text>
          {inspect.data && <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
              {button(allVisibleSelected ? "Deselect visible" : "Select all visible", () => allVisibleSelected ? clearVisible() : selectVisible(), false, working || !selectable.length)}
              {button("Select non-optional", () => selectVisible(true), false, working || !selectable.some(e => !e.optional && !selected.includes(e.id)))}
              {button("Clear selection", () => { setSelected([]); setConfirm(false); }, false, working || !selected.length)}
            </View>
            <Text accessibilityLiveRegion="polite" style={muted}>{visibleSelected} of {selectable.length} available actions selected in this view{hiddenSelected ? ` · ${hiddenSelected} selected outside this filter` : ""}. Select all includes optional actions.</Text>
          </>}
        </View>
        {!inspect.data && <View style={{ padding: 32, gap: 12 }}><Text style={{ ...text, fontSize: 18, fontWeight: "600" }}>Start with a scan</Text><Text style={muted}>Discover available tools and measure known cache locations. Nothing is deleted during scanning.</Text><Text style={muted}>Downloads · Build output · Containers · System packages</Text></View>}
        {inspect.data && !visible.length && <Text style={{ ...muted, padding: 24 }}>No matching adapters. Try another category or show unavailable tools.</Text>}
        {visible.map(e => <View key={e.id} style={{ flexDirection: "row", gap: 12, padding: 15, borderBottomWidth: 1, borderColor: border, alignItems: "center", opacity: e.available ? 1 : 0.6 }}>
          <Pressable accessibilityRole="checkbox" accessibilityLabel={`Select ${e.name}`} accessibilityState={{ checked: selected.includes(e.id), disabled: !e.cleanable }} disabled={!e.cleanable || working} onPress={() => toggle(e)} style={{ width: 25, height: 25, borderRadius: 5, borderWidth: 1, borderColor: c.foregroundMuted, alignItems: "center", justifyContent: "center", backgroundColor: selected.includes(e.id) ? c.accent : c.surface0 }}><Text style={{ color: selected.includes(e.id) ? c.accentForeground : c.foreground }}>{selected.includes(e.id) ? "✓" : ""}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`Details for ${e.name}`} onPress={() => setDetail(e)} style={{ flex: 1, gap: 5 }}><Text style={{ ...text, fontWeight: "600" }}>{e.name}</Text><Text numberOfLines={1} style={muted}>{e.path ?? e.description}</Text><Text style={muted}>{e.layer} · {e.optional ? "Your call · " : "Safe · "}{e.reason}</Text></Pressable>
          <Text style={{ ...text, fontSize: 12 }}>{sizeLabel(e)}</Text>
        </View>)}
      </View>
      <View style={{ width: layout.compact ? "100%" : 300, gap: 16 }}>
        <View style={{ padding: 18, gap: 14, borderWidth: 1, borderColor: border, borderRadius: 10 }}>
          <Text style={{ ...text, fontSize: 16, fontWeight: "600" }}>Cleanup plan</Text><Text style={{ ...text, fontSize: 28, fontWeight: "600" }}>{size(picked.reduce((n, e) => n + (e.bytes ?? 0), 0))}</Text>
          <Text style={muted}>Measured selection. Native-command actions may reclaim additional space; no estimate is invented.</Text>
          {picked.map(e => <Text key={e.id} style={text}>• {e.name}</Text>)}
          {selected.length > 40 && <Text style={text}>Maximum 40 actions per run. Deselect some actions before continuing.</Text>}
          {confirm && <Text style={text}>Run these {selected.length} actions? Deleted caches must be rebuilt or downloaded again. Keep agents and builds idle.</Text>}
          {button(cleanup.isPending ? "Cleaning…" : confirm ? "Confirm cleanup" : "Review cleanup", () => { if (!confirm) setConfirm(true); else cleanup.mutate({ token: inspect.data!.token, ids: selected }); }, true, working || !selected.length || selected.length > 40)}
          <Text style={muted}>No background polling. No automatic sudo. Scans expire after five minutes.</Text>
        </View>
        {inspect.data?.space?.length ? <View style={{ padding: 18, gap: 10, borderWidth: 1, borderColor: border, borderRadius: 10 }}><Text style={{ ...text, fontSize: 16, fontWeight: "600" }}>Largest under /workspace</Text>{inspect.data.space.map(item => <View key={item.path} style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}><Text numberOfLines={1} style={{ ...muted, flex: 1 }}>{item.path}</Text><Text style={muted}>{size(item.bytes)}</Text></View>)}<Text style={muted}>Read-only size map. No files are touched.</Text></View> : null}
        {detail && <View style={{ padding: 18, gap: 12, borderWidth: 1, borderColor: border, borderRadius: 10 }}><Text style={{ ...text, fontWeight: "600" }}>{detail.name}</Text><Text style={muted}>{detail.description}</Text>{detail.path && <Text selectable style={muted}>{detail.path}</Text>}{button("Close details", () => setDetail(null))}</View>}
        {cleanup.data && <View style={{ padding: 18, gap: 12, borderWidth: 1, borderColor: border, borderRadius: 10 }}><Text style={{ ...text, fontWeight: "600" }}>Last run · {cleanup.data.results.filter(r => r.ok).length} completed · {cleanup.data.results.filter(r => !r.ok).length} skipped or failed</Text>{cleanup.data.results.map(r => <View key={r.id}><Text style={text}>{r.ok ? "✓" : "!"} {entries.find(e => e.id === r.id)?.name ?? r.id}</Text><Text selectable style={muted}>{r.message}</Text></View>)}<Text style={muted}>Free-space change: {size(cleanup.data.reclaimedBytes)}. Cache sizes refresh after each run.</Text></View>}
      </View>
    </View>
  </ScrollView>;
}
