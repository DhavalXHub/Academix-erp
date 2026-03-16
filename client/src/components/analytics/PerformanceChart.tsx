import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PerformanceChartProps {
    data: any[]; // { title, completionRate } or similar
    dataKey: string;
    nameKey: string;
    fillColor?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ data, dataKey, nameKey, fillColor = '#10b981' }) => {
    if (!data || data.length === 0) {
        return <div style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>No performance data available.</div>;
    }

    return (
        <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey={nameKey} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 100]} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`${Math.round(value)}%`, 'Rate']}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    />
                    <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry[dataKey] < 50 ? '#ef4444' : fillColor} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PerformanceChart;
