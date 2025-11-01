import { Currency, Money } from "../valueItems/money";

export class MoneyFactory {
  defaultCurrency: Currency = Currency.EUR;

  empty(currencyName?: Currency | null): Money {
    const c = currencyName ?? this.defaultCurrency;
    return new Money({ amount: 0, currency: c });
  }

  total(amounts: Money[]): Money {
    if (!amounts || amounts.length === 0) return this.empty();
    return amounts.reduce(
      (acc, cur) => acc.add(cur),
      this.empty(amounts[0]?.currency),
    );
  }
}
