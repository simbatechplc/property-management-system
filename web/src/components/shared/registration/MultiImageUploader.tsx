import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiImageUploaderProps {
  label: string;
  description?: string;
  value: string[];
  onChange: (value: string[]) => void;
  error?: string;
  minImages?: number;
  maxImages?: number;
  className?: string;
}

export const MultiImageUploader = ({
  label,
  description,
  value,
  onChange,
  error,
  minImages = 5,
  maxImages = 10,
  className,
}: MultiImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;

    const newImages: string[] = [];
    const remainingSlots = maxImages - value.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        newImages.push(result);
        
        if (newImages.length === Math.min(files.length, remainingSlots)) {
          onChange([...value, ...newImages]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleAddClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => handleFileChange((e.target as HTMLInputElement).files);
    input.click();
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
        <span className="text-xs text-muted-foreground">
          {value.length} / {maxImages} images (minimum {minImages} required)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {value.map((image, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative aspect-square rounded-lg overflow-hidden border border-border group"
          >
            <img
              src={image}
              alt={`Property image ${index + 1}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="p-2 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-1 left-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded">
              {index + 1}
            </div>
          </motion.div>
        ))}

        {value.length < maxImages && (
          <motion.div
            onClick={handleAddClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              'aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all',
              isDragging
                ? 'border-primary bg-primary/5'
                : error
                ? 'border-destructive bg-destructive/5'
                : 'border-border bg-card hover:border-primary/40 hover:bg-accent/20'
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                isDragging ? 'bg-primary/20' : 'bg-muted'
              )}
            >
              {isDragging ? (
                <ImageIcon className="w-5 h-5 text-primary" />
              ) : (
                <Plus className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {isDragging ? 'Drop images here' : 'Add images'}
            </p>
          </motion.div>
        )}
      </div>

      {error && (
        <motion.p
          className="form-field-error"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </motion.p>
      )}

      {value.length > 0 && value.length < minImages && (
        <motion.p
          className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className="w-3 h-3" />
          Please add at least {minImages - value.length} more image{minImages - value.length > 1 ? 's' : ''}
        </motion.p>
      )}
    </div>
  );
};
