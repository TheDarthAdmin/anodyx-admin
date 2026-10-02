/** Read-only rendering of passport field values (nested objects from the battery schema). */

const UNIT_KEYS = /Unit$/;

export function humanize(key: string): string {
  const name = key.includes(".") ? key.split(".").pop()! : key;
  return name
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/**
 * Pair every `<prefix>Value…` with its `<prefix>Unit`:
 * {voltValue: 36, voltUnit: "V", temperatureRangeLowerBoundaryValue: -10, …Unit: "°C"}
 * → [["Volt", "36 V"], ["Temperature range lower boundary", "-10 °C"]].
 * Null when some key has no partner, so the generic view takes over.
 */
export function valuePairs(obj: Record<string, unknown>): [string, string][] | null {
  const keys = Object.keys(obj);
  const units = keys.filter((k) => UNIT_KEYS.test(k));
  if (!units.length) return null;
  const used = new Set<string>();
  const pairs: [string, string][] = [];
  for (const unitKey of units) {
    const prefix = unitKey.replace(UNIT_KEYS, "");
    let values = keys.filter((k) => k !== unitKey && k.startsWith(prefix) && k.slice(prefix.length).startsWith("Value"));
    // One unit with differently named values: percentUnit + percentageValue,
    // degreeCelsiusUnit + celsiusValue, ampereHour…Unit + amperehour…Value.
    if (!values.length && units.length === 1) values = keys.filter((k) => k !== unitKey && /Value/.test(k));
    if (!values.length) return null;
    used.add(unitKey);
    for (const valueKey of values) {
      used.add(valueKey);
      const suffix = valueKey.slice(prefix.length + "Value".length);
      pairs.push([humanize(prefix + suffix), `${String(obj[valueKey])} ${String(obj[unitKey])}`.trim()]);
    }
  }
  return used.size === keys.length ? pairs : null;
}

export function ValueView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="text-muted-foreground">–</span>;
  if (Array.isArray(value)) {
    return (
      <ul className="grid gap-2">
        {value.map((v, i) => (
          <li key={i} className="rounded-lg bg-paper px-3 py-2">
            <ValueView value={v} />
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const pairs = valuePairs(obj);
    if (pairs && pairs.length === 1) return <span className="num">{pairs[0][1]}</span>;
    if (pairs) {
      return (
        <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(140px,max-content)_1fr]">
          {pairs.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="num">{value}</dd>
            </div>
          ))}
        </dl>
      );
    }
    if (typeof obj.url === "string") {
      return (
        <a href={obj.url} target="_blank" rel="noreferrer noopener" className="break-all underline underline-offset-4">
          {typeof obj.resourceTitle === "string" ? obj.resourceTitle : obj.url}
        </a>
      );
    }
    return (
      <dl className="grid gap-x-4 gap-y-1 sm:grid-cols-[minmax(140px,max-content)_1fr]">
        {Object.entries(obj).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{humanize(k)}</dt>
            <dd className="min-w-0 break-words">
              <ValueView value={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  if (typeof value === "number") return <span className="num">{value}</span>;
  return <span className="break-words">{String(value)}</span>;
}

export function FieldList({ data }: { data: Record<string, unknown> }) {
  const groups = new Map<string, [string, unknown][]>();
  for (const [key, value] of Object.entries(data)) {
    const group = key.includes(".") ? key.split(".")[0] : "overig";
    groups.set(group, [...(groups.get(group) ?? []), [key, value]]);
  }
  if (!groups.size) return <p className="text-sm text-muted-foreground">Geen velden ingevuld.</p>;
  return (
    <div className="grid gap-8">
      {[...groups.entries()].map(([group, entries]) => (
        <section key={group} className="grid gap-3">
          <h3 className="font-bold">{humanize(group)}</h3>
          <dl className="divide-y divide-line rounded-xl bg-white text-sm ring-1 ring-line">
            {entries.map(([key, value]) => (
              <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(200px,1fr)_2fr] sm:gap-4">
                <dt className="font-medium">{humanize(key)}</dt>
                <dd className="min-w-0">
                  <ValueView value={value} />
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
