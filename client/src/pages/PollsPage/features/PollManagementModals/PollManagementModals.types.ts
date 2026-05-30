export type PollManagementModalsProps = {
  pollTitle: string;
  editOpen: boolean;
  editTitle: string;
  editDescription: string;
  editAllowVoteChange: boolean;
  editError: string;
  isUpdating: boolean;
  deleteOpen: boolean;
  deleteError: string;
  isDeleting: boolean;
  onCloseEdit: () => void;
  onChangeEditTitle: (value: string) => void;
  onChangeEditDescription: (value: string) => void;
  onChangeEditAllowVoteChange: (value: boolean) => void;
  onSaveEdit: () => void;
  onCloseDelete: () => void;
  onDelete: () => void;
};
