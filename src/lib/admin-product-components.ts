export function parseProductComponents(value: string) {
  return value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
}

export function serializeProductComponents(items: string[]) {
  return items
    .map(item => item.trim())
    .filter(Boolean)
    .join("\n");
}

export function normalizeProductComponents(items: string[], images: string[]) {
  const entries = items
    .map((name, index) => ({ name: name.trim(), image: images[index] ?? "" }))
    .filter(entry => entry.name);

  return {
    components: serializeProductComponents(entries.map(entry => entry.name)),
    componentImages: entries.map(entry => entry.image),
  };
}
