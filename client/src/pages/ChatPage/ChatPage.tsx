import React, { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setChatInfoPanelOpen,
  setSelectedRoom,
  setSelectedTopic,
  toggleChatInfoPanel,
} from '../../app/slices/uiSlice';
import type { RootState } from '../../app/store';
import { useEnsureDirectTopic, useChatRoomData } from './ChatPage.api';
import { displayName } from './features/utils/chatFormatters';
import {
  ChatInfoPanel,
  ChatMainHeader,
  ChatPanels,
  ChatSidebarShell,
  CreateRoomModal,
  RoomsList,
} from './features';

export const ChatPage: React.FC = () => {
  const dispatch = useDispatch();
  const [createRoomOpen, setCreateRoomOpen] = useState(false);
  const selectedRoomId = useSelector((state: RootState) => state.ui.selectedRoomId);
  const selectedTopicId = useSelector((state: RootState) => state.ui.selectedTopicId);
  const selectedThreadMessageId = useSelector(
    (state: RootState) => state.ui.selectedThreadMessageId
  );
  const chatInfoPanelOpen = useSelector((state: RootState) => state.ui.chatInfoPanelOpen);

  const { roomQuery, topicsQuery } = useChatRoomData(selectedRoomId);
  const room = roomQuery.data;
  const topics = topicsQuery.data;

  const isDirect = room?.type === 'DIRECT';
  const roomsCompact = !!selectedRoomId && !!room && !isDirect;

  useEnsureDirectTopic(
    selectedRoomId,
    !!isDirect,
    topics?.map((topic) => topic.id),
    selectedTopicId,
  );

  const { chatTitle, chatSubtitle } = useMemo(() => {
    const dmName = isDirect && room?.directRecipient ? displayName(room.directRecipient) : null;
    const selectedTopic = topics?.find((topic) => topic.id === selectedTopicId);
    const title = isDirect ? (dmName ?? room?.title ?? 'Чат') : (selectedTopic?.title ?? room?.title ?? 'Чат');
    const subtitle = !isDirect && selectedTopic && room ? room.title : undefined;

    return {
      chatTitle: title,
      chatSubtitle: subtitle,
    };
  }, [isDirect, room, selectedTopicId, topics]);

  const handleCloseRoom = () => {
    dispatch(setSelectedRoom(null));
    dispatch(setChatInfoPanelOpen(false));
  };

  const handleCloseTopic = () => {
    dispatch(setSelectedTopic(null));
    dispatch(setChatInfoPanelOpen(false));
  };

  return (
    <div className="chat-page">
      <ChatSidebarShell compact={roomsCompact} onOpenCreateRoom={() => setCreateRoomOpen(true)}>
        <RoomsList compact={roomsCompact} />
      </ChatSidebarShell>

      <ChatPanels
        selectedRoomId={selectedRoomId}
        selectedTopicId={selectedTopicId}
        selectedThreadMessageId={selectedThreadMessageId}
        room={room}
        isDirect={!!isDirect}
        header={
          <ChatMainHeader
          title={chatTitle}
          subtitle={chatSubtitle}
          avatarUrl={isDirect ? room?.directRecipient?.avatarUrl : room?.avatarUrl}
          avatarName={isDirect ? (room?.directRecipient ? displayName(room.directRecipient) : chatTitle) : room?.title ?? chatTitle}
          showInfoButton={!!selectedRoomId}
          infoPanelOpen={chatInfoPanelOpen}
          onToggleInfo={() => dispatch(toggleChatInfoPanel())}
          onCloseRoom={
            selectedTopicId && !isDirect
              ? handleCloseTopic
              : selectedRoomId
                ? handleCloseRoom
                : undefined
          }
          closeButtonLabel={selectedTopicId && !isDirect ? 'Закрыть тему' : 'Закрыть комнату'}
          />
        }
      />
      
      <ChatInfoPanel />

      <CreateRoomModal open={createRoomOpen} onClose={() => setCreateRoomOpen(false)} />
    </div>
  );
};
