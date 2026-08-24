import { useState } from 'react';
import {
  pageStack,
  sectionSubtitle,
  sectionTitle,
  space,
  workspaceCard,
  workspaceEyebrow,
  workspaceSurface,
} from '../components/ui/surfaces';

type Audience = 'operador' | 'gestor';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqGroup {
  title: string;
  items: FaqItem[];
}

const OPERADOR_GROUPS: FaqGroup[] = [
  {
    title: 'Povoamento',
    items: [
      {
        question: 'Como povoo um berçário ou viveiro?',
        answer:
          'Vá em Povoamento, escolha "Berçário" ou "Viveiro" no topo. Preencha fornecedor, lote e a quantidade de pós-larvas — o resto (geração, PL/grama, densidade, biometria inicial) é opcional. Selecione um ou mais tanques disponíveis e clique em "Criar povoamento". Para viveiro, você ainda escolhe entre "Povoamento direto" ou "Transferência de berçário".',
      },
      {
        question: 'O campo "Biometria (opcional)" faz o quê?',
        answer:
          'Registra um peso médio inicial já no ato do povoamento, sem precisar abrir a tela de Biometrias depois. É opcional porque nem toda fazenda mede peso na chegada da larva.',
      },
    ],
  },
  {
    title: 'Transferência',
    items: [
      {
        question: 'Qual a diferença entre transferência Parcial, Total e Automático?',
        answer:
          'O sistema calcula sozinho a população restante do viveiro de origem (o que foi povoado, menos mortalidade, menos o que já saiu em transferências anteriores). Em "Automático" (recomendado), ele decide certo: se você está movendo tudo que resta, o ciclo de origem fecha sozinho; se sobra alguma coisa, ele continua ativo. Só escolha "Parcial" ou "Total" manualmente se tiver certeza — marcar "Parcial" numa transferência que na prática esvazia o viveiro deixa esse viveiro com status errado (populado, mas com zero animal dentro), então o sistema bloqueia esse caso e te avisa.',
      },
      {
        question: 'Posso transferir para um viveiro que já está povoado?',
        answer:
          'Sim — a população transferida se soma ao ciclo que já está ativo naquele viveiro (mistura dois lotes no mesmo tanque). O histórico de origem de cada lote continua registrado.',
      },
      {
        question: 'Por que uma transferência deu erro?',
        answer:
          'A mensagem de erro agora mostra o motivo exato — mais comum é "quantidade excede a população restante", que já vem com o número certo de quanto ainda tem no viveiro. Outros motivos: data da transferência antes do povoamento, data no futuro, origem e destino iguais, ou o viveiro de origem sem ciclo ativo.',
      },
    ],
  },
  {
    title: 'Biometria',
    items: [
      {
        question: 'PL/grama ou Peso (g) — qual eu uso?',
        answer:
          'Berçário mostra as duas opções lado a lado com um alternador — escolha a que você mede na prática (PL/grama é o padrão em berçário; peso direto em gramas é o padrão em engorda). O sistema converte automaticamente para gramas por trás, que é o que fica salvo.',
      },
      {
        question: 'O que o card "Estimativa operacional" (peso, biomassa, sobrevivência) da tela de Biometrias representa?',
        answer:
          'É uma estimativa cruzando o peso médio atual com a ração dos últimos 7 dias e a tabela de consumo cadastrada em Configurações — não é uma contagem real. Serve de apoio, mas quem decide se a fazenda está alimentando mais ou menos do que deveria é você, com base no dia a dia (muda, doença, fase da lua e outros fatores que o sistema não enxerga).',
      },
    ],
  },
  {
    title: 'Ração e qualidade da água',
    items: [
      {
        question: 'Como lanço a ração do dia?',
        answer:
          'Em Ração, escolha o viveiro, o produto e a quantidade em kg — "Ração acumulada" e o FCA do ciclo atualizam sozinhos a partir daí.',
      },
      {
        question: 'Os alertas de qualidade da água são automáticos?',
        answer:
          'Sim — ao registrar uma medição (O₂, pH, salinidade, temperatura, amônia), o sistema compara com a faixa ideal cadastrada e marca "fora da faixa" automaticamente quando algum parâmetro sair do esperado.',
      },
    ],
  },
];

const GESTOR_GROUPS: FaqGroup[] = [
  {
    title: 'Painéis e gráficos',
    items: [
      {
        question: 'Como monto um gráfico cruzando qualquer variável (o que você pediu na reunião)?',
        answer:
          'Vá em Painéis (menu lateral). Lá dá pra escolher livremente o eixo X e o eixo Y entre variáveis de produção, nutrição, financeiro, qualidade da água e biometria, filtrar por viveiro/ciclo/período, comparar vários viveiros no mesmo gráfico e salvar quantos painéis quiser — sem precisar de Excel ou Power BI por fora.',
      },
      {
        question: 'O Painel operacional (tela inicial) mostra gráfico de quê?',
        answer:
          'Peso médio ao longo do ciclo (biometria) e oxigênio/pH ao longo do ciclo (qualidade da água), sempre do ciclo ativo mais recente — é um atalho fixo. Para cruzar outras variáveis ou comparar vários viveiros, use Painéis.',
      },
    ],
  },
  {
    title: 'Configuração',
    items: [
      {
        question: 'Onde ajusto a tabela de consumo (% de ração por faixa de peso)?',
        answer:
          'Em Configurações — essa tabela alimenta o cálculo de ração sugerida e a estimativa operacional da tela de Biometrias.',
      },
      {
        question: 'Como funciona multi-fazenda (Fazendas/Vínculos)?',
        answer:
          'Só aparece para administrador global. Em Fazendas você cadastra cada unidade; em Vínculos você define quem tem acesso a qual fazenda e com qual papel (admin, técnico, operador). Cada usuário só enxerga dados da fazenda em que está vinculado.',
      },
    ],
  },
  {
    title: 'Relatórios',
    items: [
      {
        question: 'Onde exporto dados pra Excel?',
        answer:
          'Em Relatórios operacionais — exportação por fase do ciclo (povoamento, biometria, ração, transferências, despesca).',
      },
    ],
  },
];

function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  return (
    <div style={{ display: 'grid', gap: space.section }}>
      {groups.map((group) => (
        <div key={group.title}>
          <h3 style={{ ...sectionTitle, fontSize: 15, marginBottom: space.inline }}>{group.title}</h3>
          <div style={{ display: 'grid', gap: space.tile }}>
            {group.items.map((item) => (
              <details
                key={item.question}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>
                  {item.question}
                </summary>
                <p style={{ marginTop: 8, color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.55 }}>
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function HelpPage() {
  const [audience, setAudience] = useState<Audience>('operador');
  const groups = audience === 'operador' ? OPERADOR_GROUPS : GESTOR_GROUPS;

  return (
    <div style={pageStack}>
      <div style={workspaceSurface}>
        <div style={workspaceEyebrow}>Ajuda</div>
        <h1 style={{ margin: '8px 0 0', fontSize: 22, fontWeight: 600, lineHeight: 1.25, color: 'var(--text-primary)' }}>
          Central de ajuda
        </h1>
        <p style={{ ...sectionSubtitle, marginTop: 6, maxWidth: 640 }}>
          Perguntas frequentes sobre como usar o Aquafort no dia a dia.
        </p>

        <div style={{ display: 'flex', gap: space.inline, marginTop: space.section }}>
          <button
            onClick={() => setAudience('operador')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: audience === 'operador' ? 'none' : '1px solid var(--border-strong)',
              backgroundColor: audience === 'operador' ? 'var(--accent-fill)' : 'var(--bg-card)',
              color: audience === 'operador' ? '#fff' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Operador
          </button>
          <button
            onClick={() => setAudience('gestor')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: audience === 'gestor' ? 'none' : '1px solid var(--border-strong)',
              backgroundColor: audience === 'gestor' ? 'var(--accent-fill)' : 'var(--bg-card)',
              color: audience === 'gestor' ? '#fff' : 'var(--text-primary)',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            Gestor
          </button>
        </div>
      </div>

      <div style={workspaceCard}>
        <FaqAccordion groups={groups} />
      </div>
    </div>
  );
}
