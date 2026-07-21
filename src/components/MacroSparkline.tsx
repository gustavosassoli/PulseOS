import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

interface MacroSparklineProps {
  data: { value: number }[];
  name: string;
  average: number;
  change: number;
  color: string;
  delay?: number;
}

export function MacroSparkline({ data, name, average, change, color, delay = 0 }: MacroSparklineProps) {
  const isPositive = change > 0;
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-surface-container rounded-xl p-4 flex flex-col border border-white/5"
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest leading-none">{name}</span>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-error' : 'text-primary-container'} bg-surface-container-highest px-1.5 py-0.5 rounded-sm`}>
          <span className="material-symbols-outlined text-[10px]">{isPositive ? 'arrow_upward' : 'arrow_downward'}</span>
          {Math.abs(change)}%
        </div>
      </div>
      
      <div className="flex items-end gap-1 mb-4">
        <span className="text-2xl font-black text-white leading-none">{average}</span>
        <span className="text-xs text-on-surface-variant font-bold leading-relaxed mb-0.5">g/dia</span>
      </div>

      <div className="h-10 w-full mt-auto">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              strokeWidth={3} 
              dot={false}
              isAnimationActive={true}
              animationDuration={1500}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
