# Monitor de Vagas

Um aplicativo web 100% client-side que monitora vagas de estacionamento em tempo real usando detecção de objetos com ML. O usuário desenha retângulos que representam vagas sobre o vídeo (webcam ou arquivo MP4), o modelo COCO-SSD detecta veículos, e cada vaga é marcada como LIVRE (verde) ou OCUPADA (vermelho) com overlay em tempo real.

## O Que Tem no Projeto

| Funcionalidade | Descrição | Tecnologia |
|---|---|---|
| **Detecção de Objetos** | Identifica veículos (carros, caminhões, motos, ônibus) em tempo real | TensorFlow.js + COCO-SSD (pré-treinado) |
| **Geometria Computacional** | Calcula interseção (IoU) entre vagas e bounding boxes | TypeScript (puro) |
| **Engine de Ocupação** | Determina status de vagas (LIVRE/OCUPADA) baseado em detecções | TypeScript (puro) |
| **Persistência** | Salva vagas em localStorage do navegador | JSON + localStorage |
| **Editor Visual** | Desenha retângulos como vagas sobre o vídeo | Canvas 2D |
| **Visualização** | Overlay com cores (verde = livre, vermelho = ocupada) | Canvas + requestAnimationFrame |
| **Fontes de Vídeo** | Webcam (getUserMedia) ou arquivo MP4 | HTML5 Video + File API |

### Stack Tecnológico

- **Frontend**: Vite + TypeScript (vanilla, sem framework)
- **ML**: `@tensorflow/tfjs` + `@tensorflow-models/coco-ssd` (pré-treinado)
- **Testes**: Vitest (100% offline, domínio puro)
- **Build**: Vite
- **CI/CD**: GitHub Actions (Node 22)

## Arquitetura

```mermaid
graph TB
    subgraph Domain["Domain (Lógica Pura)"]
        Geometry["geometry.ts<br/>Rect, IoU, Intersection"]
        Occupancy["occupancy.ts<br/>computeOccupancy"]
        Zones["zones.ts<br/>createZone, serialize/deserialize"]
    end
    
    subgraph Infrastructure["Infrastructure (Adapters)"]
        Storage["storage.ts<br/>StorageAdapter<br/>localStorage"]
        Detector["detector.ts<br/>Detector Port<br/>CocoSsdDetector"]
    end
    
    subgraph UI["UI (Presentation)"]
        App["app.ts<br/>ParkingMonitorApp<br/>State Management"]
        Draw["draw.ts<br/>CanvasDrawer<br/>Visualization"]
        Main["main.ts<br/>Event Loop<br/>Integration"]
    end
    
    subgraph External["External (Browser APIs)"]
        Video["Video Element<br/>Canvas<br/>localStorage<br/>getUserMedia<br/>TensorFlow.js"]
    end
    
    Domain --> Infrastructure
    Infrastructure --> UI
    UI --> External
    Main -->|rAF ~60fps| Draw
    Main -->|Interval ~500ms| Detector
    Detector -->|Detection[]| App
    App -->|occupancyStatus| Draw
    App -->|zones| Storage
    Storage --> External
```

## Como Rodar

### 1. Instalação

```bash
# Clonar repositório (ou descompactar)
cd monitor-de-vagas

# Instalar dependências
npm install
```

### 2. Desenvolvimento

```bash
# Servidor dev com hot reload
npm run dev
# Abre em http://localhost:5173
```

### 3. Build para Produção

```bash
# Gera arquivos otimizados em ./dist
npm run build

# Visualizar build localmente
npm run preview
```

## Como Testar

```bash
# Rodar testes (100% offline, sem DOM)
npm test

# Modo watch para desenvolvimento
npm run test:watch

# Type checking
npm run type-check
```

### Casos de Teste Implementados

- **Geometria (11 testes)**: IoU = 0 sem sobreposição, IoU = 1 retângulos idênticos, sobreposição parcial com cálculo exato
- **Occupancy (7 testes)**: Zonas livres sem detecções, score < threshold ignorado, classe `person` ignorada, IoU >= 0.25 marca OCUPADA, uma detecção grande cobre múltiplas vagas
- **Zones (7 testes)**: IDs estáveis após serialização roundtrip, desserialização com error handling
- **Storage (6 testes)**: Save/retrieve zones, corrupção de dados tratada

**Total: 31 testes, 100% passando**

## Uso

### Início Rápido

1. **Escolha a fonte de vídeo**
   - Clique "Usar Webcam" para câmera do dispositivo
   - Ou "Carregar MP4" para arquivo local

2. **Ative o Modo Edição**
   - Clique "Modo Edição" no painel de controle
   - Indicador muda para azul

3. **Desenhe as Vagas**
   - Clique e arraste no vídeo para criar retângulos
   - Mínimo 10x10 pixels
   - Cada zona recebe ID único

4. **Visualize Ocupação**
   - Modo Visualização mostra status em tempo real
   - Verde = LIVRE | Vermelho = OCUPADA
   - Contador no painel mostra totais
   - Detecções são marcadas em azul

5. **Gerenciar Vagas**
   - Botão "Remover" ao lado de cada vaga
   - "Limpar Vagas" remove todas
   - Vagas persistem em reload via localStorage

## Limitações

- **Ângulo de Câmera**: Funciona melhor com vista de cima/frontal. Ângulos muito laterais reduzem precisão
- **Modelo Genérico**: COCO-SSD é pré-treinado em dataset genérico (não específico para vagas). Pode ter falsos positivos/negativos
- **Iluminação**: Performance degrada em baixa luminosidade ou contra-luz
- **Performance**: Detecção a ~500ms (ajustável). Não recomendado para >50 vagas simultâneas
- **Classes Fixas**: Detecta apenas `car`, `truck`, `motorcycle`, `bus`. Não customizável em runtime

## Evolução Futura

1. **Treinamento Customizado**: Modelo YOLO custom treinado em dataset de vagas específico
2. **Detecção Mais Rápida**: Implementar Web Workers para não bloquear loop de renderização
3. **Múltiplas Câmeras**: Dashboard com múltiplas streams
4. **Backend Sync**: Sincronizar estado com servidor (WebSocket/REST)
5. **IA em Borda**: Otimizar TensorFlow.js com Lite ou ONNX Runtime para melhor performance
6. **Análise Temporal**: Gráficos de ocupação ao longo do tempo

## Origem

Inspirado em conceitos do curso de pós Engenharia de Software com IA Aplicada — implementação própria do zero usando Clean Architecture (Domain/Infrastructure/UI), Test-Driven Development e práticas de engenharia de software modernas.

## Desenvolvimento

### Estrutura de Pastas

```
.
├── src/
│   ├── domain/               # Lógica pura (sem dependências externas)
│   │   ├── geometry.ts       # Rect, IoU, interseção
│   │   ├── occupancy.ts      # Cálculo de ocupação
│   │   └── zones.ts          # Criação e serialização de zonas
│   ├── infrastructure/       # Adapters (abstraem dependências)
│   │   ├── detector.ts       # Port/Adapter para COCO-SSD
│   │   └── storage.ts        # Adapter para localStorage
│   └── ui/                   # Apresentação
│       ├── app.ts            # Gerenciamento de estado
│       ├── draw.ts           # Desenho em Canvas
│       └── main.ts           # Inicialização e event loop
├── tests/                    # Testes por camada
│   ├── domain/
│   └── infrastructure/
├── index.html                # HTML da interface
├── vite.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

### Commits

Cada funcionalidade tem commits pequenos e atômicos (conventional commits em inglês):

```
chore: scaffold vite + typescript
feat: implement occupancy engine
feat: add zones module with serialization
feat: add storage adapter for zones persistence
feat: add UI with canvas drawing and app logic
docs: add comprehensive README
```

## Licença

MIT License — Copyright (c) 2026 Vicente Moura

---

**Status**: Pronto para produção (MVP). Código testado, type-safe, com arquitetura clean e sem dependências desnecessárias.
