// Script de seed: popula o banco com dados de demonstração.
// ATENÇÃO: é DESTRUTIVO — apaga todos os registros antes de recriar.
// Cria 3 usuários de teste (um por papel), 5 categorias, 6 tags e 4 posts
// em diferentes estágios do fluxo editorial. Rodar com `npm run db:seed`.
import { PrismaClient, Role, PostStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando semeadura do banco de dados (seed)...');

  // 1. Limpar banco de dados existente respeitando chaves estrangeiras
  // A ordem importa: posts primeiro (dependem de user/category/tag), depois o resto.
  console.log('🧹 Limpando dados antigos...');
  await prisma.post.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Criar Usuários
  console.log('👥 Criando usuários padrão...');
  const salt = 8;
  
  const adminPasswordHash = await bcrypt.hash('admin123', salt);
  const admin = await prisma.user.create({
    data: {
      name: 'Henrique Administrador',
      email: 'admin@enterlinhas.com',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  const editorPasswordHash = await bcrypt.hash('editor123', salt);
  const editor = await prisma.user.create({
    data: {
      name: 'Paula Editora',
      email: 'editor@enterlinhas.com',
      passwordHash: editorPasswordHash,
      role: Role.EDITOR,
    },
  });

  const writerPasswordHash = await bcrypt.hash('writer123', salt);
  const writer = await prisma.user.create({
    data: {
      name: 'Carlos Escritor',
      email: 'writer@enterlinhas.com',
      passwordHash: writerPasswordHash,
      role: Role.WRITER,
    },
  });

  console.log(`✅ Usuários criados:
    - Admin: admin@enterlinhas.com / admin123
    - Editor: editor@enterlinhas.com / editor123
    - Escritor: writer@enterlinhas.com / writer123`);

  // 3. Criar Categorias
  console.log('🏷️ Criando categorias...');
  const catTecnologia = await prisma.category.create({
    data: { name: 'Tecnologia', slug: 'tecnologia' },
  });

  const catLiteratura = await prisma.category.create({
    data: { name: 'Literatura', slug: 'literatura' },
  });

  const catCiencia = await prisma.category.create({
    data: { name: 'Ciência', slug: 'ciencia' },
  });

  const catDesign = await prisma.category.create({
    data: { name: 'Design', slug: 'design' },
  });

  const catFilosofia = await prisma.category.create({
    data: { name: 'Filosofia', slug: 'filosofia' },
  });

  // 4. Criar Tags
  console.log('📌 Criando tags...');
  const tagReact = await prisma.tag.create({
    data: { name: 'React', slug: 'react' },
  });

  const tagTypeScript = await prisma.tag.create({
    data: { name: 'TypeScript', slug: 'typescript' },
  });

  const tagLivros = await prisma.tag.create({
    data: { name: 'Livros', slug: 'livros' },
  });

  const tagEspaco = await prisma.tag.create({
    data: { name: 'Astronomia', slug: 'astronomia' },
  });

  const tagInovacao = await prisma.tag.create({
    data: { name: 'Inovação', slug: 'inovacao' },
  });

  const tagPoesia = await prisma.tag.create({
    data: { name: 'Poesia', slug: 'poesia' },
  });

  // 5. Criar Posts
  console.log('📝 Criando posts...');

  // Post 1: Publicado
  await prisma.post.create({
    data: {
      title: 'Desbravando o Universo de React 19',
      slug: 'desbravando-o-universo-de-react-19',
      summary: 'Uma visão aprofundada sobre as novidades do React 19, incluindo Server Actions e melhorias no compilador.',
      content: `O React 19 chegou trazendo mudanças revolucionárias para o ecossistema front-end. A maior novidade é a introdução do React Compiler, que agora automatiza a memoização que antes fazíamos manualmente usando useMemo e useCallback.

Além do compilador, as Server Actions foram finalmente padronizadas, permitindo chamar funções do servidor diretamente em eventos HTML do lado do cliente. Isso reduz drasticamente a necessidade de APIs intermediárias simples e torna a integração de formulários muito mais fluida.

Neste artigo, exploramos detalhadamente como configurar essas novidades no seu projeto atual e como se preparar para a transição completa.`,
      status: PostStatus.PUBLISHED,
      readingTime: 5,
      publishedAt: new Date(),
      authorId: writer.id,
      categoryId: catTecnologia.id,
      tags: {
        connect: [{ id: tagReact.id }, { id: tagTypeScript.id }, { id: tagInovacao.id }],
      },
    },
  });

  // Post 2: Publicado
  await prisma.post.create({
    data: {
      title: 'A Importância da Leitura na Era Digital',
      slug: 'a-importancia-da-leitura-na-era-digital',
      summary: 'Como ler livros físicos e digitais nos ajuda a manter a concentração em um mundo cheio de notificações instantâneas.',
      content: `Vivemos em uma época dominada pela economia da atenção. Redes sociais, e-mails e alertas piscando constantemente fragmentam nosso foco. Pesquisas mostram que a capacidade média de atenção do ser humano diminuiu significativamente nas últimas duas décadas.

É nesse cenário que a leitura profunda se destaca como uma ferramenta de resistência cognitiva. Ler livros, seja em papel ou leitores digitais dedicados (como e-readers), força nosso cérebro a desacelerar e a reconstruir imagens mentais complexas.

Ao ler por pelo menos 20 minutos ininterruptos todos os dias, estimulamos a neuroplasticidade, melhoramos nossa empatia e fortalecemos o raciocínio crítico necessário para navegar por mares de fake news.`,
      status: PostStatus.PUBLISHED,
      readingTime: 4,
      publishedAt: new Date(),
      authorId: editor.id,
      categoryId: catLiteratura.id,
      tags: {
        connect: [{ id: tagLivros.id }],
      },
    },
  });

  // Post 3: Pendente de Revisão
  await prisma.post.create({
    data: {
      title: 'Exploração de Marte: O que nos espera na próxima década?',
      slug: 'exploracao-de-marte-proxima-decada',
      summary: 'Os avanços tecnológicos e os planos das agências espaciais públicas e privadas para levar a humanidade ao planeta vermelho.',
      content: `A exploração tripulada de Marte não é mais apenas ficção científica. Diversas empresas e governos estão investindo bilhões no desenvolvimento de foguetes reutilizáveis super pesados, sistemas de suporte à vida de ciclo fechado e habitats capazes de proteger os astronautas da radiação cósmica.

O principal desafio não é apenas a viagem de ida, que dura cerca de 6 a 9 meses, mas sim como manter os exploradores vivos e capazes de retornar. A extração de oxigênio da atmosfera marciana e a busca por depósitos de água subterrânea serão cruciais para a sobrevivência em Marte.

Neste artigo técnico de revisão de astronomia e astronáutica, analisamos a viabilidade dos planos da NASA e da SpaceX até o ano de 2035.`,
      status: PostStatus.PENDING_REVIEW,
      readingTime: 8,
      authorId: writer.id,
      categoryId: catCiencia.id,
      tags: {
        connect: [{ id: tagEspaco.id }, { id: tagInovacao.id }],
      },
    },
  });

  // Post 4: Rascunho
  await prisma.post.create({
    data: {
      title: 'A Filosofia por Trás do Design Minimalista',
      slug: 'a-filosofia-por-tras-do-design-minimalista',
      summary: 'Menos é mais. Investigamos as origens do design minimalista e como ele se aplica aos sistemas modernos de UI/UX.',
      content: `O design minimalista é frequentemente reduzido a espaços em branco abundantes e paletas de cores neutras. No entanto, sua verdadeira essência é muito mais profunda e está ancorada em filosofias de redução e intencionalidade.

Desde a escola Bauhaus até o conceito japonês de 'Ma' (o espaço vazio que dá significado às coisas), o minimalismo busca remover o supérfluo para permitir que o essencial se expresse plenamente.

Em interfaces de usuário modernas, o minimalismo ajuda a reduzir a carga cognitiva, permitindo que o usuário realize suas tarefas sem distrações desnecessárias. Menos ruído visual se traduz em mais usabilidade e melhor experiência.`,
      status: PostStatus.DRAFT,
      readingTime: 6,
      authorId: admin.id,
      categoryId: catDesign.id,
      tags: {
        connect: [{ id: tagInovacao.id }],
      },
    },
  });

  console.log('🌱 Semeadura concluída com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed do banco:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
