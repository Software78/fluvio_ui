import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: number[];
  label?: string;
  color?: string;
  emptyMessage?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  label = 'Sparkline (Last 20 ticks)',
  color = '#22c55e',
  emptyMessage = 'Waiting for live stream data...',
}) => {
  const chartData = data.map((val, idx) => ({ index: idx, value: val }));

  return (
    <div className="w-full bg-[#0e0e10] border border-darkBorder rounded-[4px] p-4 flex flex-col justify-between">
      <div className="text-[10px] text-textMuted uppercase tracking-wider font-semibold font-mono mb-3">
        {label}
      </div>

      <div className="w-full h-[60px]">
        {data.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center text-textMuted text-xs font-mono">
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
