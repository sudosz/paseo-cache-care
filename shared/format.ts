/** Human-readable size label shared by the dashboard summary and rows. */
export function formatBytes(
  n: number | null,
  options: { native?: boolean } = {},
): string {
  if (n === null) return options.native ? "Native cleanup" : "Unmeasured";
  if (n >= 1024 ** 3) return `${(n / 1024 ** 3).toFixed(2)} GiB`;
  return `${(n / 1024 ** 2).toFixed(1)} MiB`;
}
