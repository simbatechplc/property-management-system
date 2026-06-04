import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepIndicator } from './StepIndicator';
import { PersonTypeStep } from './PersonTypeStep';
import { PersonalInfoStep } from './PersonalInfoStep';
import { OwnerDetailsStep } from './OwnerDetailsStep';
import { BrokerDetailsStep } from './BrokerDetailsStep';
import { SuccessStep } from './SuccessStep';
import { type FormData, getStepSchema, type PersonType } from './validationSchemas';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const steps = [
  { title: 'Person Type', description: 'Owner or Broker' },
  { title: 'Personal Info', description: 'Your details' },
  { title: 'Additional Info', description: 'Final details' },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

export const PropertyRegistrationForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const form = useForm<FormData>({
    mode: 'onChange',
    defaultValues: {
      personType: undefined,
      fullName: '',
      phoneNumber: '',
      email: '',
      password: '',
      confirmPassword: '',
      propertyType: undefined,
      companyName: '',
      companyCity: '',
      businessDescription: '',
      businessLicenseImage: '',
      propertyImages: [],
      nationalIdFront: '',
      nationalIdBack: '',
      bio: '',
    },
  });

  const personType = form.watch('personType') as PersonType | undefined;

  const validateCurrentStep = async (): Promise<{ valid: boolean; errors: string[] }> => {
    const schema = getStepSchema(currentStep, personType);
    try {
      const fieldsToValidate = Object.keys(schema.fields);
      const values = form.getValues();
      const stepValues = fieldsToValidate.reduce((acc, key) => {
        acc[key] = values[key as keyof FormData];
        return acc;
      }, {} as Record<string, unknown>);

      await schema.validate(stepValues, { abortEarly: false });
      return { valid: true, errors: [] };
    } catch (error: unknown) {
      // Trigger validation to show errors
      const fieldsToValidate = Object.keys(schema.fields) as (keyof FormData)[];
      fieldsToValidate.forEach((field) => {
        form.trigger(field);
      });

      // Extract error messages
      const yupError = error as { inner?: { message: string }[] };
      const errorMessages = yupError.inner?.map((e) => e.message) || ['Please fill in all required fields'];
      return { valid: false, errors: errorMessages };
    }
  };

  const handleNext = async () => {
    const { valid, errors } = await validateCurrentStep();
    if (!valid) {

      toast.error(
        errors[0] || "Please fill in all required fields correctly.",
      )
      return;
    }

    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    const { valid, errors } = await validateCurrentStep();
    if (!valid) {
      toast.error(
        errors[0] || "Please fill in all required fields correctly.",
      )
      return;
    }

    setIsSubmitting(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setIsCompleted(true);

    toast.success(
      "Your property has been registered successfully.",
    )

  };

  const handleReset = () => {
    form.reset();
    setCurrentStep(0);
    setIsCompleted(false);
  };


  const renderStep = () => {
    if (isCompleted) {
      return <SuccessStep formData={form.getValues()} onReset={handleReset} />;
    }

    switch (currentStep) {
      case 0:
        return <PersonTypeStep form={form} />;
      case 1:
        return <PersonalInfoStep form={form} />;
      case 2:
        return personType === 'owner' ? (
          <OwnerDetailsStep form={form} />
        ) : (
          <BrokerDetailsStep form={form} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
          Property Registration
        </h1>
        <p className="text-muted-foreground">
          Register your property or join as a broker in just a few steps
        </p>
      </div>

      {/* Step Indicator */}
      {!isCompleted && (
        <div className="mb-10">
          <StepIndicator steps={steps} currentStep={currentStep} />
        </div>
      )}

      {/* Form Card */}
      <div className="border border-border rounded-2xl bg-card shadow-lg p-6 sm:p-8">
        <form onSubmit={(e) => e.preventDefault()}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={isCompleted ? 'success' : currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons */}
          {!isCompleted && (
            <div className="flex justify-between mt-8 pt-6 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 0}
                className={cn(
                  'gap-2',
                  currentStep === 0 && 'invisible'
                )}
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : currentStep === steps.length - 1 ? (
                  <>
                    Complete Registration
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
