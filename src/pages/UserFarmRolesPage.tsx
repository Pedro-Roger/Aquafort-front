import { useState } from 'react';
import { AlertTriangle, Link2, Unlink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import {
  pageStack,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceSurface,
  workspaceTile,
} from '../components/ui/surfaces';
import { useFarms } from '../hooks/useFarms';
import { useUsers } from '../hooks/useUsers';
import { useLinkUserFarmRole, useUnlinkUserFarmRole } from '../hooks/useUserFarmRoles';
import { UserRole } from '../types';

const ROLE_OPTIONS = [
  { value: UserRole.ADMIN, label: 'Admin' },
  { value: UserRole.TECNICO, label: 'Técnico' },
  { value: UserRole.OPERADOR, label: 'Operador' },
];

function extractMessage(err: unknown, fallback: string) {
  const withResponse = err as { response?: { data?: { message?: string } }; message?: string };
  return withResponse?.response?.data?.message ?? withResponse?.message ?? fallback;
}

/**
 * RN-04: gestão de vínculos usuário-fazenda, exclusivo do admin global.
 *
 * O backend só expõe vincular (`POST /v1/farms/:farmId/users`) e desvincular
 * (`DELETE /v1/farms/:farmId/users/:userId`) — não existe endpoint pra
 * listar os vínculos já existentes de uma fazenda. Por isso esta tela não
 * mostra "quem está vinculado a quem": o admin escolhe fazenda + usuário e
 * age; o próprio backend recusa (409) um vínculo duplicado ou (404) um
 * desvínculo inexistente, e a mensagem de erro sobe pra tela. Sinalizado no
 * relatório final — falta um `GET /v1/farms/:farmId/users` no backend.
 */
export function UserFarmRolesPage() {
  const { data: farms = [], isLoading: farmsLoading } = useFarms();
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const linkRole = useLinkUserFarmRole();
  const unlinkRole = useUnlinkUserFarmRole();

  const [linkFarmId, setLinkFarmId] = useState('');
  const [linkUserId, setLinkUserId] = useState('');
  const [linkRoleValue, setLinkRoleValue] = useState<string>(UserRole.OPERADOR);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);

  const [unlinkFarmId, setUnlinkFarmId] = useState('');
  const [unlinkUserId, setUnlinkUserId] = useState('');
  const [unlinkError, setUnlinkError] = useState<string | null>(null);
  const [unlinkSuccess, setUnlinkSuccess] = useState<string | null>(null);

  const farmOptions = farms.map((farm) => ({ value: farm.id, label: farm.name }));
  const userOptions = users.map((user) => ({ value: user.id, label: `${user.name} (${user.email})` }));

  async function handleLink() {
    setLinkError(null);
    setLinkSuccess(null);
    if (!linkFarmId || !linkUserId) {
      setLinkError('Escolha a fazenda e o usuário.');
      return;
    }
    try {
      await linkRole.mutateAsync({ farmId: linkFarmId, userId: linkUserId, role: linkRoleValue as UserRole });
    } catch (err) {
      setLinkError(extractMessage(err, 'Não foi possível vincular o usuário a essa fazenda.'));
      return;
    }
    setLinkSuccess('Usuário vinculado com sucesso.');
    setLinkUserId('');
  }

  async function handleUnlink() {
    setUnlinkError(null);
    setUnlinkSuccess(null);
    if (!unlinkFarmId || !unlinkUserId) {
      setUnlinkError('Escolha a fazenda e o usuário.');
      return;
    }
    try {
      await unlinkRole.mutateAsync({ farmId: unlinkFarmId, userId: unlinkUserId });
    } catch (err) {
      setUnlinkError(extractMessage(err, 'Não foi possível desvincular o usuário dessa fazenda.'));
      return;
    }
    setUnlinkSuccess('Usuário desvinculado com sucesso.');
    setUnlinkUserId('');
  }

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={workspaceEyebrow}>Administração</div>
        <div style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 680 }}>
          Vincule ou remova o acesso de um usuário a uma fazenda, com o papel que ele exerce nela (RN-03: o papel pode
          mudar de uma fazenda para outra).
        </div>

        <div
          style={{
            ...workspaceTile,
            marginTop: space.section,
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            backgroundColor: 'rgba(217, 119, 6, 0.08)',
            border: '1px solid rgba(217, 119, 6, 0.25)',
          }}
        >
          <AlertTriangle size={16} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            O backend ainda não expõe um endpoint para listar os vínculos existentes de uma fazenda — esta tela só
            vincula e desvincula. Se tentar vincular alguém que já tem acesso, ou desvincular alguém sem vínculo, o
            próprio servidor recusa e o motivo aparece abaixo do formulário.
          </div>
        </div>
      </div>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link2 size={16} color="var(--accent-dark)" />
          <h2 style={sectionTitle}>Vincular usuário a uma fazenda</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Select
            label="Fazenda"
            options={farmOptions}
            value={linkFarmId}
            onChange={(e) => setLinkFarmId(e.target.value)}
            placeholder={farmsLoading ? 'Carregando...' : 'Selecione a fazenda'}
          />
          <Select
            label="Usuário"
            options={userOptions}
            value={linkUserId}
            onChange={(e) => setLinkUserId(e.target.value)}
            placeholder={usersLoading ? 'Carregando...' : 'Selecione o usuário'}
          />
          <Select
            label="Papel na fazenda"
            options={ROLE_OPTIONS}
            value={linkRoleValue}
            onChange={(e) => setLinkRoleValue(e.target.value)}
          />
        </div>
        {linkError && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{linkError}</div>}
        {linkSuccess && <div style={{ color: 'var(--accent-dark)', fontSize: 13 }}>{linkSuccess}</div>}
        <div>
          <Button icon={<Link2 size={16} />} loading={linkRole.isPending} onClick={handleLink}>
            Vincular
          </Button>
        </div>
      </section>

      <section style={workspaceCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Unlink size={16} color="var(--danger)" />
          <h2 style={sectionTitle}>Desvincular usuário de uma fazenda</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Select
            label="Fazenda"
            options={farmOptions}
            value={unlinkFarmId}
            onChange={(e) => setUnlinkFarmId(e.target.value)}
            placeholder={farmsLoading ? 'Carregando...' : 'Selecione a fazenda'}
          />
          <Select
            label="Usuário"
            options={userOptions}
            value={unlinkUserId}
            onChange={(e) => setUnlinkUserId(e.target.value)}
            placeholder={usersLoading ? 'Carregando...' : 'Selecione o usuário'}
          />
        </div>
        {unlinkError && <div style={{ color: 'var(--danger)', fontSize: 13 }}>{unlinkError}</div>}
        {unlinkSuccess && <div style={{ color: 'var(--accent-dark)', fontSize: 13 }}>{unlinkSuccess}</div>}
        <div>
          <Button variant="danger" icon={<Unlink size={16} />} loading={unlinkRole.isPending} onClick={handleUnlink}>
            Desvincular
          </Button>
        </div>
      </section>
    </div>
  );
}
