# Guia de Validação de Área Plantada

## Visão Geral

Este guia descreve o sistema de validação de área plantada implementado para garantir que a soma das áreas de cultivos não exceda a área total do terreno.

---

## Funcionalidades

### 1. Validação em Tempo Real

O sistema valida a área plantada conforme o usuário digita, fornecendo feedback imediato.

**Benefícios:**
- Previne erros antes do envio
- Melhora experiência do usuário
- Reduz rejeições de formulário

### 2. Alertas Visuais

Mensagens claras indicam se a área é válida ou excede o limite.

**Tipos de alerta:**
- Verde: Validação bem-sucedida
- Vermelho: Erro (área excede limite)

### 3. Cálculos Automáticos

O sistema calcula automaticamente:
- Área disponível para plantio
- Percentual de uso do terreno
- Status de uso (Baixo, Moderado, Alto, Crítico)

### 4. Proteção contra Spam

Limite de tentativas e cooldown para reenvios.

---

## Arquitetura

### Função: `validatePlantedArea`

Valida se a área plantada não excede a área do terreno.

**Localização:** `lib/validation/area-validation.ts`

**Assinatura:**

```typescript
function validatePlantedArea(
  areaTerreno: number,
  areaPlantadaAtual: number,
  areaPlantadaExistente?: number
): AreaValidationResult
```

**Parâmetros:**
- `areaTerreno` - Área total do terreno em hectares
- `areaPlantadaAtual` - Área que será plantada agora
- `areaPlantadaExistente` - Soma das áreas já plantadas (padrão: 0)

**Retorno:**

```typescript
{
  isValid: boolean;              // Validação passou?
  message: string;               // Mensagem descritiva
  areaDisponivel: number;        // Área ainda disponível
  areaUsada: number;             // Área já usada
  areaPlantada: number;          // Área plantada agora
  percentualUso: number;         // Percentual de uso (0-100)
}
```

**Exemplo:**

```typescript
const result = validatePlantedArea(10, 5, 3);
// {
//   isValid: true,
//   message: "Plantio registrado com sucesso. Área usada: 8 ha de 10 ha (80%)",
//   areaDisponivel: 2,
//   areaUsada: 3,
//   areaPlantada: 5,
//   percentualUso: 80
// }
```

### Hook: `useAreaValidation`

Gerencia validação de área com estado reativo.

**Localização:** `hooks/use-area-validation.ts`

**Uso:**

```typescript
const validation = useAreaValidation({
  areaTerreno: 10,
  areaPlantadaExistente: 3,
  onValidationChange: (result) => {
    console.log('Validação:', result.isValid);
  },
});

// Atualizar área
validation.setAreaPlantada(5);

// Verificar estado
console.log(validation.isValid);           // boolean
console.log(validation.areaDisponivel);    // number
console.log(validation.percentualUso);     // number
console.log(validation.usageStatus);       // 'Baixo' | 'Moderado' | 'Alto' | 'Crítico'
console.log(validation.usageColor);        // '#10b981' | '#f59e0b' | '#f97316' | '#ef4444'
```

### Componente: `AreaValidationInput`

Input com validação integrada e feedback visual.

**Localização:** `components/area-validation-input.tsx`

**Props:**

```typescript
interface AreaValidationInputProps {
  label?: string;                    // Label do input
  placeholder?: string;              // Placeholder
  value: string;                     // Valor atual
  onChangeText: (text: string) => void;  // Callback de mudança
  areaTerreno: number;              // Área total do terreno
  areaPlantadaExistente?: number;   // Área já plantada
  onValidationChange?: (isValid: boolean) => void;  // Callback de validação
  editable?: boolean;               // Habilitado?
}
```

**Exemplo:**

```typescript
<AreaValidationInput
  label="Area Plantada (ha)"
  value={areaPlantada}
  onChangeText={setAreaPlantada}
  areaTerreno={10}
  areaPlantadaExistente={3}
  onValidationChange={(isValid) => {
    setCanSave(isValid);
  }}
/>
```

### Componente: `AreaValidationAlert`

Alerta visual com detalhes da validação.

**Localização:** `components/area-validation-alert.tsx`

**Props:**

```typescript
interface AreaValidationAlertProps {
  result: AreaValidationResult | null;  // Resultado da validação
  visible?: boolean;                    // Visível?
  showDetails?: boolean;                // Mostrar detalhes?
}
```

**Exemplo:**

```typescript
<AreaValidationAlert
  result={validationResult}
  visible={true}
  showDetails={true}
/>
```

---

## Fluxo de Uso

### 1. Usuário Abre Formulário de Cultivo

```
Tela de Cultivos → Clica "Novo Cultivo" → Formulário abre
```

### 2. Usuário Digita Área Plantada

```
AreaValidationInput recebe input → Valida em tempo real → Exibe alerta
```

### 3. Validação Passa

```
Alerta verde → Botão "Salvar" habilitado → Usuário clica "Salvar"
```

### 4. Validação Falha

```
Alerta vermelho → Botão "Salvar" desabilitado → Usuário corrige
```

---

## Exemplos Práticos

### Exemplo 1: Validação Simples

```typescript
import { validatePlantedArea } from '@/lib/validation/area-validation';

// Terreno com 10 ha, plantando 5 ha
const result = validatePlantedArea(10, 5, 0);

if (result.isValid) {
  // Salvar cultivo
  await saveCultura({
    areaPlantada: 5,
    ...outrosDados,
  });
} else {
  // Mostrar erro
  Alert.alert('Erro', result.message);
}
```

### Exemplo 2: Validação em Formulário

```typescript
import { AreaValidationInput } from '@/components/area-validation-input';

export function CulturaForm() {
  const [areaPlantada, setAreaPlantada] = useState('');
  const [canSave, setCanSave] = useState(false);

  return (
    <View>
      <AreaValidationInput
        value={areaPlantada}
        onChangeText={setAreaPlantada}
        areaTerreno={10}
        areaPlantadaExistente={3}
        onValidationChange={setCanSave}
      />

      <Button
        title="Salvar"
        disabled={!canSave}
        onPress={handleSave}
      />
    </View>
  );
}
```

### Exemplo 3: Múltiplos Cultivos

```typescript
import { validateMultipleCrops } from '@/lib/validation/area-validation';

const cultivos = [
  { id: 1, area: 3 },
  { id: 2, area: 4 },
  { id: 3, area: 2 },
];

const result = validateMultipleCrops(10, cultivos);

console.log(`Uso: ${result.percentualUso.toFixed(1)}%`);
// Uso: 90%
```

---

## Cores e Status

### Cores de Uso

| Percentual | Cor | Status |
|-----------|-----|--------|
| 0-50% | Verde | Baixo |
| 51-75% | Amarelo | Moderado |
| 76-95% | Laranja | Alto |
| 96-100% | Vermelho | Crítico |

### Significado

- **Baixo**: Muito espaço disponível, sem preocupações
- **Moderado**: Espaço adequado, considere planejamento
- **Alto**: Pouco espaço, planeje com cuidado
- **Crítico**: Terreno quase cheio, não há margem

---

## Tratamento de Erros

### Erro: "Area plantada excede a area do terreno"

**Causa:** Soma das áreas plantadas > área do terreno

**Solução:** Reduzir área plantada ou usar outro terreno

### Erro: "Area plantada nao pode ser negativa"

**Causa:** Valor negativo inserido

**Solução:** Inserir valor positivo

### Erro: "Area do terreno deve ser maior que 0"

**Causa:** Terreno com área zero ou negativa

**Solução:** Verificar dados do terreno

---

## Boas Práticas

### 1. Sempre Validar Antes de Salvar

```typescript
// ✅ Correto
if (validationResult.isValid) {
  await saveCultura(data);
}

// ❌ Incorreto
await saveCultura(data);  // Sem validação
```

### 2. Mostrar Feedback Visual

```typescript
// ✅ Correto
<AreaValidationAlert result={result} visible={true} />

// ❌ Incorreto
// Sem feedback visual
```

### 3. Usar Componente Integrado

```typescript
// ✅ Correto
<AreaValidationInput
  areaTerreno={10}
  onValidationChange={setCanSave}
/>

// ❌ Incorreto
<TextInput />  // Sem validação
```

### 4. Considerar Margem de Segurança

```typescript
// ✅ Recomendado
const max = suggestMaximumArea(10, 3, 5);  // Deixa 5% de margem

// ❌ Não recomendado
const max = calculateAvailableArea(10, 3);  // Usa 100% do espaço
```

---

## Testes

### Testar Validação Básica

```typescript
import { validatePlantedArea } from '@/lib/validation/area-validation';

test('deve validar area dentro do limite', () => {
  const result = validatePlantedArea(10, 5, 0);
  expect(result.isValid).toBe(true);
});

test('deve rejeitar area que excede', () => {
  const result = validatePlantedArea(10, 6, 5);
  expect(result.isValid).toBe(false);
});
```

### Testar Componente

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { AreaValidationInput } from '@/components/area-validation-input';

test('deve mostrar alerta de erro', () => {
  const { getByText } = render(
    <AreaValidationInput
      areaTerreno={10}
      areaPlantadaExistente={5}
      value="6"
      onChangeText={() => {}}
    />
  );

  expect(getByText(/excede/i)).toBeTruthy();
});
```

---

## Próximas Melhorias

1. **Histórico de Plantios** — Rastrear áreas plantadas por período
2. **Recomendações** — Sugerir cultivos baseado em espaço disponível
3. **Rotação de Culturas** — Validar rotação de culturas por terreno
4. **Alertas Automáticos** — Notificar quando terreno está quase cheio

---

## Referências

- [Função validatePlantedArea](./lib/validation/area-validation.ts)
- [Hook useAreaValidation](./hooks/use-area-validation.ts)
- [Componente AreaValidationInput](./components/area-validation-input.tsx)
- [Componente AreaValidationAlert](./components/area-validation-alert.tsx)
- [Testes area-validation.test.ts](./tests/area-validation.test.ts)
