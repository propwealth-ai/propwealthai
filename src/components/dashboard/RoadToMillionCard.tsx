import React from 'react';
import { Target, Trophy, TrendingUp, Milestone, Star } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface RoadToMillionCardProps {
  currentNetWorth: number;
  goalAmount?: number;
}

interface MilestoneType {
  value: number;
  label: string;
  icon: React.ElementType;
  reached: boolean;
}

const RoadToMillionCard: React.FC<RoadToMillionCardProps> = ({ 
  currentNetWorth, 
  goalAmount = 1000000 
}) => {
  const { t, isRTL } = useLanguage();
  
  const progress = Math.min((currentNetWorth / goalAmount) * 100, 100);
  const remaining = Math.max(goalAmount - currentNetWorth, 0);
  
  // Format goal amount for display
  const formatGoalLabel = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1)}M`;
    }
    return `$${(value / 1000).toFixed(0)}K`;
  };
  
  // Generate dynamic milestones based on goal
  const generateMilestones = (): MilestoneType[] => {
    const steps = [0.05, 0.1, 0.25, 0.5, 0.75, 1];
    return steps.map((step, index) => {
      const value = goalAmount * step;
      const icons = [Star, Milestone, Milestone, TrendingUp, TrendingUp, Trophy];
      return {
        value,
        label: formatGoalLabel(value),
        icon: icons[index],
        reached: currentNetWorth >= value
      };
    });
  };
  
  const milestones = generateMilestones();

  const nextMilestone = milestones.find(m => !m.reached) || milestones[milestones.length - 1];
  const toNextMilestone = Math.max(nextMilestone.value - currentNetWorth, 0);

  return (
    <div className="glass-card p-4 sm:p-6 relative overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
      
      {/* Header */}
      <div className={cn("flex items-center justify-between mb-4 sm:mb-6", isRTL && "flex-row-reverse")}>
        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
          </div>
          <div className={isRTL ? "text-right" : ""}>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {t('dashboard.roadToMillion')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {t('dashboard.wealthJourney')}
            </p>
          </div>
        </div>
        {progress >= 100 && (
          <div className="px-3 py-1 bg-primary/20 rounded-full">
            <span className="text-xs font-semibold text-primary">🎉 {t('dashboard.goalReached')}</span>
          </div>
        )}
      </div>

      {/* Current Value */}
      <div className={cn("mb-4", isRTL && "text-right")}>
        <p className="text-xs text-muted-foreground mb-1">{t('dashboard.currentNetWorth')}</p>
        <div className={cn("flex items-baseline gap-2", isRTL && "flex-row-reverse justify-end")}>
          <span className="text-2xl sm:text-4xl font-bold text-money">
            ${currentNetWorth.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">/ {formatGoalLabel(goalAmount)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative mb-6">
        <div className="progress-bar h-3 sm:h-4 rounded-full">
          <div 
            className="progress-bar-fill h-full rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            {progress > 5 && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary-foreground">
                {progress.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        
        {/* Milestone markers */}
        <div className="absolute top-0 left-0 right-0 h-3 sm:h-4">
          {milestones.map((milestone, index) => {
            const position = (milestone.value / goalAmount) * 100;
            return (
              <div
                key={milestone.value}
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 w-2 h-2 sm:w-3 sm:h-3 rounded-full border-2 transition-all",
                  milestone.reached 
                    ? "bg-primary border-primary-foreground" 
                    : "bg-secondary border-muted-foreground"
                )}
                style={{ left: `${position}%`, transform: 'translate(-50%, -50%)' }}
              />
            );
          })}
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
        {milestones.map((milestone) => (
          <div 
            key={milestone.value}
            className={cn(
              "flex flex-col items-center p-2 rounded-lg transition-all",
              milestone.reached 
                ? "bg-primary/10 border border-primary/30" 
                : "bg-secondary/50 border border-transparent"
            )}
          >
            <milestone.icon 
              className={cn(
                "w-4 h-4 mb-1",
                milestone.reached ? "text-primary" : "text-muted-foreground"
              )} 
            />
            <span className={cn(
              "text-xs font-medium",
              milestone.reached ? "text-primary" : "text-muted-foreground"
            )}>
              {milestone.label}
            </span>
          </div>
        ))}
      </div>

      {/* Next Milestone */}
      {progress < 100 && (
        <div className={cn("flex items-center justify-between p-3 bg-secondary/50 rounded-lg", isRTL && "flex-row-reverse")}>
          <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
            <nextMilestone.icon className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              {t('dashboard.nextMilestone')}:
            </span>
            <span className="text-sm font-semibold text-foreground">{nextMilestone.label}</span>
          </div>
          <span className="text-sm text-primary font-medium">
            ${toNextMilestone.toLocaleString()} {t('dashboard.toGo')}
          </span>
        </div>
      )}

      {/* Remaining to Goal */}
      {progress < 100 && (
        <div className={cn("mt-4 text-center", isRTL && "text-right")}>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.remainingToGoal')}:
            <span className="text-primary font-semibold ml-2">${remaining.toLocaleString()}</span>
          </p>
        </div>
      )}
    </div>
  );
};

export default RoadToMillionCard;
