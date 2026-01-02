import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  MapPin, 
  DollarSign,
  TrendingUp,
  Filter,
  GitCompare,
  Check,
  X,
  BarChart3
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import PropertyDetailsModal from '@/components/properties/PropertyDetailsModal';
import PropertyComparison from '@/components/properties/PropertyComparison';

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

const Properties: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  // Comparison mode
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    state: '',
    property_type: 'Single-family',
    purchase_price: '',
    monthly_rent: '',
    status: 'new' as const
  });

  useEffect(() => {
    if (profile?.team_id) {
      fetchProperties();

      // Set up real-time subscription
      const channel = supabase
        .channel('properties-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'properties'
          },
          (payload) => {
            console.log('Realtime update:', payload);
            if (payload.eventType === 'INSERT') {
              setProperties(prev => [payload.new as Property, ...prev]);
              toast({
                title: "New Property",
                description: "A team member added a new property"
              });
            } else if (payload.eventType === 'UPDATE') {
              setProperties(prev => 
                prev.map(p => p.id === (payload.new as Property).id ? payload.new as Property : p)
              );
            } else if (payload.eventType === 'DELETE') {
              setProperties(prev => 
                prev.filter(p => p.id !== (payload.old as Property).id)
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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

  const handleAddProperty = async () => {
    if (!profile?.team_id) {
      toast({
        title: "Error",
        description: "You must be part of a team to add properties",
        variant: "destructive"
      });
      return;
    }

    if (!formData.address) {
      toast({
        title: "Error",
        description: "Address is required",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from('properties').insert({
      address: formData.address,
      city: formData.city || null,
      state: formData.state || null,
      property_type: formData.property_type,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      monthly_rent: formData.monthly_rent ? parseFloat(formData.monthly_rent) : null,
      status: formData.status,
      team_id: profile.team_id
    });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add property",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Property added successfully"
    });

    setFormData({
      address: '',
      city: '',
      state: '',
      property_type: 'Single-family',
      purchase_price: '',
      monthly_rent: '',
      status: 'new'
    });
    setIsAddDialogOpen(false);
    fetchProperties();
  };

  const handlePropertyClick = (property: Property) => {
    if (compareMode) {
      toggleCompareSelection(property.id);
    } else {
      setSelectedProperty(property);
      setIsDetailsOpen(true);
    }
  };

  const toggleCompareSelection = (propertyId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(propertyId)) {
        return prev.filter(id => id !== propertyId);
      }
      if (prev.length >= 4) {
        toast({
          title: "Maximum reached",
          description: "You can compare up to 4 properties at a time",
          variant: "destructive"
        });
        return prev;
      }
      return [...prev, propertyId];
    });
  };

  const resetForm = () => {
    setFormData({
      address: '',
      city: '',
      state: '',
      property_type: 'Single-family',
      purchase_price: '',
      monthly_rent: '',
      status: 'new'
    });
  };

  const handleStartComparison = () => {
    if (selectedForComparison.length < 2) {
      toast({
        title: "Select more properties",
        description: "Please select at least 2 properties to compare",
        variant: "destructive"
      });
      return;
    }
    setIsComparisonOpen(true);
  };

  const handleExitCompareMode = () => {
    setCompareMode(false);
    setSelectedForComparison([]);
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
  const comparisonProperties = displayProperties.filter(p => selectedForComparison.includes(p.id));

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in px-2 sm:px-0">
      {/* Header */}
      <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4", isRTL && "sm:flex-row-reverse")}>
        <div className={isRTL ? "text-right" : ""}>
          <div className={cn("flex items-center gap-3 mb-2", isRTL && "flex-row-reverse justify-end")}>
            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t('nav.properties')}</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your real estate portfolio
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {compareMode ? (
            <>
              <Button 
                variant="outline"
                onClick={handleExitCompareMode}
                className="gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Cancel</span>
              </Button>
              <Button 
                onClick={handleStartComparison}
                disabled={selectedForComparison.length < 2}
                className="btn-premium text-primary-foreground gap-2 text-sm"
              >
                <GitCompare className="w-4 h-4" />
                Compare ({selectedForComparison.length})
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline"
                onClick={() => navigate('/analytics')}
                className="gap-2 text-sm"
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
              <Button 
                variant="outline"
                onClick={() => setCompareMode(true)}
                className="gap-2 text-sm"
              >
                <GitCompare className="w-4 h-4" />
                <span className="hidden sm:inline">Compare</span>
              </Button>
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                className="btn-premium text-primary-foreground gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('properties.addProperty') || 'Add Property'}</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Compare Mode Banner */}
      {compareMode && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 sm:p-4 flex items-center justify-between">
          <p className="text-sm text-foreground">
            <span className="font-medium">Compare Mode:</span> Select 2-4 properties to compare side by side
          </p>
          <span className="text-sm text-primary font-medium">{selectedForComparison.length}/4 selected</span>
        </div>
      )}

      {/* Filters */}
      <div className={cn("flex items-center gap-2 sm:gap-3 flex-wrap", isRTL && "flex-row-reverse")}>
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1 sm:gap-2 flex-wrap">
          {['all', 'new', 'analyzing', 'under_contract', 'acquired'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={cn(
                "px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm transition-all",
                filter === status 
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Properties Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary animate-pulse-glow"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayProperties.map((property, index) => {
            const equity = property.current_value && property.purchase_price 
              ? property.current_value - property.purchase_price 
              : 0;
            const equityPercent = property.purchase_price 
              ? ((equity / property.purchase_price) * 100).toFixed(1)
              : '0';
            const isSelected = selectedForComparison.includes(property.id);

            return (
              <div
                key={property.id}
                onClick={() => handlePropertyClick(property)}
                className={cn(
                  "glass-card overflow-hidden animate-fade-in transition-all cursor-pointer group relative",
                  isSelected 
                    ? "border-primary ring-2 ring-primary/30" 
                    : "hover:border-primary/30"
                )}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Compare Checkbox */}
                {compareMode && (
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      isSelected ? "bg-primary" : "bg-secondary/80 border border-border"
                    )}>
                      {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
                    </div>
                  </div>
                )}

                {/* Property Image */}
                <div className="h-32 sm:h-40 bg-gradient-to-br from-secondary to-muted relative overflow-hidden">
                  {property.image_url ? (
                    <img 
                      src={property.image_url} 
                      alt={property.address}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent"></div>
                  <div className={cn(
                    "absolute top-3 sm:top-4 px-2 sm:px-3 py-1 rounded-full border text-xs font-medium",
                    statusColors[property.status],
                    isRTL ? "right-3 sm:right-4" : "left-3 sm:left-4"
                  )}>
                    {property.status.replace('_', ' ').charAt(0).toUpperCase() + property.status.slice(1).replace('_', ' ')}
                  </div>
                  <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                    <div className={cn("flex items-center gap-2 text-foreground", isRTL && "flex-row-reverse")}>
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                      <span className="font-medium text-sm sm:text-base">{property.city}, {property.state}</span>
                    </div>
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <div className={isRTL ? "text-right" : ""}>
                    <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {property.address}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{property.property_type || 'Residential'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Purchase Price</p>
                      <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse justify-end")}>
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {property.purchase_price?.toLocaleString() || '-'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                      <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse justify-end")}>
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {property.monthly_rent?.toLocaleString() || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {equity !== 0 && (
                    <div className="pt-2 sm:pt-3 border-t border-border">
                      <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                        <span className="text-xs sm:text-sm text-muted-foreground">Equity Gain</span>
                        <div className={cn("flex items-center gap-1", isRTL && "flex-row-reverse")}>
                          <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                          <span className="text-primary font-medium text-xs sm:text-sm">
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
        <div className="glass-card p-8 sm:p-12 text-center">
          <Building2 className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No properties yet</h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            Start building your portfolio by adding your first property
          </p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="btn-premium text-primary-foreground gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('properties.addFirstProperty') || 'Add Your First Property'}
          </Button>
        </div>
      )}

      {/* Add Property Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => { setIsAddDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t('properties.addProperty') || 'Add Property'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('properties.addPropertyDesc') || 'Add a new property to your portfolio'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address" className="text-foreground">{t('properties.address') || 'Address'} *</Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-secondary border-border"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-foreground">{t('properties.city') || 'City'}</Label>
                <Input
                  id="city"
                  placeholder="Miami"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state" className="text-foreground">{t('properties.state') || 'State'}</Label>
                <Input
                  id="state"
                  placeholder="FL"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="property_type" className="text-foreground">{t('properties.propertyType') || 'Property Type'}</Label>
              <Select 
                value={formData.property_type} 
                onValueChange={(value) => setFormData({ ...formData, property_type: value })}
              >
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single-family">Single-family</SelectItem>
                  <SelectItem value="Multi-family">Multi-family</SelectItem>
                  <SelectItem value="Duplex">Duplex</SelectItem>
                  <SelectItem value="Triplex">Triplex</SelectItem>
                  <SelectItem value="Apartment">Apartment</SelectItem>
                  <SelectItem value="Commercial">Commercial</SelectItem>
                  <SelectItem value="Land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchase_price" className="text-foreground">{t('properties.purchasePrice') || 'Purchase Price ($)'}</Label>
                <Input
                  id="purchase_price"
                  type="number"
                  placeholder="250000"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly_rent" className="text-foreground">{t('properties.monthlyRent') || 'Monthly Rent ($)'}</Label>
                <Input
                  id="monthly_rent"
                  type="number"
                  placeholder="2000"
                  value={formData.monthly_rent}
                  onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => { setIsAddDialogOpen(false); resetForm(); }}
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button 
              onClick={handleAddProperty}
              disabled={isSubmitting || !formData.address}
              className="btn-premium text-primary-foreground"
            >
              {isSubmitting ? (t('common.saving') || 'Saving...') : (t('properties.addProperty') || 'Add Property')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedProperty(null);
        }}
        onUpdate={fetchProperties}
        isRTL={isRTL}
      />

      {/* Property Comparison Modal */}
      <PropertyComparison
        properties={comparisonProperties}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
        onRemoveProperty={(id) => {
          setSelectedForComparison(prev => prev.filter(pId => pId !== id));
          if (selectedForComparison.length <= 2) {
            setIsComparisonOpen(false);
          }
        }}
        isRTL={isRTL}
      />
    </div>
  );
};

export default Properties;
