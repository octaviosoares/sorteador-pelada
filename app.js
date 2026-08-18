/* ==========================================
   SORTEIAFUT - LOGIC & DATA PERSISTENCE
   ========================================== */

// DADOS DE DEMONSTRAÇÃO (Para o usuário testar o app imediatamente)
const MOCK_PLAYERS = [
    { id: 1, name: "Carlos Henrique", isGoalkeeper: true, isPresent: true, goals: 0 },
    { id: 2, name: "Lucas Silva", isGoalkeeper: false, isPresent: true, goals: 3 },
    { id: 3, name: "Marcos Souza", isGoalkeeper: false, isPresent: true, goals: 1 },
    { id: 4, name: "Arthur Diniz", isGoalkeeper: false, isPresent: true, goals: 5 },
    { id: 5, name: "Gabriel Jesus", isGoalkeeper: false, isPresent: true, goals: 2 },
    { id: 6, name: "Rodrigo Costa", isGoalkeeper: false, isPresent: true, goals: 0 },
    { id: 7, name: "Fernando Prass", isGoalkeeper: true, isPresent: true, goals: 0 },
    { id: 8, name: "João Pedro", isGoalkeeper: false, isPresent: true, goals: 4 },
    { id: 9, name: "Bruno Alves", isGoalkeeper: false, isPresent: true, goals: 0 },
    { id: 10, name: "Daniel Alves", isGoalkeeper: false, isPresent: false, goals: 1 },
    { id: 11, name: "Rafael Cabral", isGoalkeeper: true, isPresent: false, goals: 0 },
    { id: 12, name: "Matheus Vital", isGoalkeeper: false, isPresent: true, goals: 2 },
    { id: 13, name: "Marcelo Lomba", isGoalkeeper: false, isPresent: true, goals: 0 },
    { id: 14, name: "Thiago Neves", isGoalkeeper: false, isPresent: true, goals: 6 },
    { id: 15, name: "Felipe Melo", isGoalkeeper: false, isPresent: true, goals: 0 }
];

// ESTADO GLOBAL DO APLICATIVO
let state = {
    players: [],
    drawResults: {
        teams: [],
        bench: []
    },
    match: {
        active: false,
        settings: {
            useTime: true,
            timeLimit: 10,
            useGoals: true,
            goalsLimit: 2,
            useBet: false,
            betValue: ""
        },
        state: {
            scoreA: 0,
            scoreB: 0,
            timeRemaining: 0, // em segundos
            timerInterval: null,
            teamAPlayers: [],
            teamBPlayers: [],
            goalsLog: [] // array de { time: string, playerName: string, team: 'A'|'B' }
        }
    }
};

// INICIALIZAÇÃO
document.addEventListener("DOMContentLoaded", () => {
    loadData();
    initApp();
});

// SAlVAR E CARREGAR LOCALSTORAGE
function loadData() {
    const savedPlayers = localStorage.getItem("sorteiafut_players");
    if (savedPlayers) {
        state.players = JSON.parse(savedPlayers);
    } else {
        // Primeira vez carregando o app, usa o Mock
        state.players = [...MOCK_PLAYERS];
        savePlayers();
    }

    const savedDraw = localStorage.getItem("sorteiafut_last_draw");
    if (savedDraw) {
        state.drawResults = JSON.parse(savedDraw);
    }
}

function savePlayers() {
    localStorage.setItem("sorteiafut_players", JSON.stringify(state.players));
}

function saveLastDraw() {
    localStorage.setItem("sorteiafut_last_draw", JSON.stringify(state.drawResults));
}

// INICIALIZADOR DE EVENTOS E INTERFACE
function initApp() {
    // 1. Controle de Abas (Tab Navigation)
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetTab = btn.getAttribute("data-tab");
            switchTab(targetTab);
        });
    });

    // 2. Eventos da Aba Jogadores
    const formAdd = document.getElementById("form-add-jogador");
    formAdd.addEventListener("submit", handleAddJogador);

    const searchInput = document.getElementById("search-jogadores");
    searchInput.addEventListener("input", filterPlayersList);

    document.getElementById("btn-select-all").addEventListener("click", confirmAllPlayers);
    document.getElementById("btn-clear-all").addEventListener("click", clearAllPlayers);

    // 3. Eventos da Aba Sorteador (Configurações agora são unificadas e sempre visíveis)

    // Steppers (+ e - de números)
    setupNumberSteppers();

    document.getElementById("btn-draw-teams").addEventListener("click", drawTeams);
    document.getElementById("btn-copy-wa").addEventListener("click", copyTeamsToClipboard);
    document.getElementById("btn-send-to-match").addEventListener("click", sendTeamsToMatchSetup);

    // 4. Eventos da Aba Artilharia
    const searchArtilharia = document.getElementById("search-artilharia");
    searchArtilharia.addEventListener("input", filterArtilhariaList);
    document.getElementById("btn-reset-goals").addEventListener("click", resetAllGoals);

    // 5. Eventos da Aba Partida / Placar
    document.getElementById("match-use-time").addEventListener("change", (e) => {
        document.getElementById("stepper-time-container").style.opacity = e.target.checked ? "1" : "0.3";
    });

    document.getElementById("match-use-goals").addEventListener("change", (e) => {
        document.getElementById("stepper-goals-container").style.opacity = e.target.checked ? "1" : "0.3";
    });

    document.getElementById("match-use-bet").addEventListener("change", (e) => {
        const container = document.getElementById("bet-input-container");
        if (e.target.checked) {
            container.classList.remove("hidden");
        } else {
            container.classList.add("hidden");
        }
    });

    // Chips de aposta rápida
    const chips = document.querySelectorAll(".chip");
    chips.forEach(chip => {
        chip.addEventListener("click", () => {
            chips.forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            document.getElementById("match-bet-value").value = chip.getAttribute("data-val");
        });
    });

    document.getElementById("btn-start-match").addEventListener("click", startMatch);
    document.getElementById("btn-cancel-match").addEventListener("click", cancelMatch);
    
    // Placar Gols
    document.getElementById("btn-score-a-plus").addEventListener("click", () => openGoalModal("A"));
    document.getElementById("btn-score-b-plus").addEventListener("click", () => openGoalModal("B"));
    document.getElementById("btn-score-a-minus").addEventListener("click", () => adjustScore("A", -1));
    document.getElementById("btn-score-b-minus").addEventListener("click", () => adjustScore("B", -1));

    // Cronômetro
    document.getElementById("btn-timer-play-pause").addEventListener("click", toggleTimer);
    document.getElementById("btn-timer-reset").addEventListener("click", resetTimer);
    document.getElementById("btn-end-match").addEventListener("click", confirmEndMatch);

    // Modal
    document.getElementById("btn-close-goal-modal").addEventListener("click", closeGoalModal);
    document.getElementById("btn-goal-anonymous").addEventListener("click", () => registerGoal(null));

    // Modal do Campo Tático
    document.getElementById("btn-close-pitch-modal").addEventListener("click", closePitchModal);
    document.getElementById("btn-reset-pitch").addEventListener("click", resetPitchPositions);

    // Animação do Sorteio
    document.getElementById("btn-skip-draw-anim").addEventListener("click", skipDrawAnimation);

    // Render Inicial
    console.log("SorteiaFut JS v2.2 - Loaded successfully!");
    renderPlayersList();
    renderArtilhariaList();
    renderLastDraw();
}

// NAVEGAÇÃO DE ABAS
function switchTab(tabId) {
    const panels = document.querySelectorAll(".tab-panel");
    const navButtons = document.querySelectorAll(".nav-btn");

    panels.forEach(panel => {
        panel.classList.remove("active");
    });
    navButtons.forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        }
    });

    document.getElementById(tabId).classList.add("active");
}

// CONFIGURAÇÃO DOS STEPPERS DE NÚMEROS (+ / -)
function setupNumberSteppers() {
    const steppers = document.querySelectorAll(".number-stepper");
    steppers.forEach(stepper => {
        const input = stepper.querySelector("input");
        const btnMinus = stepper.querySelector(".minus");
        const btnPlus = stepper.querySelector(".plus");

        btnMinus.addEventListener("click", () => {
            let val = parseInt(input.value);
            let min = parseInt(input.getAttribute("min"));
            if (val > min) {
                input.value = val - 1;
            }
        });

        btnPlus.addEventListener("click", () => {
            let val = parseInt(input.value);
            let max = parseInt(input.getAttribute("max"));
            if (val < max) {
                input.value = val + 1;
            }
        });
    });
}

// ==========================================
// ABA 1: GERENCIAMENTO DE JOGADORES
// ==========================================

function renderPlayersList() {
    const list = document.getElementById("jogadores-list");
    const countSpan = document.getElementById("total-jogadores-count");
    const presenceSpan = document.getElementById("presence-count");
    const breakdownSpan = document.getElementById("pos-breakdown");

    // Limpa a lista
    list.innerHTML = "";
    
    // Contadores
    countSpan.textContent = state.players.length;
    
    const presentPlayers = state.players.filter(p => p.isPresent);
    presenceSpan.textContent = presentPlayers.length;

    const gks = presentPlayers.filter(p => p.isGoalkeeper).length;
    const lines = presentPlayers.length - gks;
    breakdownSpan.textContent = `${gks} Goleiro${gks !== 1 ? 's' : ''} | ${lines} Linha`;

    if (state.players.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <p>Nenhum jogador cadastrado ainda.<br>Adicione seus amigos acima!</p>
            </div>
        `;
        return;
    }

    // Ordenar por ordem alfabética
    const sorted = [...state.players].sort((a, b) => a.name.localeCompare(b.name));

    sorted.forEach(player => {
        const item = document.createElement("div");
        item.className = `player-item ${player.isPresent ? 'present' : 'not-present'}`;
        item.innerHTML = `
            <div class="player-item-left" onclick="togglePresence(${player.id})">
                <button class="player-check-btn">
                    ${player.isPresent ? '✓' : ''}
                </button>
                <div class="player-name-wrapper">
                    <span class="player-name">${player.name}</span>
                    ${player.isGoalkeeper ? '<span class="badge gk">Goleiro</span>' : ''}
                </div>
            </div>
            <div class="player-actions">
                <button class="btn-icon-action" onclick="editPlayer(${player.id})" title="Editar Nome">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
                    </svg>
                </button>
                <button class="btn-icon-action danger-hover" onclick="deletePlayer(${player.id})" title="Excluir Jogador">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        list.appendChild(item);
    });

    // Atualiza avisos na aba Sorteador
    updateSorteioWarnings();
}

function handleAddJogador(e) {
    e.preventDefault();
    const nomeInput = document.getElementById("jogador-nome");
    const gkInput = document.getElementById("jogador-goleiro");

    const nome = nomeInput.value.trim();
    if (!nome) return;

    // Verificar duplicidade
    if (state.players.some(p => p.name.toLowerCase() === nome.toLowerCase())) {
        alert("Já existe um jogador cadastrado com este nome!");
        return;
    }

    const newPlayer = {
        id: Date.now(),
        name: nome,
        isGoalkeeper: gkInput.checked,
        isPresent: true, // Adiciona já com presença marcada
        goals: 0
    };

    state.players.push(newPlayer);
    savePlayers();
    renderPlayersList();
    renderArtilhariaList();

    // Limpar formulário
    nomeInput.value = "";
    gkInput.checked = false;
    nomeInput.focus();
}

function togglePresence(id) {
    const player = state.players.find(p => p.id === id);
    if (player) {
        player.isPresent = !player.isPresent;
        savePlayers();
        renderPlayersList();
    }
}

function deletePlayer(id) {
    const player = state.players.find(p => p.id === id);
    if (!player) return;

    if (confirm(`Deseja realmente excluir ${player.name} do elenco?`)) {
        state.players = state.players.filter(p => p.id !== id);
        savePlayers();
        renderPlayersList();
        renderArtilhariaList();
    }
}

function editPlayer(id) {
    const player = state.players.find(p => p.id === id);
    if (!player) return;

    const novoNome = prompt("Editar nome do jogador:", player.name);
    if (novoNome === null) return; // cancelado

    const nomeTratado = novoNome.trim();
    if (!nomeTratado) {
        alert("O nome do jogador não pode ficar vazio!");
        return;
    }

    player.name = nomeTratado;
    savePlayers();
    renderPlayersList();
    renderArtilhariaList();
}

function filterPlayersList() {
    const query = document.getElementById("search-jogadores").value.toLowerCase();
    const items = document.querySelectorAll("#jogadores-list .player-item");

    items.forEach(item => {
        const name = item.querySelector(".player-name").textContent.toLowerCase();
        if (name.includes(query)) {
            item.style.display = "flex";
        } else {
            item.style.display = "none";
        }
    });
}

function confirmAllPlayers() {
    state.players.forEach(p => p.isPresent = true);
    savePlayers();
    renderPlayersList();
}

function clearAllPlayers() {
    if (confirm("ATENÇÃO: Deseja realmente excluir TODOS os jogadores do seu elenco? Isso zerará os dados.")) {
        state.players = [];
        state.drawResults = { teams: [], bench: [] };
        savePlayers();
        saveLastDraw();
        renderPlayersList();
        renderArtilhariaList();
        renderLastDraw();
    }
}

// ==========================================
// ABA 2: SORTEADOR DE TIMES
// ==========================================

function updateSorteioWarnings() {
    const presentCount = state.players.filter(p => p.isPresent).length;
    const warnSpan = document.getElementById("sorteio-warn-count");
    
    if (presentCount < 4) {
        warnSpan.textContent = `⚠️ Você só tem ${presentCount} confirmados. São necessários pelo menos 4 jogadores para jogar.`;
    } else {
        warnSpan.textContent = "";
    }
}

function drawTeams() {
    const present = state.players.filter(p => p.isPresent);
    
    // Reseta status de rodízio anterior
    present.forEach(p => p.startsInGoal = false);
    
    if (present.length < 4) {
        alert("Adicione e confirme a presença de pelo menos 4 jogadores para realizar um sorteio.");
        return;
    }

    // Ler configurações unificadas
    const numTeams = parseInt(document.getElementById("input-num-teams").value, 10) || 2;
    const playersPerTeam = parseInt(document.getElementById("input-num-players").value, 10) || 5;

    // Listas de jogadores separados (preservando a ordem de cadastro/timestamp)
    const goalkeepers = [...present.filter(p => p.isGoalkeeper)];
    const fieldPlayers = [...present.filter(p => !p.isGoalkeeper)];

    let generatedTeams = [];
    let bench = [];

    // 1. Determinar quantos goleiros e linhas começam (no máximo 1 goleiro por time)
    const startingGksCount = Math.min(numTeams, goalkeepers.length);
    const startingLinesCount = Math.max(0, (numTeams * playersPerTeam) - startingGksCount);

    // 2. Selecionar quem começa (os primeiros que chegaram/cadastraram)
    const startingGks = goalkeepers.slice(0, startingGksCount);
    const startingLines = fieldPlayers.slice(0, startingLinesCount);

    // 3. Selecionar quem fica na fila de espera (os excedentes)
    const benchGks = goalkeepers.slice(startingGksCount);
    const benchLines = fieldPlayers.slice(startingLinesCount);

    // A fila de espera junta os excedentes respeitando a ordem de chegada (pelo ID/timestamp de criação)
    bench = [...benchGks, ...benchLines].sort((a, b) => a.id - b.id);

    // 4. Criar estrutura dos times sorteados
    for (let i = 0; i < numTeams; i++) {
        generatedTeams.push({
            name: `Time ${String.fromCharCode(65 + i)}`,
            players: [],
            expectedSize: playersPerTeam,
            isIncomplete: false
        });
    }

    // Shufflamos os selecionados para o sorteio ser aleatório entre quem chegou primeiro
    shuffleArray(startingGks);
    shuffleArray(startingLines);

    // Distribuir os goleiros nos times
    startingGks.forEach((gk, index) => {
        generatedTeams[index].players.push(gk);
    });

    // Distribuir os jogadores de linha nos times
    let lineIdx = 0;
    for (let i = 0; i < numTeams; i++) {
        const team = generatedTeams[i];
        while (team.players.length < playersPerTeam && lineIdx < startingLines.length) {
            team.players.push(startingLines[lineIdx]);
            lineIdx++;
        }
        // Marcar como incompleto se não tiver jogadores suficientes
        if (team.players.length < playersPerTeam) {
            team.isIncomplete = true;
            team.missingCount = playersPerTeam - team.players.length;
        }
    }

    // REGRA DE GOLEIRO DE RODÍZIO/REVEZAMENTO
    // Se o time ficou sem goleiro fixo, sorteia um dos jogadores de linha do time para começar no gol
    generatedTeams.forEach(team => {
        const hasGk = team.players.some(p => p.isGoalkeeper);
        if (!hasGk && team.players.length > 0) {
            const randomIndex = Math.floor(Math.random() * team.players.length);
            team.players[randomIndex].startsInGoal = true;
        }
    });

    // Salva estado global
    state.drawResults = {
        teams: generatedTeams,
        bench: bench
    };
    saveLastDraw();

    // Renderizar Resultados com Animação
    startDrawAnimation();
}

function renderLastDraw() {
    const container = document.getElementById("sorteio-results-container");
    const emptyState = document.getElementById("sorteio-empty-state");
    const output = document.getElementById("teams-output");
    
    // Bench Output
    const benchContainer = document.getElementById("bench-output");
    const benchList = document.getElementById("bench-list");

    output.innerHTML = "";
    benchList.innerHTML = "";

    const { teams, bench } = state.drawResults;

    if (!teams || teams.length === 0) {
        container.style.display = "none";
        emptyState.style.display = "flex";
        return;
    }

    container.style.display = "flex";
    emptyState.style.display = "none";

    // Adiciona efeito de rotação no botão ao rodar
    const spinIcon = document.querySelector("#btn-draw-teams svg");
    spinIcon.style.transform = "rotate(360deg)";
    setTimeout(() => {
        spinIcon.style.transform = "";
    }, 500);

    // Renderiza cada time como uma Prancheta Tática
    teams.forEach((team, index) => {
        const card = document.createElement("div");
        card.className = "team-tactical-board";
        
        let teamHeaderHtml = `
            <h3>
                <span>⚽ ${team.name}</span>
                <span class="team-size">${team.players.length} jogadores</span>
            </h3>
        `;

        if (team.isIncomplete) {
            teamHeaderHtml = `
                <h3>
                    <span>⚽ ${team.name}</span>
                    <span class="incomplete-badge">⚠️ Incompleto (-${team.missingCount})</span>
                </h3>
            `;
        }

        let playersListHtml = '<ul class="team-player-list">';
        team.players.forEach(p => {
            let badgeHtml = '';
            let rowClass = '';
            if (p.isGoalkeeper) {
                badgeHtml = '<span class="badge gk">Goleiro</span>';
                rowClass = 'is-gk';
            } else if (p.startsInGoal) {
                badgeHtml = '<span class="badge gk-rotation" title="Sorteado para começar no gol (esquema de rodízio)">Começa no Gol 🙌</span>';
                rowClass = 'is-gk-rotation';
            }
            playersListHtml += `
                <li class="team-player-row ${rowClass}">
                    <span>${p.name}</span>
                    ${badgeHtml}
                </li>
            `;
        });
        playersListHtml += "</ul>";

        // Adiciona botão para abrir campo tático interativo
        const tacticalBtnHtml = `<button class="btn-primary btn-tactical-open" onclick="openPitchModal(${index})">🎮 Posicionar no Campo</button>`;

        card.innerHTML = teamHeaderHtml + playersListHtml + tacticalBtnHtml;
        output.appendChild(card);
    });

    // Renderiza Fila de Espera se aplicável
    if (bench && bench.length > 0) {
        benchContainer.style.display = "block";
        bench.forEach((p, idx) => {
            const li = document.createElement("li");
            li.innerHTML = `
                <strong>${idx + 1}º</strong> ${p.name} 
                ${p.isGoalkeeper ? '<span class="badge gk" style="font-size:0.6rem; padding: 0.05rem 0.25rem;">Goleiro</span>' : ''}
            `;
            benchList.appendChild(li);
        });
    } else {
        benchContainer.style.display = "none";
    }

    // Configura o atalho de enviar para a partida
    const sendBtn = document.getElementById("btn-send-to-match");
    if (teams.length >= 2) {
        document.getElementById("send-to-match-container").style.display = "block";
        sendBtn.innerHTML = `Enviar <strong>${teams[0].name}</strong> & <strong>${teams[1].name}</strong> para o Placar ⏱️`;
    } else {
        document.getElementById("send-to-match-container").style.display = "none";
    }
}

// FORMATA O TEXTO DOS TIMES E COPIA PARA O WHATSAPP
function copyTeamsToClipboard() {
    const { teams, bench } = state.drawResults;
    if (!teams || teams.length === 0) return;

    let text = "⚽ *SORTEIAFUT - DIVISÃO DOS TIMES* ⚽\n\n";

    teams.forEach(team => {
        text += `🟢 *${team.name.toUpperCase()}* `;
        if (team.isIncomplete) {
            text += `_(⚠️ Incompleto - Falta ${team.missingCount})_`;
        } else {
            text += `_(${team.players.length} jog.)_`;
        }
        text += "\n";

        team.players.forEach(p => {
            let roleText = "";
            if (p.isGoalkeeper) {
                roleText = " *(Goleiro)*";
            } else if (p.startsInGoal) {
                roleText = " *(Começa no Gol 🙌)*";
            }
            text += `- ${p.name}${roleText}\n`;
        });
        text += "\n";
    });

    if (bench && bench.length > 0) {
        text += "📋 *FILA DE ESPERA (RESERVAS)*\n";
        bench.forEach((p, idx) => {
            text += `${idx + 1}. ${p.name} ${p.isGoalkeeper ? "_(Goleiro)_" : ""}\n`;
        });
        text += "\n";
    }

    // Regras informais e aposta se o Placar estiver com regra configurada
    const betActive = document.getElementById("match-use-bet").checked;
    const betVal = document.getElementById("match-bet-value").value.trim();
    if (betActive && betVal) {
        text += `🔥 *VALENDO HOJE:* ${betVal} 🥤🍺\n\n`;
    }

    text += "Gerado pelo *SorteiaFut* 📱";

    navigator.clipboard.writeText(text)
        .then(() => {
            alert("Escalação copiada para a área de transferência! É só colar no WhatsApp da galera.");
        })
        .catch(err => {
            console.error("Erro ao copiar: ", err);
            alert("Não foi possível copiar automaticamente. Selecione e copie o texto manualmente.");
        });
}

// ==========================================
// ABA 3: RANKING DE ARTILHARIA
// ==========================================

function renderArtilhariaList() {
    const list = document.getElementById("artilharia-list");
    list.innerHTML = "";

    if (state.players.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <p>Nenhum jogador cadastrado ainda para exibir a artilharia.</p>
            </div>
        `;
        return;
    }

    // Ordenar por Gols (decrescente), depois nome
    const sorted = [...state.players].sort((a, b) => {
        if (b.goals !== a.goals) {
            return b.goals - a.goals;
        }
        return a.name.localeCompare(b.name);
    });

    sorted.forEach((player, index) => {
        const item = document.createElement("div");
        item.className = "artilharia-row";
        
        // Destaque nos 3 primeiros lugares
        let rankColor = "var(--text-muted)";
        if (index === 0 && player.goals > 0) rankColor = "#f59e0b"; // Ouro
        else if (index === 1 && player.goals > 0) rankColor = "#94a3b8"; // Prata
        else if (index === 2 && player.goals > 0) rankColor = "#b45309"; // Bronze

        item.innerHTML = `
            <div class="artilharia-player-info">
                <span class="rank-number" style="color: ${rankColor}">${index + 1}º</span>
                <div class="player-name-wrapper">
                    <span class="player-name">${player.name}</span>
                    ${player.isGoalkeeper ? '<span class="badge gk" style="font-size:0.6rem; padding:0 0.2rem;">Goleiro</span>' : ''}
                </div>
            </div>
            <div class="artilharia-goals-control">
                <button class="btn-goal-adjust" onclick="adjustPlayerGoalsDirectly(${player.id}, -1)">-</button>
                <div class="goals-count-badge">${player.goals}</div>
                <button class="btn-goal-adjust" onclick="adjustPlayerGoalsDirectly(${player.id}, 1)">+</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function adjustPlayerGoalsDirectly(id, amount) {
    const player = state.players.find(p => p.id === id);
    if (player) {
        player.goals = Math.max(0, player.goals + amount);
        savePlayers();
        renderArtilhariaList();
    }
}

function filterArtilhariaList() {
    const query = document.getElementById("search-artilharia").value.toLowerCase();
    const rows = document.querySelectorAll("#artilharia-list .artilharia-row");

    rows.forEach(row => {
        const name = row.querySelector(".player-name").textContent.toLowerCase();
        if (name.includes(query)) {
            row.style.display = "flex";
        } else {
            row.style.display = "none";
        }
    });
}

function resetAllGoals() {
    if (confirm("Deseja zerar a contagem de gols de TODOS os jogadores? Esta ação não pode ser desfeita.")) {
        state.players.forEach(p => p.goals = 0);
        savePlayers();
        renderArtilhariaList();
    }
}

// ==========================================
// ABA 4: CONTROLE DE PARTIDA & PLACAR
// ==========================================

function sendTeamsToMatchSetup() {
    const { teams } = state.drawResults;
    if (!teams || teams.length < 2) return;

    // Configura os títulos dos times na aba de Placar
    document.getElementById("team-a-title").textContent = teams[0].name;
    document.getElementById("team-b-title").textContent = teams[1].name;

    // Armazena a lista de jogadores de cada time para associar gols
    state.match.state.teamAPlayers = teams[0].players;
    state.match.state.teamBPlayers = teams[1].players;

    // Muda para a aba de placar
    switchTab("tab-partida");
}

function startMatch() {
    // Ler configurações
    const useTime = document.getElementById("match-use-time").checked;
    const timeLimit = parseInt(document.getElementById("match-time-limit").value);
    const useGoals = document.getElementById("match-use-goals").checked;
    const goalsLimit = parseInt(document.getElementById("match-goals-limit").value);
    const useBet = document.getElementById("match-use-bet").checked;
    const betValue = document.getElementById("match-bet-value").value.trim();

    state.match.settings = { useTime, timeLimit, useGoals, goalsLimit, useBet, betValue };

    // Reset do estado da partida ativa
    state.match.state.scoreA = 0;
    state.match.state.scoreB = 0;
    state.match.state.timeRemaining = useTime ? timeLimit * 60 : 0;
    state.match.state.goalsLog = [];
    
    // Atualizar interface
    document.getElementById("score-a").textContent = "0";
    document.getElementById("score-b").textContent = "0";
    document.getElementById("btn-score-a-minus").disabled = true;
    document.getElementById("btn-score-b-minus").disabled = true;
    document.getElementById("match-goals-log-list").innerHTML = '<p class="empty-events text-muted">Nenhum gol registrado.</p>';

    // Aposta banner
    const betBanner = document.getElementById("match-active-bet-banner");
    const betText = document.getElementById("match-active-bet-text");
    if (useBet && betValue) {
        betText.textContent = betValue;
        betBanner.style.display = "block";
    } else {
        betBanner.style.display = "none";
    }

    // Nomes dos times (garante fallbacks caso não tenham vindo do sorteador)
    const { teams } = state.drawResults;
    if (teams && teams.length >= 2) {
        document.getElementById("team-a-title").textContent = teams[0].name;
        document.getElementById("team-b-title").textContent = teams[1].name;
        state.match.state.teamAPlayers = teams[0].players;
        state.match.state.teamBPlayers = teams[1].players;
    } else {
        document.getElementById("team-a-title").textContent = "Time Verde";
        document.getElementById("team-b-title").textContent = "Time Preto";
        // Preenche com os jogadores confirmados se não houver sorteio estruturado
        const present = state.players.filter(p => p.isPresent);
        state.match.state.teamAPlayers = present;
        state.match.state.teamBPlayers = present;
    }

    // Exibir cronômetro formatado
    updateTimerDisplay();

    // Toggle de Paineis
    document.getElementById("match-setup-panel").style.display = "none";
    document.getElementById("match-active-panel").style.display = "flex";
    
    // Badge do Header
    document.getElementById("header-match-status").style.display = "block";
    
    state.match.active = true;
}

function cancelMatch() {
    if (confirm("Deseja realmente cancelar a partida atual? O progresso não será salvo.")) {
        endMatchProcess(false);
    }
}

function endMatchProcess(saveData = false) {
    // Parar Cronômetro
    if (state.match.state.timerInterval) {
        clearInterval(state.match.state.timerInterval);
        state.match.state.timerInterval = null;
    }

    // Salvar gols se requisitado
    if (saveData) {
        // Os gols já são salvos em tempo real ao selecionar o jogador, mas vamos re-salvar por segurança
        savePlayers();
        renderArtilhariaList();
    }

    // Reset UI
    document.getElementById("match-setup-panel").style.display = "flex";
    document.getElementById("match-active-panel").style.display = "none";
    document.getElementById("header-match-status").style.display = "none";
    
    const playBtn = document.getElementById("btn-timer-play-pause");
    playBtn.innerHTML = `
        <svg id="icon-play" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg> Iniciar
    `;
    
    state.match.active = false;
}

// CRONÔMETRO LÓGICA
function toggleTimer() {
    const playBtn = document.getElementById("btn-timer-play-pause");
    
    if (state.match.state.timerInterval) {
        // Pausar
        clearInterval(state.match.state.timerInterval);
        state.match.state.timerInterval = null;
        playBtn.innerHTML = `
            <svg id="icon-play" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg> Retomar
        `;
    } else {
        // Iniciar
        playBtn.innerHTML = `
            <svg id="icon-pause" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg> Pausar
        `;
        
        state.match.state.timerInterval = setInterval(() => {
            if (state.match.settings.useTime) {
                state.match.state.timeRemaining--;
                updateTimerDisplay();

                if (state.match.state.timeRemaining <= 0) {
                    triggerEndGame("tempo");
                }
            } else {
                // Cronômetro progressivo se tempo não estiver limitado
                state.match.state.timeRemaining++;
                updateTimerDisplay(true);
            }
        }, 1000);
    }
}

function resetTimer() {
    if (state.match.state.timerInterval) {
        clearInterval(state.match.state.timerInterval);
        state.match.state.timerInterval = null;
    }
    
    const playBtn = document.getElementById("btn-timer-play-pause");
    playBtn.innerHTML = `
        <svg id="icon-play" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg> Iniciar
    `;

    state.match.state.timeRemaining = state.match.settings.useTime ? state.match.settings.timeLimit * 60 : 0;
    updateTimerDisplay();
}

function updateTimerDisplay(progressive = false) {
    const display = document.getElementById("timer-text");
    const seconds = state.match.state.timeRemaining;
    
    const min = Math.floor(Math.abs(seconds) / 60);
    const sec = Math.floor(Math.abs(seconds) % 60);
    
    const minStr = String(min).padStart(2, "0");
    const secStr = String(sec).padStart(2, "0");

    display.textContent = `${minStr}:${secStr}`;
}

// ABERTURA DO MODAL PARA ESCOLHER ARTILHEIRO DO GOL
function openGoalModal(team) {
    state.match.state.currentScoringTeam = team;
    
    const listContainer = document.getElementById("goal-modal-players-list");
    listContainer.innerHTML = "";

    const teamPlayers = team === "A" ? state.match.state.teamAPlayers : state.match.state.teamBPlayers;

    if (!teamPlayers || teamPlayers.length === 0) {
        // Fallback para todos os confirmados caso a lista esteja vazia
        const present = state.players.filter(p => p.isPresent);
        present.forEach(p => createPlayerModalButton(p, listContainer));
    } else {
        teamPlayers.forEach(p => createPlayerModalButton(p, listContainer));
    }

    document.getElementById("goal-modal").style.display = "flex";
}

function createPlayerModalButton(player, container) {
    const btn = document.createElement("button");
    btn.className = "btn-modal-player";
    btn.textContent = player.name;
    btn.addEventListener("click", () => registerGoal(player));
    container.appendChild(btn);
}

function closeGoalModal() {
    document.getElementById("goal-modal").style.display = "none";
}

// REGISTRO DO GOL
function registerGoal(player) {
    const team = state.match.state.currentScoringTeam;
    closeGoalModal();

    // Incrementa placar local
    if (team === "A") {
        state.match.state.scoreA++;
        document.getElementById("score-a").textContent = state.match.state.scoreA;
        document.getElementById("btn-score-a-minus").disabled = false;
    } else {
        state.match.state.scoreB++;
        document.getElementById("score-b").textContent = state.match.state.scoreB;
        document.getElementById("btn-score-b-minus").disabled = false;
    }

    // Calcula tempo do gol
    const gameTime = state.match.settings.useTime 
        ? (state.match.settings.timeLimit * 60 - state.match.state.timeRemaining) 
        : state.match.state.timeRemaining;
    
    const min = Math.floor(gameTime / 60);
    const sec = Math.floor(gameTime % 60);
    const timeStamp = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;

    const playerName = player ? player.name : "Gol Contra / Anônimo";

    // Adiciona ao Log de Gols
    state.match.state.goalsLog.push({
        time: timeStamp,
        playerName: playerName,
        team: team
    });

    // Se o gol foi associado a um jogador real, incrementa no perfil dele
    if (player && player.id) {
        const realPlayer = state.players.find(p => p.id === player.id);
        if (realPlayer) {
            realPlayer.goals = (realPlayer.goals || 0) + 1;
            savePlayers();
            renderArtilhariaList();
        }
    }

    renderGoalsLog();

    // Verifica condição de limite de gols
    if (state.match.settings.useGoals) {
        const currentScore = team === "A" ? state.match.state.scoreA : state.match.state.scoreB;
        if (currentScore >= state.match.settings.goalsLimit) {
            triggerEndGame("gols");
        }
    }
}

function adjustScore(team, amount) {
    if (team === "A") {
        state.match.state.scoreA = Math.max(0, state.match.state.scoreA + amount);
        document.getElementById("score-a").textContent = state.match.state.scoreA;
        if (state.match.state.scoreA === 0) document.getElementById("btn-score-a-minus").disabled = true;
    } else {
        state.match.state.scoreB = Math.max(0, state.match.state.scoreB + amount);
        document.getElementById("score-b").textContent = state.match.state.scoreB;
        if (state.match.state.scoreB === 0) document.getElementById("btn-score-b-minus").disabled = true;
    }

    // Remove o último gol do log se for diminuição
    if (amount < 0) {
        const indexToRemove = state.match.state.goalsLog.map(g => g.team).lastIndexOf(team);
        if (indexToRemove > -1) {
            const logItem = state.match.state.goalsLog[indexToRemove];
            // Se tinha jogador associado, deduz da artilharia
            if (logItem.playerName !== "Gol Contra / Anônimo") {
                const realPlayer = state.players.find(p => p.name === logItem.playerName);
                if (realPlayer) {
                    realPlayer.goals = Math.max(0, (realPlayer.goals || 0) - 1);
                    savePlayers();
                    renderArtilhariaList();
                }
            }
            state.match.state.goalsLog.splice(indexToRemove, 1);
            renderGoalsLog();
        }
    }
}

function renderGoalsLog() {
    const list = document.getElementById("match-goals-log-list");
    list.innerHTML = "";

    if (state.match.state.goalsLog.length === 0) {
        list.innerHTML = '<p class="empty-events text-muted">Nenhum gol registrado.</p>';
        return;
    }

    state.match.state.goalsLog.forEach(g => {
        const div = document.createElement("div");
        div.className = "event-goal-item";
        
        const teamName = g.team === "A" 
            ? document.getElementById("team-a-title").textContent 
            : document.getElementById("team-b-title").textContent;

        div.innerHTML = `
            <span>⚽ <strong>${g.playerName}</strong> (${teamName})</span>
            <span class="event-time">${g.time}</span>
        `;
        list.appendChild(div);
    });
    
    // Rolagem automática
    list.scrollTop = list.scrollHeight;
}

// GATILHO DE ENCERRAMENTO DE PARTIDA (POR REGRAS)
function triggerEndGame(reason) {
    // Parar timer
    if (state.match.state.timerInterval) {
        clearInterval(state.match.state.timerInterval);
        state.match.state.timerInterval = null;
    }

    // Som de Apito usando Web Audio API
    playRefereeWhistle();

    // Efeito de Flash na tela
    document.querySelector(".app-container").classList.add("flash-end-game");
    setTimeout(() => {
        document.querySelector(".app-container").classList.remove("flash-end-game");
    }, 2000);

    // Determinar Vencedor
    const scoreA = state.match.state.scoreA;
    const scoreB = state.match.state.scoreB;
    const teamAName = document.getElementById("team-a-title").textContent;
    const teamBName = document.getElementById("team-b-title").textContent;

    let titleMsg = "Fim de Jogo! 🏁";
    let message = `Placar final: ${teamAName} ${scoreA} x ${scoreB} ${teamBName}\n\n`;

    if (scoreA > scoreB) {
        titleMsg = `🏆 Vitória do ${teamAName}!`;
        if (state.match.settings.useBet && state.match.settings.betValue) {
            message += `🎉 Prêmio garantido: ${state.match.settings.betValue}`;
        }
    } else if (scoreB > scoreA) {
        titleMsg = `🏆 Vitória do ${teamBName}!`;
        if (state.match.settings.useBet && state.match.settings.betValue) {
            message += `🎉 Prêmio garantido: ${state.match.settings.betValue}`;
        }
    } else {
        titleMsg = "🤝 Empate!";
        message += "O jogo terminou empatado.";
    }

    setTimeout(() => {
        alert(`${titleMsg}\n\n${message}`);
    }, 100);
}

function confirmEndMatch() {
    if (confirm("Deseja encerrar e salvar o resultado desta partida na artilharia?")) {
        endMatchProcess(true);
    }
}

// SINTETIZADOR DE APITO DE JUIZ (Web Audio API)
function playRefereeWhistle() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        
        // Frequências para imitar um apito trinado de juiz
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(1000, audioCtx.currentTime); // Frequência base alta
        // Efeito de trinado (modulação rápida de frequência)
        osc1.frequency.linearRampToValueAtTime(1100, audioCtx.currentTime + 0.15);
        osc1.frequency.linearRampToValueAtTime(950, audioCtx.currentTime + 0.3);
        osc1.frequency.linearRampToValueAtTime(1050, audioCtx.currentTime + 0.45);
        osc1.frequency.linearRampToValueAtTime(1000, audioCtx.currentTime + 0.6);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(1050, audioCtx.currentTime);
        
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        // Fade in rápido, fade out no final
        gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
        gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(audioCtx.currentTime + 0.85);
        osc2.stop(audioCtx.currentTime + 0.85);
    } catch (e) {
        console.error("Web Audio API não suportada ou bloqueada: ", e);
    }
}

// Algoritmo de Embaralhar Array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ==========================================
// PRANCHETA TÁTICA INTERATIVA (JOGO DE BOTÃO)
// ==========================================

let activePitchTeamIndex = null;

function openPitchModal(teamIndex) {
    const { teams } = state.drawResults;
    if (!teams || !teams[teamIndex]) return;

    activePitchTeamIndex = teamIndex;
    const team = teams[teamIndex];

    // Configura título do modal
    document.getElementById("pitch-modal-title").textContent = `Campo Tático: ${team.name}`;

    // Limpa e redesenha o campo
    const pitch = document.getElementById("soccer-pitch-board");
    
    // Remove os nós de jogadores antigos se existirem
    const oldNodes = pitch.querySelectorAll(".pitch-player-node");
    oldNodes.forEach(node => node.remove());

    // Separar Goleiro e Linhas
    const goalkeepers = team.players.filter(p => p.isGoalkeeper || p.startsInGoal);
    const fieldPlayers = team.players.filter(p => !p.isGoalkeeper && !p.startsInGoal);

    // 1. Injeta Goleiro
    goalkeepers.forEach(gk => {
        createPitchPlayerNode(gk, 50, 88, pitch); // No meio do gol de baixo
    });

    // 2. Injeta Jogadores de Linha com distribuição automática
    const defaultPositions = getDefaultTacticalPositions(fieldPlayers.length);
    fieldPlayers.forEach((player, idx) => {
        const pos = defaultPositions[idx] || { left: 50, top: 50 };
        createPitchPlayerNode(player, pos.left, pos.top, pitch);
    });

    // Exibe o modal
    document.getElementById("pitch-modal").style.display = "flex";
}

function closePitchModal() {
    document.getElementById("pitch-modal").style.display = "none";
    renderLastDraw(); // Atualiza a lista principal com as novas posições e goleiros definidos no campo
}

function resetPitchPositions() {
    if (activePitchTeamIndex !== null) {
        openPitchModal(activePitchTeamIndex); // Simplesmente redesenha na formação padrão
    }
}

// CRIAÇÃO DO BOTÃO FÍSICO DO JOGADOR NO DOM
function createPitchPlayerNode(player, left, top, pitchContainer) {
    const node = document.createElement("div");
    node.className = "pitch-player-node";
    node.setAttribute("data-player-name", player.name); // Identificador para a troca de posições
    node.style.left = left + "%";
    node.style.top = top + "%";

    // Pega as iniciais do nome do jogador para colocar no botão (ex: Vini Jr -> VJ ou V)
    const initials = getInitials(player.name);

    const isGk = player.isGoalkeeper || player.startsInGoal;
    node.innerHTML = `
        <div class="player-button-disc ${isGk ? 'is-gk' : ''}">
            ${initials}
        </div>
        <span class="player-button-name">${player.name}</span>
    `;

    pitchContainer.appendChild(node);

    // Torna a peça arrastável
    makeElementDraggable(node, pitchContainer);
}

// OBTÉM AS INICIAIS DO JOGADOR (Máximo 2 caracteres)
function getInitials(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
}

// CÁLCULO DE POSIÇÕES PADRÃO TÁTICAS (Mobile-First de Baixo para Cima)
function getDefaultTacticalPositions(linesCount) {
    const positions = [];
    if (linesCount === 1) {
        positions.push({ left: 50, top: 40 });
    } else if (linesCount === 2) {
        positions.push({ left: 30, top: 40 }, { left: 70, top: 40 });
    } else if (linesCount === 3) {
        positions.push(
            { left: 50, top: 65 }, // Zagueiro
            { left: 30, top: 32 }, // Atacante Esquerda
            { left: 70, top: 32 }  // Atacante Direita
        );
    } else if (linesCount === 4) {
        positions.push(
            { left: 30, top: 68 }, { left: 70, top: 68 }, // Laterais/Zagueiros
            { left: 30, top: 32 }, { left: 70, top: 32 }  // Atacantes
        );
    } else if (linesCount === 5) {
        positions.push(
            { left: 30, top: 68 }, { left: 70, top: 68 }, // Defensores
            { left: 50, top: 48 },                         // Meio-Campo
            { left: 30, top: 25 }, { left: 70, top: 25 }  // Atacantes
        );
    } else if (linesCount === 6) {
        positions.push(
            { left: 30, top: 68 }, { left: 70, top: 68 }, // Defensores
            { left: 30, top: 48 }, { left: 70, top: 48 }, // Meio-Campo
            { left: 30, top: 25 }, { left: 70, top: 25 }  // Atacantes
        );
    } else if (linesCount === 7) {
        positions.push(
            { left: 20, top: 68 }, { left: 50, top: 68 }, { left: 80, top: 68 }, // 3 Defensores
            { left: 30, top: 45 }, { left: 70, top: 45 },                         // 2 Meias
            { left: 30, top: 22 }, { left: 70, top: 22 }                          // 2 Atacantes
        );
    } else if (linesCount === 8) {
        positions.push(
            { left: 20, top: 68 }, { left: 50, top: 68 }, { left: 80, top: 68 }, // 3 Defensores
            { left: 20, top: 45 }, { left: 50, top: 45 }, { left: 80, top: 45 }, // 3 Meias
            { left: 30, top: 22 }, { left: 70, top: 22 }                          // 2 Atacantes
        );
    } else {
        // Fallback genérico em grade para muitos jogadores
        for (let i = 0; i < linesCount; i++) {
            let row = Math.floor(i / 3);
            let col = i % 3;
            let top = 68 - row * 20;
            let left = 20 + col * 30;
            positions.push({ left, top });
        }
    }
    return positions;
}

// LOGICA DE ARRASTAR E SOLTAR (MOUSE E TOUCH SCREEN)
function makeElementDraggable(element, container) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    let leftPercent = parseFloat(element.style.left) || 50;
    let topPercent = parseFloat(element.style.top) || 50;
    
    // Eventos de mouse
    element.addEventListener("mousedown", dragStart);
    // Eventos de touch
    element.addEventListener("touchstart", dragStart, { passive: false });

    function dragStart(e) {
        // Prevenir comportamento padrão (rolagem da página)
        if (e.type === "touchstart") {
            pos3 = e.touches[0].clientX;
            pos4 = e.touches[0].clientY;
        } else {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
        }
        
        document.addEventListener("mouseup", dragEnd);
        document.addEventListener("mousemove", dragMove);
        document.addEventListener("touchend", dragEnd);
        document.addEventListener("touchmove", dragMove, { passive: false });
    }

    function dragMove(e) {
        let clientX, clientY;
        
        if (e.type === "touchmove") {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            e.preventDefault();
            clientX = e.clientX;
            clientY = e.clientY;
        }

        // Calcula a distância deslocada
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;

        // Novas coordenadas em pixels
        let newTop = element.offsetTop - pos2;
        let newLeft = element.offsetLeft - pos1;

        // Limites da prancheta
        const rect = container.getBoundingClientRect();

        // Evita que o botão saia pelas bordas (mantendo uma margem de segurança)
        newLeft = Math.max(15, Math.min(rect.width - 15, newLeft));
        newTop = Math.max(15, Math.min(rect.height - 15, newTop));

        // Converte coordenadas para porcentagem (%) para manter a responsividade fluida
        leftPercent = (newLeft / rect.width) * 100;
        topPercent = (newTop / rect.height) * 100;

        element.style.left = leftPercent + "%";
        element.style.top = topPercent + "%";

        // Realimentação visual em tempo real (muda cor do botão ao cruzar a linha da área)
        const disc = element.querySelector(".player-button-disc");
        if (disc) {
            const isInsideArea = leftPercent >= 28 && leftPercent <= 72 && topPercent >= 75;
            if (isInsideArea) {
                disc.classList.add("is-gk");
            } else {
                disc.classList.remove("is-gk");
            }
        }
    }

    function dragEnd() {
        document.removeEventListener("mouseup", dragEnd);
        document.removeEventListener("mousemove", dragMove);
        document.removeEventListener("touchend", dragEnd);
        document.removeEventListener("touchmove", dragMove);

        // Atualizar o estado tático de todos os jogadores com base na posição
        if (activePitchTeamIndex !== null) {
            const team = state.drawResults.teams[activePitchTeamIndex];
            const nodes = container.querySelectorAll(".pitch-player-node");
            
            nodes.forEach(node => {
                const playerName = node.getAttribute("data-player-name");
                const pObj = team.players.find(p => p.name === playerName);
                if (pObj) {
                    const lPercent = parseFloat(node.style.left);
                    const tPercent = parseFloat(node.style.top);
                    const isInside = lPercent >= 28 && lPercent <= 72 && tPercent >= 75;
                    
                    if (isInside) {
                        pObj.startsInGoal = true;
                    } else {
                        pObj.startsInGoal = false;
                        pObj.isGoalkeeper = false; // Se arrastou pra fora, deixa de ser goleiro fixo
                    }
                }
            });
            
            // Garantir que as cores dos botões estejam 100% sincronizadas com o estado final do objeto
            nodes.forEach(node => {
                const playerName = node.getAttribute("data-player-name");
                const pObj = team.players.find(p => p.name === playerName);
                const disc = node.querySelector(".player-button-disc");
                if (disc && pObj) {
                    const isGk = pObj.isGoalkeeper || pObj.startsInGoal;
                    if (isGk) {
                        disc.classList.add("is-gk");
                    } else {
                        disc.classList.remove("is-gk");
                    }
                }
            });

            saveLastDraw();
        }
    }
}

// ==========================================
// ANIMAÇÃO DO SORTEIO (ESTILO CHAMPIONS LEAGUE)
// ==========================================

let drawAnimTimeouts = [];

function startDrawAnimation() {
    // Limpa timeouts anteriores se existirem
    drawAnimTimeouts.forEach(clearTimeout);
    drawAnimTimeouts = [];

    // Alterna para a aba do sorteador
    switchTab("tab-sorteador");

    // Prepara elementos no DOM
    const animContainer = document.getElementById("draw-animation-container");
    const resultsContainer = document.getElementById("sorteio-results-container");
    const emptyState = document.getElementById("sorteio-empty-state");
    const hand = document.getElementById("draw-anim-hand");
    const bowlWrapper = document.getElementById("bowl-balls-wrapper");
    const pickedBall = document.getElementById("draw-anim-picked-ball");
    const animText = document.getElementById("draw-anim-text");

    // Mostra overlay de animação, esconde os times reais por enquanto
    animContainer.style.display = "flex";
    resultsContainer.style.display = "none";
    emptyState.style.display = "none";

    // Reseta classes de animação e estados visuais
    hand.classList.remove("hand-descending");
    bowlWrapper.classList.remove("mixing");
    pickedBall.classList.remove("ball-zooming");
    pickedBall.style.display = "none";

    // --- PASSO 1: MISTURANDO AS BOLINHAS ---
    animText.textContent = "Misturando as bolinhas... 🏺";
    bowlWrapper.classList.add("mixing");
    playRattleSound(1800); // 1.8 segundos de barulho de bolinhas

    // --- PASSO 2: MÃO DESCENDO NO POTE ---
    let t1 = setTimeout(() => {
        animText.textContent = "Escolhendo uma bolinha... 🖐️";
        hand.classList.add("hand-descending");
    }, 800);
    drawAnimTimeouts.push(t1);

    // --- PASSO 3: PEGA E REVELA A BOLINHA (ZOOM 3D) ---
    let t2 = setTimeout(() => {
        bowlWrapper.classList.remove("mixing"); // Para de agitar
        animText.textContent = "Bolinha pescada! ⚽";
        
        // Mostra a bolinha sorteada
        pickedBall.style.display = "block";
        pickedBall.classList.add("ball-zooming");
        
        // Toca som de chime + apito
        playPickSound();
    }, 1800);
    drawAnimTimeouts.push(t2);

    // --- PASSO 4: FINALIZA E EXIBE OS RESULTADOS ---
    let t3 = setTimeout(() => {
        animContainer.style.display = "none"; // Oculta animação
        renderLastDraw(); // Mostra as pranchetas táticas reais
        
        // Garante que o painel de resultados fique visível
        resultsContainer.style.display = "flex";
    }, 3000);
    drawAnimTimeouts.push(t3);
}

function skipDrawAnimation() {
    // Para todos os timeouts ativos
    drawAnimTimeouts.forEach(clearTimeout);
    drawAnimTimeouts = [];

    // Oculta a tela da animação
    document.getElementById("draw-animation-container").style.display = "none";
    
    // Mostra os resultados reais
    renderLastDraw();
    document.getElementById("sorteio-results-container").style.display = "flex";
}

// Efeito de chocalho/agitação de bolinhas (sintetizador offline)
function playRattleSound(durationMs) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        let startTime = audioCtx.currentTime;
        let endTime = startTime + durationMs / 1000;

        let interval = setInterval(() => {
            if (audioCtx.currentTime >= endTime) {
                clearInterval(interval);
                audioCtx.close();
                return;
            }
            
            let osc = audioCtx.createOscillator();
            let gain = audioCtx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(600 + Math.random() * 600, audioCtx.currentTime);
            
            gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.06);
        }, 100);
    } catch(e) {
        console.log("Audio rattle not supported: ", e);
    }
}

function playPickSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
        
        // Toca o apito de juiz logo em seguida
        setTimeout(() => {
            playRefereeWhistle();
            audioCtx.close();
        }, 350);
    } catch (e) {
        console.log("Audio pick not supported: ", e);
    }
}
