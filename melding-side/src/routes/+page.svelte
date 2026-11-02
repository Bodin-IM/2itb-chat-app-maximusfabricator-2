
<script>

import { onMount } from "svelte";

const API = "http://10.100.0.162:3000";

  let avsender = $state("");
  let tekst = $state("");
  let meldinger = $state([]);
  let status = $state("");
  let filter = $state("");

  async function hentMeldinger() { 
      try {
          let url = `${API}/meldinger`
          if (filter.trim()){
            url += `?avsender=${encodeURIComponent(filter)}`;
          }
          const svar = await fetch(url);
          if (!svar.ok) throw new Error(`HTTP ${svar.status}`);

          meldinger = await svar.json();
          status = "Meldingene er hentet.";
      } catch (feil) {
          status = `Kunne ikke hente: ${feil.message}`;
      }
      console.log(meldinger)
  }

  async function sendMelding() {
      try {
          const svar = await fetch(`${API}/meldinger`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ avsender, tekst})
          });

          const data = await svar.json();
          if (!svar.ok) throw new Error(data.beskjed);

          status = data.beskjed;
          tekst = "";
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

  //чистая функция чтобы не вызывать 2 в одной onclick
    function handleButtonClick() {
        sendMelding()
        hentMeldinger()
    }
    //функция hentMeldinger() с интервалом, что-бы каждый раз не жать кнопку и обновлять страницу ЭТО Я КОММЕНТ ПИСАЛ КЛЯНУСЬ
    onMount(() => {
        hentMeldinger();
        const interval = setInterval(hentMeldinger, 3000);
        return () => clearInterval(interval);
    });
</script>

<h1>Meldinger</h1>

<label>
  Filtrer etter avsender
  <input bind:value={filter} />
</label>

<label>
  Avsender
  <input bind:value={avsender} />
</label>

<label>
  Melding
  <input bind:value={tekst} />
</label>

<button disabled={!avsender.trim() || !tekst.trim()} onclick={handleButtonClick}>Send melding</button>

<p>{status}</p>

{#each meldinger as melding}
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
</style>