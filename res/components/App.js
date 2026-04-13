import { Tree } from "./tree/Tree.js";
import {changeLocaleFile, model, openMasterLocaleFile, saveAll, syncAll} from "../state/locale.js";
import { addNewSection } from "../state/locale.js";

export function App() {
  const state = model.value;

  return (
    <div id="app">
        <header>
            <button onclick={() => openMasterLocaleFile()}>Open master locale file</button>
            <button onclick={() => addNewSection()}>New section</button>
            <button onclick={() => syncAll()}>Sync</button>
            <button onclick={() => saveAll()}>Save all</button>
            <select value={state.selectedLocaleFileIndex} onchange={(e) => {
              changeLocaleFile(Number(e.target.value));
            }}>
              {state.files.map((v, i) => (
                <option value={i}>
                  {v.fileName} {i == 0 && " (primary)"}
                </option>
              ))}
            </select>
        </header>
        <div class="window">
            <aside>
                <Tree key={state.selectedLocaleFileIndex} data={state.files[state.selectedLocaleFileIndex]?.tree ?? []} />
            </aside>
            <main>
                
            </main>
        </div>
    </div>
  );
}