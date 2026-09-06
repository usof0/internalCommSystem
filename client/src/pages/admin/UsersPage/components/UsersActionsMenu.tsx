import React from 'react';
import type { User } from '../../../../types';
import { ContextMenu, type ContextMenuItem } from '../../../../components/ui/ContextMenu';

export type UsersMenuState = {
  visible: boolean;
  x: number;
  y: number;
  user: User | null;
};

type Props = {
  state: UsersMenuState;
  onClose: () => void;
  items: ContextMenuItem[];
};

export const UsersActionsMenu: React.FC<Props> = ({ state, onClose, items }) => {
  return (
    <ContextMenu
      open={state.visible && !!state.user}
      x={state.x}
      y={state.y}
      onClose={onClose}
      items={items}
    />
  );
};
