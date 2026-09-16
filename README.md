# Incantare Centro Estético — Landing Page Preenchimento Labial

Landing page **mobile-first**, curta e de alta conversão, feita
**exclusivamente para tráfego pago do Meta Ads** (Instagram/Facebook —
não é usada para Google Ads). HTML, CSS e JavaScript puro — sem
frameworks, sem build step, pronta para deploy na Netlify ou Vercel.

Fluxo: **anúncio → hero promocional → antes/depois → quiz de 3 etapas
→ WhatsApp**. O preço nunca é revelado na página — a oferta trabalha
curiosidade ("condição nunca vista") e qualificação rápida via quiz.

---

## Estrutura de arquivos

```
index.html
styles.css
script.js
site.webmanifest
netlify.toml
robots.txt
sitemap.xml
/assets
  logo-incantare.png          ← logotipo oficial, otimizado p/ web (900px)
  logo-incantare-oficial.png  ← arquivo original enviado pelo cliente (fonte)
  antes-depois-01.webp … antes-depois-05.webp
  og-image.jpg
  favicon-16.png / favicon-32.png / favicon.ico
  apple-touch-icon.png
  icon-192.png / icon-512.png
```

### Sobre o logotipo

`assets/logo-incantare.png` é o logotipo **oficial** da Incantare
(enviado pelo cliente), redimensionado para 900px de largura e
otimizado para web (~55KB). O arquivo original em alta resolução
(6616px) fica em `assets/logo-incantare-oficial.png`, mantido só como
fonte — se precisar reexportar em outro tamanho, reprocesse a partir
dele. Os favicons (`favicon-*.png`, `apple-touch-icon.png`,
`icon-192/512.png`) também já foram recortados a partir do emblema
real (o "I" dentro do oval).

### Sobre as imagens de antes e depois

As 5 imagens em `/assets/antes-depois-0X.webp` já vieram com a marca
d'água da Incantare aplicada e foram apenas redimensionadas e
convertidas para WebP (redução de ~8,8 MB para ~0,28 MB no total,
mantendo a marca d'água original). Elas são representações geradas
para fins publicitários.

Para substituir por fotos reais de pacientes (com autorização), basta
sobrescrever os arquivos `antes-depois-01.webp` a `antes-depois-05.webp`
mantendo o mesmo nome e proporção (1:1).

---

## Estrutura da página (somente isso, de propósito)

1. Hero promocional (logo pequena + "CONDIÇÃO NUNCA VISTA" + CTA)
2. Antes e depois (carrossel automático + CTA)
3. Quiz de 3 etapas
4. WhatsApp (único ponto de saída — só aparece depois do quiz completo)
5. Rodapé Incantare (compacto)
6. Assinatura Adriano Marketing (discreta, separada por divisor)

Sem menu, sem FAQ, sem seção de benefícios/institucional, sem botão
flutuante de WhatsApp e sem nenhum CTA de WhatsApp antes do quiz —
isso é proposital: a página existe para converter tráfego de anúncio
rápido, não para explicar a clínica.

---

## Configuração — status atual

1. ✅ **Número de WhatsApp da Incantare** — configurado em `script.js`
   (`WHATSAPP_NUMBER = '5547996650381'`).
2. ✅ **Meta Pixel** — configurado em `index.html` (Pixel ID
   `762018213673538`, código base oficial + `PageView` automático).
3. ✅ **Google Tag Manager** — container `GTM-PNSMTRVH` já instalado
   (snippet no `<head>` + `<noscript>` logo após a abertura do
   `<body>`). Os eventos do dataLayer (`lp_view`, `quiz_start`, `lead`,
   `whatsapp_contact` etc.) já existem independente do GTM — configure
   as tags/triggers dentro do próprio GTM usando a tabela de eventos
   abaixo.
4. ⏳ **Domínio canônico** — ainda placeholder. Quando o domínio final
   for definido, ajustar `<link rel="canonical">` e `og:url` em
   `index.html`, e a URL em `robots.txt`/`sitemap.xml`.

---

## Deploy

**Netlify:** suba a pasta para um repositório Git → *Add new site →
Import an existing project* → build command vazio, publish directory
`.` → Deploy (`netlify.toml` já define headers de cache/segurança).

**Vercel:** *Add New → Project → Import Git Repository* → Framework
"Other" (site estático, sem build) → Deploy.

---

## LGPD / Consent Mode

- A página inicia com consentimento **negado** por padrão
  (`default_consent` no `<head>`, antes de qualquer tag).
- O banner de cookies (rodapé, discreto) permite **Aceitar** tudo ou
  **Configurar** Analytics e Marketing separadamente.
- Qualquer escolha dispara `consent_update` no dataLayer com
  `analytics_storage` e `ad_storage` (`granted`/`denied`).
- A escolha fica salva em `localStorage` — o banner não é mostrado de
  novo em visitas futuras no mesmo navegador.
- O Meta Pixel base já dispara `PageView` independentemente do banner
  (comportamento padrão do Pixel); ajuste isso nas configurações de
  consentimento do Gerenciador de Eventos da Meta caso precise
  condicionar ao aceite de cookies de marketing.

---

## Dados pessoais — o que NUNCA vai para o dataLayer/Pixel

Nome, telefone, e-mail, CPF ou qualquer identificador pessoal **não**
são enviados a nenhum evento de tracking. O primeiro nome informado
no quiz fica apenas em memória no JavaScript da página, usado só para
personalizar a tela de resultado e a mensagem pré-preenchida do
WhatsApp.

---

## Tabela de eventos

| Evento | Quando dispara | Parâmetros principais | dataLayer | Meta Pixel |
|---|---|---|---|---|
| `lp_view` | No carregamento da página | `procedure`, `clinic`, `funnel`, `event_id`, UTMs* | `lp_view` | `PageView` (código base do Pixel, automático) |
| `offer_view` | Quando o Hero entra na viewport (1x) | mesmos parâmetros base | `offer_view` | — |
| `quiz_start` | Primeiro clique em "QUERO DESCOBRIR A CONDIÇÃO" (hero ou abaixo do carrossel) — 1x por sessão | mesmos parâmetros base | `quiz_start` | `fbq('trackCustom', 'QuizStart')` |
| `quiz_answer` | Ao responder a etapa 2 ou 3 do quiz | `quiz_step` (2 ou 3), `answer_code` | `quiz_answer` (auxiliar) | — |
| `lead` | Assim que a etapa 3 é respondida (quiz 100% completo) — 1x, nunca antes | mesmos parâmetros base | `lead` | `fbq('track', 'Lead')` |
| `whatsapp_contact` | Clique no botão final "VER MINHA CONDIÇÃO NO WHATSAPP" (único CTA de WhatsApp da página) | mesmos parâmetros base | `whatsapp_contact` | `fbq('track', 'Contact')` |

\* `traffic_source`, `campaign_name`, `creative_name`, `medium`, `term` e
`click_id` são adicionados automaticamente a todo evento do dataLayer
quando a URL de entrada contiver `utm_source`, `utm_campaign`,
`utm_content`, `utm_medium`, `utm_term` ou `fbclid` (persistidos em
`sessionStorage` durante a navegação).

Todos os eventos do dataLayer passam pela função `trackEvent()` em
`script.js`, que já inclui `event`, `procedure`, `clinic`, `funnel`,
`page_variant` e um `event_id` único (`crypto.randomUUID()`). Os
eventos do Meta Pixel passam por `fbqSafe()`, que não faz nada (sem
erro) enquanto o Pixel ID real não for configurado.

**Códigos das respostas do quiz** (`answer_code` em `quiz_answer`):
- Etapa 2 (objetivo): `volume` · `definicao` · `natural` · `indeciso`
- Etapa 3 (prazo): `quanto_antes` · `proximos_dias` · `proximas_semanas` · `pesquisando`

### Evento à parte — assinatura da agência (rodapé)

| Evento | Quando dispara | Parâmetros | Observação |
|---|---|---|---|
| `agency_footer_click` | Clique no link "Falar com o responsável por esta página" (assinatura discreta abaixo do rodapé) | `agency: "adriano_marketing"`, `source_page: "incantare_preenchimento_labial"`, `cta_position: "agency_footer"` | Disparado **fora** de `trackEvent()` e sem `fbq`, sem os campos de campanha da Incantare. **Não usar este evento para otimizar/qualificar a campanha de preenchimento labial** — é tráfego institucional da agência, não lead da clínica. |
