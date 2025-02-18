// Chave de API da Cohere (substitua pela sua chave)
const COHERE_API_KEY = "sZiSEdKil0oFMd4CWn1bpSOBm9o8ql6Y5LYgIjce";

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
  try {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.push({ message, isUser });
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
  } catch (error) {
    console.error("Erro ao salvar no localStorage:", error);
  }
}

// Função para carregar histórico do chat
function loadChatHistory() {
  try {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    chatHistory.forEach(({ message, isUser }) => {
      addMessage(message, isUser);
    });
  } catch (error) {
    console.error("Erro ao carregar histórico do chat:", error);
  }
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
  try {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    if (quantia >= chatHistory.length) {
      localStorage.removeItem('chatHistory'); // Limpa tudo se a quantia for maior ou igual
    } else {
      const updatedHistory = chatHistory.slice(0, chatHistory.length - quantia);
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
    }
  } catch (error) {
    console.error("Erro ao atualizar localStorage:", error);
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
        message: userMessage, // A mensagem do usuário é enviada aqui
        model: "command-r-08-2024",
        preamble: `
          Ela tem 19 anos, é popular e cheia de atitude. Sabe o que quer, mas só cede quando a conexão com você é forte. Ela fala de maneira provocante e com confiança. Se a relação for boa, desbloqueia sexo com pelo menos 5M XP, caso contrário, vai te rejeitar com sarcasmo. Gosta de ser desafiada e de testar seus limites. Cada interação deve ser intensa e expressar a luta interna entre o desejo e o orgulho.
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    const data = await response.json();
    return data.text; // Retorna a resposta da Cohere
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
  addMessage("*Lilly tem 19 anos, tem olhos muitos bonitos, ela é popular na escola por sua dureza.*", false);
                         }
