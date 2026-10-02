import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { TotpField } from "@/components/auth/totp-field";

function Harness({ onComplete }: { onComplete: (code: string) => void }) {
  const [value, setValue] = useState("");
  return <TotpField value={value} onChange={setValue} onComplete={onComplete} />;
}

describe("TotpField", () => {
  it("strips non-digits and fires once six digits are in", async () => {
    const onComplete = vi.fn();
    render(<Harness onComplete={onComplete} />);
    const input = screen.getByLabelText("Code uit je authenticator-app");
    await userEvent.type(input, "12 34a56");
    expect(input).toHaveValue("123456");
    expect(onComplete).toHaveBeenCalledWith("123456");
    expect(input).toHaveAttribute("autocomplete", "one-time-code");
  });
});
