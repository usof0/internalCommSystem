import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePermission } from '../../../hooks/usePermission';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { LoadingState, ErrorState } from '../../../components/ui/States';
import type { OrgUnit, OrgUnitNode } from '../../../types';
import {
  useAddOrgMember,
  useAddOrgTag,
  useCreateOrgUnit,
  useDeleteOrgUnit,
  useOrgDetailsData,
  useRemoveOrgMember,
  useRemoveOrgTag,
  useUpdateOrgUnit,
} from './OrgDetailsPage.api';
import type { GroupedOrgMember, OrgDetailsPageParams } from './OrgDetailsPage.types';
import { OrgDetailsHeader } from './features/OrgDetailsHeader/OrgDetailsHeader';
import { OrgDetailsEditForm } from './features/OrgDetailsEditForm/OrgDetailsEditForm';
import { OrgTagsSection } from './features/OrgTagsSection/OrgTagsSection';
import { AddMemberModal } from './features/OrgMembersSection/components/AddMemberModal';
import { OrgMembersSection } from './features/OrgMembersSection/OrgMembersSection';
import { OrgChildrenSection } from './features/OrgChildrenSection/OrgChildrenSection';
import './OrgDetailsPage.css';

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<unknown>;
};

function findPath(nodes: OrgUnitNode[], targetId: string, path: OrgUnit[] = []): OrgUnit[] | null {
  for (const node of nodes) {
    const next = [...path, node];
    if (node.id === targetId) return next;
    const found = findPath(node.children, targetId, next);
    if (found) return found;
  }
  return null;
}

function findNode(nodes: OrgUnitNode[], targetId: string): OrgUnitNode | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    const found = findNode(node.children, targetId);
    if (found) return found;
  }
  return null;
}

export const OrgDetailsPage: React.FC = () => {
  const { orgId } = useParams<OrgDetailsPageParams>();
  const navigate = useNavigate();
  const canManage = usePermission('org.manage');

  const { orgQuery, membersQuery, treeQuery, positionsQuery, tagsQuery, orgTagsQuery, usersQuery } =
    useOrgDetailsData(orgId);

  const { data: org, isLoading, isError, refetch } = orgQuery;
  const members = membersQuery.data?.items ?? [];
  const membersLoading = membersQuery.isLoading;
  const tree = treeQuery.data?.items ?? [];
  const positions = positionsQuery.data ?? [];
  const allTags = tagsQuery.data ?? [];
  const orgTags = orgTagsQuery.data ?? [];
  const allUsers = usersQuery.data?.items ?? [];

  // Derived
  const currentNode = useMemo(() => (orgId ? findNode(tree, orgId) : null), [tree, orgId]);
  const breadcrumb = useMemo(() => (orgId ? findPath(tree, orgId) ?? [] : []), [tree, orgId]);
  const children = currentNode?.children ?? [];
  const assignedTagIds = useMemo(() => new Set(orgTags.map((tag) => tag.id)), [orgTags]);
  const availableTags = useMemo(
    () => allTags.filter((tag) => !assignedTagIds.has(tag.id)),
    [allTags, assignedTagIds],
  );

  // Group flat members list by userId so multi-position users appear only once
  const groupedMembers = useMemo<GroupedOrgMember[]>(() => {
    const map = new Map<string, GroupedOrgMember>();
    for (const m of members) {
      if (!map.has(m.userId)) {
        map.set(m.userId, {
          userId: m.userId,
          email: m.email,
          displayName: m.displayName,
          avatarUrl: m.avatarUrl,
          positions: [],
        });
      }
      map.get(m.userId)!.positions.push({ positionId: m.positionId, positionName: m.positionName });
    }
    return Array.from(map.values());
  }, [members]);

  // Only show users not yet in this unit at all in the "Add member" modal
  const availableUsers = useMemo(
    () => allUsers.filter((u) => !groupedMembers.some((m) => m.userId === u.id)),
    [allUsers, groupedMembers],
  );

  // Mutations
  const [updateOrgUnit, { isLoading: isSaving }] = useUpdateOrgUnit();
  const [deleteOrgUnit, { isLoading: isDeleting }] = useDeleteOrgUnit();
  const [createOrgUnit, { isLoading: isCreatingChild }] = useCreateOrgUnit();
  const [addMember] = useAddOrgMember();
  const [removeMember] = useRemoveOrgMember();
  const [addTag] = useAddOrgTag();
  const [removeTag] = useRemoveOrgTag();

  // Edit org state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Add member state
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [addUserId, setAddUserId] = useState('');
  const [addPositionId, setAddPositionId] = useState('');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  const [addMemberLoading, setAddMemberLoading] = useState(false);

  // Create child state
  const [creatingChild, setCreatingChild] = useState(false);
  const [childName, setChildName] = useState('');
  const [childDesc, setChildDesc] = useState('');
  const [childError, setChildError] = useState<string | null>(null);

  // ---- Handlers ----------------------------------------------------------------

  const startEdit = () => {
    setEditName(org?.name ?? '');
    setEditDesc(org?.description ?? '');
    setSaveError(null);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!orgId || !editName.trim()) return;
    setSaveError(null);
    try {
      await updateOrgUnit({ orgUnitId: orgId, body: { name: editName.trim(), description: editDesc.trim() || null } }).unwrap();
      setIsEditing(false);
    } catch {
      setSaveError('Не удалось сохранить изменения');
    }
  };

  const handleDelete = async () => {
    if (!orgId) return;
    try {
      await deleteOrgUnit(orgId).unwrap();
      navigate('/admin/organizations');
    } catch {
      setConfirmError('Не удалось удалить подразделение');
    }
  };

  const handleAddMember = async () => {
    if (!orgId || !addUserId || !addPositionId) {
      setAddMemberError('Выберите пользователя и должность');
      return;
    }
    setAddMemberError(null);
    setAddMemberLoading(true);
    try {
      await addMember({ orgUnitId: orgId, body: { userId: addUserId, positionId: addPositionId } }).unwrap();
      setAddUserId('');
      setAddPositionId('');
      setAddMemberOpen(false);
    } catch (e: any) {
      setAddMemberError(e?.data?.message ?? 'Не удалось добавить участника');
    } finally {
      setAddMemberLoading(false);
    }
  };

  const handleRemovePosition = async (userId: string, positionId: string) => {
    if (!orgId) return;
    try {
      await removeMember({ orgUnitId: orgId, userId, body: { positionId } }).unwrap();
    } catch {
      // silently fail
    }
  };

  const handleRemoveAllPositions = async (member: GroupedOrgMember) => {
    if (!orgId) return;
    setConfirm({
      title: 'Удалить участника?',
      message: `${member.displayName || member.email} будет удален из подразделения со всеми должностями.`,
      confirmLabel: 'Удалить участника',
      onConfirm: async () => {
        for (const pos of member.positions) {
          await removeMember({ orgUnitId: orgId, userId: member.userId, body: { positionId: pos.positionId } }).unwrap();
        }
      },
    });
  };

  const handleAddPosition = async (userId: string, positionId: string) => {
    if (!orgId || !positionId) return;
    try {
      await addMember({ orgUnitId: orgId, body: { userId, positionId } }).unwrap();
    } catch {
      // silently fail
    }
  };

  const handleAddTag = async (tagId: string) => {
    if (!orgId || !tagId) return;
    try {
      await addTag({ orgUnitId: orgId, tagId }).unwrap();
    } catch {
      // silently fail
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    if (!orgId) return;
    try {
      await removeTag({ orgUnitId: orgId, tagId }).unwrap();
    } catch {
      // silently fail
    }
  };

  const handleCreateChild = async () => {
    if (!orgId || !childName.trim()) {
      setChildError('Название обязательно');
      return;
    }
    setChildError(null);
    try {
      await createOrgUnit({ name: childName.trim(), description: childDesc.trim() || null, parentId: orgId }).unwrap();
      setChildName('');
      setChildDesc('');
      setCreatingChild(false);
    } catch {
      setChildError('Не удалось создать подразделение');
    }
  };

  const handleDeleteChild = async (childId: string, name: string) => {
    setConfirm({
      title: 'Удалить дочернее подразделение?',
      message: `Подразделение "${name}" будет удалено. Все связанные данные для этого узла станут недоступны.`,
      confirmLabel: 'Удалить подразделение',
      onConfirm: async () => {
        await deleteOrgUnit(childId).unwrap();
      },
    });
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setConfirmError(null);
    try {
      await confirm.onConfirm();
      setConfirm(null);
    } catch {
      setConfirmError('Не удалось выполнить действие');
    }
  };

  // ---- Render -----------------------------------------------------------------

  if (isLoading) return <LoadingState />;
  if (isError || !org) return <ErrorState onRetry={refetch} />;

  return (
    <div className="org-details-page">
      <OrgDetailsHeader
        org={org}
        breadcrumb={breadcrumb}
        canManage={canManage}
        isEditing={isEditing}
        memberCount={groupedMembers.length}
        childCount={children.length}
        tagCount={orgTags.length}
        onNavigateToList={() => navigate('/admin/organizations')}
        onNavigateToOrg={(targetOrgId) => navigate(`/admin/organizations/${targetOrgId}`)}
        onStartEdit={startEdit}
        onRequestDelete={() =>
          setConfirm({
            title: 'Удалить подразделение?',
            message: `Подразделение "${org.name}" будет удалено. Это действие нельзя отменить.`,
            confirmLabel: 'Удалить подразделение',
            onConfirm: handleDelete,
          })
        }
      />

      {isEditing ? (
        <OrgDetailsEditForm
          name={editName}
          description={editDesc}
          error={saveError}
          isSaving={isSaving}
          onChangeName={setEditName}
          onChangeDescription={setEditDesc}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      ) : null}

      <OrgTagsSection
        tags={orgTags}
        availableTags={availableTags}
        canManage={canManage}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
      />

      <OrgMembersSection
        members={groupedMembers}
        positions={positions}
        canManage={canManage}
        isLoading={membersLoading}
        onOpenAddMember={() => setAddMemberOpen(true)}
        onAddPosition={handleAddPosition}
        onRemovePosition={handleRemovePosition}
        onRemoveMember={handleRemoveAllPositions}
      />

      <OrgChildrenSection
        children={children}
        canManage={canManage}
        isCreating={creatingChild}
        childName={childName}
        childDescription={childDesc}
        childError={childError}
        isSaving={isCreatingChild}
        onToggleCreating={() => setCreatingChild((value) => !value)}
        onChangeChildName={setChildName}
        onChangeChildDescription={setChildDesc}
        onCancelCreate={() => {
          setCreatingChild(false);
          setChildName('');
          setChildDesc('');
        }}
        onCreate={handleCreateChild}
        onOpenChild={(childId) => navigate(`/admin/organizations/${childId}`)}
        onDeleteChild={handleDeleteChild}
      />

      <AddMemberModal
        open={addMemberOpen}
        users={availableUsers}
        positions={positions}
        selectedUserId={addUserId}
        selectedPositionId={addPositionId}
        error={addMemberError}
        isLoading={addMemberLoading}
        onClose={() => {
          setAddMemberOpen(false);
          setAddMemberError(null);
          setAddUserId('');
          setAddPositionId('');
        }}
        onChangeUser={setAddUserId}
        onChangePosition={setAddPositionId}
        onSubmit={handleAddMember}
      />

      <Modal
        open={!!confirm}
        onClose={() => {
          if (!isDeleting) setConfirm(null);
        }}
        maxWidth={460}
        title={<div className="org-details-confirm-title">{confirm?.title}</div>}
        footer={
          <div className="org-details-confirm-actions">
            <Button onClick={() => setConfirm(null)} disabled={isDeleting}>
              Отмена
            </Button>
            <Button variant="danger" onClick={runConfirm} loading={isDeleting}>
              {confirm?.confirmLabel || 'Подтвердить'}
            </Button>
          </div>
        }
      >
        <div className="org-details-confirm-body">
          <p>{confirm?.message}</p>
          {confirmError ? <div className="org-details-error">{confirmError}</div> : null}
        </div>
      </Modal>
    </div>
  );
};
