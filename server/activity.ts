/** Match active processes to the cache family they can use. */
export function blockingProcesses(id: string, output: string): string[] {
  const family = id.startsWith("rust:") ? "cargo" : id.startsWith("py:") ? "python" : id;
  const names: Record<string, string[]> = {
    npm: ["npm", "npx"], pnpm: ["pnpm"], yarn: ["yarn"],
    pip: ["pip", "pip3"], uv: ["uv", "uvx"],
    cargo: ["cargo", "rustc"], go: ["go", "compile", "link"],
    "go-mod": ["go"], python: ["pip", "pip3"],
    conda: ["conda", "mamba"], brew: ["brew"],
    "apt-get": ["apt", "apt-get", "dpkg"], dnf: ["dnf", "rpm"],
    yum: ["yum", "rpm"], zypper: ["zypper", "rpm"],
    paccache: ["pacman", "paccache", "paru", "yay"], apk: ["apk"],
  };
  return output.split("\n").flatMap(line => {
    const match = line.trim().match(/^(\d+)\s+(\S+)\s+(\S+)/);
    if (!match || match[2].startsWith("Z")) return [];
    const [, pid, , command] = match;
    return (names[family] ?? []).includes(command) ? [`${command} (PID ${pid})`] : [];
  });
}
