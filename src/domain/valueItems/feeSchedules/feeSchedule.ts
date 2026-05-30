import { Money } from "..";

export interface FeeSchedule {
  feeForOverdueItem(loan: unknown): Money;
  feeForDamagedItem?(loan: unknown): Money;
  fee_for_overdue_item?(loan: unknown): Money;
  fee_for_damaged_item?(loan: unknown): Money;
}
