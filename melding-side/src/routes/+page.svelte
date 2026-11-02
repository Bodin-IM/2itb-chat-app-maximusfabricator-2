        <script>

        import { onMount } from "svelte";

        const API = "http://localhost:3000";

        let avsender = $state("");
        let tekst = $state("");
        let meldinger = $state([]);
        let status = $state("");
        let filter = $state("");

        let visMeldinger = $derived(
            filter.trim() //ниже тернарный оператор 
            ? meldinger.filter(m => m.avsender.toLowerCase().includes(filter.trim().toLowerCase()))
            : meldinger
        );
        
        async function hentMeldinger() { 
            try {
                const svar = await fetch(`${API}/meldinger`); // делает get запрос на сервер
                if (!svar.ok) throw new Error(`HTTP ${svar.status}`); //если сервер вернул ошибку, то выбрасываем исключение
 
                meldinger = await svar.json(); //получаем json с сервера и присваиваем его переменной meldinger
                status = "Meldingene er hentet."; //обновляем статус
            } catch (feil) {
                status = `Kunne ikke hente: ${feil.message}`;
            }
        }

        async function sendMelding() {
            try {
                const svar = await fetch(`${API}/meldinger`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" }, //говорим серверу что отправляем данные в json
                    body: JSON.stringify({ avsender, tekst})
                });

                const data = await svar.json(); //сервер отправляет json, ждем await.svar.json() и присваиваем его переменной data
                if (!svar.ok) throw new Error(data.beskjed);

                status = data.beskjed;
                tekst = "";
                hentMeldinger();
            } catch (feil) {
                status = `Kunne ikke sende: ${feil.message}`;
            }
        };

        // Функция-помощник прямо в скрипте

        function formatereTid(isoString) {
            return new Date(isoString).toLocaleTimeString('no-NO', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }

            //функция hentMeldinger() с интервалом, что-бы каждый раз не жать кнопку и обновлять страницу ЭТО Я КОММЕНТ ПИСАЛ КЛЯНУСЬ
            onMount(() => {
                hentMeldinger();
                const interval = setInterval(hentMeldinger, 3000);
                return () => clearInterval(interval);
            });
        </script>

        <h1>Meldinger</h1>

        <div id="filter">
            <label>
            Filtrer etter avsender
            <input bind:value={filter} />
            </label>
        </div>

        <label>
            Avsender
            <input bind:value={avsender} />
        </label>
        
        <label>
            Melding
            <input bind:value={tekst} />
        </label>

        <button disabled={!avsender.trim() || !tekst.trim()} onclick={sendMelding}>Send melding</button>

        <p>{status}</p>

        {#each visMeldinger as melding}
        <div id="melding">
            <h4><strong>{melding.avsender}:</strong>{melding.tekst}</h4>
            <p id="tid">{formatereTid(melding.opprettet)}</p>
        </div>
        {/each}

        <style>
            #melding{
                padding: 10px;
                margin-bottom: 10px;
            }

            #tid {
                font-size: 0.8rem;
                color: gray;
            }
            #filter{
                margin-bottom: 30px;
            }
        </style>