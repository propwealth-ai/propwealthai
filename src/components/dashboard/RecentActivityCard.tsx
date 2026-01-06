import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, GraduationCap, Users, BarChart3, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string | null;
  metadata: unknown;
  created_at: string;
}

const RecentActivityCard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchActivities();
    }
  }, [user?.id]);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setActivities(data || []);
    } catch (err) {
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'property_added':
      case 'property_analyzed':
      case 'property_acquired':
        return Building2;
      case 'lesson_completed':
        return GraduationCap;
      case 'team_member_invited':
        return Users;
      default:
        return BarChart3;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'property_acquired':
        return 'bg-primary/20 text-primary';
      case 'property_analyzing':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'property_added':
        return 'bg-blue-500/20 text-blue-400';
      case 'lesson_completed':
        return 'bg-purple-500/20 text-purple-400';
      case 'team_member_invited':
        return 'bg-orange-500/20 text-orange-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="glass-card p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">
          {t('dashboard.recentActivity')}
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 p-3 sm:p-4 bg-secondary/50 rounded-lg">
              <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="glass-card p-4 sm:p-6">
        <h2 className={cn("text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6", isRTL && "text-right")}>
          {t('dashboard.recentActivity')}
        </h2>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">{t('dashboard.noRecentActivity')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('dashboard.startByAnalyzing')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 sm:p-6">
      <h2 className={cn("text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6", isRTL && "text-right")}>
        {t('dashboard.recentActivity')}
      </h2>
      <div className="space-y-3 sm:space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.activity_type);
          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-center justify-between p-3 sm:p-4 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer gap-3",
                isRTL && "flex-row-reverse"
              )}
            >
              <div className={cn("flex items-center gap-3 sm:gap-4 min-w-0 flex-1", isRTL && "flex-row-reverse")}>
                <div className={cn(
                  "w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                  getActivityColor(activity.activity_type)
                )}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className={cn("min-w-0", isRTL ? "text-right" : "")}>
                  <p className="font-medium text-foreground text-sm sm:text-base truncate">{activity.title}</p>
                  {activity.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{activity.description}</p>
                  )}
                </div>
              </div>
              <div className={cn("text-right flex-shrink-0", isRTL && "text-left")}>
                <p className="text-xs sm:text-sm text-muted-foreground">{formatTime(activity.created_at)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivityCard;
