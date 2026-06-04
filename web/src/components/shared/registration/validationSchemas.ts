import * as yup from 'yup';

export const personTypeSchema = yup.object({
  personType: yup.string().oneOf(['owner', 'broker']).required('Please select a person type'),
});

export const personalInfoSchema = yup.object({
  fullName: yup.string().required('Full name is required').min(2, 'Name must be at least 2 characters'),
  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, 'Please enter a valid phone number'),
  email: yup.string().required('Email is required').email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
});

export const ownerDetailsSchema = yup.object({
  propertyType: yup
    .string()
    .oneOf(['property', 'hotel', 'resort', 'apartment', 'villa'])
    .required('Please select a property type'),
  companyName: yup.string().required('Company name is required').min(2, 'Company name must be at least 2 characters'),
  companyCity: yup.string().required('Company city is required'),
  businessDescription: yup
    .string()
    .required('Business description is required')
    .min(50, 'Description must be at least 50 characters'),
  businessLicenseImage: yup.string().required('Business license image is required'),
  propertyImages: yup
    .array()
    .of(yup.string().required('Each image URL is required'))
    .min(5, 'Please upload at least 5 property images')
    .required('Property images are required'),
});

export const brokerDetailsSchema = yup.object({
  nationalIdFront: yup.string().required('Front side of National ID is required'),
  nationalIdBack: yup.string().required('Back side of National ID is required'),
  bio: yup
    .string()
    .required('Bio is required')
    .min(20, 'Bio must be at least 20 characters')
    .max(500, 'Bio must not exceed 500 characters'),
});

export type PersonType = 'owner' | 'broker';
export type PropertyType = 'property' | 'hotel' | 'resort' | 'apartment' | 'villa';

export interface FormData {
  personType: PersonType;
  fullName: string;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
  propertyType?: PropertyType;
  companyName?: string;
  companyCity?: string;
  businessDescription?: string;
  businessLicenseImage?: string;
  propertyImages?: string[];
  nationalIdFront?: string;
  nationalIdBack?: string;
  bio?: string;
}

export const getStepSchema = (step: number, personType?: PersonType) => {
  switch (step) {
    case 0:
      return personTypeSchema;
    case 1:
      return personalInfoSchema;
    case 2:
      return personType === 'owner' ? ownerDetailsSchema : brokerDetailsSchema;
    default:
      return personTypeSchema;
  }
};
