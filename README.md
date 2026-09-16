# Incantare Centro Estético — Landing Page Preenchimento Labial

Landing page mobile-first, extremamente rápida e focada em conversão para a
campanha de **preenchimento labial** da Incantare Centro Estético. HTML, CSS
e JavaScript puro — sem frameworks, sem build step, pronta para deploy na
Netlify.

O preço nunca é revelado na página. A oferta trabalha curiosidade
("condição nunca vista", "valor especial") e conduz o visitante por um
quiz de 3 perguntas até o CTA de WhatsApp.

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
  logo-incantare.svg     ← logotipo (ver nota abaixo)
  antes-depois-01.webp … antes-depois-05.webp
  og-image.jpg
  favicon-16.png / favicon-32.png / favicon.ico
  apple-touch-icon.png
  icon-192.png / icon-512.png
```

### Sobre o logotipo

O arquivo `assets/logo-incantare.svg` é uma **reconstrução em vetor**
do logotipo enviado (o Claude Code não tem acesso a imagens coladas
diretamente na conversa como arquivo). Para usar o arquivo oficial:

1. Salve o PNG/SVG original em `assets/logo-incantare.png` (ou `.svg`).
2. No `index.html`, troque as três ocorrências de
   `src="assets/logo-incantare.svg"` pelo novo caminho.

### Sobre as imagens de antes e depois

As 5 imagens em `/assets/antes-depois-0X.webp` já vieram com a marca
d'água da Incantare aplicada e foram apenas redimensionadas e
convertidas para WebP (redução de ~8,8 MB para ~0,28 MB no total,
mantendo a marca d'água original). Elas são representações geradas
para fins publicitários — por isso a página exibe o aviso
"Imagens ilustrativas. Resultados podem variar conforme cada caso."
abaixo do carrossel.

Para substituir por fotos reais de pacientes (com autorização), basta
sobrescrever os arquivos `antes-depois-01.webp` a `antes-depois-05.webp`
mantendo o mesmo nome e proporção (1:1).

---

## Configuração obrigatória antes do deploy

1. **Número de WhatsApp** — em `script.js`, defina:
   ```js
   var WHATSAPP_NUMBER = '55DDDNUMERO'; // formato: 55 + DDD + número
   ```
2. **Domínio canônico** — em `index.html`, ajuste `<link rel="canonical">`,
   `og:url` e, em `robots.txt`/`sitemap.xml`, o domínio final.
3. **Google Tag Manager** — insira o snippet do GTM:
   - no `<head>`, logo após o bloco `<script>` que inicializa o
     `dataLayer` (marcado com o comentário `INSERIR AQUI O SNIPPET DO
     GOOGLE TAG MANAGER`);
   - o `<noscript>` do GTM logo após a abertura do `<body>` (comentário
     equivalente já indicado no HTML).
   - Configure o **Consent Mode** no próprio GTM usando os eventos
     `default_consent` e `consent_update` já disparados pela página
     (ver seção LGPD abaixo).

---

## Deploy na Netlify

1. Suba esta pasta para um repositório Git (GitHub/GitLab/Bitbucket).
2. Na Netlify: **Add new site → Import an existing project**.
3. Build command: (vazio — não há build).
4. Publish directory: `.`
5. Deploy. O `netlify.toml` já define headers de cache e segurança.

---

## LGPD / Consent Mode

- A página inicia com consentimento **negado** por padrão
  (`default_consent` no `<head>`, antes de qualquer tag).
- O banner de cookies (rodapé, discreto) permite **Aceitar** tudo ou
  **Configurar** Analytics e Marketing separadamente.
- Qualquer escolha dispara `consent_update` no dataLayer com
  `analytics_storage` e `ad_storage` (`granted`/`denied`), para que o
  GTM libere (ou não) as tags conforme configurado nas suas próprias
  configurações de consentimento.
- A escolha fica salva em `localStorage` — o banner não é mostrado de
  novo em visitas futuras no mesmo navegador.

---

## Dados pessoais — o que NUNCA vai para o dataLayer

Nome, telefone, e-mail, CPF ou qualquer identificador pessoal **não**
são enviados a nenhum evento de analytics. O primeiro nome informado
no quiz fica apenas em memória no JavaScript da página, usado só para
personalizar a tela de resultado e a mensagem pré-preenchida do
WhatsApp.

---

## Tabela de eventos para configuração no GTM

| Evento | Quando dispara | Parâmetros principais | Tag GA4 sugerida | Tag Meta sugerida |
|---|---|---|---|---|
| `lp_view` | No carregamento da página | `procedure`, `funnel`, `clinic`, `page_variant`, `traffic_source`*, `campaign_name`*, `event_id` | `page_view` (ou evento complementar `lp_view`) | `PageView` |
| `offer_view` | Quando o Hero entra na viewport (dispara 1x) | mesmos parâmetros base | `offer_view` | `ViewContent` |
| `quiz_start` | Clique em "QUERO DESCOBRIR A CONDIÇÃO" (1x por sessão) | mesmos parâmetros base | `quiz_start` | Evento customizado `QuizStart` |
| `quiz_answer` | Ao responder a pergunta 2 ou 3 do quiz | `quiz_step` (2 ou 3), `answer_code` (`natural`/`volume`/`definicao` ou `agora`/`30_dias`/`pesquisando`) | `quiz_answer` (evento auxiliar) | Evento customizado `QuizAnswer` (opcional) |
| `quiz_complete` | Logo após responder a pergunta 3 | `intent_level` (`high`/`low`) | `quiz_complete` | Evento customizado `QuizComplete` |
| `qualified_interest` | Somente se a resposta 3 for `agora` ou `30_dias` | `intent_level: "high"`, `timeframe` | `qualify_lead` | Evento customizado `QualifiedInterest` |
| `whatsapp_click` | Clique em qualquer botão de WhatsApp, antes de abrir o link | `intent_level`, `cta_position` (`hero`/`gallery`/`quiz_result`/`footer`/`sticky`) | `whatsapp_click` | `Contact` |
| `lead_submit` *(futuro)* | Só quando existir envio real de formulário com telefone/contato confirmado — **não** disparar apenas por abrir o quiz | a definir | `generate_lead` | `Lead` |

\* `traffic_source`, `campaign_name`, `creative_name`, `medium`, `term` e
`click_id` são adicionados automaticamente a todo evento quando a URL
de entrada contiver `utm_source`, `utm_campaign`, `utm_content`,
`utm_medium`, `utm_term` ou `fbclid` (persistidos em `sessionStorage`
durante a navegação).

Todos os eventos acima passam pela função `trackEvent()` em `script.js`,
que já inclui `event`, `procedure`, `clinic`, `funnel`, `page_variant` e
um `event_id` único (`crypto.randomUUID()`) — não é necessário duplicar
esses campos manualmente no GTM.

### Evento à parte — assinatura da agência (rodapé)

| Evento | Quando dispara | Parâmetros | Observação |
|---|---|---|---|
| `agency_footer_click` | Clique no link "Falar com o responsável por esta página" (assinatura discreta abaixo do rodapé) | `agency: "adriano_marketing"`, `source_page: "incantare_preenchimento_labial"`, `cta_position: "agency_footer"` | Disparado **fora** de `trackEvent()`, sem os campos de campanha da Incantare. **Não usar este evento para otimizar/qualificar a campanha de preenchimento labial** — é tráfego institucional da agência, não lead da clínica. |
