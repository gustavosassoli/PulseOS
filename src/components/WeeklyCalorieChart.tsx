import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { motion } from 'motion/react';

interface ChartDataPoint {
  date: string;
  dayName: string;
  total: number;
  macros: { protein: number; carbs: number; fats: number };
  meals: number;
}

interface WeeklyCalorieChartProps {
  data: ChartDataPoint[];
  goal: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ChartDataPoint;
    
    if (data.total === 0) return null;

    return (
      <div className="bg-surface-container-high border border-white/10 p-3 rounded-lg shadow-2xl backdrop-blur-md">
        <p className="text-white font-bold mb-2">{new Date(data.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
        <p className="text-primary-container font-black text-lg">{data.total} <span className="text-xs text-on-surface-variant">kcal</span></p>
        <div className="flex gap-3 mt-2 pt-2 border-t border-white/10">
          <span className="text-[10px] font-bold text-[#B9CBB9] uppercase">P: {data.macros.protein}g</span>
          <span className="text-[10px] font-bold text-[#A3B8CC] uppercase">C: {data.macros.carbs}g</span>
          <span className="text-[10px] font-bold text-[#FF6B6B] uppercase">G: {data.macros.fats}g</span>
        </div>
      </div>
    );
  }
  return null;
};

export function WeeklyCalorieChart({ data, goal }: WeeklyCalorieChartProps) {
  // Find min and max for YAxis roughly
  const maxTotal = Math.max(...data.map(d => d.total), goal);
  const yDomain = [0, maxTotal + 200];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full h-64 mt-6"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis 
            dataKey="dayName" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#B9CBB9', fontSize: 12, fontWeight: 500 }}
            dy={10} 
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#B9CBB9', fontSize: 10 }}
            domain={yDomain}
          />
          <Tooltip 
            content={<CustomTooltip />} 
            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
          />
          <ReferenceLine 
            y={goal} 
            stroke="#B9CBB9" 
            strokeDasharray="4 4" 
            opacity={0.5} 
            label={{ position: 'top', value: 'Meta', fill: '#B9CBB9', fontSize: 10, fontWeight: 'bold' }} 
          />
          <Bar 
            dataKey="total" 
            radius={[4, 4, 4, 4]} 
            maxBarSize={40}
            animationDuration={1000}
          >
            {data.map((entry, index) => {
              const isBelowOrAtGoal = entry.total > 0 && entry.total <= goal + 100; // Small threshold
              const isEmpty = entry.total === 0;

              return (
                <Cell 
                  key={`cell-${index}`} 
                  fill={isEmpty ? '#2A2A2A' : isBelowOrAtGoal ? '#00FF88' : '#FF4D4D'} 
                  fillOpacity={isEmpty ? 0.3 : 1}
                />
              )
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
