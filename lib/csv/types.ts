export type ParsedTradeRow = {
  symbol: string;
  direction: "LONG" | "SHORT";
  contracts: number;
  entryPrice: number | null;
  exitPrice: number | null;
  pnl: number;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  openedAt: Date;
  closedAt: Date;
  dedupKey: string;
};

export type ParseRowError = { line: number; message: string; raw?: string };

export type ParseResult = {
  rows: ParsedTradeRow[];
  errors: ParseRowError[];
};

export type BrokerAdapter = {
  id: string;
  name: string;
  parse(csv: string): ParseResult;
};
