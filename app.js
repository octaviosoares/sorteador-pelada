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
    matchHistory: [],
    drawResults: {
        teams: [],
        bench: []
    },
    vestColors: {
        teamA: 'verde',
        teamB: 'azul'
    },
    nextTeamLetter: 'C',
    drawCount: 0,
    isPro: false,
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

    const savedHistory = localStorage.getItem("sorteiafut_match_history");
    if (savedHistory) {
        state.matchHistory = JSON.parse(savedHistory);
    }

    state.nextTeamLetter = localStorage.getItem("sorteiafut_next_team_letter") || 'C';
    state.drawCount = parseInt(localStorage.getItem("sorteiafut_draw_count") || '0', 10);
    state.isPro = localStorage.getItem("sorteiafut_is_pro") === "true";

    const savedVestColors = localStorage.getItem("sorteiafut_vest_colors");
    if (savedVestColors) {
        state.vestColors = JSON.parse(savedVestColors);
    } else {
        state.vestColors = { teamA: 'verde', teamB: 'azul' };
    }
}

function saveHistory() {
    localStorage.setItem("sorteiafut_match_history", JSON.stringify(state.matchHistory));
    localStorage.setItem("sorteiafut_next_team_letter", state.nextTeamLetter);
    localStorage.setItem("sorteiafut_draw_count", state.drawCount.toString());
    localStorage.setItem("sorteiafut_vest_colors", JSON.stringify(state.vestColors));
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
    if (formAdd) {
        formAdd.addEventListener("submit", handleAddJogador);
    }

    // Alternar modos de cadastro (Individual vs Lista)
    const btnSingle = document.getElementById("btn-toggle-add-single");
    const btnBulk = document.getElementById("btn-toggle-add-bulk");
    const formSingle = document.getElementById("form-add-jogador");
    const formBulk = document.getElementById("form-import-jogadores");

    if (btnSingle && btnBulk && formSingle && formBulk) {
        btnSingle.addEventListener("click", () => {
            btnSingle.classList.add("active");
            btnSingle.style.borderBottomColor = "#ffffff";
            btnSingle.style.opacity = "1";
            
            btnBulk.classList.remove("active");
            btnBulk.style.borderBottomColor = "transparent";
            btnBulk.style.opacity = "0.6";

            formSingle.style.display = "flex";
            formBulk.style.display = "none";
        });

        btnBulk.addEventListener("click", () => {
            btnBulk.classList.add("active");
            btnBulk.style.borderBottomColor = "#ffffff";
            btnBulk.style.opacity = "1";

            btnSingle.classList.remove("active");
            btnSingle.style.borderBottomColor = "transparent";
            btnSingle.style.opacity = "0.6";

            formSingle.style.display = "none";
            formBulk.style.display = "flex";
        });
    }

    const formImport = document.getElementById("form-import-jogadores");
    if (formImport) {
        formImport.addEventListener("submit", handleBulkImport);
    }

    const searchInput = document.getElementById("search-jogadores");
    if (searchInput) {
        searchInput.addEventListener("input", filterPlayersList);
    }

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

    // Registra o Service Worker para PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('PWA Service Worker registrado com sucesso!'))
            .catch(err => console.log('Erro ao registrar Service Worker:', err));
    }

    // Render Inicial
    console.log("SorteiaFut JS v2.2 - Loaded successfully!");
    renderPlayersList();
    renderArtilhariaList();
    renderLastDraw();
    renderHistory();

    // Inicializa AdMob Nativo
    initAdMob();

    // Eventos de encerramento do dia
    document.getElementById("btn-end-day").addEventListener("click", confirmEndDay);

    // Eventos de Seleção de Time no Placar
    document.getElementById("match-select-team-a").addEventListener("change", handleTeamASelectionChange);
    document.getElementById("match-select-team-b").addEventListener("change", handleTeamBSelectionChange);

    // Eventos do Menu Hambúrguer (Drawer)
    document.getElementById("btn-open-menu").addEventListener("click", openAppDrawer);
    document.getElementById("btn-close-drawer").addEventListener("click", closeAppDrawer);
    document.getElementById("app-drawer").addEventListener("click", (e) => {
        if (e.target.id === "app-drawer") closeAppDrawer();
    });

    // Seletor de Cores de Coletes
    const selectColorA = document.getElementById("select-color-team-a");
    const selectColorB = document.getElementById("select-color-team-b");
    if (selectColorA && selectColorB) {
        selectColorA.value = state.vestColors.teamA;
        selectColorB.value = state.vestColors.teamB;

        selectColorA.addEventListener("change", () => {
            state.vestColors.teamA = selectColorA.value;
            saveHistory();
            renderLastDraw();
        });
        selectColorB.addEventListener("change", () => {
            state.vestColors.teamB = selectColorB.value;
            saveHistory();
            renderLastDraw();
        });
    }

    // Botão Adquirir PRO
    const btnBuyPro = document.getElementById("btn-buy-pro");
    if (btnBuyPro) {
        if (state.isPro) {
            document.getElementById("drawer-pro-banner").style.borderColor = "#10b981";
            document.getElementById("drawer-pro-banner").style.boxShadow = "none";
            document.getElementById("drawer-pro-banner").querySelector("h3").innerHTML = "SorteiaFut PRO Ativo! 🎉";
            btnBuyPro.style.display = "none";
        }
        btnBuyPro.addEventListener("click", () => {
            if (confirm("Parabéns pelo interesse no SorteiaFut PRO!\n\nDeseja realizar a compra simulada por R$ 14,90 para remover permanentemente todos os anúncios e apoiar o projeto?")) {
                state.isPro = true;
                localStorage.setItem("sorteiafut_is_pro", "true");
                alert("Compra efetuada com sucesso! Todos os anúncios foram removidos.");
                document.getElementById("drawer-pro-banner").style.borderColor = "#10b981";
                document.getElementById("drawer-pro-banner").querySelector("h3").innerHTML = "SorteiaFut PRO Ativo! 🎉";
                btnBuyPro.style.display = "none";
                
                if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
                    try {
                        window.Capacitor.Plugins.AdMob.removeBanner();
                    } catch (err) {
                        console.log("Erro ao remover banner AdMob:", err);
                    }
                }
            }
        });
    }

    // Ver Histórico do Dia
    document.getElementById("btn-menu-history").addEventListener("click", () => {
        closeAppDrawer();
        switchTab("tab-partida");
        const panel = document.getElementById("match-history-panel");
        if (panel) {
            panel.scrollIntoView({ behavior: "smooth" });
        }
    });

    // Abrir Modal de Guia de Funções
    const btnMenuGuide = document.getElementById("btn-menu-guide");
    if (btnMenuGuide) {
        btnMenuGuide.addEventListener("click", () => {
            closeAppDrawer();
            document.getElementById("guide-modal").style.display = "flex";
        });
    }

    // Fechar Modal de Guia de Funções
    const closeGuideBtn = document.getElementById("btn-close-guide-modal");
    const okGuideBtn = document.getElementById("btn-ok-guide");
    if (closeGuideBtn) {
        closeGuideBtn.addEventListener("click", () => {
            document.getElementById("guide-modal").style.display = "none";
        });
    }
    if (okGuideBtn) {
        okGuideBtn.addEventListener("click", () => {
            document.getElementById("guide-modal").style.display = "none";
        });
    }

    // Compartilhar Aplicativo
    document.getElementById("btn-menu-share").addEventListener("click", () => {
        const shareData = {
            title: "SorteiaFut",
            text: "Monte times e artilharias de futebol direto do celular! Baixe o SorteiaFut v2.2.",
            url: window.location.href
        };
        if (navigator.share) {
            navigator.share(shareData).catch(err => console.log(err));
        } else {
            navigator.clipboard.writeText("SorteiaFut - O melhor sorteador de peladas e gestão de partidas! Acesse: " + window.location.href);
            alert("Link do aplicativo copiado para a área de transferência! Compartilhe com seus amigos 📲");
        }
    });

    // Avaliar Aplicativo na Google Play
    document.getElementById("btn-menu-rate").addEventListener("click", () => {
        alert("Obrigado pelo seu apoio! Esta opção redirecionará para a Google Play Store após o aplicativo estar publicado.");
        window.open("https://play.google.com/store", "_blank");
    });

    // Reiniciar o Aplicativo completamente
    document.getElementById("btn-menu-reset").addEventListener("click", () => {
        if (confirm("ATENÇÃO: Deseja realmente reiniciar o aplicativo?\n\nIsso apagará permanentemente todos os jogadores, histórico de partidas do dia, configurações e estatísticas. Esta ação não pode ser desfeita!")) {
            localStorage.clear();
            alert("Aplicativo reiniciado com sucesso!");
            window.location.reload();
        }
    });

    // Eventos da Tela de Empate no Placar
    document.getElementById("btn-draw-coin-flip").addEventListener("click", () => {
        const modal = document.getElementById("coin-flip-modal");
        const assignment = document.getElementById("coin-teams-assignment");
        const teamAName = document.getElementById("team-a-title").textContent;
        const teamBName = document.getElementById("team-b-title").textContent;
        
        assignment.textContent = `${teamAName} (Cara) vs ${teamBName} (Coroa)`;
        document.getElementById("coin-flip-result").innerHTML = "";
        document.getElementById("virtual-coin").className = "coin";
        document.getElementById("btn-spin-coin").classList.remove("hidden");
        document.getElementById("btn-confirm-coin-result").classList.add("hidden");
        
        modal.style.display = "flex";
    });
    
    document.getElementById("btn-draw-keep-a").addEventListener("click", () => handleManualDrawDecision(0));
    document.getElementById("btn-draw-keep-b").addEventListener("click", () => handleManualDrawDecision(1));
    document.getElementById("btn-spin-coin").addEventListener("click", spinVirtualCoin);
    document.getElementById("btn-confirm-coin-result").addEventListener("click", () => {
        document.getElementById("coin-flip-modal").style.display = "none";
        handleManualDrawDecision(state.coinFlipWinnerIndex);
    });
    document.getElementById("btn-close-coin-flip").addEventListener("click", () => {
        document.getElementById("coin-flip-modal").style.display = "none";
    });
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

    // Preenche as opções de escala de times ao acessar a aba Partida
    if (tabId === "tab-partida") {
        populateMatchTeamsDropdowns();
    }
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
                    <div style="display: flex; gap: 0.25rem; align-items: center; margin-top: 0.15rem;">
                        ${player.isGoalkeeper ? '<span class="badge gk">Goleiro</span>' : ''}
                        ${player.isSeeded ? '<span class="badge" style="background: #fbbf24; color: #0b0f19;">Estrela ⭐</span>' : ''}
                    </div>
                </div>
            </div>
            <div class="player-actions">
                <!-- Botão de Cabeça de Chave (Estrela) -->
                <button class="btn-icon-action" onclick="toggleSeeded(${player.id})" title="Alternar Cabeça de Chave" style="color: ${player.isSeeded ? '#fbbf24' : 'var(--text-muted)'}; opacity: ${player.isSeeded ? '1' : '0.4'}; font-size: 1.15rem; cursor: pointer;">
                    ★
                </button>
                <!-- Botão de Goleiro (Luvas) -->
                <button class="btn-icon-action" onclick="toggleGoalkeeper(${player.id})" title="Alternar Goleiro" style="opacity: ${player.isGoalkeeper ? '1' : '0.35'}; filter: grayscale(${player.isGoalkeeper ? '0' : '1'}); font-size: 1.1rem; cursor: pointer;">
                    🧤
                </button>
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

function handleBulkImport(e) {
    e.preventDefault();
    const textarea = document.getElementById("import-names-area");
    if (!textarea) return;

    const rawText = textarea.value;
    if (!rawText.trim()) {
        alert("Por favor, cole alguma lista de nomes antes de importar!");
        return;
    }

    const lines = rawText.split(/\r?\n/);
    let importCount = 0;
    let goalkeeperCount = 0;

    lines.forEach((line, index) => {
        let name = line.trim();
        if (!name) return;

        // 1. Detecta se é goleiro (se contiver palavras como "goleiro", "goleira", "(g)", "(gk)", "gol")
        const isGk = /\b(goleiro|goleira|gk|gol)\b|\((g|gk)\)/i.test(name);

        // 2. Limpa prefixos de numeração e listas comuns
        // Remove números no início, seguidos de ponto, traço, parêntese ou espaço (Ex: "1.", "2 -", "3)", "4. ")
        name = name.replace(/^\d+[\.\-\)\s]*/, '');
        // Remove marcadores de tópicos como "*", "-", "•", "o" no início da linha
        name = name.replace(/^[\*\-\u2022\u25e6]\s*/, '');

        // Remove menções de goleiro do texto do nome para limpar
        name = name.replace(/\b(goleiro|goleira|gk|gol)\b|\((goleiro|goleira|gk|gol|g)\)/i, '');
        // Remove caracteres especiais de limpeza nas pontas
        name = name.replace(/[\(\)\-\[\]]/g, '');
        name = name.trim();

        if (!name || name.length < 2) return;

        // Limita a 20 caracteres (mesmo limite do input de jogador individual)
        if (name.length > 20) {
            name = name.substring(0, 20).trim();
        }

        // Verifica duplicados (case insensitive)
        const nameExists = state.players.some(p => p.name.toLowerCase() === name.toLowerCase());
        if (nameExists) return;

        // Cria o jogador
        const newPlayer = {
            id: Date.now() + index + Math.floor(Math.random() * 100),
            name: name,
            isGoalkeeper: isGk,
            isPresent: true,
            goals: 0
        };

        state.players.push(newPlayer);
        importCount++;
        if (isGk) goalkeeperCount++;
    });

    if (importCount > 0) {
        savePlayers();
        renderPlayersList();
        renderArtilhariaList();
        textarea.value = "";
        
        let msg = `${importCount} jogadores importados com sucesso!`;
        if (goalkeeperCount > 0) {
            msg += `\n(${goalkeeperCount} goleiro(s) auto-detectado(s))`;
        }
        alert(msg);
        
        // Retorna ao modo individual após importar
        document.getElementById("btn-toggle-add-single").click();
    } else {
        alert("Nenhum jogador novo foi detectado ou importado da lista. Verifique a lista colada.");
    }
}

function togglePresence(id) {
    const player = state.players.find(p => p.id === id);
    if (player) {
        player.isPresent = !player.isPresent;
        savePlayers();
        renderPlayersList();
    }
}

function toggleSeeded(id) {
    const player = state.players.find(p => p.id === id);
    if (player) {
        player.isSeeded = !player.isSeeded;
        savePlayers();
        renderPlayersList();
    }
}

function toggleGoalkeeper(id) {
    const player = state.players.find(p => p.id === id);
    if (player) {
        player.isGoalkeeper = !player.isGoalkeeper;
        savePlayers();
        renderPlayersList();
        updateSorteioWarnings();
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

    // Incrementa contagem de sorteios
    state.drawCount++;
    saveHistory();

    // Exibe anúncio intersticial de tela cheia se rodando no app nativo (a partir do 2º sorteio e se não for PRO)
    if (state.drawCount >= 2 && !state.isPro) {
        showAdMobInterstitial();
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

    // Separar os titulares de linha entre Cabeças de Chave (seeded) e normais
    const startingSeeded = startingLines.filter(p => p.isSeeded);
    const startingNormal = startingLines.filter(p => !p.isSeeded);

    shuffleArray(startingSeeded);
    shuffleArray(startingNormal);

    // Distribuir os goleiros nos times
    startingGks.forEach((gk, index) => {
        generatedTeams[index].players.push(gk);
    });

    // Distribuir os Cabeças de Chave nos times de forma equilibrada (round-robin)
    for (let i = 0; i < startingSeeded.length; i++) {
        const teamIdx = i % numTeams;
        const team = generatedTeams[teamIdx];
        if (team.players.length < playersPerTeam) {
            team.players.push(startingSeeded[i]);
        } else {
            // Se o time correspondente já estiver cheio, procura outro com vaga
            let assigned = false;
            for (let offset = 1; offset < numTeams; offset++) {
                const nextTeam = generatedTeams[(teamIdx + offset) % numTeams];
                if (nextTeam.players.length < playersPerTeam) {
                    nextTeam.players.push(startingSeeded[i]);
                    assigned = true;
                    break;
                }
            }
            if (!assigned) {
                team.players.push(startingSeeded[i]);
            }
        }
    }

    // Distribuir os jogadores de linha normais nos times
    let normalIdx = 0;
    for (let i = 0; i < numTeams; i++) {
        const team = generatedTeams[i];
        while (team.players.length < playersPerTeam && normalIdx < startingNormal.length) {
            team.players.push(startingNormal[normalIdx]);
            normalIdx++;
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
    const emojiMap = {
        verde: "🟢",
        azul: "🔵",
        vermelho: "🔴",
        amarelo: "🟡",
        laranja: "🟠",
        roxo: "🟣",
        branco: "⚪",
        preto: "⚫"
    };

    teams.forEach((team, index) => {
        const card = document.createElement("div");
        card.className = "team-tactical-board";
        
        let colorEmoji = "🟢";
        if (index === 0) {
            colorEmoji = emojiMap[state.vestColors.teamA] || "🟢";
        } else if (index === 1) {
            colorEmoji = emojiMap[state.vestColors.teamB] || "🔵";
        } else {
            const backupColors = ["🟡", "🔴", "🟠", "🟣", "⚫", "⚪"];
            colorEmoji = backupColors[(index - 2) % backupColors.length];
        }

        let teamHeaderHtml = `
            <h3>
                <span>${colorEmoji} ${team.name}</span>
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

    const emojiMap = {
        verde: "🟢",
        azul: "🔵",
        vermelho: "🔴",
        amarelo: "🟡",
        laranja: "🟠",
        roxo: "🟣",
        branco: "⚪",
        preto: "⚫"
    };

    teams.forEach((team, idx) => {
        let colorEmoji = "🟢";
        if (idx === 0) {
            colorEmoji = emojiMap[state.vestColors.teamA] || "🟢";
        } else if (idx === 1) {
            colorEmoji = emojiMap[state.vestColors.teamB] || "🔵";
        } else {
            const backupColors = ["🟡", "🔴", "🟠", "🟣", "⚫", "⚪"];
            colorEmoji = backupColors[(idx - 2) % backupColors.length];
        }

        text += `${colorEmoji} *${team.name.toUpperCase()}* `;
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
    // Apenas muda para a aba de placar (a seleção e preenchimento agora são dinâmicos)
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

    // Ler as seleções dos dropdowns
    const selectA = document.getElementById("match-select-team-a");
    const selectB = document.getElementById("match-select-team-b");
    const valA = selectA.value;
    const valB = selectB.value;

    if (valA === valB) {
        alert("Erro: O Time A e o Time B não podem ser o mesmo!");
        return;
    }

    // Carrega Time A
    if (valA.startsWith("team-")) {
        const idx = parseInt(valA.replace("team-", ""), 10);
        const selectedTeam = state.drawResults.teams[idx];
        document.getElementById("team-a-title").textContent = selectedTeam.name;
        state.match.state.teamAPlayers = selectedTeam.players;
    } else if (valA === "manual") {
        document.getElementById("team-a-title").textContent = "Time A (Manual)";
        const checkedList = document.querySelectorAll("#manual-team-a-list input:checked");
        if (checkedList.length === 0) {
            alert("Selecione pelo menos 1 jogador para o Time A!");
            return;
        }
        const playersA = [];
        checkedList.forEach(input => {
            const pId = parseInt(input.value, 10);
            const pObj = state.players.find(p => p.id === pId);
            if (pObj) playersA.push(pObj);
        });
        state.match.state.teamAPlayers = playersA;
    }

    // Carrega Time B
    if (valB.startsWith("team-")) {
        const idx = parseInt(valB.replace("team-", ""), 10);
        const selectedTeam = state.drawResults.teams[idx];
        document.getElementById("team-b-title").textContent = selectedTeam.name;
        state.match.state.teamBPlayers = selectedTeam.players;
    } else if (valB === "manual") {
        document.getElementById("team-b-title").textContent = "Time B (Manual)";
        const checkedList = document.querySelectorAll("#manual-team-b-list input:checked");
        if (checkedList.length === 0) {
            alert("Selecione pelo menos 1 jogador para o Time B!");
            return;
        }
        const playersB = [];
        checkedList.forEach(input => {
            const pId = parseInt(input.value, 10);
            const pObj = state.players.find(p => p.id === pId);
            if (pObj) playersB.push(pObj);
        });
        state.match.state.teamBPlayers = playersB;
    }

    // Evita escalação duplicada
    const duplicatePlayer = state.match.state.teamAPlayers.find(pa => 
        state.match.state.teamBPlayers.some(pb => pb.id === pa.id)
    );
    if (duplicatePlayer) {
        alert(`Erro: O jogador "${duplicatePlayer.name}" está escalado nos dois times ao mesmo tempo!`);
        return;
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

    const scoreA = state.match.state.scoreA;
    const scoreB = state.match.state.scoreB;

    // Salvar gols se requisitado
    if (saveData) {
        savePlayers();
        renderArtilhariaList();

        // Adiciona a partida ao histórico do dia
        const matchData = {
            id: state.matchHistory.length + 1,
            teamA: document.getElementById("team-a-title").textContent,
            teamB: document.getElementById("team-b-title").textContent,
            scoreA: scoreA,
            scoreB: scoreB,
            goalsLog: [...state.match.state.goalsLog]
        };
        state.matchHistory.push(matchData);
        saveHistory();
        renderHistory();

        const keepSame = document.getElementById("match-keep-same-teams").checked;

        if (keepSame) {
            console.log("Mantendo os mesmos times para a próxima partida (Revanche).");
        } else {
            // Se for empate e estiver jogando com times estruturados, exige decisão
            if (scoreA === scoreB && state.drawResults.teams && state.drawResults.teams.length >= 2) {
                const drawPanel = document.getElementById("draw-decision-panel");
                const activePanel = document.getElementById("match-active-panel");
                
                document.getElementById("draw-team-a-name").textContent = document.getElementById("team-a-title").textContent;
                document.getElementById("draw-team-b-name").textContent = document.getElementById("team-b-title").textContent;
                
                activePanel.style.display = "none";
                drawPanel.style.display = "flex";
                
                // Pausa o reset normal até escolherem o time vencedor
                return;
            } else if (state.drawResults.teams && state.drawResults.teams.length >= 2) {
                // Se não for empate, faz a rotação automática do vencedor/perdedor
                const winnerIdx = scoreA > scoreB ? 0 : 1;
                const loserIdx = scoreA > scoreB ? 1 : 0;
                handleRotation(winnerIdx, loserIdx);
            }
        }
    }

    // Reset UI normal
    document.getElementById("match-setup-panel").style.display = "flex";
    document.getElementById("match-active-panel").style.display = "none";
    document.getElementById("draw-decision-panel").style.display = "none";
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

// ==========================================
// ADMOB INTEGRATION (CAPACITOR NATIVE PLUGINS)
// ==========================================

async function initAdMob() {
    if (state.isPro) {
        console.log("AdMob ignorado: Versão PRO ativa (sem anúncios).");
        return;
    }
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        try {
            console.log("Inicializando AdMob Nativo...");
            await AdMob.initialize({
                initializeForTesting: true, // true usa os IDs de teste do Google. Mude para false para produção.
            });
            console.log("AdMob inicializado!");
            
            // Exibir o banner de propaganda
            showAdMobBanner();
        } catch (e) {
            console.error("Erro ao inicializar o AdMob:", e);
        }
    } else {
        console.log("AdMob ignorado: Não está rodando no ambiente nativo do Capacitor.");
    }
}

async function showAdMobBanner() {
    if (state.isPro) return;
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        const options = {
            adId: 'ca-app-pub-3940256099942544/6300978111', // ID de teste oficial do Google para Banner
            adSize: 'BANNER',
            position: 'BOTTOM_CENTER', // Posicionado embaixo
            margin: 72, // Afasta 72px do rodapé para ficar exatamente acima do menu
            isTesting: true // Mude para false para produção
        };
        try {
            await AdMob.showBanner(options);
            console.log("Banner AdMob carregado e exibido!");
        } catch (e) {
            console.error("Erro ao exibir banner do AdMob:", e);
        }
    }
}

async function showAdMobInterstitial() {
    if (state.isPro) return;
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
        const { AdMob } = window.Capacitor.Plugins;
        const options = {
            adId: 'ca-app-pub-3940256099942544/1033173712', // ID de teste oficial do Google para Interstitial
            isTesting: true // Mude para false para produção
        };
        try {
            console.log("Carregando anúncio intersticial...");
            await AdMob.prepareInterstitial(options);
            await AdMob.showInterstitial();
            console.log("Intersticial AdMob exibido!");
        } catch (e) {
            console.error("Erro ao exibir intersticial do AdMob:", e);
        }
    }
}

// ==========================================
// HISTÓRICO DE PARTIDAS DO DIA E ENCERRAMENTO
// ==========================================

function renderHistory() {
    const listElement = document.getElementById("match-history-list");
    if (!listElement) return;

    listElement.innerHTML = "";

    if (!state.matchHistory || state.matchHistory.length === 0) {
        listElement.innerHTML = '<p class="empty-events text-muted" style="text-align: center; padding: 1.5rem 0;">Nenhuma partida concluída hoje.</p>';
        return;
    }

    // Renderiza cada partida de hoje em ordem reversa (mais recente no topo)
    [...state.matchHistory].reverse().forEach(match => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.style.background = "rgba(0, 0, 0, 0.02)";
        item.style.border = "1px solid rgba(0, 0, 0, 0.04)";
        item.style.borderRadius = "0.6rem";
        item.style.padding = "0.75rem 0.85rem";
        item.style.display = "flex";
        item.style.flexDirection = "column";
        item.style.gap = "0.25rem";
        item.style.fontSize = "0.85rem";
        item.style.color = "var(--text-main)";

        // Determina vencedor ou empate
        let resultLabel = "🤝 Empate";
        if (match.scoreA > match.scoreB) {
            resultLabel = `🏆 Vit. ${match.teamA}`;
        } else if (match.scoreB > match.scoreA) {
            resultLabel = `🏆 Vit. ${match.teamB}`;
        }

        // Formata os gols
        let goalsText = "Sem gols registrados";
        if (match.goalsLog && match.goalsLog.length > 0) {
            const goalsMap = {};
            match.goalsLog.forEach(g => {
                goalsMap[g.playerName] = (goalsMap[g.playerName] || 0) + 1;
            });
            goalsText = "⚽ Gols: " + Object.entries(goalsMap).map(([name, count]) => `${name} (${count})`).join(", ");
        }

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; font-weight: 700; align-items: center;">
                <span>Jogo ${match.id}</span>
                <span style="font-size: 0.75rem; background: rgba(0, 0, 0, 0.06); padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 600;">${resultLabel}</span>
            </div>
            <div style="font-size: 0.95rem; font-weight: 600; text-align: center; margin: 0.25rem 0; color: var(--color-accent);">
                ${match.teamA} <span style="font-size: 1.1rem; color: var(--text-main);">${match.scoreA} x ${match.scoreB}</span> ${match.teamB}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">
                ${goalsText}
            </div>
        `;
        listElement.appendChild(item);
    });
}

function confirmEndDay() {
    if (!state.matchHistory || state.matchHistory.length === 0) {
        alert("Nenhuma partida foi jogada ainda hoje.");
        return;
    }

    if (confirm("Deseja realmente encerrar a Pelada de Hoje?\n\nEsta ação irá:\n1. Apagar o histórico de partidas de hoje.\n2. Zerar a contagem de gols de todos os jogadores (Artilharia).\n\nIdeal para começar um novo dia de jogos limpo!")) {
        let totalGames = state.matchHistory.length;
        let totalGoals = 0;
        state.matchHistory.forEach(m => totalGoals += (m.scoreA + m.scoreB));

        let topScorer = { name: "Ninguém", goals: 0 };
        state.players.forEach(p => {
            if (p.goals > topScorer.goals) {
                topScorer = { name: p.name, goals: p.goals };
            }
        });

        state.matchHistory = [];
        state.players.forEach(p => p.goals = 0);

        savePlayers();
        saveHistory();
        
        renderHistory();
        renderArtilhariaList();

        alert(`🏁 Pelada do Dia Encerrada com Sucesso!\n\nResumo de Hoje:\n⚽ Partidas Jogadas: ${totalGames}\n🔥 Total de Gols: ${totalGoals}\n👑 Artilheiro do Dia: ${topScorer.name} (${topScorer.goals} gols)`);
    }
}

// ==========================================
// SELEÇÃO MANUAL E ESCALAÇÃO DE TIMES NO PLACAR
// ==========================================

function populateMatchTeamsDropdowns() {
    const selectA = document.getElementById("match-select-team-a");
    const selectB = document.getElementById("match-select-team-b");
    if (!selectA || !selectB) return;

    selectA.innerHTML = "";
    selectB.innerHTML = "";

    const { teams } = state.drawResults;

    // Se houver times sorteados, popula os seletores com eles
    if (teams && teams.length > 0) {
        teams.forEach((team, idx) => {
            const optA = document.createElement("option");
            optA.value = `team-${idx}`;
            optA.textContent = team.name;
            selectA.appendChild(optA);

            const optB = document.createElement("option");
            optB.value = `team-${idx}`;
            optB.textContent = team.name;
            selectB.appendChild(optB);
        });
    }

    // Adiciona a opção manual em ambos
    const optManualA = document.createElement("option");
    optManualA.value = "manual";
    optManualA.textContent = "-- Seleção Manual --";
    selectA.appendChild(optManualA);

    const optManualB = document.createElement("option");
    optManualB.value = "manual";
    optManualB.textContent = "-- Seleção Manual --";
    selectB.appendChild(optManualB);

    // Seleciona Time A (índice 0) e Time B (índice 1 ou manual) como padrão
    if (teams && teams.length >= 2) {
        selectA.value = "team-0";
        selectB.value = "team-1";
    } else {
        selectA.value = "manual";
        selectB.value = "manual";
    }

    // Autocompleta o checkbox de Revanche se a fila de espera estiver vazia
    const keepSameCheckbox = document.getElementById("match-keep-same-teams");
    if (keepSameCheckbox) {
        const { bench } = state.drawResults;
        if (!bench || bench.length === 0) {
            keepSameCheckbox.checked = true;
        } else {
            keepSameCheckbox.checked = false;
        }
    }

    // Dispara a atualização visual dos checklists manuais
    handleTeamASelectionChange();
    handleTeamBSelectionChange();
}

function handleTeamASelectionChange() {
    const selectA = document.getElementById("match-select-team-a");
    const valA = selectA.value;
    const checklistBoxA = document.getElementById("manual-team-a-checklist-box");
    const container = document.getElementById("manual-players-container");

    if (valA === "manual") {
        checklistBoxA.classList.remove("hidden");
        container.classList.remove("hidden");
        populateManualPlayerChecklist("manual-team-a-list");
    } else {
        checklistBoxA.classList.add("hidden");
        const valB = document.getElementById("match-select-team-b").value;
        if (valB !== "manual") {
            container.classList.add("hidden");
        }
    }
}

function handleTeamBSelectionChange() {
    const selectB = document.getElementById("match-select-team-b");
    const valB = selectB.value;
    const checklistBoxB = document.getElementById("manual-team-b-checklist-box");
    const container = document.getElementById("manual-players-container");

    if (valB === "manual") {
        checklistBoxB.classList.remove("hidden");
        container.classList.remove("hidden");
        populateManualPlayerChecklist("manual-team-b-list");
    } else {
        checklistBoxB.classList.add("hidden");
        const valA = document.getElementById("match-select-team-a").value;
        if (valA !== "manual") {
            container.classList.add("hidden");
        }
    }
}

function populateManualPlayerChecklist(elementId) {
    const listDiv = document.getElementById(elementId);
    if (!listDiv) return;

    listDiv.innerHTML = "";

    const presentPlayers = state.players.filter(p => p.isPresent);

    if (presentPlayers.length === 0) {
        listDiv.innerHTML = `<p class="text-muted" style="font-size:0.75rem; color:#888;">Sem confirmados.</p>`;
        return;
    }

    presentPlayers.forEach(p => {
        const label = document.createElement("label");
        label.style.display = "flex";
        label.style.alignItems = "center";
        label.style.gap = "0.35rem";
        label.style.cursor = "pointer";
        label.style.userSelect = "none";
        label.style.marginBottom = "0.15rem";
        label.style.color = "#ffffff";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = p.id;
        checkbox.style.cursor = "pointer";

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(`${p.name} ${p.isGoalkeeper ? "(G)" : ""}`));
        listDiv.appendChild(label);
    });
}

// ==========================================
// CONTROLE DE GAVETA DO MENU HAMBÚRGUER (DRAWER)
// ==========================================

function openAppDrawer() {
    const drawer = document.getElementById("app-drawer");
    if (!drawer) return;
    drawer.style.display = "block";
    setTimeout(() => {
        drawer.classList.add("active");
    }, 10);
}

function closeAppDrawer() {
    const drawer = document.getElementById("app-drawer");
    if (!drawer) return;
    drawer.classList.remove("active");
    setTimeout(() => {
        drawer.style.display = "none";
    }, 300);
}

// ==========================================
// ROTAÇÃO AUTOMÁTICA DE TIMES E FILA DE ESPERA
// ==========================================

function handleRotation(winnerIndex, loserIndex) {
    const { teams, bench } = state.drawResults;
    if (!teams || teams.length < 2) return;

    const winnerTeam = teams[winnerIndex];
    const loserTeam = teams[loserIndex];
    const playersPerTeam = teams[0].players.length; // Usa tamanho atual do time sorteado

    console.log(`Rodízio: ${winnerTeam.name} venceu. ${loserTeam.name} perdeu e vai para o fim da fila.`);

    // 1. Envia os jogadores do perdedor para o final do bench (fila de espera)
    state.drawResults.bench = [...state.drawResults.bench, ...loserTeam.players];

    // 2. Cria o novo time pegando os jogadores da frente da fila
    const newTeamPlayers = state.drawResults.bench.splice(0, playersPerTeam);

    // 3. Monta o novo time (Time C, D, E...)
    const incomingTeamName = `Time ${state.nextTeamLetter}`;
    const newTeam = {
        name: incomingTeamName,
        players: newTeamPlayers
    };

    // Incrementa a letra para o próximo time (C -> D -> E ...)
    let nextCharCode = state.nextTeamLetter.charCodeAt(0) + 1;
    if (nextCharCode > 90) { // Limita até Z e depois volta pro A
        nextCharCode = 65; 
    }
    state.nextTeamLetter = String.fromCharCode(nextCharCode);

    // 4. Atualiza os times ativos:
    // O vencedor fica no índice 0 (Time A) e o desafiante entra no índice 1 (Time B)
    state.drawResults.teams = [winnerTeam, newTeam];

    // 5. Salva no localStorage e re-renderiza
    saveLastDraw();
    saveHistory(); // Salva a letra do time
    renderLastDraw();
    populateMatchTeamsDropdowns();
}

// ==========================================
// TRATAMENTO DE DECISÃO MANUAL EM CASO DE EMPATE
// ==========================================

function handleManualDrawDecision(winnerIndex) {
    // Esconde o painel de decisão
    document.getElementById("draw-decision-panel").style.display = "none";

    const loserIndex = winnerIndex === 0 ? 1 : 0;
    
    // Roda a fila normalmente usando quem o coordenador escolheu como vencedor
    handleRotation(winnerIndex, loserIndex);

    // Conclui o fluxo da partida e volta para a tela de configurações
    endMatchProcess(false); // false evita re-adicionar gols/histórico já salvos
}

// ==========================================
// MOEDA DE CARA OU COROA INTERATIVA
// ==========================================

function spinVirtualCoin() {
    const coin = document.getElementById("virtual-coin");
    const spinBtn = document.getElementById("btn-spin-coin");
    const resultDiv = document.getElementById("coin-flip-result");
    const confirmBtn = document.getElementById("btn-confirm-coin-result");

    if (!coin || !spinBtn) return;

    // Desativa botão durante o giro
    spinBtn.disabled = true;
    spinBtn.textContent = "Girando... 🪙";
    resultDiv.textContent = "";
    confirmBtn.classList.add("hidden");

    // Remove animações anteriores
    coin.className = "coin";

    // Escolhe o resultado (50% Cara, 50% Coroa)
    const isHeads = Math.random() < 0.5;
    state.coinFlipWinnerIndex = isHeads ? 0 : 1; // 0 = Cara (Time A), 1 = Coroa (Time B)

    const teamAName = document.getElementById("team-a-title").textContent;
    const teamBName = document.getElementById("team-b-title").textContent;

    // Trigger da animação do CSS3
    setTimeout(() => {
        if (isHeads) {
            coin.classList.add("spin-heads-anim");
        } else {
            coin.classList.add("spin-tails-anim");
        }
    }, 50);

    // Mostra resultado após a animação de 1.5s
    setTimeout(() => {
        spinBtn.disabled = false;
        spinBtn.textContent = "Lançar Moeda 🪙";
        spinBtn.classList.add("hidden"); // Oculta para não re-jogar na mesma rodada
        confirmBtn.classList.remove("hidden");

        if (isHeads) {
            resultDiv.innerHTML = `⭐ Resultado: <span style="color: #fbbf24; font-weight:900;">CARA</span><br><small style="font-weight: 600; color: var(--text-muted);">${teamAName} continua em campo!</small>`;
        } else {
            resultDiv.innerHTML = `👑 Resultado: <span style="color: #fbbf24; font-weight:900;">COROA</span><br><small style="font-weight: 600; color: var(--text-muted);">${teamBName} continua em campo!</small>`;
        }
    }, 1600);
}
