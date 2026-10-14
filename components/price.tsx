import clsx from 'clsx';

const Price = ({
  amount,
  className,
  currencyCode = 'USD',
  currencyCodeClassName,
  prefix
}: {
  amount: string;
  className?: string;
  currencyCode: string;
  currencyCodeClassName?: string;
  /** Set on a listing whose variants differ, so the figure reads as a starting price ("From"). */
  prefix?: string;
} & React.ComponentProps<'p'>) => (
  <p suppressHydrationWarning={true} className={className}>
    {prefix ? <span className="mr-1">{prefix}</span> : null}
    {`${new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol'
    }).format(parseFloat(amount))}`}
    <span className={clsx('ml-1 inline', currencyCodeClassName)}>{`${currencyCode}`}</span>
  </p>
);

export default Price;
