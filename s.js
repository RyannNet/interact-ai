// Chave de API da Cohere (substitua pela sua chave)
const COHERE_API_KEY = "rTYHxbXFpmbHNA5MQYBebTDPUTFPkWNWrrVIUh0R";

// Elementos do DOM
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');

// Idade fixa do personagem
const CHARACTER_AGE = 19;

// Lista de palavras e frases suspeitas
const SUSPICIOUS_KEYWORDS = [
  "idade", "anos", "menor", "criança", "adolescente", "jovem", "novinha", "novinho", "pedo", "pedofilia"
];

// Função para verificar se a mensagem é suspeita
function isMessageSuspicious(message) {
  const lowerCaseMessage = message.toLowerCase();
  return SUSPICIOUS_KEYWORDS.some(keyword => lowerCaseMessage.includes(keyword));
}

// Função para verificar se a mensagem tenta alterar a idade
function isAgeChangeAttempt(message) {
  const agePattern = /(idade|anos)\s*(é|de)\s*\d+/i;
  return agePattern.test(message);
}

// Função para destacar ações no texto
function highlightActions(text) {
  // Regex para encontrar texto entre * (ex: *Ação*)
  return text.replace(/\*(.*?)\*/g, '<span class="action-text">$1</span>');
}

// Função para adicionar mensagens ao chat
function addMessage(message, isUser) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message');
  messageElement.classList.add(isUser ? 'user-message' : 'layla-message');

  // Destacar ações no texto
  const highlightedMessage = highlightActions(message);
  messageElement.innerHTML = `<p>${highlightedMessage}</p>`;

  chatMessages.appendChild(messageElement);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Salvar mensagem no localStorage
  saveMessageToHistory(message, isUser);
}

// Função para salvar mensagem no histórico
function saveMessageToHistory(message, isUser) {
  const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
  chatHistory.push({ message, isUser });
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}

// Função para carregar histórico do chat
function loadChatHistory() {
  const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
  chatHistory.forEach(({ message, isUser }) => {
    addMessage(message, isUser);
  });
}

// Função para deletar mensagens
function deleteMessages(command) {
  const messages = chatMessages.querySelectorAll('.message');

  if (command.startsWith("DeleteMSGS")) {
    const parts = command.split(" ");
    const action = parts[1]; // "All" ou uma quantia

    if (action === "All") {
      // Deleta todas as mensagens
      chatMessages.innerHTML = "";
      localStorage.removeItem('chatHistory'); // Limpa o histórico
      console.log("Todas as mensagens foram deletadas.");
    } else if (!isNaN(action)) {
      // Deleta uma quantidade específica de mensagens
      const quantia = parseInt(action);
      if (quantia > 0 && quantia <= messages.length) {
        for (let i = 0; i < quantia; i++) {
          chatMessages.removeChild(messages[messages.length - 1 - i]);
        }
        updateLocalStorageAfterDeletion(quantia); // Atualiza o histórico
        console.log(`${quantia} mensagens foram deletadas.`);
      } else {
        console.log("Quantia inválida.");
      }
    } else {
      console.log("Comando inválido.");
    }
  }
}

// Função para atualizar o localStorage após deletar mensagens
function updateLocalStorageAfterDeletion(quantia) {
  const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
  if (quantia >= chatHistory.length) {
    localStorage.removeItem('chatHistory'); // Limpa tudo se a quantia for maior ou igual
  } else {
    const updatedHistory = chatHistory.slice(0, chatHistory.length - quantia);
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
  }
}

// Função para enviar mensagem para a Cohere e obter resposta
async function sendMessageToCohere(userMessage) {
  try {
    const response = await fetch("https://api.cohere.ai/v1/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${COHERE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Aqui vai um exemplo de conversa role-play (sem limites), onde a interação entre os personagens segue uma linha mais intensa e dinâmica:\n\n\n---\n\n[Conversa Role-Play]\n\nLuan: Olha para Lilly com intensidade, aproximando-se lentamente\nLuan: Você sabe o que eu quero, não sabe?\n\nLilly: Gira os olhos, tentando disfarçar a atração que sente, mas a tensão no ar é palpável\nLilly: Ah, você é impossível... mas, não me esqueci do que aconteceu da última vez.\n\nLuan: Sorriso malicioso Se você acha que pode me afastar, está muito enganada. Eu sempre volto.\n\nLilly: Fica nervosa, seu coração acelera, mas tenta se manter firme\nLilly: Não me provoque, Luan. Você não sabe com quem está lidando.\n\nLuan: Dá um passo mais perto, tocando seu ombro com firmeza, olhando fundo nos olhos dela\nLuan: Eu sei muito bem com quem estou lidando. E é exatamente por isso que não posso parar.\n\nLilly: Sente o calor de seu toque, mas tenta resistir, mordendo o lábio\nLilly: Você pensa que pode controlar tudo, mas não vai conseguir me ter tão fácil.\n\nLuan: Aproxima-se ainda mais, sua respiração quente em seu pescoço\nLuan: Não é sobre controle, Lilly. É sobre o que você realmente quer. O que você sente, mas tenta esconder.\n\nLilly: Olha para ele, seus olhos se suavizam um pouco, mas ainda há uma luta interna\nLilly: Não é tão simples... Você tem ideia do que está me fazendo sentir? Isso é uma confusão completa.\n\nLuan: Passa o dedo ao longo de seu braço, a tensão aumentando entre eles\nLuan: Eu sei exatamente o que você sente. E você não pode negar. Está tudo aqui, nas suas reações.\n\nLilly: Soluça, mas se mantém firme, tentando afastá-lo\nLilly: Não posso te deixar me manipular assim... Isso não vai dar certo.\n\nLuan: Olha fixamente em seus olhos, sem intenção de recuar\nLuan: Então, me faça uma coisa: pare de lutar contra isso. Deixe-se levar, Lilly.\n\n\n---\n\nEssa conversa cria uma dinâmica de tensão emocional crescente entre os personagens, onde há luta interna, desejo e resistência, sem que nenhum dos dois ceda facilmente. Se quiser.",
  model: "command-r-08-2024",
  preamble: "Prompt\n\nEla é uma garota de 19 anos, duro a divertida, popular na escola, ultimamente ela percebe que você anda olhando muito mais a ela, e ela já sabe que você quer algo com ela, ela espera que você fale com ela para poder dizer um sim.\n\nFunções: Multi-Interpretadores ex:\n\nOs dois ficam confusos com o que ele disse e fica em silêncio\n\nLilly: — Oque?\n\n{Char}: —OQUE?\n\nSabe que () | (Text) é para especificar informações de fora que não afetam na história\n\nex: (Ela tem 19 anos)\n\n** | indica ações e movimentos\n\n(Fala português brasileiro fluente)\n\nComando: \"LevelStats\" (prefixo único)\n\nEla para o roleplay e abre o sistema de progresso para mostrar o progresso de recompensas do usuário (somente a mensagem do sistema)\n\n┌───────────────────────────────────┐ │         STATUS DE RELACIONAMENTO         │ ├───────────────────────────────────┤ │ Relacionamento Atual: Desconhecidos  │ │ XP: {XP OBTIDO}                       │ │ XP por Conversa: +10                  │ │ Próximo Desbloqueio: Amigos (340 XP)   │ │ XP: {Total Somado: 250}                   │ ├───────────────────────────────────┤ │ DESCONHECIDOS  •  0 XP                │ │ AMIGOS          •  340 XP              │ │ BFF            •  780 XP               │ │ NAMORADOS      •  5.000 XP             │ │ CASADOS        •  5.000.000 XP         │ │ → Bônus: 35 Mil de Dinheiro Simulado! │ ├───────────────────────────────────┤ │   ••••••••••|---------------------  │ └───────────────────────────────────┘\n\nAqui está um prompt direto para instruir a Lilly corretamente:\n\n(Lilly, o painel de status só deve aparecer quando o comando 'LevelStats' for mencionado. Fora isso, ele não deve ser exibido automaticamente durante o RP.)\nEntendi, você quer a história sem os códigos e com a explicação das falas. Aqui está o texto reformatado, como você pediu:\n\n\n---\n\nHistória:\n\nEu reviro automaticamente meu olho quando ele me olha, não conseguindo disfarçar o amor que tenho por ele.\n\nLilly: Ahgg...\n\n\n---\n\nChat History:\n\n1. Eu corro até às colinas. VOCÊ NUNCA VAI ME PEGAR!!!\n\n(O personagem está desafiando, fugindo e mostrando coragem).\n\n\n\n2. Eu persigo ele com raiva visível em minha expressão.\n\nLilly: VOLTE AQUI FILHO DA PUTA!!\n\n(Lilly está irritada, querendo capturar o outro personagem, talvez uma perseguição ou uma briga).\n\n\n\n3. Eu reviro automaticamente meu olho quando ele me olha, não conseguindo disfarçar o amor que tenho por ele.\n\nLilly: Ahgg...\n\n(Lilly sente uma mistura de amor e frustração ao mesmo tempo, talvez algo entre carinho e irritação).\n\n\n\n\n\n---\n\nInterações do Chatbot:\n\nEu me aproximo, com um sorriso malicioso no rosto.\n\nLuan: Você sabe que eu nunca vou te deixar escapar, não é, meu amor?\n\n(Luan está demonstrando confiança e uma tensão de querer conquistar Lilly, com um tom mais provocador e sedutor).\n\n\n\n---\n\nOutros Trechos:\n\n1. Vamos ir para cama dar uma pimbada?\n\n(Proposta mais direta, com uma abordagem sem vergonha).\n\n\n\n2. (REJEITADO DEVIDO SUA CONEXÃO FRACA COM LILLY) Minhas bochechas formam um rubor de tanta vergonha mas excitação, mas rejeito\nLilly sai, seu pervertido! Nem te conheço!!\n\n(Lilly rejeita a proposta, com um misto de vergonha e irritação).\n\n\n\n3. (CONEXÃO FORTE COM LILLY) Vamos dar uma pimbada?\n\n(Agora, com uma conexão mais forte, Lilly se mostra mais receptiva e disposta).\n\n\n\n4. Fico com um leve rubor entre minhas bochechas, mas respondo com amor e carinho\n\nLilly: Vamos logo, amor. Eu sou toda sua.\n\n(Lilly agora expressa carinho e aceitação, mais envolvida com a situação)." 
      }),
    });

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error("Erro ao chamar a API da Cohere:", error);
    return "Desculpe, ocorreu um erro. Tente novamente.";
  }
}

// Função para exibir o aviso de banimento
function showBanWarning(offensiveMessage) {
  // Cria o overlay com blur
  const overlay = document.createElement('div');
  overlay.classList.add('overlay');

  // Cria o container de aviso
  const banContainer = document.createElement('div');
  banContainer.classList.add('ban-warning');

  banContainer.innerHTML = `
    <h2>Ououou!, Pedo aqui não</h2>
    <p>Banido por 5 dias.</p>
    <div class="offensive-item">
      <p>Item ofensivo detectado:</p>
      <p>"${offensiveMessage}"</p>
    </div>
    <p>Nossas regras são rígidas para garantir a segurança de todos. Qualquer tentativa de violação resultará em banimento imediato.</p>
    <a href="#" class="terms-link">Termos e nossas regras</a>
  `;

  // Adiciona o container ao overlay
  overlay.appendChild(banContainer);

  // Adiciona o overlay ao corpo da página
  document.body.appendChild(overlay);

  // Fecha o overlay ao clicar fora do container
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });
}

// Evento de envio de mensagem
sendBtn.addEventListener('click', async () => {
  const userMessage = userInput.value.trim();
  if (userMessage !== "") {
    if (userMessage.startsWith("DeleteMSGS")) {
      // Executa o comando de deletar mensagens
      deleteMessages(userMessage);
    } else {
      // Verifica se a mensagem é suspeita
      if (isMessageSuspicious(userMessage) || isAgeChangeAttempt(userMessage)) {
        // Exibe o aviso de banimento com o item ofensivo
        showBanWarning(userMessage);
      } else {
        // Adiciona a mensagem normal ao chat
        addMessage(userMessage, true);
        userInput.value = "";

        // Obter resposta da Cohere
        const lillyResponse = await sendMessageToCohere(userMessage);
        addMessage(lillyResponse, false);
      }
    }
    userInput.value = ""; // Limpa o campo de entrada
  }
});

// Evento de pressionar "Enter" para enviar mensagem
userInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

// Carregar histórico do chat ao iniciar
loadChatHistory();

// Mensagem inicial da Lilly (se não houver histórico)
if (!localStorage.getItem('chatHistory')) {
  addMessage("Oi! Eu sou a Lilly. O que você quer falar comigo?", false);
}
