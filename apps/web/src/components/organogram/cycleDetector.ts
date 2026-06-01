export type OrgRow = { name: string; reportsTo?: string };

// Detect cycles in reporting relationships using DFS.
// Returns list of names involved in any cycle (one cycle's nodes) or empty array.
export function detectCycle(rows: OrgRow[]): string[] {
  const adj = new Map<string, string[]>();
  for (const r of rows) {
    const from = r.name;
    const to = r.reportsTo;
    if (!adj.has(from)) adj.set(from, []);
    if (to) {
      if (!adj.has(to)) adj.set(to, []);
      adj.get(from)!.push(to);
    }
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const stack: string[] = [];
  const result: string[] = [];

  function dfs(n: string): boolean {
    if (visiting.has(n)) {
      // found cycle; collect cycle nodes
      const idx = stack.indexOf(n);
      if (idx >= 0) {
        for (let i = idx; i < stack.length; i++) result.push(stack[i]);
        result.push(n);
      } else {
        result.push(n);
      }
+      return true;
+    }
+    if (visited.has(n)) return false;
+    visiting.add(n);
+    stack.push(n);
+    for (const m of adj.get(n) || []) {
+      if (dfs(m)) return true;
+    }
+    stack.pop();
+    visiting.delete(n);
+    visited.add(n);
+    return false;
+  }
+
+  for (const node of adj.keys()) {
+    if (dfs(node)) break;
+  }
+
+  // Ensure unique
+  return Array.from(new Set(result));
+}
