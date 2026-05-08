import { describe, it, expect } from "vitest";
import { computeSplit, type SplitParticipant, type SplitExpense } from "@/lib/expenses/split";

const ann: SplitParticipant = { id: "a", name: "Ann" };
const ben: SplitParticipant = { id: "b", name: "Ben" };
const cilla: SplitParticipant = { id: "c", name: "Cilla", days: [1, 2] };

describe("computeSplit", () => {
  it("splits an evenly-shared expense and produces a single settlement", () => {
    const expenses: SplitExpense[] = [
      { description: "Mat", amount: 300, paidBy: "a", splitAmong: ["a", "b", "c"] },
    ];
    const result = computeSplit([ann, ben, cilla], expenses);

    expect(result.totalSpent).toBe(300);
    const annBal = result.balances.find((b) => b.id === "a")!;
    const benBal = result.balances.find((b) => b.id === "b")!;
    expect(annBal.paid).toBe(300);
    expect(annBal.net).toBe(200);
    expect(benBal.net).toBe(-100);
    expect(result.settlements).toHaveLength(2);
    expect(result.settlements.every((s) => s.to === "a")).toBe(true);
    const total = result.settlements.reduce((s, x) => s + x.amount, 0);
    expect(Math.round(total)).toBe(200);
  });

  it("excludes participants whose days do not include the expense day", () => {
    const expenses: SplitExpense[] = [
      { description: "Hytteleie dag 3", amount: 600, paidBy: "a", splitAmong: ["a", "b", "c"], dayNumber: 3 },
    ];
    const result = computeSplit([ann, ben, cilla], expenses);

    const cillaBal = result.balances.find((b) => b.id === "c")!;
    expect(cillaBal.owes).toBe(0);
    const annBal = result.balances.find((b) => b.id === "a")!;
    const benBal = result.balances.find((b) => b.id === "b")!;
    expect(annBal.owes).toBe(300);
    expect(benBal.owes).toBe(300);
  });

  it("warns when payer is unknown and skips the expense", () => {
    const expenses: SplitExpense[] = [
      { description: "Spøkelse", amount: 100, paidBy: "ghost", splitAmong: ["a", "b"] },
    ];
    const result = computeSplit([ann, ben], expenses);
    expect(result.totalSpent).toBe(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toMatch(/Spøkelse/);
  });
});
