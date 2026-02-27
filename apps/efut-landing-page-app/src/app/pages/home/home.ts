import { Component, HostListener, computed, signal } from '@angular/core';

@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage {
  readonly showcasesPerView = 3;
  readonly currentShowcase = signal(0);
  readonly activeShowcaseIndex = signal<number | null>(null);

  readonly heroComments = [
    {
      quote: 'Finalmente paramos de usar planilha para fechar rodada.',
      author: 'Rafael, Liga Open Sul'
    },
    {
      quote: 'O mercado de transferencias deixou nossa liga muito mais viva.',
      author: 'Bruna, Copa Master Online'
    },
    {
      quote: 'Leiloes e ranking no mesmo sistema mudaram nossa operacao.',
      author: 'Marcos, Elite Virtual League'
    },
    {
      quote: 'A organizacao da temporada ficou rapida e sem retrabalho.',
      author: 'Thiago, Arena Manager Cup'
    },
    {
      quote: 'Os clubes entendem tudo pelo app, quase sem suporte manual.',
      author: 'Paula, Liga Nacional Pro Clubs'
    }
  ];

  readonly features = [
    {
      icon: 'league',
      title: 'Master Liga / Modo Carreira',
      description: 'Cada manager controla clube, elenco e caixa.'
    },
    {
      icon: 'market',
      title: 'Mercado de Transferencias',
      description: 'Compras, vendas, trocas e emprestimos no mesmo fluxo.'
    },
    {
      icon: 'auction',
      title: 'Leiloes em Tempo Real',
      description: 'Lances ao vivo com regras claras da liga.'
    },
    {
      icon: 'stats',
      title: 'Resultados e Estatisticas',
      description: 'Tabela, artilharia e historico atualizados automaticamente.'
    },
    {
      icon: 'calendar',
      title: 'Calendario e Marcacao de Jogos',
      description: 'Rodadas, grupos e mata-mata sem planilhas.'
    },
    {
      icon: 'support',
      title: 'Suporte e Evolucao Continua',
      description: 'Suporte rapido e produto em evolucao constante.'
    }
  ];

  readonly showcases = [
    {
      title: 'Painel do Usuario',
      description:
        'Painel onde o usuario podera ter total controle do seu time, ter uma visao rapida da equipe, proximas partidas, torneios, contratar e vender jogadores, participar de leiloes etc...',
      image: '/user-dashboard.png',
      accent: '#2eb8e3'
    },
    {
      title: 'Copas',
      description:
        'Administradores podem criar copas em mata-mata, fase de grupos ou grupos com eliminatorias.',
      image: '/cup.png',
      accent: '#1fda8f'
    },
    {
      title: 'Classificacao de Liga',
      description:
        'Monte ligas por pontos corridos com partidas unicas ou formato ida e volta.',
      image: '/league-classification.png',
      accent: '#f5c05a'
    },
    {
      title: 'Atributos dos Jogadores',
      description:
        'Acompanhe os atributos de cada jogador com dados atualizados para analise e estrategia.',
      image: '/player-stats.png',
      accent: '#8aa7ff'
    },
    {
      title: 'Leiloes',
      description:
        'Crie leiloes e permita que participantes disputem lances para contratar jogadores desejados.',
      image: '/user-auction.png',
      accent: '#ff7f7f'
    },
    {
      title: 'Admin Dashboard',
      description:
        'Painel central do administrador para gerenciar toda a liga com controle operacional completo.',
      image: '/admin-dashboard.png',
      accent: '#a6e36f'
    }
  ];

  readonly maxCarouselIndex = computed(() =>
    Math.max(0, this.showcases.length - this.showcasesPerView)
  );
  readonly carouselPages = computed(() =>
    Array.from({ length: this.maxCarouselIndex() + 1 }, (_, i) => i)
  );
  readonly carouselTransform = computed(
    () => `translateX(-${this.currentShowcase() * (100 / this.showcasesPerView)}%)`
  );
  readonly activeShowcase = computed(() => {
    const index = this.activeShowcaseIndex();
    return index === null ? null : this.showcases[index];
  });

  nextShowcase() {
    const maxIndex = this.maxCarouselIndex();
    this.currentShowcase.update((value) => (value >= maxIndex ? 0 : value + 1));
  }

  prevShowcase() {
    const maxIndex = this.maxCarouselIndex();
    this.currentShowcase.update((value) => (value <= 0 ? maxIndex : value - 1));
  }

  goToShowcase(index: number) {
    const maxIndex = this.maxCarouselIndex();
    this.currentShowcase.set(Math.max(0, Math.min(index, maxIndex)));
  }

  openShowcase(index: number) {
    this.activeShowcaseIndex.set(index);
  }

  closeShowcase() {
    this.activeShowcaseIndex.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscapeKey() {
    this.closeShowcase();
  }

  readonly plans = [
    {
      name: 'Inicio',
      price: 'R$ 19,90',
      frequency: '/mes',
      description: 'Para ligas pequenas iniciando no modo carreira.',
      cta: 'Criar uma liga',
      featured: false,
      items: [
        '1 liga ativa',
        '1 copa ativa',
        'Ate 12 clubes',
        'Negociacao de jogadores',
        'Suporte base'
      ]
    },
    {
      name: 'Pro',
      price: 'R$ 49,90',
      frequency: '/mes',
      description: 'Para ligas em crescimento e operacao diaria.',
      cta: 'Assinar plano Pro',
      featured: true,
      items: [
        'Ate 5 ligas ativas',
        'Ate 5 copas ativas',
        'Ate 50 clubes',
        'Negociacao de jogadores',
        'Leiloes em tempo real',
        'Suporte prioritario'
      ]
    },
    {
      name: 'Elite',
      price: 'Sob consulta',
      frequency: '',
      description: 'Para grandes redes de campeonatos e federacoes.',
      cta: 'Falar com vendas',
      featured: false,
      items: ['Ligas ilimitadas', 'Integracoes', 'Gestao dedicada']
    }
  ];

  readonly faqs = [
    {
      question: 'Como funciona um campeonato Master Liga / Modo Carreira?',
      answer:
        'Voce controla seu proprio clube dentro da liga: joga partidas online e tambem administra elenco, contratacoes e financeiro.'
    },
    {
      question: 'Como os jogos e resultados sao organizados na plataforma?',
      answer:
        'Os confrontos sao disputados online e os resultados ficam centralizados no painel, com tabela, ranking, artilharia e historico atualizados.'
    },
    {
      question: 'Consigo marcar partidas e acompanhar os proximos jogos?',
      answer:
        'Sim. Cada participante pode ver agenda, combinar partidas e acompanhar o calendario completo da temporada.'
    },
    {
      question: 'Posso escolher escudo e identidade do meu clube?',
      answer:
        'Sim. O sistema permite personalizar seu clube para deixar sua participacao com identidade propria dentro da liga.'
    },
    {
      question: 'A plataforma permite negociar jogadores com outros participantes?',
      answer:
        'Sim. Voce pode comprar, vender e emprestar jogadores para montar o elenco da forma que preferir.'
    },
    {
      question: 'Como funcionam os leiloes de jogadores?',
      answer:
        'Os administradores criam leiloes e os participantes disputam por lances. Quem oferecer a melhor proposta leva o jogador.'
    },
    {
      question: 'Existe ranking para acompanhar desempenho na liga?',
      answer:
        'Sim. O ranking considera o desempenho nas partidas e campeonatos, ajudando a acompanhar evolucao como manager e player.'
    },
    {
      question: 'Serve para FIFA, eFootball, Pro Clubs e formatos x11?',
      answer: 'Sim. O sistema atende diferentes modos competitivos de futebol virtual.'
    },
    {
      question: 'Existe garantia no inicio da contratacao?',
      answer: 'Sim. Existe periodo inicial para validacao sem risco.'
    }
  ];
}
