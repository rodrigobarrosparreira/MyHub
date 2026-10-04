# Guia do código — My Hub

Este guia explica o app arquivo por arquivo, quase linha por linha. As referências do tipo **L12–20** apontam para as linhas do arquivo como ele está no repositório agora. Se o código for editado depois, os números podem mudar um pouco.

Ordem sugerida de estudo:

1. [Visão geral](#1-visão-geral) e [estrutura de diretórios](#2-estrutura-de-diretórios)
2. [Conceitos que aparecem em todo o código](#3-conceitos-que-aparecem-em-todo-o-código)
3. [Configuração e ponto de entrada](#4-configuração-e-ponto-de-entrada)
4. [App.tsx](#5-apptsx--o-esqueleto-do-app)
5. [Tipos](#6-srctypes--o-formato-dos-dados), [navegação](#7-srcnavigationnavigationrefts--navegar-de-fora-das-telas), [armazenamento](#8-srcstorage--salvar-e-carregar-do-celular) e [notificações](#9-srcnotificationslembretests--avisos-agendados)
6. As telas: [Home e Health](#10-telas-simples-home-e-health), [Gym](#11-gymtsx--lista-de-exercícios), [Exercise](#12-exercisetsx--registros-de-um-exercício) e [Reminders](#13-reminderstsx--lembretes)
7. [O menu circular](#14-radialmenutsx--o-menu-circular) (a parte mais difícil)
8. [Fluxos completos](#15-fluxos-completos-do-toque-até-o-dado-salvo) e [perguntas prováveis](#16-perguntas-prováveis-e-respostas-curtas)

---

## 1. Visão geral

O My Hub é um app em **React Native** com **Expo**, escrito em **TypeScript**. Ele tem quatro áreas, acessadas pelo menu circular no canto inferior direito:

| Tela | O que faz |
|---|---|
| Início (`Home`) | Tela inicial, só com um texto por enquanto |
| Saúde (`Health`) | Tela com um botão que leva para a de Treino |
| Treino (`Gym`) | Cadastro de exercícios. Tocar num exercício abre a tela `Exercise` |
| Exercício (`Exercise`) | Registros de peso, séries e repetições de um exercício, com histórico |
| Lembretes (`Reminders`) | Lembretes com data e hora que geram uma notificação agendada |

Os dados ficam salvos **no próprio celular** com o **AsyncStorage**, o equivalente do `localStorage` do navegador. Não existe servidor nem banco de dados externo.

O app é organizado em **camadas**, e cada pasta tem uma responsabilidade:

```
Tela (screens)  ──usa──▶  Armazenamento (storage)  ──usa──▶  AsyncStorage (celular)
      │                         │
      └──usa──▶ Tipos (types) ◀─┘
      │
      └──usa──▶ Notificações (notifications)  ──usa──▶  expo-notifications
```

As telas não falam direto com o AsyncStorage. Elas chamam funções como `carregarExercicios()` e `salvarExercicios()`. Se um dia o app trocar o AsyncStorage por um banco SQL, só a pasta `storage` muda.

---

## 2. Estrutura de diretórios

```
app/
├── index.js                  ponto de entrada: registra o componente App
├── App.tsx                   esqueleto do app: navegação + menu circular
├── app.json                  configuração do Expo (nome, ícones, plugins)
├── package.json              dependências e scripts (npm start etc.)
├── package-lock.json         versões exatas instaladas (gerado pelo npm)
├── babel.config.js           configuração do Babel (tradutor do código)
├── tsconfig.json             configuração do TypeScript
├── assets/                   imagens: ícone do app, splash, favicon
├── docs/                     documentação das etapas do trabalho e este guia
└── src/                      todo o código do app
    ├── components/
    │   └── RadialMenu.tsx    menu circular flutuante (componente reutilizável)
    ├── navigation/
    │   └── navigationRef.ts  permite navegar de fora das telas (usado pelo menu)
    ├── notifications/
    │   └── lembretes.ts      agendar/cancelar notificações dos lembretes
    ├── screens/              uma tela por arquivo
    │   ├── Home.tsx
    │   ├── Health.tsx
    │   ├── Gym.tsx
    │   ├── Exercise.tsx
    │   └── Reminders.tsx
    ├── storage/              ler/gravar dados no celular
    │   ├── exercicios.ts
    │   └── lembretes.ts
    └── types/                "formato" dos dados (só TypeScript, não executa)
        ├── gym.ts
        ├── lembrete.ts
        └── navigation.ts
```

A pasta `node_modules/` (não versionada) guarda as bibliotecas instaladas pelo `npm install`.

**Regra de dependência:** `screens` usa `storage`, `notifications`, `types` e `navigation`. `storage` usa só `types`. `types` não usa ninguém. Assim fica fácil saber onde mexer: mudou o formato do dado → `types`; mudou onde salva → `storage`; mudou a aparência ou a interação → `screens`.

---

## 3. Conceitos que aparecem em todo o código

Vale ler esta seção antes dos arquivos, porque esses conceitos se repetem em todas as telas.

### 3.1 Componente

Um componente é uma **função que devolve o que vai aparecer na tela** (JSX). Exemplo: `export default function Home() { return (<View>...</View>) }`.

- `View` é como uma `div` do HTML: uma caixa.
- `Text` é qualquer texto. Em React Native, texto **precisa** estar dentro de `<Text>`.
- `TextInput` é um campo de digitação.
- `Pressable` é qualquer coisa clicável (tem `onPress`).
- `FlatList` é uma lista otimizada: só desenha os itens que aparecem na tela.

### 3.2 Props

Props são os **parâmetros de um componente**. Em `<Text style={styles.titulo}>`, `style` é uma prop. As telas recebem props da navegação: `navigation` (para ir para outra tela) e `route` (com os parâmetros recebidos).

### 3.3 Estado (`useState`)

```ts
const [nome, setNome] = useState("");
```

- `nome` é o valor atual.
- `setNome` é a função para trocar o valor.
- `""` é o valor inicial.

Quando um `set...` é chamado, o React **redesenha o componente** com o valor novo. É assim que a tela se atualiza.

**Campo controlado:** `<TextInput value={nome} onChangeText={setNome} />`. O campo mostra o que está no estado (`value`), e cada letra digitada chama `setNome` com o texto novo. Para limpar o campo, basta `setNome("")`.

### 3.4 Efeitos (`useEffect`, `useFocusEffect`)

- `useEffect(() => { ... }, [])` roda o código **uma vez, quando a tela aparece pela primeira vez**. O `[]` (lista de dependências vazia) significa "não rode de novo". É usado para carregar os dados salvos.
- `useFocusEffect(useCallback(() => { ... }, []))` vem do React Navigation e roda **toda vez que a tela volta a ficar visível**. A Gym usa isso porque, ao voltar da tela Exercise, precisa recarregar a lista para mostrar o último registro. O `useCallback` evita que a função seja recriada a cada redesenho; sem ele, o efeito rodaria em loop.

### 3.5 Imutabilidade: por que sempre criamos listas novas

O React só percebe que algo mudou se receber **um objeto/lista novo**. Por isso o código nunca altera a lista existente (`lista.push(...)`). Ele sempre cria outra:

| Operação | Código | O que faz |
|---|---|---|
| Adicionar | `[...lista, novo]` | copia todos os itens (`...` = "espalhar") e põe o novo no fim |
| Editar | `lista.map(x => x.id === id ? { ...x, nome: "novo" } : x)` | percorre todos; troca só o item com o `id` certo |
| Apagar | `lista.filter(x => x.id !== id)` | mantém todos, menos o do `id` |
| Achar | `lista.find(x => x.id === id)` | devolve o primeiro item que bate (ou `undefined`) |

`{ ...x, nome: "novo" }` cria um objeto igual a `x`, mas com `nome` trocado.

### 3.6 Funções assíncronas (`async` / `await`)

Ler e gravar no celular demora um pouco, então essas funções devolvem uma **Promise** (uma "promessa" de resultado futuro).

- `async function f()` marca uma função que pode esperar.
- `await algo()` espera a promessa terminar antes de seguir para a próxima linha.
- `carregarExercicios().then(setExercicios)` é outro jeito de esperar: "quando terminar, chame `setExercicios` com o resultado".

### 3.7 Renderização condicional

- `{condicao && <Componente />}` só desenha o componente se a condição for verdadeira.
- `{condicao ? "A" : "B"}` é o operador ternário, um `if/else` em uma linha.
- `style={[styles.card, condicao && styles.destaque]}`: uma lista de estilos em que o segundo só é aplicado se a condição for verdadeira (quando é falsa, o `false` é ignorado).

### 3.8 TypeScript

TypeScript é JavaScript com **tipos**. O tipo diz o formato esperado dos dados, e o editor avisa quando algo não bate, antes mesmo de rodar o app.

- `type Exercicio = { id: string; nome: string; ... }` define o formato.
- `useState<Exercicio[]>([])` diz que o estado é uma lista de `Exercicio`.
- `string | null` significa "texto **ou** nulo".
- Os tipos somem quando o app roda; servem só para pegar erros enquanto se escreve o código.

### 3.9 Estilos (`StyleSheet`)

Os estilos são parecidos com CSS, mas escritos como objeto JavaScript, com nomes em camelCase (`backgroundColor` em vez de `background-color`) e números sem `px`. O layout é **flexbox**:

| Propriedade | Significado |
|---|---|
| `flex: 1` | ocupa todo o espaço disponível |
| `flexDirection: "row"` | filhos lado a lado (o padrão é `"column"`, um embaixo do outro) |
| `justifyContent` | alinhamento no eixo principal (`"center"`, `"space-between"`...) |
| `alignItems` | alinhamento no eixo cruzado |
| `gap` | espaço entre os filhos |
| `padding` / `margin` | espaço interno / externo (`paddingHorizontal`, `marginTop`...) |
| `borderWidth`, `borderColor`, `borderRadius` | borda e cantos arredondados |
| `position: "absolute"` + `top/right/bottom/left` | posiciona livremente em relação ao pai |
| `elevation` | sombra no Android |
| `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius` | sombra no iOS |

As cores seguem uma paleta fixa de cinzas-azulados (`#0F172A` quase preto, `#64748B` cinza, `#E2E8F0` borda clara), mais verde (`#16A34A`) e vermelho (`#DC2626`).

### 3.10 Id único com `Date.now().toString()`

`Date.now()` devolve quantos milissegundos se passaram desde 1970. Como o usuário não consegue criar dois itens no mesmo milissegundo, esse número serve de **id único** simples. O `.toString()` transforma em texto.

---

## 4. Configuração e ponto de entrada

### `package.json`

- **L2–4**: nome do projeto, versão e `"main": "index.js"`, o arquivo que roda primeiro.
- **L5–24**: `dependencies`, as bibliotecas usadas. As principais:
  - `expo`, `react`, `react-native`: a base do app.
  - `@react-navigation/native` e `@react-navigation/native-stack`: navegação entre telas em pilha.
  - `react-native-screens` e `react-native-safe-area-context`: exigidas pelo React Navigation.
  - `react-native-gesture-handler`: gestos (toque, arrasto), usado no menu circular.
  - `react-native-reanimated`: animações suaves, usado no menu circular.
  - `@expo/vector-icons`: ícones (o app usa o conjunto Ionicons).
  - `@react-native-async-storage/async-storage`: salvar dados no celular.
  - `expo-notifications`: notificações agendadas dos lembretes.
  - `@react-native-community/datetimepicker`: calendário e relógio nativos.
  - `typescript`, `@types/...`: TypeScript e os tipos das bibliotecas.
- **L25–30**: `scripts`, atalhos do terminal. `npm start` roda `expo start`.

O `^` e o `~` antes das versões dizem quanto a versão pode variar ao instalar. `package-lock.json` grava as versões exatas que foram instaladas.

### `app.json`

Configuração do Expo: nome do app (`name`), orientação só em retrato (`orientation`), ícones de Android/iOS (L39–54) e `plugins` (L55–57). O plugin do datetimepicker só faz diferença se o app for compilado como build próprio. No Expo Go ele é ignorado.

### `babel.config.js`

O Babel traduz o código moderno (JSX, TypeScript) para JavaScript que o celular entende. `babel-preset-expo` já traz tudo que um projeto Expo precisa. `api.cache(true)` só acelera as recompilações.

### `tsconfig.json`

Herda a configuração padrão do Expo (`extends`) e liga o modo `strict`, que faz o TypeScript ser mais rigoroso (por exemplo, obriga a tratar valores que podem ser `null`).

### `index.js`

- **L1**: importa `registerRootComponent` do Expo.
- **L3**: importa o componente principal `App`.
- **L5–7**: comentário original do template do Expo. Explica que `registerRootComponent` registra o App como componente raiz, tanto no Expo Go quanto num build nativo.
- **L8**: registra o `App`. A partir daqui, o React Native desenha o `App` na tela.

---

## 5. `App.tsx` — o esqueleto do app

É o componente raiz. Monta a **navegação** e coloca o **menu circular** por cima de tudo.

- **L1**: `import 'react-native-gesture-handler'` precisa ser a **primeira linha** do app. Ela inicializa a biblioteca de gestos antes de qualquer outra coisa.
- **L2–6**: imports do React, do `StyleSheet`, do `GestureHandlerRootView` (container obrigatório para os gestos funcionarem), do `NavigationContainer` (guarda o estado da navegação) e de `createNativeStackNavigator` (cria a navegação em pilha).
- **L8–12**: importa as cinco telas.
- **L14**: importa o menu circular e o tipo `RadialMenuItem`, que diz o formato de cada botão do menu.
- **L15**: importa `navigationRef` e `navigate`, explicados na [seção 7](#7-srcnavigationnavigationrefts--navegar-de-fora-das-telas).
- **L16**: importa o tipo com a lista de telas e seus parâmetros.
- **L18**: cria o navegador em pilha, tipado com `RootStackParamList`. Assim o TypeScript sabe quais telas existem.
- **L20**: o componente `App`.
- **L21–46**: `menuItems`, a lista de botões do menu circular. Cada item tem:
  - `id`: identificador único.
  - `name`: texto que aparece ao lado do ícone.
  - `icon`: nome do ícone Ionicons.
  - `onPress`: função chamada ao tocar. Todas chamam `navigate('NomeDaTela')`.
- **L48–73**: o que é desenhado.
  - **L49**: `GestureHandlerRootView` envolve tudo, porque os gestos do menu exigem isso. O estilo `root` (`flex: 1`, L76–80) faz ele ocupar a tela inteira.
  - **L50**: `NavigationContainer` com `ref={navigationRef}`. A `ref` dá ao menu um "controle remoto" da navegação.
  - **L51–58**: `Stack.Navigator`.
    - `initialRouteName="Home"`: o app abre na Home.
    - `screenOptions`: aparência do cabeçalho de todas as telas (cor de fundo, cor do texto, título centralizado).
  - **L59–62**: registra cada tela: `name` (nome usado para navegar), `component` (o componente da tela) e `options.title` (título no cabeçalho).
  - **L63–67**: a tela `Exercise` é diferente. O título é uma **função** que lê o parâmetro `nome` da rota, então o cabeçalho mostra o nome do exercício aberto (ex.: "Supino").
  - **L71**: o `RadialMenu` fica **fora** do `NavigationContainer`, depois dele. Por isso ele aparece por cima de todas as telas e não some ao trocar de tela.

**Por que o menu usa `navigate()` e não `navigation.navigate()`?** A prop `navigation` só existe dentro das telas. Como o menu está fora do navegador, ele usa o `navigationRef` para navegar.

---

## 6. `src/types/` — o formato dos dados

Arquivos só de TypeScript. Eles não executam nada; só descrevem como os dados são.

### `navigation.ts`

- **L1–7**: `RootStackParamList` lista as telas e **que parâmetros cada uma recebe**:
  - `undefined` significa que a tela não recebe parâmetro.
  - `Exercise: { id: string; nome: string }`: a tela de exercício precisa receber o `id` (para achar os dados) e o `nome` (para o título).

Com isso, se alguém tentar `navigation.navigate("Exercise")` sem os parâmetros, o TypeScript acusa erro.

### `gym.ts`

- **L1–7**: `Registro`, uma anotação de treino:
  - `id`: identificador.
  - `data`: data em texto ISO, ex.: `"2026-09-29T14:30:00.000Z"`.
  - `peso`: em kg.
  - `series`, `repeticoes`.
- **L9–13**: `Exercicio`:
  - `id`, `nome`.
  - `registros`: lista de `Registro`, do mais antigo para o mais novo.

A data é guardada como **texto** (e não como `Date`) porque o AsyncStorage só salva texto, e um texto ISO converte de volta com `new Date(texto)`.

### `lembrete.ts`

- **L1–8**: `Lembrete`:
  - `titulo`, `texto`: o texto é o campo de detalhes, que pode ser vazio.
  - `quando`: data e hora em ISO.
  - `concluido`: `true`/`false`.
  - `notificacaoId`: o id que o `expo-notifications` devolve ao agendar o aviso. É guardado para poder **cancelar aquele aviso específico** depois. É `null` quando não há aviso agendado.

---

## 7. `src/navigation/navigationRef.ts` — navegar de fora das telas

- **L1–2**: imports.
- **L4**: `createNavigationContainerRef` cria a referência que é passada ao `NavigationContainer` no App.tsx (L50). Depois que o container a recebe, ela pode comandar a navegação de qualquer lugar.
- **L6–9**: função `navigate`, com tipo genérico:
  - `RouteName extends keyof RootStackParamList` faz o nome da tela ter que ser um dos que existem (`"Home"`, `"Gym"`...).
  - `params?: RootStackParamList[RouteName]` faz os parâmetros ter o tipo certo para aquela tela. O `?` os torna opcionais.
- **L10**: `isReady()` confere se a navegação já terminou de montar. Navegar antes disso daria erro.
- **L11**: `// @ts-expect-error` é uma **instrução para o TypeScript**, não um comentário explicativo. Ela diz "a próxima linha tem um erro de tipo que eu sei que existe; pode ignorar". O erro acontece porque a função `navigate` da biblioteca tem tipos muito complexos para aceitar um nome genérico. Sem essa linha, o projeto não compila.
- **L12**: navega de fato.

---

## 8. `src/storage/` — salvar e carregar do celular

Os dois arquivos são iguais na estrutura. Muda só a chave e o tipo.

### `exercicios.ts`

- **L1**: importa o AsyncStorage.
- **L2**: importa o tipo `Exercicio`.
- **L4**: `CHAVE = "exercicios"`. O AsyncStorage funciona como um dicionário de **chave → texto**, e essa é a "gaveta" onde a lista inteira fica guardada.
- **L6**: `carregarExercicios` devolve uma `Promise<Exercicio[]>`, ou seja, no futuro uma lista de exercícios.
- **L7**: `getItem(CHAVE)` lê o texto salvo. O `await` espera a leitura.
- **L9–11**: se nunca salvou nada (primeira vez que o app abre), `getItem` devolve `null`, e a função devolve lista vazia.
- **L13**: `JSON.parse` transforma o texto de volta em lista de objetos.
- **L16–18**: `salvarExercicios` faz o contrário: `JSON.stringify` transforma a lista em texto e `setItem` grava. A **lista inteira** é regravada a cada alteração. É simples e funciona bem para poucos dados.

### `lembretes.ts`

Mesma coisa com a chave `"lembretes"` e o tipo `Lembrete`.

---

## 9. `src/notifications/lembretes.ts` — avisos agendados

Este arquivo esconde da tela toda a complicação das notificações. A tela só chama `pedirPermissao()`, `agendarNotificacao()` e `cancelarNotificacao()`.

**O problema que ele resolve:** desde o SDK 53, o **Expo Go no Android** não tem o módulo nativo de notificações. Se o app simplesmente importar `expo-notifications` lá, ele **trava ao abrir**. Por isso o módulo só é carregado quando necessário, e só onde funciona.

- **L1–2**: `Platform` diz o sistema (`"android"` ou `"ios"`). `Constants` (do `expo-constants`, que vem junto com o `expo`) diz **onde** o app está rodando.
- **L4**: `rodandoNoExpoGo` fica `true` quando o ambiente é `StoreClient`, que é o nome técnico do Expo Go.
- **L6**: `notificacoesDisponiveis` fica `false` só quando é Expo Go **e** Android. É exportado para a tela mostrar o aviso amarelo.
- **L8**: `modulo` guarda o `expo-notifications` depois de carregado. Começa `null`. O tipo `typeof import("expo-notifications")` significa "o tipo desse módulo", mas **sem importá-lo de verdade**.
- **L9**: `handlerConfigurado` é uma flag para configurar o comportamento só uma vez.
- **L11–39**: `obterModulo()` é o coração do arquivo:
  - **L12–14**: se notificações não estão disponíveis, devolve `null` e não tenta nada.
  - **L15–17**: se já carregou antes, devolve o mesmo módulo. Isso é cache.
  - **L19–20**: `require("expo-notifications")` carrega o módulo **na hora**, dentro de um `try`. Um `import` no topo do arquivo rodaria sempre, inclusive no Expo Go, que é justamente o que trava o app.
  - **L22–32**: na primeira vez, `setNotificationHandler` define o que acontece quando o aviso chega **com o app aberto**:
    - `shouldShowBanner`: mostra a faixa no topo da tela.
    - `shouldShowList`: deixa o aviso na central de notificações.
    - `shouldPlaySound`: toca som.
    - `shouldSetBadge`: o número no ícone do app (só iOS). Fica desligado.
  - **L35–38**: se der qualquer erro ao carregar, devolve `null` e o app segue funcionando, só que sem avisos.
- **L41–49**: `pedirPermissao()`. A partir do Android 13 o usuário precisa autorizar notificações. `requestPermissionsAsync()` mostra a pergunta do sistema, e a função devolve `true` se o usuário aceitou (`"granted"`).
- **L51–71**: `agendarNotificacao(titulo, texto, quando)`:
  - Se não há módulo, devolve `null`. O lembrete ainda é salvo, só não terá aviso.
  - `scheduleNotificationAsync` agenda o aviso com `content` (título e corpo) e `trigger` (gatilho). O tipo `DATE` significa "dispara uma vez, nessa data".
  - Devolve o **id** do agendamento, que a tela guarda em `notificacaoId`.
- **L73–80**: `cancelarNotificacao(id)` cancela um aviso agendado pelo id.

**Padrão a notar:** todas as funções começam com `const notificacoes = obterModulo(); if (notificacoes === null) return ...`. Esse "retorno antecipado" (*early return*) evita `if`s aninhados.

---

## 10. Telas simples: Home e Health

### `Home.tsx`

- **L1**: importa `View`, `Text` e `StyleSheet`.
- **L4–10**: o componente devolve uma `View` com um `Text`.
- **L13–22**: estilos. `container` ocupa a tela toda (`flex: 1`) e centraliza o conteúdo nos dois eixos.

### `Health.tsx`

- **L2–3**: importa o tipo de props de tela e a lista de telas.
- **L5**: `type Props = NativeStackScreenProps<RootStackParamList, "Health">` define as props que a tela `Health` recebe da navegação. Com isso, `navigation` fica tipado.
- **L7**: `{navigation}: Props` usa *desestruturação* para pegar só a prop `navigation`.
- **L11**: um `Pressable` que, ao ser tocado, chama `navigation.navigate("Gym")`. É o mesmo que escolher "Treino" no menu, mas a partir de um botão da tela.
- **L32**: `"#7ea2e874"` é uma cor com transparência (os dois últimos dígitos, `74`, são a opacidade).

---

## 11. `Gym.tsx` — lista de exercícios

Permite **adicionar, editar e apagar** exercícios. Tocar num exercício abre a tela `Exercise`.

### Imports e props (L1–10)

- **L1**: `useCallback` e `useState` do React.
- **L2**: componentes do React Native. `Alert` mostra a caixa de confirmação.
- **L3**: `useFocusEffect`, explicado na seção 3.4.
- **L5**: `Ionicons`, os ícones.
- **L7–8**: o tipo `Exercicio` e as funções de `storage`.
- **L10**: props da tela, igual à Health.

### Estado (L13–15)

- **L13**: `exercicios` é a lista exibida. Começa vazia e é preenchida pelo carregamento.
- **L14**: `nome` é o texto do campo.
- **L15**: `editandoId` é o **truque do formulário único**:
  - `null`: o campo serve para **adicionar**.
  - um id: o campo está **editando** aquele exercício.

### Carregamento (L17–21)

`useFocusEffect` carrega a lista **toda vez que a tela aparece**. Isso é necessário porque, ao voltar da tela Exercise (onde registros foram adicionados), a Gym continua montada na pilha. Sem recarregar, ela mostraria o "Último" desatualizado.

### Funções

- **L23–26**: `atualizarLista` é o **único caminho** para mudar a lista. Ela atualiza a tela (`setExercicios`) e salva no celular (`salvarExercicios`). Centralizar isso evita esquecer de salvar.
- **L28–48**: `salvar()`, chamada pelo botão e pelo "enter" do teclado:
  - **L29–32**: `trim()` tira espaços das pontas. Se ficou vazio, sai sem fazer nada.
  - **L34–40**: **modo adicionar** (`editandoId === null`). Cria um `Exercicio` novo (id pelo relógio, sem registros) e adiciona no fim com `[...exercicios, novo]`.
  - **L41–45**: **modo editar**. Usa `map` para trocar só o nome do exercício com o id em edição; os outros voltam iguais (`: e`).
  - **L47**: `cancelarEdicao()` limpa o campo e volta ao modo adicionar.
- **L50–53**: `comecarEdicao(exercicio)` copia o nome para o campo e guarda o id. Com isso, o botão vira "Salvar" e o card ganha borda escura.
- **L55–58**: `cancelarEdicao()` limpa o campo e zera o `editandoId`.
- **L60–74**: `apagarExercicio(exercicio)`:
  - `Alert.alert(título, mensagem, botões)` mostra a confirmação.
  - O botão `"cancel"` não faz nada.
  - O botão `"destructive"` (vermelho no iOS) executa o `onPress`, que remove com `filter`. Se o exercício apagado era o que estava em edição, cancela a edição também (L68–70).
  - A mensagem usa *template string* (crase com `${}`) para incluir o nome.

### O que é desenhado (L76–129)

- **L78–94**: o formulário em linha (`styles.form` tem `flexDirection: "row"`):
  - **L79–85**: o campo controlado. `onSubmitEditing={salvar}` salva ao apertar "enter" no teclado.
  - **L86–88**: botão cujo texto depende do modo: `"Adicionar"` ou `"Salvar"`.
  - **L89–93**: o botão **X** (cancelar) só aparece em modo edição (`editandoId !== null && ...`).
- **L96–127**: a `FlatList`:
  - `data`: a lista a exibir.
  - `keyExtractor`: diz qual campo é o id de cada item. O React usa isso para saber qual item é qual ao redesenhar.
  - `contentContainerStyle={styles.lista}`: o estilo `lista` tem `paddingBottom: 120`, um espaço no fim para o menu circular não cobrir o último item.
  - `ListEmptyComponent`: o que aparece quando a lista está vazia.
  - `renderItem`: função que desenha **cada** item.
    - **L102**: `ultimo` é o último registro, o mais recente. Se não há registros, fica `undefined`.
    - **L105**: o card ganha `cardEditando` (borda escura) se for o item em edição.
    - **L106–116**: a área do texto é um `Pressable` que navega para `Exercise` passando `id` e `nome`. O texto mostra o último registro ou `"Sem registros"` (ternário).
    - **L118–123**: ícones de editar (lápis) e apagar (lixeira).

### Estilos (L133–205)

Seguem a seção 3.9. Destaques:

- `input` tem `flex: 1` para ocupar o espaço que sobra ao lado do botão.
- `cardConteudo` também tem `flex: 1`, o que empurra os ícones para a direita.

---

## 12. `Exercise.tsx` — registros de um exercício

Mesma lógica da Gym (formulário único para adicionar/editar, lista com editar/apagar), mas para os **registros** de um exercício.

### Parâmetro e estado (L11–18)

- **L11–12**: recebe `route` e tira o `id` do exercício de `route.params`. Esse id foi enviado pela Gym (L108 da Gym).
- **L14**: `exercicios` guarda a **lista completa** de exercícios, não só o atual. Isso é necessário porque, para salvar, o storage regrava a lista inteira.
- **L15–17**: os três campos são **texto** (`""`), porque `TextInput` sempre trabalha com texto. A conversão para número acontece ao salvar.
- **L18**: `editandoId`, igual à Gym, mas para registros.

### Carregamento (L20–22)

Aqui é `useEffect` (só na abertura), e não `useFocusEffect`. Esta tela é **criada de novo cada vez** que é aberta pela Gym, então carregar uma vez basta.

### Valores calculados (L24–27)

Estes não são estado; são **recalculados a cada redesenho** a partir do estado:

- **L24**: `exercicio`, o exercício atual, encontrado com `find`.
- **L25**: `registros` são os registros dele. Se ainda não carregou (`exercicio` é `undefined`), usa lista vazia.
- **L27**: `historico` é a cópia invertida (o mais novo primeiro). O `[...registros]` cria uma cópia antes do `reverse()`, porque o `reverse` **altera** a lista original.

### Funções

- **L29–35**: `atualizarRegistros(novosRegistros)` troca os registros **só do exercício atual** dentro da lista completa (`map` + `{ ...e, registros: novosRegistros }`), atualiza a tela e salva.
- **L37–68**: `salvar()`:
  - **L38**: `peso.replace(",", ".")` aceita vírgula (padrão brasileiro). `Number(...)` converte texto em número.
  - **L42–46**: validação. Se algum campo está vazio ou não é número (`isNaN` = *is Not a Number*), mostra um alerta e sai.
  - **L48–56**: **adicionar**: cria o registro com a data de agora (`new Date().toISOString()`) e põe no fim.
  - **L57–65**: **editar**: troca peso, séries e repetições do registro em edição, **mantendo id e data** originais.
- **L70–75**: `comecarEdicao(registro)` preenche os campos com `String(...)` (número → texto) e guarda o id.
- **L77–82**: `cancelarEdicao()` limpa tudo.
- **L84–98**: `apagarRegistro(registro)`: confirmação e `filter`, igual à Gym.

### O que é desenhado (L100–164)

- **L102–115**: três campos lado a lado. Cada `campo` tem `flex: 1`, então dividem a largura igualmente.
  - `keyboardType="decimal-pad"` abre o teclado numérico com vírgula (peso).
  - `"number-pad"` abre o teclado só com números (séries e repetições).
- **L117–126**: botão principal ("Registrar treino" ou "Salvar alteração") e botão "Cancelar" só em modo edição.
- **L130–162**: `FlatList` do histórico:
  - **L135**: `renderItem` também recebe o `index` (posição na lista).
  - **L136**: como a lista está do mais novo para o mais antigo, o registro **anterior no tempo** está na **próxima** posição (`index + 1`). O último item da lista não tem anterior (`undefined`).
  - **L137**: `diferenca` é o peso atual menos o anterior, arredondado para 2 casas com `Math.round(x * 100) / 100`. Isso é necessário porque contas com decimais no computador podem dar `2.1999999` em vez de `2.2`.
  - **L142**: data em formato brasileiro (`toLocaleDateString("pt-BR")`).
  - **L144**: "40 kg · 3x12".
  - **L145–149**: se houve diferença, mostra "+2.5 kg" em verde (`subiu`) ou "-5 kg" em vermelho (`desceu`). O `{"  "}` coloca dois espaços antes. O `"+"` só aparece se for positivo, porque o negativo já vem com o sinal.

---

## 13. `Reminders.tsx` — lembretes

### Imports (L1–12)

- **L4**: `DateTimePicker` (o componente do calendário/relógio) e o tipo `DateTimePickerEvent`.
- **L7–12**: as funções de notificação e a flag `notificacoesDisponiveis`.

### Funções auxiliares, fora do componente (L14–25)

Ficam fora porque não dependem de estado.

- **L14–18**: `daquiUmaHora()` devolve a data de agora + 1 hora (`60 * 60 * 1000` milissegundos), com segundos e milissegundos zerados (`setSeconds(0, 0)`). É o valor inicial dos seletores. Os segundos são zerados porque o seletor só mostra hora e minuto, mas guardaria os segundos escondidos.
- **L20–25**: `formatarData(iso)` transforma o texto ISO em `"05/10/2026 às 18:30"`.

### Estado (L28–32)

- **L28–30**: a lista de lembretes e os campos de título e texto.
- **L31**: `quando` guarda data **e** hora juntas num único `Date`. O seletor de data muda só o dia, e o de hora muda só o horário.
- **L32**: `seletorAberto` diz qual seletor está aberto: `"date"` (calendário), `"time"` (relógio) ou `null` (nenhum).

### Carregamento (L34–37)

Uma vez, ao abrir a tela: carrega os lembretes e pede permissão de notificação. O resultado de `pedirPermissao()` não é usado; se o usuário negar, o agendamento simplesmente não aparece.

### Ordenação (L39–41)

`ordenados` é uma cópia ordenada por data, o mais próximo primeiro.

- `sort` recebe uma função de comparação: se ela devolve um número negativo, `a` vem antes de `b`.
- `getTime()` transforma a data em milissegundos para poder subtrair.
- A cópia `[...lembretes]` existe porque o `sort` **altera** a lista original.

### Funções

- **L43–46**: `atualizarLista`, mesmo padrão das outras telas.
- **L48–75**: `adicionar()`:
  - **L49–53**: título obrigatório.
  - **L55–58**: a data precisa estar no futuro, porque não dá para agendar um aviso no passado.
  - **L62**: agenda a notificação e recebe o id (ou `null`).
  - **L64–71**: monta o `Lembrete`. `quando.toISOString()` converte a data em texto para salvar. `notificacaoId,` sozinho é um atalho para `notificacaoId: notificacaoId`.
  - **L73–74**: salva e limpa o formulário.
- **L77–81**: `limparFormulario()` volta a data para "daqui a uma hora".
- **L83–88**: `aoEscolher(evento, escolhida)` é chamada pelo `DateTimePicker` quando o usuário fecha o seletor:
  - **L84**: fecha o seletor (`null`). No Android isso é obrigatório: se o componente continuar desenhado, a janela abre de novo.
  - **L85–87**: só troca a data se o usuário apertou **OK** (`"set"`). Se cancelou (`"dismissed"`), mantém a anterior. O `escolhida?: Date` é opcional porque pode não vir.
- **L90–100**: `alternarConcluido(lembrete)` marca ou desmarca:
  - **L91–93**: ao **marcar** como concluído, cancela o aviso que ainda não disparou.
  - **L95–99**: inverte `concluido` (`!l.concluido`) e zera `notificacaoId`. Desmarcar **não reagenda** o aviso. Essa é uma decisão de simplicidade: assim não é preciso tratar o caso de a data já ter passado.
- **L102–116**: `apagar(lembrete)` pede confirmação, cancela o aviso (para não disparar um aviso de um lembrete que não existe mais) e remove com `filter`. Repare que o `onPress` aqui é `async`.

### O que é desenhado (L118–212)

- **L120–128**: aviso amarelo, que só aparece quando as notificações não funcionam neste ambiente (Expo Go no Android).
- **L130–143**: campos de título e detalhes.
  - `multiline` permite várias linhas.
  - O estilo `inputTexto` dá altura mínima e, no Android, alinha o texto no topo (`textAlignVertical: "top"`).
- **L145–162**: os "campos" de data e hora. Na verdade são **botões** (`Pressable`) com aparência de campo (`styles.input`), mostrando ícone + valor formatado. Tocar em um chama `setSeletorAberto("date")` ou `"time"`.
- **L164–172**: o `DateTimePicker` só é desenhado quando `seletorAberto` não é `null`. **No Android, desenhar esse componente abre a janela nativa** de calendário ou relógio. Props:
  - `value`: data atual.
  - `mode`: `"date"` ou `"time"`, vindo do estado.
  - `is24Hour`: relógio de 24h.
  - `minimumDate={new Date()}`: não deixa escolher dia passado.
  - `onChange={aoEscolher}`.
- **L174–176**: botão "Adicionar lembrete".
- **L180–210**: lista dos lembretes. Em cada card:
  - **L187–193**: o círculo à esquerda alterna concluído. O ícone e a cor mudam conforme `item.concluido`.
  - **L196**: título riscado (`textDecorationLine: "line-through"`) quando concluído.
  - **L199–201**: os detalhes só aparecem se não estiverem vazios.
  - **L202**: data formatada.
  - **L205–207**: lixeira.

---

## 14. `RadialMenu.tsx` — o menu circular

O componente mais complexo. Ele usa **gestos** (`react-native-gesture-handler`) e **animações** (`react-native-reanimated`).

### Ideia geral

- Um botão azul redondo (FAB, *floating action button*) fica no canto inferior direito.
- Ao tocar nele, os itens "saem" do botão e se espalham num **arco** em volta dele.
- Se houver mais itens do que cabem, o usuário **arrasta** para girar a roleta e trazer os escondidos.

**Geometria:** os ângulos são medidos a partir do centro do botão azul. **0°** = à esquerda do botão e **90°** = logo acima. Cada item fica a `RADIUS` (100) de distância do centro, num ângulo próprio. Itens com ângulo entre 10° e 85° ficam visíveis; fora disso, somem gradualmente.

```
          90° (acima)
            │   ● item em ~58°
            │
            │        ● item em 16°
  0° ───────[FAB]
 (esquerda)
```

### Dois "mundos": JS e UI

O React Native roda o código em duas *threads*:

- **thread JS**: onde roda o React (estado, `useState`, funções normais).
- **thread de UI**: onde a tela é desenhada.

Para animações e gestos ficarem suaves (60 quadros por segundo), o Reanimated roda partes do código **direto na thread de UI**. Essas partes se chamam *worklets*. Os callbacks de gestos (`onUpdate`, `onEnd`...) e os `useAnimatedStyle` são worklets.

- `useSharedValue`: um valor que **as duas threads enxergam**. Mudar `.value` **não redesenha o componente**; só atualiza a animação.
- `runOnJS(funcao)(args)`: dentro de um worklet, é o jeito de chamar uma função da thread JS (por exemplo, um `setState` ou a navegação).

### Imports, tipos e constantes (L1–33)

- **L3**: `GestureDetector` (envolve um componente para dar gestos a ele) e `Gesture` (cria os gestos).
- **L4–13**: do Reanimated:
  - `Animated`: componentes animáveis.
  - `useSharedValue`, `useAnimatedStyle`.
  - `withTiming`: anima até um valor num tempo.
  - `interpolate`: converte uma faixa de valores em outra.
  - `Extrapolation`, `Easing` (curva de aceleração), `runOnJS`.
  - `SharedValue`: o tipo.
- **L16–21**: `RadialMenuItem`, o formato de cada botão:
  - `id`, `name`, `onPress`.
  - `icon: keyof typeof Ionicons.glyphMap`: o nome do ícone precisa ser um dos que existem no Ionicons.
- **L23–25**: as props do menu: só a lista de itens.
- **L27–33**: constantes de layout:
  - `RADIUS = 100`: distância dos itens até o centro do botão.
  - `BUTTON_SIZE = 56`: diâmetro do botão azul.
  - `ITEM_SIZE = 42`: diâmetro dos botões dos itens.
  - `ANGLE_STEP = 42`: graus entre um item e o próximo.
  - `FIRST_ANGLE = 16`: ângulo do primeiro item.
  - `VISIBLE_MIN = 10` e `VISIBLE_MAX = 85`: faixa de ângulos em que o item fica totalmente visível e aceita toque.

### Estado e valores animados (L36–44)

- **L36**: `isOpen` diz se o menu está aberto (estado React, redesenha a tela).
- **L37**: `rotationStep` diz quantos "encaixes" a roleta está girada (0, 1, 2...). É usado para saber quais itens aceitam toque.
- **L39**: `openProgress` vai de 0 (fechado) a 1 (aberto), animado. Todos os efeitos de abrir e fechar derivam dele.
- **L40**: `rotationOffset` é quantos graus a roleta está girada, animado.
- **L41**: `startRotation` guarda a rotação no início de cada arrasto.
- **L43**: `maxSteps = items.length - 2`. Cabem **dois** itens totalmente visíveis por vez (em 16° e 58°; o próximo, em 100°, já passa de 85°). Com 4 itens, é preciso girar 2 encaixes para ver o último.
- **L44**: `maxScroll` é a rotação máxima em graus.

### Abrir/fechar (L46–62)

`toggleMenu`:

- **Fechando (L47–54)**: anima `openProgress` para 0 em 140 ms, volta a roleta para 0 e marca fechado. `Easing.in(Easing.cubic)` faz a animação começar devagar e acelerar.
- **Abrindo (L55–61)**: marca aberto e anima `openProgress` para 1 em 180 ms, com `Easing.out` (começa rápido e desacelera).

### Gesto de arrastar — a roleta (L64–81)

- **L64–65**: `Gesture.Pan()` é o gesto de arrastar. `minDistance(12)` exige que o dedo ande 12 pontos antes de contar como arrasto, para um toque simples não virar arrasto sem querer.
- **L66–68**: `onStart`: no começo do arrasto, guarda a rotação atual.
- **L69–76**: `onUpdate`, a cada movimento do dedo:
  - `translationX`/`translationY` = quanto o dedo andou desde o início.
  - `(translationY - translationX) * 0.25`: arrastar **para baixo ou para a esquerda** gira num sentido, e para cima ou para a direita no outro. O `0.25` é a sensibilidade (4 pontos de arrasto = 1 grau).
  - **L73**: só aceita valores entre -10 e `maxScroll + 10`. A folga de 10° dá um efeito "elástico" nas pontas.
- **L77–81**: `onEnd`, ao soltar o dedo:
  - **L78**: calcula o encaixe mais próximo: divide pelo passo, arredonda (`Math.round`) e limita entre 0 e `maxSteps` (`Math.max`/`Math.min`).
  - **L79**: anima até o ângulo exato do encaixe, para nenhum item ficar parado pela metade.
  - **L80**: `runOnJS(setRotationStep)(step)` atualiza o estado React. Como `onEnd` roda na thread de UI, o `setState` precisa ser chamado pelo `runOnJS`.

### Estilos animados do botão e do arco (L83–95)

- **L83–88**: o ícone do botão azul gira de 0° a 90° enquanto abre. `interpolate(valor, [0, 1], [0, 90])` converte "progresso 0 a 1" em "0 a 90 graus".
- **L90–95**: o círculo pontilhado aparece (opacidade 0 → 0,4) e cresce de 85% para 100% do tamanho.

### O que é desenhado (L97–138)

- **L98**: `overlayContainer` cobre a tela inteira (`position: absolute` com `top/left/right/bottom: 0` e `zIndex: 999` para ficar por cima). O `pointerEvents="box-none"` significa que **a caixa em si não recebe toques, só os filhos**. Sem isso, o menu fechado bloquearia a tela inteira.
- **L99–101**: o *backdrop*, um fundo escuro semitransparente que ocupa a tela. Tocar nele **fecha o menu**. Só existe com o menu aberto.
- **L103–105**: o círculo pontilhado, puramente decorativo (`pointerEvents="none"`, não recebe toque).
- **L107–126**: a **zona da roleta** (`dialZone`), uma área no canto inferior direito que recebe o gesto de arrastar (`GestureDetector gesture={panGesture}`). Dentro dela, cada item é desenhado com `items.map(...)`. Para cada um:
  - `key`: id para o React.
  - `index`: posição na lista, que define o ângulo.
  - `tappable`: se aceita toque. É calculado com o ângulo atual do item: `FIRST_ANGLE + (index - rotationStep) * ANGLE_STEP`.
  - `openProgress` e `rotationOffset`: passados para o item animar a própria posição.
  - `onSelect`: ao tocar, fecha o menu e chama o `onPress` do item (a navegação).
- **L128–136**: o botão azul. O ícone troca entre `apps-outline` (fechado) e `close` (aberto) e gira com `fabAnimatedStyle`.

### `isAngleVisible` (L141–143)

Devolve `true` se o ângulo está na faixa visível (entre 10° e 85°).

### Cada item: `RadialItemComponent` (L145–216)

- **L145–159**: props recebidas e os tipos delas.
- **L160–162**: `Gesture.Tap()` é o gesto de toque. `onEnd` roda na thread de UI, por isso usa `runOnJS(onSelect)()` para chamar a função JS que navega.
- **L164–195**: `useAnimatedStyle` calcula, a cada quadro, a posição, a opacidade e o tamanho do item:
  - **L165**: ângulo base: o primeiro em 16°, o segundo em 58°, o terceiro em 100° etc.
  - **L166**: ângulo atual = base − rotação da roleta.
  - **L167**: converte graus em radianos (`Math.cos`/`Math.sin` trabalham em radianos).
  - **L169–170**: trigonometria para achar o ponto no círculo. `cos` dá o deslocamento horizontal e `sin` o vertical. Os sinais negativos fazem 0° ficar à esquerda (−x) e 90° acima (−y, porque na tela o y cresce para baixo).
  - **L172–173**: com o menu fechado (`openProgress = 0`), o item fica no centro do botão (deslocamento 0). Aberto (1), vai até o ponto calculado. No meio do caminho, fica no meio: é isso que faz os itens "saírem" do botão.
  - **L175–181**: opacidade: 1 dentro da faixa visível; vai a 0 nos 20° antes de 10° e depois de 85°. `Extrapolation.CLAMP` impede passar de 0 ou 1. A multiplicação por `openProgress` faz sumir ao fechar.
  - **L183–189**: tamanho: 100% dentro da faixa e 50% fora, com a mesma lógica.
  - **L191–194**: aplica tudo como `opacity` e `transform` (deslocar e escalar).
- **L197–215**: o desenho:
  - **L198–201**: `Animated.View` com o estilo animado. Se o item não é `tappable`, `pointerEvents="none"`, para que um item transparente não "roube" o toque de um visível.
  - **L202–213**: o `GestureDetector` com o toque envolve a linha com a **etiqueta** (texto) e o **botão redondo** (ícone). Tocar em qualquer um dos dois seleciona o item.

### Estilos (L218–310)

- `overlayContainer`, `backdrop`: cobrem a tela toda.
- `arcCircle`: um círculo de diâmetro `RADIUS * 2` com borda tracejada. As contas em `right`/`bottom` posicionam o centro dele no centro do botão azul.
- `dialZone`: o tamanho da área que aceita o arrasto.
- `fabButton`: o botão azul, a 28 da direita e 36 de baixo.
- `itemWrapper` (L270–274): a caixa de cada item. Fica presa pela direita e por baixo, com valores calculados para que o **centro do ícone fique exatamente no centro do botão azul** (`28 + 56/2 − 42/2`). Ela não tem largura fixa: cresce para a esquerda até caber texto + ícone. Isso é importante: uma versão anterior tinha largura fixa de 42 com o texto "vazando" para fora, e no Android o desenho e a área de toque ficavam em lugares diferentes.
- `buttonAndLabelContainer`: texto e ícone lado a lado.
- `labelBadge`, `itemButton`, `itemLabel`: aparência da etiqueta branca e do círculo escuro.

---

## 15. Fluxos completos: do toque até o dado salvo

### Registrar um treino

1. Na Gym, o usuário toca no card "Supino" → `navigation.navigate("Exercise", { id, nome })` (Gym L108).
2. O navegador abre `Exercise`, e o título vem de `route.params.nome` (App.tsx L66).
3. `useEffect` chama `carregarExercicios()` → `AsyncStorage.getItem("exercicios")` → `JSON.parse` → `setExercicios(lista)`.
4. A tela redesenha: `find` acha o Supino e `historico` mostra os registros.
5. O usuário digita 40, 3 e 12 e toca "Registrar treino" → `salvar()`.
6. Converte para número, valida, cria o `Registro` com a data de agora.
7. `atualizarRegistros([...registros, novo])` → `map` troca os registros do Supino na lista completa → `setExercicios` (tela atualiza) → `salvarExercicios` → `JSON.stringify` → `AsyncStorage.setItem`.
8. Ao voltar para a Gym, `useFocusEffect` recarrega, e o card mostra "Último: 40 kg · 3x12".

### Criar um lembrete

1. O usuário digita o título, toca em "Data" → `setSeletorAberto("date")` → o `DateTimePicker` é desenhado → o Android abre o calendário.
2. O usuário escolhe e aperta OK → `aoEscolher({ type: "set" }, data)` → fecha o seletor e `setQuando(data)`.
3. Mesmo processo para "Hora".
4. Toca em "Adicionar lembrete" → `adicionar()` valida o título e a data futura.
5. `agendarNotificacao` → `obterModulo()` carrega o `expo-notifications` (se disponível) → `scheduleNotificationAsync` → devolve um id.
6. O lembrete é criado com esse `notificacaoId`, salvo com `salvarLembretes`, e a lista reordenada aparece.
7. Na data marcada, o sistema mostra a notificação (fora do Expo Go no Android).

### Navegar pelo menu circular

1. Toque no botão azul → `toggleMenu()` → `isOpen = true` e `openProgress` animado até 1 → os itens saem do botão.
2. Arrasto na zona da roleta → `onUpdate` muda `rotationOffset` → os itens giram.
3. Ao soltar → `onEnd` encaixa no passo mais próximo e atualiza `rotationStep`.
4. Toque num item → `Tap.onEnd` → `runOnJS(onSelect)` → `toggleMenu()` (fecha) + `item.onPress()` → `navigate("Gym")` → `navigationRef.navigate(...)`.

---

## 16. Perguntas prováveis e respostas curtas

**Por que AsyncStorage e não um banco SQL?**
O volume de dados é pequeno e o AsyncStorage é simples: um dicionário de chave → texto no celular. Como todo o acesso passa pela pasta `storage`, trocar por SQL depois só mexeria nela.

**Por que salvar a lista inteira a cada mudança?**
É o jeito mais simples com AsyncStorage, que guarda um texto por chave. Para poucos itens o custo é desprezível.

**Por que a Gym usa `useFocusEffect` e a Exercise usa `useEffect`?**
A Gym continua montada na pilha enquanto a Exercise está aberta. Ao voltar, ela precisa recarregar. A Exercise é criada de novo a cada abertura, então carregar uma vez basta.

**Por que não usar `push` para adicionar na lista?**
O React só redesenha se receber uma lista **nova**. `push` altera a mesma lista, e o React não perceberia a mudança. Por isso o código usa `[...lista, novo]`, `map` e `filter`.

**O que é `editandoId`?**
O estado que diz se o formulário está adicionando (`null`) ou editando (o id do item). Um formulário só serve para as duas coisas.

**Por que `[...registros].reverse()` e não só `registros.reverse()`?**
`reverse` altera o array original. Isso bagunçaria a ordem salva. A cópia evita isso. O mesmo vale para o `sort` dos lembretes.

**Por que o menu usa `navigationRef` em vez de `navigation`?**
O menu fica fora do navegador (App.tsx L71), então não recebe a prop `navigation`. A `ref` permite navegar de qualquer lugar.

**O que é `runOnJS`?**
Gestos e animações do Reanimated rodam na thread de UI. Para chamar uma função normal do React (um `setState` ou a navegação) a partir deles, é preciso passar por `runOnJS`.

**Por que as notificações não funcionam no Expo Go do Android?**
Desde o SDK 53, o Expo Go para Android não traz o módulo nativo de notificações. O app detecta isso (`notificacoesDisponiveis`), não carrega o módulo e mostra um aviso. Num build próprio do app, elas funcionam.

**O que acontece se o usuário negar a permissão de notificação?**
O lembrete é salvo normalmente; só o aviso não aparece.

**Por que o `// @ts-expect-error` no navigationRef?**
É uma instrução para o TypeScript ignorar um erro de tipo conhecido da biblioteca ao usar um nome de tela genérico. Não é um comentário explicativo e não pode ser removido.
