import type { BrokerAdapter } from "./types";
import { tradovateAdapter } from "./tradovate";

export const BROKER_ADAPTERS: BrokerAdapter[] = [tradovateAdapter];

export function getBrokerAdapter(id: string): BrokerAdapter | undefined {
  return BROKER_ADAPTERS.find((a) => a.id === id);
}
