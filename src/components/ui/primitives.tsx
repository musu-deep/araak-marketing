import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

/* بطاقة زجاجية فاخرة */
export function GlassCard({
  children,
  className = '',
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`glass-card rounded-2xl ${hover ? 'transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-0.5' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* مؤشر KPI - بطاقة زجاجية للأرقام */
export function KpiCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  color = 'araak',
  suffix,
  footer,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  trendUp?: boolean;
  color?: 'araak' | 'gold' | 'navy' | 'sand';
  suffix?: string;
  footer?: string;
}) {
  const colors = {
    araak: 'from-araak-400 to-araak-600 text-araak-600 bg-araak-50',
    gold: 'from-gold-400 to-gold-600 text-gold-600 bg-gold-50',
    navy: 'from-navy-400 to-navy-600 text-navy-600 bg-navy-50',
    sand: 'from-sand-400 to-sand-600 text-sand-600 bg-sand-50',
  };
  const c = colors[color];

  return (
    <GlassCard hover className="p-5 relative overflow-hidden group">
      <div className={`absolute -left-8 -top-8 w-24 h-24 rounded-full bg-gradient-to-br ${c.split(' ')[0]} ${c.split(' ')[1]} opacity-10 group-hover:opacity-20 transition-opacity`} />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs text-navy-500 font-medium mb-1">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <CountUp value={value} />
            {suffix && <span className="text-sm font-medium text-navy-500">{suffix}</span>}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
              {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
          {footer && !trend && <p className="text-[11px] text-navy-400 mt-2">{footer}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl ${c.split(' ')[3]} ${c.split(' ')[2]} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </GlassCard>
  );
}

/* عدّاد تدريجي للأرقام */
function CountUp({ value }: { value: string | number }) {
  const isNumeric = typeof value === 'number' || /^[\d,.]+$/.test(String(value));
  const target = isNumeric ? parseFloat(String(value).replace(/,/g, '')) : 0;
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isNumeric) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 900;
          const startTime = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.floor(target * eased));
            if (progress < 1) requestAnimationFrame(tick);
            else setDisplay(target);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, isNumeric]);

  if (!isNumeric) {
    return <span ref={ref} className="text-2xl font-bold text-navy-900">{value}</span>;
  }
  return (
    <span ref={ref} className="text-2xl font-bold text-navy-900">
      {new Intl.NumberFormat('ar-SA').format(display)}
    </span>
  );
}

/* حلقة تقدّمProgress Ring */
export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  color = '#0e8494',
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setOffset(circumference - (value / 100) * circumference);
    }, 100);
    return () => clearTimeout(timeout);
  }, [value, circumference]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(14,132,148,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-navy-900">{value}%</span>
        {label && <span className="text-[11px] text-navy-500 font-medium mt-0.5">{label}</span>}
        {sublabel && <span className="text-[10px] text-navy-400">{sublabel}</span>}
      </div>
    </div>
  );
}

/* شريط تقدّم أفقي */
export function ProgressBar({
  value,
  max = 100,
  color = 'araak',
  height = 8,
  label,
}: {
  value: number;
  max?: number;
  color?: 'araak' | 'gold' | 'navy' | 'emerald' | 'red';
  height?: number;
  label?: string;
}) {
  const percentage = Math.min((value / max) * 100, 100);
  const colors = {
    araak: 'from-araak-400 to-araak-600',
    gold: 'from-gold-400 to-gold-600',
    navy: 'from-navy-400 to-navy-600',
    emerald: 'from-emerald-400 to-emerald-600',
    red: 'from-red-400 to-red-600',
  };
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-navy-500 mb-1.5">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="w-full bg-navy-100/50 rounded-full overflow-hidden" style={{ height }}>
        <div
          className={`h-full bg-gradient-to-l ${colors[color]} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/* حالة فارغة */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-navy-50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-navy-300" />
      </div>
      <h3 className="text-lg font-semibold text-navy-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-navy-400 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* حالة تحميل */
export function LoadingState({ label = 'جارٍ التحميل...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-10 h-10 border-3 border-araak-100 border-t-araak-500 rounded-full animate-spin" />
      <p className="mt-3 text-sm text-navy-500">{label}</p>
    </div>
  );
}

/* عنوان قسم */
export function SectionHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-araak-500 to-araak-700 flex items-center justify-center shadow-glow flex-shrink-0">
            <Icon className="w-5 h-5 text-white" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-navy-900 leading-tight">{title}</h1>
          {subtitle && <p className="text-sm text-navy-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/* شارة Status Badge */
export function StatusBadge({
  label,
  color,
  bg,
  border,
}: {
  label: string;
  color: string;
  bg: string;
  border?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${color} ${border ?? ''}`}>
      {label}
    </span>
  );
}
