import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  loading?: boolean;
  alertState?: 'normal' | 'warning' | 'error';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  loading,
  alertState = 'normal'
}) => {
  const getCardStyle = () => {
    switch (alertState) {
      case 'warning':
        return 'border-[#f59e0b]/30 bg-[#f59e0b]/5 text-[#f59e0b]';
      case 'error':
        return 'border-[#ef4444]/30 bg-[#ef4444]/5 text-[#ef4444]';
      default:
        return 'border-darkBorder bg-darkSurface text-textPrimary';
    }
  };

  const getTitleStyle = () => {
    switch (alertState) {
      case 'warning':
        return 'text-[#f59e0b]/60';
      case 'error':
        return 'text-[#ef4444]/60';
      default:
        return 'text-textMuted';
    }
  };

  const getValueStyle = () => {
    switch (alertState) {
      case 'warning':
        return 'text-[#f59e0b]';
      case 'error':
        return 'text-[#ef4444]';
      default:
        return 'text-textPrimary';
    }
  };

  return (
    <div className={`p-4 border rounded-[4px] font-mono transition-all duration-300 ${getCardStyle()}`}>
      <div className={`text-[10px] uppercase tracking-wider mb-2 font-semibold ${getTitleStyle()}`}>
        {title}
      </div>
      <div className={`text-2xl font-bold tracking-tight leading-none ${getValueStyle()}`}>
        {loading ? <span className="text-textMuted opacity-55 animate-pulse">...</span> : value}
      </div>
    </div>
  );
};
