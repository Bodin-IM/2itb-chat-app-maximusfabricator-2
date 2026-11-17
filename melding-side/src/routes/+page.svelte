<script>
    import { onMount } from "svelte";

    const API = "http://localhost:3000";

    let loginBrukernavn = $state("");
    let loginPassord = $state("");

    let regBrukernavn = $state("");
    let regPassord = $state("");


    let innloggetBruker = $state(null); // Кто сейчас вошел в систему
    let tekst = $state("");
    let meldinger = $state([]);
    let status = $state("");
    let filter = $state("");

    let visMeldinger = $derived(
        filter.trim()
            ? meldinger.filter((m) =>
                  m.avsender
                      .toLowerCase()
                      .includes(filter.trim().toLowerCase()),
              )
            : meldinger,
    );

    async function nyBruker(regBrukernavn, regPassord) {
        try {
            const svar = await fetch(`${API}/brukere`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ regBrukernavn, regPassord })
            });
            const data = await svar.json();
            if (!svar.ok) throw new Error(data.feil || "Kunne ikke opprette bruker");
            status = "Bruker opprettet! Du kan nå logge inn.";
        } catch (feil) {
            status = `Kunne ikke opprette ny bruker: ${feil.message}`;
        }
    }

    async function loggInn(loginBrukernavn, loginPassord) {
        try {
            const svar = await fetch(`${API}/login`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loginBrukernavn, loginPassord }),
            });

            const data = await svar.json();
            if (!svar.ok) throw new Error(data.feil || "Kunne ikke logge inn");

            innloggetBruker = data.bruker;
            status = "Logget inn.";
            hentMeldinger();
        } catch (feil) {
            status = `Kunne ikke logge inn: ${feil.message}`;
        }
    }

    async function loggUt() {
        try {
            const svar = await fetch(`${API}/logout`, {
                method: "POST",
                credentials: "include",
            });
            if (svar.ok) {
                innloggetBruker = null;
                status = "Logget ut.";
            }
        } catch (feil) {
            status = `Kunne ikke logge ut: ${feil.message}`;
        }
    }

    async function hentMeldinger() {
        try {
            const svar = await fetch(`${API}/meldinger`, {
                credentials: "include",
            });

            if (!svar.ok) throw new Error(`HTTP ${svar.status}`);

            meldinger = await svar.json();
        } catch (feil) {
            status = `Kunne ikke hente: ${feil.message}`;
        }
    }

    async function sendMelding() {
        try {
            const svar = await fetch(`${API}/meldinger`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tekst }),
            });

            const data = await svar.json();
            if (!svar.ok) throw new Error(data.beskjed);

            status = "";
            tekst = "";
            hentMeldinger();
        } catch (feil) {
            status = `Kunne ikke sende: ${feil.message}`;
        }
    }

    async function slettMelding(id) {
        try {
            const svar = await fetch(`${API}/meldinger/${id}`, {
                method: "DELETE",
                credentials: "include",
            });
            const data = await svar.json();
            if (!svar.ok) throw new Error(data.beskjed);
            await hentMeldinger();
            status = data.beskjed;
        } catch (feil) {
            status = `Kunne ikke slette: ${feil.message}`;
        }
    }

    function formatereTid(isoString) {
        return new Date(isoString).toLocaleTimeString("no-NO", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    onMount(() => {
        hentMeldinger();
        const interval = setInterval(hentMeldinger, 3000);
        return () => clearInterval(interval);
    });
</script>

<main class="container">
    <h1>💬 Meldinger</h1>

    {#if !innloggetBruker}
        <div class="auth-grid">
            <div class="card" id="loginn">
                <h2>Logg Inn</h2>
                <label>
                    Brukernavn
                    <input bind:value={loginBrukernavn} placeholder="Skriv brukernavn..." />
                </label>

                <label>
                    Passord
                    <input type="password" bind:value={loginPassord} placeholder="Skriv passord..." />
                </label>

                <button class="btn primary" onclick={() => loggInn(loginBrukernavn, loginPassord)}>Logg Inn</button>
            </div>

            <div class="card" id="registrerNyBruker">
                <h2>Ny Bruker</h2>
                <label>
                    Brukernavn
                    <input bind:value={regBrukernavn} placeholder="Velg brukernavn..." />
                </label>

                <label>
                    Passord
                    <input type="password" bind:value={regPassord} placeholder="Velg passord..." />
                </label>

                <button class="btn secondary" onclick={() => nyBruker(regBrukernavn, regPassord)}>Registrer deg</button>
            </div>
        </div>
    {:else}
        <div class="card session-card">
            <div id="profil">
                <p>Logget inn som: <strong>{innloggetBruker}</strong></p>
                <button class="btn danger-outline" onclick={loggUt}>Logg ut</button>
            </div>

            <div id="skriv" class="compose-box">
                <input bind:value={tekst} placeholder="Skriv en melding..." onkeydown={(e) => e.key === 'Enter' && !(!tekst.trim()) && sendMelding()} />
                <button class="btn primary" disabled={!tekst.trim()} onclick={sendMelding}>Send</button>
            </div>
        </div>
    {/if}

    <div id="filter" class="filter-box">
        <input bind:value={filter} placeholder="🔍 Filtrer etter avsender..." />
    </div>

    {#if status}
        <p class="status-msg">{status}</p>
    {/if}

    <div class="messages-list">
        {#each visMeldinger as melding}
            <div id="melding" class="message-card">
                <div class="message-header">
                    <strong>{melding.avsender}</strong>
                    <span id="tid">{formatereTid(melding.opprettet)}</span>
                </div>
                <p class="message-text">{melding.tekst}</p>
                
                {#if melding.avsender === innloggetBruker}
                    <button class="btn-text-danger" onclick={() => slettMelding(melding.id)}>Slett</button>
                {/if}
            </div>
        {/each}
    </div>
</main>

<style>
    :global(body) {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f7f9fc;
        color: #333;
        margin: 0;
        padding: 0;
    }

    .container {
        max-width: 600px;
        margin: 40px auto;
        padding: 20px;
    }

    h1 {
        text-align: center;
        color: #2c3e50;
        margin-bottom: 25px;
    }

    h2 {
        font-size: 1.2rem;
        margin-top: 0;
        color: #4a5568;
    }

    .auth-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
    }

    .card {
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .session-card {
        margin-bottom: 20px;
    }

    #profil {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
        padding-bottom: 10px;
        border-bottom: 1px solid #edf2f7;
    }

    label {
        display: block;
        font-size: 0.9rem;
        font-weight: 600;
        color: #4a5568;
        margin-bottom: 10px;
    }

    input {
        width: 100%;
        padding: 10px 12px;
        margin-top: 5px;
        margin-bottom: 15px;
        border: 1px solid #cbd5e0;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
        transition: border-color 0.2s;
    }

    input:focus {
        outline: none;
        border-color: #3182ce;
        box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
    }

    .compose-box {
        display: flex;
        gap: 10px;
    }

    .compose-box input {
        margin-bottom: 0;
    }

    .btn {
        padding: 10px 16px;
        border: none;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, opacity 0.2s;
    }

    .btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .btn.primary {
        background-color: #3182ce;
        color: white;
    }
    .btn.primary:hover:not(:disabled) {
        background-color: #2b6cb0;
    }

    .btn.secondary {
        background-color: #38a169;
        color: white;
    }
    .btn.secondary:hover {
        background-color: #2f855a;
    }

    .btn.danger-outline {
        background: transparent;
        border: 1px solid #e53e3e;
        color: #e53e3e;
        padding: 6px 12px;
    }
    .btn.danger-outline:hover {
        background: #fff5f5;
    }

    .filter-box {
        margin-bottom: 20px;
    }

    .status-msg {
        text-align: center;
        font-size: 0.9rem;
        color: #718096;
        margin-bottom: 15px;
    }

    .messages-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .message-card {
        background: white;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.03);
        position: relative;
        border-left: 4px solid #3182ce;
    }

    .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 6px;
    }

    .message-text {
        margin: 0;
        color: #2d3748;
        word-break: break-word;
    }

    #tid {
        font-size: 0.75rem;
        color: #a0aec0;
    }

    .btn-text-danger {
        background: none;
        border: none;
        color: #e53e3e;
        font-size: 0.8rem;
        cursor: pointer;
        padding: 0;
        margin-top: 8px;
    }
    .btn-text-danger:hover {
        text-decoration: underline;
    }

    @media (max-width: 600px) {
        .auth-grid {
            grid-template-columns: 1fr;
        }
    }
</style>