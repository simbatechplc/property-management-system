import { motion } from 'framer-motion';
import { type UseFormReturn } from 'react-hook-form';
import {
  Home,
  Hotel,
  Building2,
  Castle,
  TreePalm,
  Building,
  MapPin,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { type FormData, type PropertyType } from './validationSchemas';
import { ImageUploader } from './ImageUploader';
import { MultiImageUploader } from './MultiImageUploader';

interface OwnerDetailsStepProps {
  form: UseFormReturn<FormData>;
}

const propertyTypes: { value: PropertyType; label: string; icon: React.ElementType }[] = [
  { value: 'property', label: 'Guesthouse', icon: Home },
  { value: 'hotel', label: 'Hotel', icon: Hotel },
  { value: 'resort', label: 'Resort', icon: TreePalm },
  { value: 'apartment', label: 'Apartment', icon: Building2 },
  { value: 'villa', label: 'Villa', icon: Castle },
];

export const OwnerDetailsStep = ({ form }: OwnerDetailsStepProps) => {
  const selectedPropertyType = form.watch('propertyType');
  const errors = form.formState.errors;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground">
          Property Details
        </h2>
        <p className="text-muted-foreground mt-2">
          Tell us about your property and business
        </p>
      </div>

      {/* Property Type Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">Property Type</Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {propertyTypes.map((type) => {
            const isSelected = selectedPropertyType === type.value;
            const Icon = type.icon;

            return (
              <motion.button
                key={type.value}
                type="button"
                onClick={() => form.setValue('propertyType', type.value, { shouldValidate: true })}
                className={cn(
                  'flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300',
                  isSelected
                    ? 'border-primary bg-accent shadow-glow'
                    : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
                )}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-all',
                    isSelected
                      ? 'gradient-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium transition-colors',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {type.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        {errors.propertyType && (
          <motion.p
            className="form-field-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.propertyType.message}
          </motion.p>
        )}
      </div>

      {/* Company Details */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
            Company Name
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <Building className="w-4 h-4" />
            </div>
            <Input
              id="companyName"
              placeholder="Your company name"
              {...form.register('companyName')}
              className={cn(
                'pl-10 h-12 bg-background border-border focus:border-primary',
                errors.companyName && 'border-destructive'
              )}
            />
          </div>
          {errors.companyName && (
            <motion.p
              className="form-field-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.companyName.message}
            </motion.p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyCity" className="text-sm font-medium text-foreground">
            Company City
          </Label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
            </div>
            <Input
              id="companyCity"
              placeholder="City where your business operates"
              {...form.register('companyCity')}
              className={cn(
                'pl-10 h-12 bg-background border-border focus:border-primary',
                errors.companyCity && 'border-destructive'
              )}
            />
          </div>
          {errors.companyCity && (
            <motion.p
              className="form-field-error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.companyCity.message}
            </motion.p>
          )}
        </div>
      </div>

      {/* Business Description */}
      <div className="space-y-2">
        <Label htmlFor="businessDescription" className="text-sm font-medium text-foreground">
          Business Description
        </Label>
        <Textarea
          id="businessDescription"
          placeholder="Describe your property and services (minimum 50 characters)"
          {...form.register('businessDescription')}
          className={cn(
            'min-h-[120px] bg-background border-border focus:border-primary resize-none',
            errors.businessDescription && 'border-destructive'
          )}
        />
        {errors.businessDescription && (
          <motion.p
            className="form-field-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {errors.businessDescription.message}
          </motion.p>
        )}
      </div>

      {/* Business License Upload */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <Label className="text-base font-semibold text-foreground">
            Business License
          </Label>
        </div>
        
        <div className="p-4 rounded-xl bg-accent/30 border border-border mb-2">
          <p className="text-sm text-muted-foreground">
            Please upload a clear image of your business license. Ensure all text and official stamps are visible and readable. Accepted formats: PNG, JPG, JPEG.
          </p>
        </div>

        <ImageUploader
          label="Business License Document"
          description="Upload your official business license or permit"
          value={form.watch('businessLicenseImage') || ''}
          onChange={(value) => form.setValue('businessLicenseImage', value, { shouldValidate: true })}
          error={errors.businessLicenseImage?.message}
        />
      </motion.div>

      {/* Property Images Upload */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          <Label className="text-base font-semibold text-foreground">
            Property Images
          </Label>
        </div>
        
        <div className="p-4 rounded-xl bg-accent/30 border border-border mb-2">
          <p className="text-sm text-muted-foreground">
            Upload high-quality images of your property to showcase it to potential guests. Include exterior views, rooms, amenities, and unique features. Accepted formats: PNG, JPG, JPEG.
          </p>
        </div>

        <MultiImageUploader
          label="Property Gallery"
          description="Upload at least 5 images of your property"
          value={form.watch('propertyImages') || []}
          onChange={(value) => form.setValue('propertyImages', value, { shouldValidate: true })}
          error={errors.propertyImages?.message}
          minImages={5}
          maxImages={10}
        />
      </motion.div>
    </div>
  );
};
