import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Brain, 
  Calculator, 
  Globe, 
  Users,
  Play,
  CheckCircle2,
  Lock,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  duration: string;
  isCompleted: boolean;
}

interface Module {
  id: string;
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<any>;
  lessons: Lesson[];
}

const Academy: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const modules: Module[] = [
    {
      id: 'mindset',
      titleKey: 'module.mindset.title',
      descKey: 'module.mindset.desc',
      icon: Brain,
      lessons: [
        { id: 'mindset-1', title: t('lesson.mindset1'), duration: '15 min', isCompleted: false },
        { id: 'mindset-2', title: t('lesson.mindset2'), duration: '20 min', isCompleted: false },
      ],
    },
    {
      id: 'math',
      titleKey: 'module.math.title',
      descKey: 'module.math.desc',
      icon: Calculator,
      lessons: [
        { id: 'math-1', title: t('lesson.math1'), duration: '25 min', isCompleted: false },
        { id: 'math-2', title: t('lesson.math2'), duration: '20 min', isCompleted: false },
        { id: 'math-3', title: t('lesson.math3'), duration: '18 min', isCompleted: false },
      ],
    },
    {
      id: 'ai',
      titleKey: 'module.ai.title',
      descKey: 'module.ai.desc',
      icon: Brain,
      lessons: [
        { id: 'ai-1', title: t('lesson.ai1'), duration: '30 min', isCompleted: false },
        { id: 'ai-2', title: t('lesson.ai2'), duration: '25 min', isCompleted: false },
      ],
    },
    {
      id: 'taxes',
      titleKey: 'module.taxes.title',
      descKey: 'module.taxes.desc',
      icon: Globe,
      lessons: [
        { id: 'taxes-1', title: t('lesson.taxes1'), duration: '22 min', isCompleted: false },
        { id: 'taxes-2', title: t('lesson.taxes2'), duration: '28 min', isCompleted: false },
        { id: 'taxes-3', title: t('lesson.taxes3'), duration: '20 min', isCompleted: false },
      ],
    },
    {
      id: 'team',
      titleKey: 'module.team.title',
      descKey: 'module.team.desc',
      icon: Users,
      lessons: [
        { id: 'team-1', title: t('lesson.team1'), duration: '18 min', isCompleted: false },
        { id: 'team-2', title: t('lesson.team2'), duration: '15 min', isCompleted: false },
      ],
    },
  ];

  useEffect(() => {
    if (user) {
      fetchProgress();
    }
  }, [user]);

  const fetchProgress = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('course_progress')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('is_completed', true);

    if (data) {
      setCompletedLessons(new Set(data.map(p => p.lesson_id)));
    }
  };

  const markComplete = async (moduleId: string, lessonId: string) => {
    if (!user) return;
    setLoading(true);

    const { error } = await supabase
      .from('course_progress')
      .upsert({
        user_id: user.id,
        module_id: moduleId,
        lesson_id: lessonId,
        is_completed: true,
        completed_at: new Date().toISOString(),
      });

    if (!error) {
      setCompletedLessons(prev => new Set([...prev, lessonId]));
    }
    setLoading(false);
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = completedLessons.size;
  const progressPercent = (completedCount / totalLessons) * 100;

  const selectedModuleData = modules.find(m => m.id === selectedModule);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
            <GraduationCap className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{t('academy.title')}</h1>
          </div>
          <p className="text-muted-foreground">{t('academy.subtitle')}</p>
        </div>
      </div>

      {/* Progress Card */}
      <div className="glass-card p-6">
        <div className={cn("flex items-center justify-between mb-4", isRTL && "flex-row-reverse")}>
          <h3 className="font-semibold text-foreground">{t('academy.progress')}</h3>
          <span className="text-primary font-medium">{completedCount}/{totalLessons} {t('academy.lessons')}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {Math.round(progressPercent)}% complete
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Modules List */}
        <div className="lg:col-span-1 space-y-4">
          {modules.map((module, index) => {
            const moduleCompletedCount = module.lessons.filter(l => 
              completedLessons.has(l.id)
            ).length;
            const isComplete = moduleCompletedCount === module.lessons.length;

            return (
              <div
                key={module.id}
                onClick={() => setSelectedModule(module.id)}
                className={cn(
                  "module-card animate-fade-in",
                  selectedModule === module.id && "border-primary/50",
                  isRTL && "text-right"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={cn("flex items-start gap-4", isRTL && "flex-row-reverse")}>
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    isComplete ? "bg-primary/20" : "bg-secondary"
                  )}>
                    {isComplete ? (
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    ) : (
                      <module.icon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse justify-end")}>
                      <span className="text-xs text-muted-foreground">
                        {t('academy.module')} {index + 1}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mt-1">{t(module.titleKey)}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t(module.descKey)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 progress-bar h-1">
                        <div 
                          className="progress-bar-fill"
                          style={{ width: `${(moduleCompletedCount / module.lessons.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {moduleCompletedCount}/{module.lessons.length}
                      </span>
                    </div>
                  </div>
                  {isRTL ? (
                    <ChevronLeft className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lesson Content */}
        <div className="lg:col-span-2">
          {selectedModuleData ? (
            <div className="glass-card p-6 animate-fade-in">
              <div className={cn("flex items-center gap-3 mb-6", isRTL && "flex-row-reverse")}>
                <selectedModuleData.icon className="w-8 h-8 text-primary" />
                <div className={isRTL ? "text-right" : ""}>
                  <h2 className="text-2xl font-bold text-foreground">
                    {t(selectedModuleData.titleKey)}
                  </h2>
                  <p className="text-muted-foreground">{t(selectedModuleData.descKey)}</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedModuleData.lessons.map((lesson, index) => {
                  const isLessonComplete = completedLessons.has(lesson.id);
                  
                  return (
                    <div
                      key={lesson.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-lg transition-all",
                        isLessonComplete 
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-secondary/50 hover:bg-secondary",
                        isRTL && "flex-row-reverse"
                      )}
                    >
                      <div className={cn("flex items-center gap-4", isRTL && "flex-row-reverse")}>
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          isLessonComplete ? "bg-primary" : "bg-muted"
                        )}>
                          {isLessonComplete ? (
                            <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                          ) : (
                            <Play className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className={isRTL ? "text-right" : ""}>
                          <p className="font-medium text-foreground">
                            Lesson {index + 1}: {lesson.title}
                          </p>
                          <p className="text-sm text-muted-foreground">{lesson.duration}</p>
                        </div>
                      </div>
                      
                      {!isLessonComplete && (
                        <Button
                          onClick={() => markComplete(selectedModuleData.id, lesson.id)}
                          disabled={loading}
                          variant="outline"
                          className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          {t('academy.markComplete')}
                        </Button>
                      )}
                      {isLessonComplete && (
                        <span className="text-primary text-sm font-medium">
                          {t('academy.completed')} ✓
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Video Placeholder */}
              <div className="mt-8 aspect-video bg-secondary rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"></div>
                <div className="text-center z-10">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-primary/30 transition-colors">
                    <Play className="w-8 h-8 text-primary ml-1" />
                  </div>
                  <p className="text-muted-foreground">Select a lesson to start watching</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-12 flex flex-col items-center justify-center text-center">
              <GraduationCap className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Select a Module
              </h3>
              <p className="text-muted-foreground max-w-md">
                Choose a module from the left to start learning. Complete all lessons to become a PropWealth certified investor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Academy;
