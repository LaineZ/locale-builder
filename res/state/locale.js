import {cleanupExpanded} from "./treeState";

const { signal } = Reactor;
import * as sys from "@sys";
import * as sctr from "@sciter";

export const model = signal({
  selectedLocaleFileIndex: 0,
  files: []
});

let currentDirectory = "";

function syncKeysStrict(primary, target) {
  const result = {};

  for (const key in primary) {
    const pVal = primary[key];
    const tVal = target?.[key];

    if (
      typeof pVal === "object" &&
      pVal !== null &&
      !Array.isArray(pVal)
    ) {
      result[key] = syncKeysStrict(pVal, tVal || {});
    } else {
      result[key] = key in target ? tVal : "";
    }
  }

  return result;
}

export function openMasterLocaleFile() {
  const filePath = Window.this.selectFile({
    mode: "open",
    filter: "JavaScript Object Notation (*.json)|*.json"
  });

  const fileSplit = filePath.split("/");
  const primaryFileName = fileSplit.pop();
  currentDirectory = fileSplit.join("/");

  try {
    let directory = sys.fs.sync.readdir(currentDirectory);
    const files = directory.map((x) => x.name);
    const orderedFiles = [
      primaryFileName,
      ...files.filter(f => f !== primaryFileName)
    ];


    for (const file of orderedFiles) {
      readLocaleFile(file);
    }

    if (!model.value.files.length) {
      console.error("Incorrect directory structure. Directory must have at least one file");
    }

  } catch (e) {
    console.error("Read error:", e);
  }
}

export function syncAll() {
  for (let i = 1; i < model.value.files.length; i++) {
    model.value.files[i].tree = syncKeysStrict(
      model.value.files[0].tree,
      model.value.files[i].tree
    );
  }
  model.send(model.value);
  cleanupExpanded();
}

export function saveAll() {
  for (const locale of model.value.files) {
    const handle = sys.fs.sync.open(currentDirectory + "/" + locale.fileName, "w");
    console.log(handle);
    handle.writeSync(sctr.encode(JSON.stringify(locale.tree, null, 4), "utf-8"));
  }
}

function readLocaleFile(fileName) {
  const path = currentDirectory + "/" + fileName;
  console.log(path);
  let data = sys.fs.sync.readfile(path);

  let text = sctr.decode(data, "utf-8");
  model.value.files.push({ fileName: fileName, tree: JSON.parse(text) });
  model.send(model.value);
}

export function changeLocaleFile(index) {
  model.value.selectedLocaleFileIndex = index;
  model.send(model.value);
  cleanupExpanded();
  console.log("locale change!", model.value.selectedLocaleFileIndex);
}

function getNodeByPath(tree, path) {
  const parts = 
    path.split(".")
    .filter(Boolean)
    .filter(p => p !== "root");

  let current = tree;

  for (const p of parts) {
    if (!current[p]) return null;
    current = current[p];
  }

  return current;
}

export function removeKey(path) {
  if (path === "root") return;
  const parts = path
    .split(".")
    .filter(Boolean)
    .filter(p => p !== "root");

  const keyToDelete = parts.pop();

  let parent = model.value.files[model.value.selectedLocaleFileIndex].tree;

  for (const p of parts) {
    if (!parent[p]) return;
    parent = parent[p];
  }

  delete parent[keyToDelete];

  model.value = { ...model.value };
}

export function addNewKey(path = "root") {
  const target = getNodeByPath(model.value.files[model.value.selectedLocaleFileIndex].tree, path) ??
    model.value.files[model.value.selectedLocaleFileIndex].tree;

  const key = "key" + Object.keys(target).length;

  target[key] = "value";

  model.value = {
    ...model.value
  };
}

export function addNewSection(path = "root") {
  const target = path === "root"
    ? model.value.files[model.value.selectedLocaleFileIndex].tree
    : getNodeByPath(model.value.files[model.value.selectedLocaleFileIndex].tree, path);

  const key = "section" + Object.keys(target).length;

  target[key] = {};
  model.value = {
    ...model.value
  };
}