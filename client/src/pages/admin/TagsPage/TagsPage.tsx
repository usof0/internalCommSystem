import React, { useMemo, useState } from 'react';
import { usePermission } from '../../../hooks/usePermission';
import {
  useListTagsQuery,
  useCreateTagMutation,
  useUpdateTagMutation,
  useDeleteTagMutation,
} from '../../../api/orgsApi';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { FormGroup, Input } from '../../../components/ui/Form';
import { LoadingState, ErrorState, EmptyState } from '../../../components/ui/States';

export const TagsPage: React.FC = () => {
  const canManageTags = usePermission('org.manage');

  const { data, isLoading, isError, refetch } = useListTagsQuery();
  const tags = data ?? [];

  const [createTag, { isLoading: creating }] = useCreateTagMutation();
  const [updateTag] = useUpdateTagMutation();
  const [deleteTag] = useDeleteTagMutation();

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const filteredTags = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter((tag) => tag.name.toLowerCase().includes(query));
  }, [search, tags]);

  if (!canManageTags) {
    return <div className="error">Нет прав для управления тегами</div>;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTag({ name: name.trim() }).unwrap();
      setName('');
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      alert('Не удалось создать тег');
    }
  };

  const handleUpdate = async (tagId: string, oldName: string) => {
    const newName = prompt('Новое название тега', oldName);
    if (!newName || newName === oldName) return;

    try {
      await updateTag({ tagId, body: { name: newName.trim() } }).unwrap();
    } catch (err) {
      console.error(err);
      alert('Не удалось обновить тег');
    }
  };

  const handleDelete = async (id: string, tagName: string) => {
    if (!confirm(`Удалить тег "${tagName}"?`)) return;
    try {
      await deleteTag(id).unwrap();
    } catch (err) {
      console.error(err);
      alert('Не удалось удалить тег');
    }
  };

  return (
    <div className="admin-tags-page">
      <PageHeader
        title="Теги"
        actions={
          <Button variant="primary" onClick={() => setIsCreating((v) => !v)}>
            {isCreating ? 'Отмена' : '+ Создать тег'}
          </Button>
        }
      />

      {isCreating && (
        <form onSubmit={handleCreate} className="create-tag-form">
          <FormGroup label="Название тега">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название тега"
              required
            />
          </FormGroup>

          <Button variant="primary" type="submit" loading={creating}>
            Создать
          </Button>
        </form>
      )}

      {tags.length > 0 && (
        <div className="tags-search">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск тегов..."
          />
          <span>{filteredTags.length} из {tags.length}</span>
        </div>
      )}

      {isLoading && <LoadingState />}
      {isError && <ErrorState onRetry={refetch} />}
      {!isLoading && !isError && tags.length === 0 && !isCreating && <EmptyState text="Нет тегов" />}
      {!isLoading && !isError && tags.length > 0 && filteredTags.length === 0 && <EmptyState text="Теги не найдены" />}

      {filteredTags.length > 0 && (
        <div className="tags-grid">
          {filteredTags.map((tag) => (
            <Card
              key={tag.id}
              actions={
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button size="sm" onClick={() => handleUpdate(tag.id, tag.name)}>
                    Изменить
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(tag.id, tag.name)}>
                    Удалить
                  </Button>
                </div>
              }
            >
              <h4 className="card-title">{tag.name}</h4>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
