import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  TrendingUp, 
  Percent,
  Edit,
  Trash2,
  Calculator,
  Bot
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import PropertyImageUpload from './PropertyImageUpload';

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

interface PropertyDetailsModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  isRTL?: boolean;
}

const PropertyDetailsModal: React.FC<PropertyDetailsModalProps> = ({
  property,
  isOpen,
  onClose,
  onUpdate,
  isRTL = false
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editData, setEditData] = useState({
    address: '',
    city: '',
    state: '',
    property_type: '',
    purchase_price: '',
    current_value: '',
    monthly_rent: '',
    monthly_expenses: '',
    status: ''
  });

  React.useEffect(() => {
    if (property) {
      setEditData({
        address: property.address || '',
        city: property.city || '',
        state: property.state || '',
        property_type: property.property_type || 'Single-family',
        purchase_price: property.purchase_price?.toString() || '',
        current_value: property.current_value?.toString() || '',
        monthly_rent: property.monthly_rent?.toString() || '',
        monthly_expenses: property.monthly_expenses?.toString() || '',
        status: property.status || 'new'
      });
    }
  }, [property]);

  if (!property) return null;

  // Financial Calculations
  const purchasePrice = property.purchase_price || 0;
  const currentValue = property.current_value || purchasePrice;
  const monthlyRent = property.monthly_rent || 0;
  const monthlyExpenses = property.monthly_expenses || (monthlyRent * 0.35);
  const annualRent = monthlyRent * 12;
  const annualExpenses = monthlyExpenses * 12;
  const noi = annualRent - annualExpenses;
  const capRate = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;
  const cashOnCash = purchasePrice > 0 ? ((monthlyRent - monthlyExpenses) * 12 / (purchasePrice * 0.25)) * 100 : 0;
  const onePercentRule = purchasePrice > 0 ? (monthlyRent / purchasePrice) * 100 : 0;
  const equity = currentValue - purchasePrice;
  const grossYield = purchasePrice > 0 ? (annualRent / purchasePrice) * 100 : 0;

  const handleEdit = async () => {
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('properties')
      .update({
        address: editData.address,
        city: editData.city || null,
        state: editData.state || null,
        property_type: editData.property_type,
        purchase_price: editData.purchase_price ? parseFloat(editData.purchase_price) : null,
        current_value: editData.current_value ? parseFloat(editData.current_value) : null,
        monthly_rent: editData.monthly_rent ? parseFloat(editData.monthly_rent) : null,
        monthly_expenses: editData.monthly_expenses ? parseFloat(editData.monthly_expenses) : null,
        status: editData.status as any
      })
      .eq('id', property.id);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update property",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Property updated successfully"
    });
    
    setIsEditing(false);
    onUpdate();
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', property.id);

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Property deleted successfully"
    });
    
    setIsDeleting(false);
    onClose();
    onUpdate();
  };

  const handleAnalyze = () => {
    onClose();
    navigate('/analyzer', { state: { property } });
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500/20 text-blue-400',
    analyzing: 'bg-yellow-500/20 text-yellow-400',
    under_contract: 'bg-purple-500/20 text-purple-400',
    acquired: 'bg-primary/20 text-primary',
    archived: 'bg-muted text-muted-foreground',
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setIsEditing(false); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-[700px] bg-card border-border max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-4 sm:p-6 pb-0">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
              <DialogTitle className="text-foreground flex items-center gap-2 text-base sm:text-lg">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                {isEditing ? 'Edit Property' : 'Property Details'}
              </DialogTitle>
              <div className="flex items-center gap-1 sm:gap-2">
                {!isEditing && (
                  <>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsEditing(true)}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setIsDeleting(true)}
                      className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[calc(90vh-80px)]">
            {isEditing ? (
              <div className="space-y-4 p-4 sm:p-6 pt-4">
                {/* Image Upload */}
                <PropertyImageUpload
                  propertyId={property.id}
                  currentImageUrl={property.image_url}
                  onUploadComplete={() => onUpdate()}
                />

                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Address *</Label>
                  <Input
                    value={editData.address}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">City</Label>
                    <Input
                      value={editData.city}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">State</Label>
                    <Input
                      value={editData.state}
                      onChange={(e) => setEditData({ ...editData, state: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Property Type</Label>
                    <Select 
                      value={editData.property_type} 
                      onValueChange={(value) => setEditData({ ...editData, property_type: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
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
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Status</Label>
                    <Select 
                      value={editData.status} 
                      onValueChange={(value) => setEditData({ ...editData, status: value })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="analyzing">Analyzing</SelectItem>
                        <SelectItem value="under_contract">Under Contract</SelectItem>
                        <SelectItem value="acquired">Acquired</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Purchase Price ($)</Label>
                    <Input
                      type="number"
                      value={editData.purchase_price}
                      onChange={(e) => setEditData({ ...editData, purchase_price: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Current Value ($)</Label>
                    <Input
                      type="number"
                      value={editData.current_value}
                      onChange={(e) => setEditData({ ...editData, current_value: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Monthly Rent ($)</Label>
                    <Input
                      type="number"
                      value={editData.monthly_rent}
                      onChange={(e) => setEditData({ ...editData, monthly_rent: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground text-sm">Monthly Expenses ($)</Label>
                    <Input
                      type="number"
                      value={editData.monthly_expenses}
                      onChange={(e) => setEditData({ ...editData, monthly_expenses: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-4">
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="text-sm">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleEdit}
                    disabled={isSubmitting || !editData.address}
                    className="btn-premium text-primary-foreground text-sm"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-4">
                {/* Property Image */}
                {property.image_url && (
                  <img 
                    src={property.image_url} 
                    alt={property.address}
                    className="w-full h-40 sm:h-48 object-cover rounded-lg"
                  />
                )}

                {/* Property Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-foreground">{property.address}</h2>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{property.city}, {property.state}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{property.property_type}</p>
                  </div>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs sm:text-sm font-medium self-start",
                    statusColors[property.status]
                  )}>
                    {property.status.replace('_', ' ').charAt(0).toUpperCase() + property.status.slice(1).replace('_', ' ')}
                  </span>
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground mb-1">Purchase Price</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">${purchasePrice.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground mb-1">Current Value</p>
                    <p className="text-base sm:text-lg font-semibold text-foreground">${currentValue.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                    <p className="text-base sm:text-lg font-semibold text-primary">${monthlyRent.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs text-muted-foreground mb-1">Monthly Cashflow</p>
                    <p className={cn(
                      "text-base sm:text-lg font-semibold",
                      (monthlyRent - monthlyExpenses) > 0 ? "text-primary" : "text-destructive"
                    )}>
                      ${(monthlyRent - monthlyExpenses).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Financial Analysis */}
                <div className="glass-card p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">Financial Analysis</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">Cap Rate</span>
                      </div>
                      <p className={cn(
                        "text-lg sm:text-xl font-bold",
                        capRate >= 8 ? "text-primary" : capRate >= 5 ? "text-yellow-400" : "text-destructive"
                      )}>
                        {capRate.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {capRate >= 8 ? "Excellent" : capRate >= 5 ? "Good" : "Below Average"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">Cash-on-Cash</span>
                      </div>
                      <p className={cn(
                        "text-lg sm:text-xl font-bold",
                        cashOnCash >= 12 ? "text-primary" : cashOnCash >= 8 ? "text-yellow-400" : "text-destructive"
                      )}>
                        {cashOnCash.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cashOnCash >= 12 ? "Excellent" : cashOnCash >= 8 ? "Good" : "Below Average"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">1% Rule</span>
                      </div>
                      <p className={cn(
                        "text-lg sm:text-xl font-bold",
                        onePercentRule >= 1 ? "text-primary" : onePercentRule >= 0.8 ? "text-yellow-400" : "text-destructive"
                      )}>
                        {onePercentRule.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {onePercentRule >= 1 ? "Meets Rule" : onePercentRule >= 0.8 ? "Close" : "Below"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">Annual NOI</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-foreground">
                        ${noi.toLocaleString()}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Percent className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">Gross Yield</span>
                      </div>
                      <p className="text-lg sm:text-xl font-bold text-foreground">
                        {grossYield.toFixed(2)}%
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                        <span className="text-xs sm:text-sm text-muted-foreground">Equity Gain</span>
                      </div>
                      <p className={cn(
                        "text-lg sm:text-xl font-bold",
                        equity >= 0 ? "text-primary" : "text-destructive"
                      )}>
                        {equity >= 0 ? '+' : ''}${equity.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <Button 
                    onClick={handleAnalyze}
                    className="btn-premium text-primary-foreground flex-1 gap-2 text-sm"
                  >
                    <Bot className="w-4 h-4" />
                    AI Deep Analysis
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    className="flex-1 gap-2 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Property
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Property?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This action cannot be undone. This will permanently delete the property
              "{property.address}" from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-sm"
            >
              {isSubmitting ? 'Deleting...' : 'Delete Property'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PropertyDetailsModal;
