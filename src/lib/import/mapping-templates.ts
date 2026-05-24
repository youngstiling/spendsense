import { readJsonStorage } from "@/lib/safe-storage";
import type { ColumnMapping } from "./types";

export type MappingTemplate = {
  id: string;
  name: string;
  mapping: ColumnMapping;
  createdAt?: string;
};

const DEMO_KEY = "spendsense-mapping-templates";

export function listDemoMappingTemplates(): MappingTemplate[] {
  const raw = readJsonStorage<
    Array<{ name: string; mapping: ColumnMapping }>
  >(DEMO_KEY, []);
  return raw.map((t, i) => ({
    id: `demo-${i}-${t.name}`,
    name: t.name,
    mapping: t.mapping,
  }));
}

export function saveDemoMappingTemplate(name: string, mapping: ColumnMapping) {
  const existing = listDemoMappingTemplates();
  const trimmed = name.trim();
  const without = existing.filter((t) => t.name !== trimmed);
  const next = [{ name: trimmed, mapping }, ...without.map((t) => ({ name: t.name, mapping: t.mapping }))];
  localStorage.setItem(DEMO_KEY, JSON.stringify(next.slice(0, 20)));
}

export async function fetchMappingTemplates(
  demo: boolean
): Promise<{ templates: MappingTemplate[]; error?: string }> {
  if (demo) {
    return { templates: listDemoMappingTemplates() };
  }

  try {
    const res = await fetch("/api/mapping-templates");
    const data = await res.json();
    if (!res.ok) {
      return { templates: [], error: data.error ?? "Could not load templates." };
    }
    return {
      templates: (data.templates ?? []).map(
        (t: { id: string; name: string; mapping: ColumnMapping; created_at?: string }) => ({
          id: t.id,
          name: t.name,
          mapping: t.mapping,
          createdAt: t.created_at,
        })
      ),
    };
  } catch {
    return { templates: [], error: "Could not load templates." };
  }
}
