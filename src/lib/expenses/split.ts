export interface SplitParticipant {
  id: string;
  name: string;
  days?: number[] | null;
}

export interface SplitExpense {
  id?: string;
  description: string;
  amount: number;
  paidBy: string;
  splitAmong: string[];
  dayNumber?: number | null;
}

export interface ParticipantBalance {
  id: string;
  name: string;
  paid: number;
  owes: number;
  net: number;
}

export interface Settlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface SplitResult {
  balances: ParticipantBalance[];
  settlements: Settlement[];
  totalSpent: number;
  warnings: string[];
}

const ROUND = 100;

function round(value: number): number {
  return Math.round(value * ROUND) / ROUND;
}

function effectiveSplitters(
  expense: SplitExpense,
  participants: SplitParticipant[],
): SplitParticipant[] {
  const byId = new Map(participants.map((p) => [p.id, p]));
  const chosen = expense.splitAmong.length > 0
    ? expense.splitAmong
        .map((pid) => byId.get(pid))
        .filter((p): p is SplitParticipant => Boolean(p))
    : participants;

  if (expense.dayNumber == null) return chosen;

  const day = expense.dayNumber;
  const filtered = chosen.filter((p) => {
    if (!p.days || p.days.length === 0) return true;
    return p.days.includes(day);
  });
  return filtered.length > 0 ? filtered : chosen;
}

export function computeSplit(
  participants: SplitParticipant[],
  expenses: SplitExpense[],
): SplitResult {
  const warnings: string[] = [];
  const balanceMap = new Map<string, ParticipantBalance>();
  for (const p of participants) {
    balanceMap.set(p.id, {
      id: p.id,
      name: p.name,
      paid: 0,
      owes: 0,
      net: 0,
    });
  }

  let totalSpent = 0;

  for (const expense of expenses) {
    if (expense.amount <= 0) continue;
    const payer = balanceMap.get(expense.paidBy);
    if (!payer) {
      warnings.push(
        `Utgift "${expense.description}" mangler betaler i deltakerlista.`,
      );
      continue;
    }
    const splitters = effectiveSplitters(expense, participants);
    if (splitters.length === 0) {
      warnings.push(
        `Utgift "${expense.description}" har ingen å splitte mellom.`,
      );
      continue;
    }
    payer.paid = round(payer.paid + expense.amount);
    totalSpent = round(totalSpent + expense.amount);
    const share = expense.amount / splitters.length;
    for (const s of splitters) {
      const entry = balanceMap.get(s.id);
      if (!entry) continue;
      entry.owes = round(entry.owes + share);
    }
  }

  const balances = Array.from(balanceMap.values()).map((b) => ({
    ...b,
    net: round(b.paid - b.owes),
  }));

  const settlements = settle(balances);

  return { balances, settlements, totalSpent, warnings };
}

function settle(balances: ParticipantBalance[]): Settlement[] {
  const debtors: { id: string; name: string; amount: number }[] = [];
  const creditors: { id: string; name: string; amount: number }[] = [];
  for (const b of balances) {
    if (b.net < -0.005) {
      debtors.push({ id: b.id, name: b.name, amount: -b.net });
    } else if (b.net > 0.005) {
      creditors.push({ id: b.id, name: b.name, amount: b.net });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i];
    const c = creditors[j];
    const amount = round(Math.min(d.amount, c.amount));
    if (amount > 0) {
      settlements.push({
        from: d.id,
        fromName: d.name,
        to: c.id,
        toName: c.name,
        amount,
      });
    }
    d.amount = round(d.amount - amount);
    c.amount = round(c.amount - amount);
    if (d.amount <= 0.005) i++;
    if (c.amount <= 0.005) j++;
  }
  return settlements;
}
