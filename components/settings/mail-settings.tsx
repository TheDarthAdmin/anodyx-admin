"use client";

import { CheckCircle, EnvelopeSimple, PaperPlaneTilt, Warning } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Panel, Pill, Section } from "@/components/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messageFor, postJson, requestJson } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import {
  PROVIDER_HINTS,
  SECURITY_OPTIONS,
  defaultPort,
  formErrors,
  formFrom,
  isDirty,
  mailStatus,
  payloadFrom,
  type MailForm,
  type PasswordMode,
} from "@/lib/mail-settings";
import type { MailSecurity, MailSettings, MailTestResult } from "@/lib/types";
import { cn } from "@/lib/utils";

type TestOutcome = { ok: true; to: string } | { ok: false; error: string } | null;

export function MailSettingsPanel({ initial, adminEmail }: { initial: MailSettings; adminEmail: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(initial);
  const [form, setForm] = useState<MailForm>(() => formFrom(initial));
  const [password, setPassword] = useState<PasswordMode>({ kind: "keep" });
  const [errors, setErrors] = useState<Partial<Record<keyof MailForm, string>>>({});
  const [saveState, setSaveState] = useState<{ busy: boolean; error: string | null; done: boolean }>({
    busy: false,
    error: null,
    done: false,
  });
  const [testTo, setTestTo] = useState(adminEmail);
  const [testBusy, setTestBusy] = useState(false);
  const [outcome, setOutcome] = useState<TestOutcome>(null);
  const [confirmOff, setConfirmOff] = useState(false);
  const [offBusy, setOffBusy] = useState(false);

  const status = mailStatus(saved);
  const dirty = isDirty(form, saved, password);
  const set = (key: keyof MailForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaveState((s) => ({ ...s, done: false }));
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const found = formErrors(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaveState({ busy: true, error: null, done: false });
    const result = await requestJson("PUT", "/settings/mail", payloadFrom(form, password));
    if (result.status !== 200) {
      setSaveState({ busy: false, error: messageFor(result), done: false });
      return;
    }
    const next = result.body as MailSettings;
    setSaved(next);
    setForm(formFrom(next));
    setPassword({ kind: "keep" });
    setOutcome(null);
    setSaveState({ busy: false, error: null, done: true });
    router.refresh();
  }

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    setTestBusy(true);
    setOutcome(null);
    setSaveState((st) => ({ ...st, done: false }));
    const result = await postJson("/settings/mail/test", { to: testTo });
    setTestBusy(false);
    if (result.status !== 200) {
      setOutcome({ ok: false, error: messageFor(result) });
      return;
    }
    const body = result.body as MailTestResult;
    setSaved(body);
    setOutcome(body.ok ? { ok: true, to: testTo } : { ok: false, error: body.error ?? "Onbekende fout" });
    router.refresh();
  }

  async function disable() {
    setOffBusy(true);
    const result = await postJson("/settings/mail/disable");
    setOffBusy(false);
    setConfirmOff(false);
    if (result.status === 200) {
      setSaved(result.body as MailSettings);
      setOutcome(null);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-12">
      {/* Status */}
      <Panel className="flex flex-wrap items-start gap-4 p-5">
        <span
          aria-hidden
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl",
            status.tone === "ok" && "bg-volt text-ink",
            status.tone === "idle" && "bg-paper-deep text-ink",
            status.tone === "error" && "bg-signal text-ink",
          )}
        >
          {status.tone === "ok" ? <CheckCircle className="size-5" weight="fill" /> : status.tone === "error" ? <Warning className="size-5" weight="fill" /> : <EnvelopeSimple className="size-5" />}
        </span>
        <div className="grid min-w-[min(100%,16rem)] flex-1 gap-1" role="status" aria-live="polite" data-testid="mail-status">
          <p className="text-lg leading-tight font-bold tracking-tight">{status.title}</p>
          <p className="max-w-prose text-sm text-muted-foreground">{status.detail}</p>
          {saved.verified_at && saved.active_source === "platform" ? (
            <p className="num text-xs text-muted-foreground">Getest op {formatDateTime(saved.verified_at)}</p>
          ) : null}
          {saved.last_test_error && saved.active_source !== "platform" && !outcome ? (
            <p className="mt-1 max-w-prose rounded-lg bg-signal/15 px-3 py-2 font-mono text-[0.8125rem] text-signal-text break-words">
              {saved.last_test_error}
            </p>
          ) : null}
        </div>
        {saved.enabled ? (
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setConfirmOff(true)}>
            Uitschakelen
          </Button>
        ) : null}
      </Panel>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
        {/* Connection */}
        <Section title="SMTP-server">
          <form className="grid gap-5" onSubmit={save} noValidate>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_120px]">
              <Field id="mail-host" label="Server" error={errors.host}>
                <Input
                  id="mail-host"
                  value={form.host}
                  placeholder="smtp.voorbeeld.be"
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={!!errors.host}
                  onChange={(e) => set("host", e.target.value)}
                />
              </Field>
              <Field id="mail-port" label="Poort" error={errors.port}>
                <Input
                  id="mail-port"
                  inputMode="numeric"
                  value={form.port}
                  className="num"
                  aria-invalid={!!errors.port}
                  onChange={(e) => set("port", e.target.value.replace(/\D/g, ""))}
                />
              </Field>
            </div>

            <fieldset className="grid gap-2">
              <legend className="mb-2 text-sm font-medium">Beveiliging</legend>
              <div className="flex flex-wrap gap-2">
                {SECURITY_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className={cn(
                      "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm ring-1 transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      form.security === o.value ? "bg-ink text-paper ring-ink" : "bg-white ring-line hover:bg-paper-deep",
                    )}
                  >
                    <input
                      type="radio"
                      name="security"
                      value={o.value}
                      className="sr-only"
                      checked={form.security === o.value}
                      onChange={() => {
                        const before = form.security;
                        setForm((f) => ({
                          ...f,
                          security: o.value as MailSecurity,
                          // Follow the usual port unless someone typed a custom one.
                          port: f.port === String(defaultPort(before)) ? String(o.port) : f.port,
                        }));
                      }}
                    />
                    {o.label}
                    <span className={cn("num text-xs", form.security === o.value ? "text-shell-dim" : "text-muted-foreground")}>
                      {o.port}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>

            <Field id="mail-user" label="Gebruikersnaam" hint="Laat leeg als de server geen login vraagt.">
              <Input
                id="mail-user"
                value={form.username}
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => set("username", e.target.value)}
              />
            </Field>

            <PasswordField saved={saved.has_password ?? false} mode={password} onChange={setPassword} />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="mail-from" label="Afzenderadres" error={errors.from_address}>
                <Input
                  id="mail-from"
                  type="email"
                  value={form.from_address}
                  placeholder="noreply@voorbeeld.be"
                  aria-invalid={!!errors.from_address}
                  onChange={(e) => set("from_address", e.target.value)}
                />
              </Field>
              <Field id="mail-from-name" label="Afzendernaam" hint="Bijvoorbeeld: Anodyx">
                <Input id="mail-from-name" value={form.from_name} onChange={(e) => set("from_name", e.target.value)} />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" disabled={saveState.busy || !dirty}>
                {saveState.busy ? "Opslaan…" : "Opslaan"}
              </Button>
              {saveState.done && !dirty ? (
                <p className="text-sm text-muted-foreground" role="status">
                  Opgeslagen. Verstuur nu een testmail om de instelling te activeren.
                </p>
              ) : null}
              {saveState.error ? (
                <p role="alert" className="text-sm font-medium text-signal-text">
                  {saveState.error}
                </p>
              ) : null}
            </div>
          </form>
        </Section>

        {/* How it works + presets */}
        <aside className="grid content-start gap-8 text-sm">
          <div className="grid gap-2">
            <h2 className="font-bold">Zo werkt het</h2>
            <ul className="grid gap-2 text-muted-foreground">
              <li>Een instelling wordt pas gebruikt nadat een testmail is gelukt.</li>
              <li>Wijzig je server, poort, beveiliging, login of afzender, dan staat ze uit tot een nieuwe test slaagt.</li>
              <li>Na activeren gebruiken API en worker de server binnen ongeveer een minuut.</li>
              <li>Het wachtwoord wordt versleuteld bewaard en nooit meer getoond.</li>
            </ul>
          </div>
          <div className="grid gap-2">
            <h2 className="font-bold">Veelgebruikte servers</h2>
            <ul className="grid gap-1">
              {PROVIDER_HINTS.map((p) => (
                <li key={p.name}>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, host: p.host, port: String(p.port), security: p.security }))}
                    className="grid w-full gap-0.5 rounded-lg px-3 py-2 text-left transition-colors hover:bg-paper-deep focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="font-medium">{p.name}</span>
                      <span className="num truncate text-xs text-muted-foreground">
                        {p.host}:{p.port}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">{p.note}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="px-3 text-xs text-muted-foreground">Klik om server en poort in te vullen; opslaan doe je zelf.</p>
          </div>
        </aside>
      </div>

      {/* Test */}
      <Section title="Testmail">
        <form className="grid gap-4" onSubmit={sendTest}>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid min-w-[260px] flex-1 gap-2 sm:max-w-md">
              <Label htmlFor="mail-test-to">Versturen naar</Label>
              <Input id="mail-test-to" type="email" required value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            </div>
            <Button type="submit" variant="outline" disabled={!saved.configured || dirty || testBusy}>
              <PaperPlaneTilt /> {testBusy ? "Versturen…" : "Testmail versturen"}
            </Button>
          </div>
          {!saved.configured ? (
            <p className="text-sm text-muted-foreground">Sla eerst een SMTP-server op.</p>
          ) : dirty ? (
            <p className="text-sm text-muted-foreground">Je hebt niet-opgeslagen wijzigingen. Sla eerst op, dan test je de nieuwe instelling.</p>
          ) : null}
          {outcome?.ok ? (
            <p role="status" className="flex items-center gap-2 text-sm font-medium">
              <Pill tone="ok">Gelukt</Pill> Testmail verstuurd naar {outcome.to}. Deze instelling is nu actief.
            </p>
          ) : null}
          {outcome && !outcome.ok ? (
            <div role="alert" className="grid gap-1 rounded-xl bg-signal/15 px-4 py-3 text-sm">
              <p className="font-medium text-signal-text">Testmail niet verstuurd. De instelling blijft uit.</p>
              <p className="font-mono text-[0.8125rem] break-words text-signal-text">{outcome.error}</p>
            </div>
          ) : null}
        </form>
      </Section>

      <ConfirmDialog
        open={confirmOff}
        title="Deze SMTP-server uitschakelen?"
        confirmLabel="Uitschakelen"
        busy={offBusy}
        onConfirm={disable}
        onClose={() => setConfirmOff(false)}
      >
        <p>
          Mails gaan dan weer via de instelling uit de serveromgeving. De gegevens blijven bewaard; activeren kan opnieuw met een
          testmail.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid content-start gap-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p className="text-sm font-medium text-signal-text">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

function PasswordField({
  saved,
  mode,
  onChange,
}: {
  saved: boolean;
  mode: PasswordMode;
  onChange: (mode: PasswordMode) => void;
}) {
  if (saved && mode.kind === "keep") {
    return (
      <div className="grid gap-2">
        <Label htmlFor="mail-password-saved">Wachtwoord</Label>
        <div className="flex flex-wrap items-center gap-2">
          <p id="mail-password-saved" className="num flex h-11 flex-1 items-center rounded-lg bg-paper-deep px-3 text-sm">
            •••••••• opgeslagen
          </p>
          <Button type="button" variant="ghost" onClick={() => onChange({ kind: "replace", value: "" })}>
            Wijzigen
          </Button>
          <Button type="button" variant="ghost" onClick={() => onChange({ kind: "remove" })}>
            Verwijderen
          </Button>
        </div>
      </div>
    );
  }
  if (mode.kind === "remove") {
    return (
      <div className="grid gap-2">
        <Label htmlFor="mail-password-removed">Wachtwoord</Label>
        <div className="flex flex-wrap items-center gap-2">
          <p id="mail-password-removed" className="flex h-11 flex-1 items-center rounded-lg bg-signal/15 px-3 text-sm text-signal-text">
            Wordt verwijderd bij opslaan
          </p>
          <Button type="button" variant="ghost" onClick={() => onChange({ kind: "keep" })}>
            Ongedaan maken
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="grid gap-2">
      <Label htmlFor="mail-password">Wachtwoord</Label>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          id="mail-password"
          type="password"
          autoComplete="new-password"
          className="flex-1"
          value={mode.kind === "replace" ? mode.value : ""}
          onChange={(e) => onChange(e.target.value || saved ? { kind: "replace", value: e.target.value } : { kind: "keep" })}
        />
        {saved ? (
          <Button type="button" variant="ghost" onClick={() => onChange({ kind: "keep" })}>
            Annuleren
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">Wordt versleuteld bewaard en nooit meer getoond.</p>
    </div>
  );
}
