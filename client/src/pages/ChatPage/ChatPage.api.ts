import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';

import { setSelectedTopic } from '../../app/slices/uiSlice';
import { useCreateTopicMutation, useGetRoomByIdQuery, useGetTopicsQuery } from '../../api/chatApi';
import type { RootDispatch } from './ChatPage.store';

export const useChatRoomData = (selectedRoomId: string | null) => {
  const roomQuery = useGetRoomByIdQuery(selectedRoomId || '', { skip: !selectedRoomId });
  const topicsQuery = useGetTopicsQuery(selectedRoomId || '', { skip: !selectedRoomId });

  return {
    roomQuery,
    topicsQuery,
  };
};

export const useEnsureDirectTopic = (
  selectedRoomId: string | null,
  isDirect: boolean,
  topicIds: string[] | undefined,
  selectedTopicId: string | null,
) => {
  const dispatch = useDispatch<RootDispatch>();
  const [createDirectTopic] = useCreateTopicMutation();
  const autoCreatedTopicFor = useRef<string | null>(null);

  useEffect(() => {
    if (isDirect && topicIds && topicIds.length > 0 && !selectedTopicId) {
      dispatch(setSelectedTopic(topicIds[0]));
    }
  }, [dispatch, isDirect, topicIds, selectedTopicId]);

  useEffect(() => {
    if (
      isDirect &&
      selectedRoomId &&
      topicIds !== undefined &&
      topicIds.length === 0 &&
      autoCreatedTopicFor.current !== selectedRoomId
    ) {
      autoCreatedTopicFor.current = selectedRoomId;
      void createDirectTopic({
        roomId: selectedRoomId,
        title: 'direct',
        visibilityScope: { scopeType: 'ALL_MEMBERS' },
      });
    }
  }, [createDirectTopic, isDirect, selectedRoomId, topicIds]);
};
