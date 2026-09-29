import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Offer, Operator } from '@/lib/data';
import { OPERATOR_LABELS, OperatorBadge } from '@/components/shared';

const OP_COLORS: Record<Operator, string> = {
  zain: '#6B2D90',
  orange: '#FF7900',
  umniah: '#E4002B',
};

const OPS: Operator[] = ['zain', 'orange', 'umniah'];

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Offer }[] }) {
  if (!active || !payload?.length) return null;
  const o = payload[0].payload;
  return (
    <div className="rounded-lg border border-hairline bg-surface px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-text-primary">{o.title}</p>
      <p className="tnum text-text-secondary">
        {o.priceJod} JOD · {o.dataGb}GB · {OPERATOR_LABELS[o.operator]}
      </p>
    </div>
  );
}

export function CompareDrawer({
  offers,
  open,
  onOpenChange,
  onHoverOffer,
}: {
  offers: Offer[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onHoverOffer?: (id: string | null) => void;
}) {
  const grouped = useMemo(
    () =>
      OPS.map((op) => {
        const rows = offers.filter((o) => o.operator === op);
        const avg = (k: 'priceJod' | 'dataGb') =>
          rows.length ? rows.reduce((s, o) => s + o[k], 0) / rows.length : 0;
        return {
          operator: OPERATOR_LABELS[op],
          avgPrice: Number(avg('priceJod').toFixed(2)),
          avgData: Number(avg('dataGb').toFixed(1)),
        };
      }),
    [offers],
  );

  const bestValue = useMemo(
    () =>
      [...offers]
        .filter((o) => o.dataGb > 0)
        .sort((a, b) => a.priceJod / a.dataGb - b.priceJod / b.dataGb)
        .slice(0, 3),
    [offers],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Compare operators</SheetTitle>
          <SheetDescription>
            Averages and value distribution across the filtered offers.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-8">
          <div>
            <h4 className="mb-3 text-[15px] font-semibold text-text-primary">
              Average price vs average data
            </h4>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grouped} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#EFEDE8" vertical={false} />
                  <XAxis dataKey="operator" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#F3F1ED' }}
                    contentStyle={{
                      border: '1px solid #E7E3DC',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="avgPrice"
                    name="Avg price (JOD)"
                    fill="#0F766E"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                  />
                  <Bar
                    dataKey="avgData"
                    name="Avg data (GB)"
                    fill="#4D6B8A"
                    radius={[4, 4, 0, 0]}
                    animationDuration={800}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-brand" /> Avg price (JOD)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm bg-info" /> Avg data (GB)
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-[15px] font-semibold text-text-primary">
              Price vs data per offer
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#EFEDE8" />
                  <XAxis
                    type="number"
                    dataKey="priceJod"
                    name="Price"
                    unit=" JOD"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="number"
                    dataKey="dataGb"
                    name="Data"
                    unit=" GB"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <ZAxis range={[90, 90]} />
                  <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter data={offers} animationDuration={800} animationBegin={100}>
                    {offers.map((o) => (
                      <Cell
                        key={o.id}
                        fill={OP_COLORS[o.operator]}
                        onMouseEnter={() => onHoverOffer?.(o.id)}
                        onMouseLeave={() => onHoverOffer?.(null)}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-1 flex gap-4 text-xs text-text-muted">
              {OPS.map((op) => (
                <span key={op} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: OP_COLORS[op] }} />
                  {OPERATOR_LABELS[op]}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-[15px] font-semibold text-text-primary">
              Best value (lowest JOD/GB)
            </h4>
            <div className="overflow-hidden rounded-lg border border-hairline">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hairline bg-subtle text-left text-xs text-text-muted">
                    <th className="px-3 py-2 font-medium">Offer</th>
                    <th className="px-3 py-2 font-medium">Operator</th>
                    <th className="tnum px-3 py-2 text-right font-medium">JOD/GB</th>
                  </tr>
                </thead>
                <tbody>
                  {bestValue.map((o) => (
                    <tr key={o.id} className="border-b border-hairline last:border-0">
                      <td className="px-3 py-2 text-text-primary">{o.title}</td>
                      <td className="px-3 py-2">
                        <OperatorBadge operator={o.operator} />
                      </td>
                      <td className="tnum px-3 py-2 text-right text-text-secondary">
                        {(o.priceJod / o.dataGb).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
