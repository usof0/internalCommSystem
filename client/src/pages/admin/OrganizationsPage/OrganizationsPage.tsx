import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateOrgUnitMutation,
  useDeleteOrgUnitMutation,
  useGetOrgTreeQuery,
  useUpdateOrgUnitMutation,
} from '../../../api/orgsApi';
import { Button } from '../../../components/ui/Button';
import { ContextMenu, type ContextMenuItem } from '../../../components/ui/ContextMenu';
import { Input, Select } from '../../../components/ui/Form';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui/States';
import { usePermission } from '../../../hooks/usePermission';
import type { OrgUnitNode } from '../../../types/orgTypes';
import './OrganizationsPage.css';

type OrgFormState = {
  name: string;
  description: string;
  parentId: string;
};

type FlatOrgUnit = {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  depth: number;
  path: string;
  childrenCount: number;
};

type ConfirmState = {
  node: OrgUnitNode;
};

const emptyForm: OrgFormState = { name: '', description: '', parentId: '' };

function flattenTree(nodes: OrgUnitNode[]): FlatOrgUnit[] {
  const output: FlatOrgUnit[] = [];

  const walk = (node: OrgUnitNode, depth = 0, parentPath = '') => {
    const path = parentPath ? `${parentPath} / ${node.name}` : node.name;
    output.push({
      id: node.id,
      name: node.name,
      description: node.description,
      parentId: node.parentId,
      depth,
      path,
      childrenCount: node.children.length,
    });
    node.children.forEach((child) => walk(child, depth + 1, path));
  };

  nodes.forEach((node) => walk(node));
  return output;
}

function collectIds(nodes: OrgUnitNode[]) {
  const ids: string[] = [];
  const walk = (node: OrgUnitNode) => {
    ids.push(node.id);
    node.children.forEach(walk);
  };
  nodes.forEach(walk);
  return ids;
}

function filterTree(nodes: OrgUnitNode[], query: string): OrgUnitNode[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nodes;

  return nodes
    .map((node) => {
      const children = filterTree(node.children, normalized);
      const matches = [node.name, node.description].filter(Boolean).join(' ').toLowerCase().includes(normalized);
      if (!matches && children.length === 0) return null;
      return { ...node, children };
    })
    .filter((node): node is OrgUnitNode => !!node);
}

export const OrganizationsPage: React.FC = () => {
  const navigate = useNavigate();
  const canManageOrg = usePermission('org.manage');

  const { data, isLoading, isError, refetch } = useGetOrgTreeQuery();
  const tree = data?.items ?? [];
  const flat = useMemo(() => flattenTree(tree), [tree]);
  const rootCount = tree.length;
  const maxDepth = flat.length > 0 ? Math.max(...flat.map((item) => item.depth)) + 1 : 0;

  const [createOrgUnit, { isLoading: creating }] = useCreateOrgUnitMutation();
  const [updateOrgUnit, { isLoading: updating }] = useUpdateOrgUnitMutation();
  const [deleteOrgUnit, { isLoading: deleting }] = useDeleteOrgUnitMutation();

  const [mode, setMode] = useState<'idle' | 'create' | 'edit'>('idle');
  const [editingNode, setEditingNode] = useState<OrgUnitNode | null>(null);
  const [form, setForm] = useState<OrgFormState>(emptyForm);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);
  const [menu, setMenu] = useState<{ visible: boolean; x: number; y: number; node: OrgUnitNode | null }>({
    visible: false,
    x: 0,
    y: 0,
    node: null,
  });
  const [errorMessage, setErrorMessage] = useState('');

  const visibleTree = useMemo(() => filterTree(tree, search), [search, tree]);
  const filteredIds = useMemo(() => collectIds(visibleTree), [visibleTree]);

  React.useEffect(() => {
    if (tree.length > 0) {
      setExpandedNodes(new Set(collectIds(tree)));
    }
  }, [tree]);

  if (!canManageOrg) {
    return <div className="error">Нет прав для управления подразделениями</div>;
  }

  const openCreate = (parentId = '') => {
    setMode('create');
    setEditingNode(null);
    setErrorMessage('');
    setForm({ ...emptyForm, parentId });
  };

  const openEdit = (node: OrgUnitNode) => {
    setMode('edit');
    setEditingNode(node);
    setErrorMessage('');
    setForm({
      name: node.name,
      description: node.description ?? '',
      parentId: node.parentId ?? '',
    });
  };

  const closeForm = () => {
    setMode('idle');
    setEditingNode(null);
    setForm(emptyForm);
    setErrorMessage('');
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    try {
      if (mode === 'edit' && editingNode) {
        await updateOrgUnit({
          orgUnitId: editingNode.id,
          body: {
            name: form.name.trim(),
            description: form.description.trim() || null,
            parentId: form.parentId || null,
          },
        }).unwrap();
      } else {
        await createOrgUnit({
          name: form.name.trim(),
          description: form.description.trim() || null,
          parentId: form.parentId || null,
        }).unwrap();
      }
      closeForm();
    } catch (error) {
      console.error(error);
      setErrorMessage(mode === 'edit' ? 'Не удалось обновить подразделение.' : 'Не удалось создать подразделение.');
    }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setErrorMessage('');
    try {
      await deleteOrgUnit(confirm.node.id).unwrap();
      setConfirm(null);
      if (editingNode?.id === confirm.node.id) closeForm();
    } catch (error) {
      console.error(error);
      setErrorMessage('Не удалось удалить подразделение.');
    }
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((previous) => {
      const next = new Set(previous);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const expandAll = () => setExpandedNodes(new Set(filteredIds));
  const collapseAll = () => setExpandedNodes(new Set());

  const parentOptions = flat.filter((item) => item.id !== editingNode?.id);
  const menuNode = menu.node;
  const menuItems: ContextMenuItem[] = menuNode
    ? [
        {
          label: 'Добавить дочернее',
          onClick: () => openCreate(menuNode.id),
        },
        {
          label: 'Изменить',
          onClick: () => openEdit(menuNode),
        },
        {
          label: 'Удалить',
          danger: true,
          onClick: () => setConfirm({ node: menuNode }),
        },
      ]
    : [];

  const renderNode = (node: OrgUnitNode, depth = 0) => {
    const hasChildren = node.children.length > 0;
    const forceExpanded = !!search.trim();
    const isExpanded = forceExpanded || expandedNodes.has(node.id);

    return (
      <li key={node.id} className="org-tree-item">
        <article
          className="org-node-card"
          style={{ '--org-depth': depth } as React.CSSProperties}
          onContextMenu={(event) => {
            event.preventDefault();
            setMenu({ visible: true, x: event.clientX, y: event.clientY, node });
          }}
        >
          <button
            type="button"
            className="org-node-card__toggle"
            onClick={() => toggleNode(node.id)}
            disabled={!hasChildren || forceExpanded}
            aria-label={isExpanded ? 'Свернуть подразделение' : 'Развернуть подразделение'}
          >
            {hasChildren ? (
              <svg viewBox="0 0 24 24" aria-hidden="true" className={isExpanded ? 'is-expanded' : ''}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            ) : (
              <span />
            )}
          </button>

          <button type="button" className="org-node-card__body" onClick={() => navigate(`/admin/organizations/${node.id}`)}>
            <span className="org-node-card__name">{node.name}</span>
            <span className="org-node-card__description">{node.description || 'Описание не задано'}</span>
          </button>

          <div className="org-node-card__meta">
            <span>{node.children.length} дочерних</span>
          </div>

          <span className="org-node-card__hint">Правый клик</span>
        </article>

        {hasChildren && isExpanded ? <ul className="org-tree">{node.children.map((child) => renderNode(child, depth + 1))}</ul> : null}
      </li>
    );
  };

  return (
    <div className="admin-organizations-page">
      <section className="org-hero">
        <div>
          <span>Оргструктура</span>
          <h1>Подразделения</h1>
        </div>
        <Button variant="primary" onClick={() => (mode === 'create' ? closeForm() : openCreate())}>
          {mode === 'create' ? 'Закрыть форму' : 'Создать подразделение'}
        </Button>
      </section>

      <section className="org-stats-grid" aria-label="Сводка подразделений">
        <div className="org-stat-card">
          <strong>{flat.length}</strong>
          <span>Всего подразделений</span>
        </div>
        <div className="org-stat-card">
          <strong>{rootCount}</strong>
          <span>Корневых разделов</span>
        </div>
        <div className="org-stat-card">
          <strong>{maxDepth}</strong>
          <span>Уровней структуры</span>
        </div>
      </section>

      {mode !== 'idle' ? (
        <form className="org-form-panel" onSubmit={submitForm}>
          <div className="org-form-panel__header">
            <div>
              <h2>{mode === 'edit' ? 'Редактировать подразделение' : 'Новое подразделение'}</h2>
              <p>{mode === 'edit' ? 'Измените название, описание или родительский раздел.' : 'Создайте корневое или дочернее подразделение.'}</p>
            </div>
            <Button type="button" onClick={closeForm} disabled={creating || updating}>
              Отмена
            </Button>
          </div>

          <div className="org-form-grid">
            <label>
              <span>Название *</span>
              <Input
                value={form.name}
                onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                required
                autoFocus
              />
            </label>
            <label>
              <span>Родитель</span>
              <Select
                value={form.parentId}
                onChange={(event) => setForm((previous) => ({ ...previous, parentId: event.target.value }))}
              >
                <option value="">Корневой раздел</option>
                {parentOptions.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {'— '.repeat(unit.depth)}{unit.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="org-form-grid__wide">
              <span>Описание</span>
              <Input
                value={form.description}
                onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                placeholder="Краткое описание назначения подразделения"
              />
            </label>
          </div>

          {errorMessage ? <div className="org-error-message">{errorMessage}</div> : null}

          <div className="org-form-panel__actions">
            <Button variant="primary" type="submit" loading={creating || updating}>
              {mode === 'edit' ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      ) : null}

      {errorMessage && mode === 'idle' ? <div className="org-error-message">{errorMessage}</div> : null}

      <section className="org-directory-panel">
        <div className="org-directory-toolbar">
          <div>
            <h2>Дерево подразделений</h2>
            <p>{search.trim() ? `Найдено узлов: ${filteredIds.length}` : 'Иерархия всей организации'}</p>
          </div>
          <div className="org-directory-actions">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Поиск подразделений" />
            <Button onClick={expandAll} disabled={filteredIds.length === 0}>
              Развернуть
            </Button>
            <Button onClick={collapseAll}>
              Свернуть
            </Button>
          </div>
        </div>

        {isLoading ? <LoadingState /> : null}
        {isError ? <ErrorState text="Ошибка загрузки подразделений." onRetry={refetch} /> : null}
        {!isLoading && !isError && tree.length === 0 ? <EmptyState text="Подразделения еще не созданы" /> : null}
        {!isLoading && !isError && tree.length > 0 && visibleTree.length === 0 ? <EmptyState text="По запросу ничего не найдено" /> : null}
        {!isLoading && !isError && visibleTree.length > 0 ? <ul className="org-tree org-tree--root">{visibleTree.map((node) => renderNode(node))}</ul> : null}
      </section>

      <Modal
        open={!!confirm}
        onClose={() => {
          if (!deleting) setConfirm(null);
        }}
        maxWidth={460}
        title={<div className="org-confirm-title">Удалить подразделение?</div>}
        footer={
          <div className="org-confirm-actions">
            <Button onClick={() => setConfirm(null)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              Удалить
            </Button>
          </div>
        }
      >
        <p className="org-confirm-message">
          {confirm ? `Подразделение "${confirm.node.name}" будет удалено. Убедитесь, что в нем нет нужных дочерних данных.` : ''}
        </p>
      </Modal>

      <ContextMenu
        open={menu.visible && !!menu.node}
        x={menu.x}
        y={menu.y}
        onClose={() => setMenu({ visible: false, x: 0, y: 0, node: null })}
        items={menuItems}
      />
    </div>
  );
};
