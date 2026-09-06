export type UserBasicInfoFormData = {
  firstName: string;
  secondName: string;
  lastName: string;
  displayName: string;
};

export type UserBasicInfoSectionProps = {
  email: string;
  profile: {
    firstName?: string | null;
    secondName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
  };
  isEditing: boolean;
  formData: UserBasicInfoFormData;
  onChange: (next: UserBasicInfoFormData) => void;
};
