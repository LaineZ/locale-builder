const { signal } = Reactor;

export const expanded = signal(new Set());

export function cleanupExpanded() {
  expanded.value = new Set();
}

export function toggle(path) {
    const next = new Set(expanded.value);

    if (next.has(path)) next.delete(path);
    else next.add(path);

    expanded.value = next;
}

export function isOpen(path) {
    return expanded.value.has(path);
}