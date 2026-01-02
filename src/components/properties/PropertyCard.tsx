import React from 'react';
import { Building2, MapPin, DollarSign, TrendingUp, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRBAC } from '@/hooks/useRBAC';
import RoleGate from '@/components/auth/RoleGate';
import { cn } from '@/lib/utils';

interface Property {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  property_type: string | null;
  purchase_price: number | null;
  current_value: number | null;
  monthly_rent: number | null;
  monthly_expenses?: number | null;
  status: string;
  image_url?: string | null;
}

interface PropertyCardProps {
  property: Property;
  onClick: () => void;
  compareMode: boolean;
  isSelected: boolean;
}

const statusColors: Record<string, string> = {
  new: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  analyzing: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  negotiating: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  acquired: 'bg-primary/20 text-primary border-primary/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
};

const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onClick,
  compareMode,
  isSelected,
}) => {
  const { t, isRTL } = useLanguage();
  const { canViewFinancial, canViewPhysical } = useRBAC();

  // Calculate equity gain
  const equityGain = property.current_value && property.purchase_price 
    ? property.current_value - property.purchase_price 
    : null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative bg-card border rounded-xl p-5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-primary/50",
        compareMode && isSelected && "ring-2 ring-primary border-primary",
        isRTL && "rtl"
      )}
    >
      {/* Compare Checkbox */}
      {compareMode && (
        <div className={cn(
          "absolute top-3 z-10",
          isRTL ? "left-3" : "right-3"
        )}>
          <div className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected 
              ? "bg-primary border-primary" 
              : "bg-card border-muted-foreground/30"
          )}>
            {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
          </div>
        </div>
      )}

      {/* Property Image or Placeholder */}
      <RoleGate requiredPermission="physical">
        <div className="h-32 bg-secondary/50 rounded-lg mb-4 overflow-hidden">
          {property.image_url ? (
            <img 
              src={property.image_url} 
              alt={property.address}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </RoleGate>

      {/* Status Badge */}
      <div className={cn(
        "inline-flex px-2.5 py-1 rounded-full text-xs font-medium border mb-3",
        statusColors[property.status] || statusColors.new
      )}>
        {t(`properties.status.${property.status}`)}
      </div>

      {/* Address - Always visible */}
      <RoleGate requiredPermission="physical" fallback={
        <h3 className="font-semibold text-foreground mb-1 text-sm">
          {t('properties.addressHidden')}
        </h3>
      }>
        <h3 className="font-semibold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors">
          {property.address}
        </h3>
        {(property.city || property.state) && (
          <div className={cn(
            "flex items-center gap-1 text-muted-foreground text-sm mb-3",
            isRTL && "flex-row-reverse"
          )}>
            <MapPin className="w-3 h-3" />
            <span>{[property.city, property.state].filter(Boolean).join(', ')}</span>
          </div>
        )}
      </RoleGate>

      {/* Financial Data - Role Gated */}
      <RoleGate requiredPermission="financial">
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
          {/* Purchase Price */}
          <div>
            <p className="text-xs text-muted-foreground">{t('properties.price')}</p>
            <p className="font-semibold text-foreground">
              ${(property.purchase_price || 0).toLocaleString()}
            </p>
          </div>

          {/* Monthly Rent */}
          <div>
            <p className="text-xs text-muted-foreground">{t('properties.rent')}</p>
            <p className="font-semibold text-money">
              ${(property.monthly_rent || 0).toLocaleString()}/mo
            </p>
          </div>

          {/* Equity Gain */}
          {equityGain !== null && (
            <div className="col-span-2 flex items-center gap-2 pt-2 border-t border-border/50">
              <TrendingUp className={cn(
                "w-4 h-4",
                equityGain >= 0 ? "text-primary" : "text-destructive"
              )} />
              <span className={cn(
                "text-sm font-medium",
                equityGain >= 0 ? "text-primary" : "text-destructive"
              )}>
                {equityGain >= 0 ? '+' : ''}${equityGain.toLocaleString()} {t('properties.equity')}
              </span>
            </div>
          )}
        </div>
      </RoleGate>

      {/* Non-financial role view - shown when user cannot view financial */}
      {!canViewFinancial && (
        <div className="pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground italic">
            {t('properties.financialDataRestricted')}
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyCard;
