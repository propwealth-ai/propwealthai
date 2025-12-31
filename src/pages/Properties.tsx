import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Filter
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
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
  status: string;
}

const Properties: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (profile?.team_id) {
      fetchProperties();
    }
  }, [profile?.team_id]);

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setProperties(data as Property[]);
    }
    setLoading(false);
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    analyzing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    under_contract: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    acquired: 'bg-primary/20 text-primary border-primary/50',
    archived: 'bg-muted text-muted-foreground border-border',
  };

  const filteredProperties = filter === 'all' 
    ? properties 
    : properties.filter(p => p.status === filter);

  // Mock properties for demo
  const mockProperties: Property[] = [
    {
      id: '1',
      address: '123 Investment Ave',
      city: 'Miami',
      state: 'FL',
      property_type: 'Multi-family',
      purchase_price: 425000,
      current_value: 485000,
      monthly_rent: 3200,
      status: 'acquired',
    },
    {
      id: '2',
      address: '456 Cashflow Street',
      city: 'Austin',
      state: 'TX',
      property_type: 'Single-family',
      purchase_price: 315000,
      current_value: 340000,
      monthly_rent: 2400,
      status: 'analyzing',
    },
    {
      id: '3',
      address: '789 Equity Boulevard',
      city: 'Denver',
      state: 'CO',
      property_type: 'Duplex',
      purchase_price: 275000,
      current_value: null,
      monthly_rent: 2100,
      status: 'new',
    },
  ];

  const displayProperties = properties.length > 0 ? filteredProperties : mockProperties;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">{t('nav.properties')}</h1>
          </div>
          <p className="text-muted-foreground">
            Manage your real estate portfolio
          </p>
        </div>
        <Button className="btn-premium text-primary-foreground gap-2">
          <Plus className="w-4 h-4" />
          Add Property
        </Button>
      </div>

      {/* Filters */}
      <div className={cn("flex items-center gap-3 flex-wrap", isRTL && "flex-row-reverse")}>
        <Filter className="w-4 h-4 text-muted-foreground" />
        {['all', 'new', 'analyzing', 'under_contract', 'acquired'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-all",
              filter === status 
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary animate-pulse-glow"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayProperties.map((property, index) => {
            const equity = property.current_value && property.purchase_price 
              ? property.current_value - property.purchase_price 
              : 0;
            const equityPercent = property.purchase_price 
              ? ((equity / property.purchase_price) * 100).toFixed(1)
              : '0';

            return (
              <div
                key={property.id}
                className="glass-card overflow-hidden animate-fade-in hover:border-primary/30 transition-all cursor-pointer group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Property Image Placeholder */}
                <div className="h-40 bg-gradient-to-br from-secondary to-muted relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  <div className={cn(
                    "absolute top-4 px-3 py-1 rounded-full border text-xs font-medium",
                    statusColors[property.status],
                    isRTL ? "right-4" : "left-4"
                  )}>
                    {property.status.replace('_', ' ').charAt(0).toUpperCase() + property.status.slice(1).replace('_', ' ')}
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className={cn("flex items-center gap-2 text-foreground", isRTL && "flex-row-reverse")}>
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{property.city}, {property.state}</span>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-4 space-y-4">
                  <div className={isRTL ? "text-right" : ""}>
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {property.address}
                    </h3>
                    <p className="text-sm text-muted-foreground">{property.property_type || 'Residential'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Purchase Price</p>
                      <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse justify-end")}>
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {property.purchase_price?.toLocaleString() || '-'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                      <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse justify-end")}>
                        <DollarSign className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground">
                          {property.monthly_rent?.toLocaleString() || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {equity !== 0 && (
                    <div className="pt-3 border-t border-border">
                      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                        <span className="text-sm text-muted-foreground">Equity Gain</span>
                        <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <span className="text-primary font-medium">
                            +${equity.toLocaleString()} ({equityPercent}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {displayProperties.length === 0 && !loading && (
        <div className="glass-card p-12 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-6">
            Start building your portfolio by adding your first property
          </p>
          <Button className="btn-premium text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Property
          </Button>
        </div>
      )}
    </div>
  );
};

export default Properties;
