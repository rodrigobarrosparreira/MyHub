### identificação das telas implementadas:
- Home.tsx
- Health.tsx
- Gym.tsx

A tela Home será a tela inicial do App.
Decidi usar um menu lateral para navegar dentro das diferentes áreas do aplicativo, e dentro dessas áreas, terão mais telas, como a Gym, que é uma tela dentro de Health.

Por enquanto utilizei somente componentes Text e Pressable para fazer o botão de navegação, com estilos styleSheet

Optei por usar Header, mas em sub telas, como Gym, desativo a header pai, para não ficar o título da área, e sim daquela tela do momento.

### instruções para execução da aplicação:
- Node.js 20 ou superior
- Celular com Expo Go instalado
- npm install
- npx expo start
- ler QR code do terminal