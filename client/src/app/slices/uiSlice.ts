import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  chatInfoPanelOpen: boolean;
  selectedRoomId: string | null;
  selectedTopicId: string | null;
  selectedThreadMessageId: string | null;
  threadUnreadCounts: Record<string, number>;
}

const initialState: UiState = {
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'dark',
  sidebarCollapsed: false,
  chatInfoPanelOpen: false,
  selectedRoomId: null,
  selectedTopicId: null,
  selectedThreadMessageId: null,
  threadUnreadCounts: {},
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', state.theme);
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
      localStorage.setItem('theme', state.theme);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    toggleChatInfoPanel: (state) => {
      state.chatInfoPanelOpen = !state.chatInfoPanelOpen;
    },
    setChatInfoPanelOpen: (state, action: PayloadAction<boolean>) => {
      state.chatInfoPanelOpen = action.payload;
    },
    setSelectedRoom: (state, action: PayloadAction<string | null>) => {
      state.selectedRoomId = action.payload;
      state.selectedTopicId = null;
      state.selectedThreadMessageId = null;
    },
    setSelectedTopic: (state, action: PayloadAction<string | null>) => {
      state.selectedTopicId = action.payload;
      state.selectedThreadMessageId = null;
    },
    setSelectedThreadMessage: (state, action: PayloadAction<string | null>) => {
      state.selectedThreadMessageId = action.payload;
      if (action.payload) {
        delete state.threadUnreadCounts[action.payload];
      }
    },
    incrementThreadUnread: (state, action: PayloadAction<string>) => {
      const parentId = action.payload;
      state.threadUnreadCounts[parentId] = (state.threadUnreadCounts[parentId] ?? 0) + 1;
    },
    clearThreadUnread: (state, action: PayloadAction<string>) => {
      delete state.threadUnreadCounts[action.payload];
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  toggleChatInfoPanel,
  setChatInfoPanelOpen,
  setSelectedRoom,
  setSelectedTopic,
  setSelectedThreadMessage,
  incrementThreadUnread,
  clearThreadUnread,
} = uiSlice.actions;
export default uiSlice.reducer;
