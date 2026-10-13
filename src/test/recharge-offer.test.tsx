import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RechargeOffer from "@/components/RechargeOffer";

const state = vi.hoisted(() => ({ balance: 9.5, signedIn: true }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ session: state.signedIn ? { user: { id: "test" } } : null, profile: state.signedIn ? { balance_minutes: state.balance } : null }),
}));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [{ plan_id: "active-plan", label: "Value", price: 199, minutes: 30, bonus: 5 }] }),
}));

afterEach(() => { cleanup(); state.balance = 9.5; state.signedIn = true; });
const offer = () => <MemoryRouter><RechargeOffer /></MemoryRouter>;

describe("home recharge reminder", () => {
  it.each([10, 12])("hides at %s minutes", balance => {
    state.balance = balance;
    render(offer());
    expect(screen.queryByText("More time for your conversations")).toBeNull();
  });
  it.each([0, 0.5, 9.5])("shows below ten minutes (%s)", balance => {
    state.balance = balance;
    render(offer());
    expect(screen.getByText("More time for your conversations")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Recharge ₹199/ })).toHaveAttribute("href", "/recharge?plan=active-plan");
  });
  it.each(["Close recharge offer", "Skip for now"])("allows dismissal using %s", name => {
    const view = render(offer());
    fireEvent.click(screen.getByRole("button", { name }));
    state.balance = 8;
    view.rerender(offer());
    expect(screen.queryByText("More time for your conversations")).toBeNull();
    state.balance = 20;
    view.rerender(offer());
    state.balance = 9;
    view.rerender(offer());
    expect(screen.getByText("More time for your conversations")).toBeInTheDocument();
  });
  it("preserves the accurate guest trial", () => {
    state.signedIn = false;
    render(offer());
    expect(screen.getByRole("link", { name: /Start my 30-second trial/ })).toHaveAttribute("href", "/onboarding");
  });
});