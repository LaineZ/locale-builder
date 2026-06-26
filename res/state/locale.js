import {cleanupExpanded} from "./treeState";

const { signal } = Reactor;
import * as sys from "@sys";
import * as sctr from "@sciter";
import { Translator } from "../core/translator";

export const model = signal({
  selectedLocaleFileIndex: 0,
  files: []
});

const translator = new Translator();

let currentDirectory = "";
let idCounter = 0;

function toTree(obj) {
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) {
      return obj.map((item, index) => ({
        id: "node_" + idCounter++,
        key: String(index),
        value: typeof item === "object" ? null : item,
        children: typeof item === "object" ? toTree(item) : null,
        expanded: false
      }));
    }
    return Object.entries(obj).map(([k, v]) => {
      const isArr = Array.isArray(v);
      return {
        id: "node_" + idCounter++,
        key: k,
        value: isArr ? null : (typeof v === "object" ? null : v),
        children: isArr ? toTree(v) : (typeof v === "object" ? toTree(v) : null),
        expanded: false,
        ...(isArr ? {isArray: true} : {})
      };
    });
  }
  return [];
}

function fromTree(nodes) {
  const obj = {};

  for (const node of nodes) {
    if (node.children) {
      obj[node.key] = node.isArray ? fromArray(node.children) : fromTree(node.children);
    } else {
      obj[node.key] = node.value;
    }
  }

  return obj;
}

function fromArray(nodes) {
  return nodes.map(node => {
    if (node.children) {
      return node.isArray ? fromArray(node.children) : fromTree(node.children);
    }
    return node.value;
  });
}


function syncKeysStrict(primaryNodes, targetNodes, isArray = false) {
  const result = [];

  for (let i = 0; i < primaryNodes.length; i++) {
    const pNode = primaryNodes[i];
    const tNode = isArray ? targetNodes[i] : targetNodes.find(n => n.key === pNode.key);

    const synced = {
      id: pNode.id,
      key: isArray ? String(i) : pNode.key,
      value: (tNode?.value ?? pNode.value) ?? "",
      expanded: tNode?.expanded ?? false,
      children: null,
      isArray: pNode.isArray
    };

    if (pNode.children) {
      synced.children = syncKeysStrict(
        pNode.children,
        tNode?.children ?? [],
        pNode.isArray
      );
    }

    result.push(synced);
  }

  return result;
}

export async function translate(id, text) {
  const modelValue = model.value;
  const from = modelValue.files[0].fileName.replace(".json", "");
  const to = modelValue.files[modelValue.selectedLocaleFileIndex].fileName.replace(".json", "");
  const response = await translator.translate(text, from, to);
  if (response) {
    updateValue(id, response);
  }
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

    model.value.files = [];
    model.value.selectedLocaleFileIndex = 0;

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
  const files = model.value.files;
  const primary = files[0];

  for (let i = 1; i < files.length; i++) {
    files[i].tree = syncKeysStrict(primary.tree, files[i].tree ?? []);
  }

  model.value = { ...model.value };
  cleanupExpanded();
}

export function saveAll() {
  for (const locale of model.value.files) {
    const handle = sys.fs.sync.open(currentDirectory + "/" + locale.fileName, "w");
    const json = fromTree(locale.tree);
    handle.writeSync(sctr.encode(JSON.stringify(json, null, 4), "utf-8"));
  }
}

function readLocaleFile(fileName) {
  const path = currentDirectory + "/" + fileName;
  let data = sys.fs.sync.readfile(path);
  let text = sctr.decode(data, "utf-8");

  model.value.files.push({
    fileName,
    tree: toTree(JSON.parse(text))
  });

  model.send(model.value);
}

export function changeLocaleFile(index) {
  model.value.selectedLocaleFileIndex = index;
  model.send(model.value);
  cleanupExpanded();
}

function findById(nodes, id) {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (n.children) {
      const res = findById(n.children, id);
      if (res) return res;
    }
  }
  return null;
}

export function updateValue(id, value) {
  const file = model.value.files[model.value.selectedLocaleFileIndex];
  const node = findById(file.tree, id);

  if (!node) return;

  node.value = value;

  model.send(model.value);
}

export function updateKey(id, newKey) {
  const file = model.value.files[model.value.selectedLocaleFileIndex];

  function findParent(nodes, id) {
    for (const n of nodes) {
      if (n.children?.some(c => c.id === id)) return n;
      if (n.children) {
        const res = findParent(n.children, id);
        if (res) return res;
      }
    }
    return null;
  }

  const node = findById(file.tree, id);
  const parent = findParent(file.tree, id);

  if (!node || !parent) return;
  if (parent.isArray) return;

  node.key = newKey;

  model.send(model.value);
}



export function removeKey(id) {
  const file = model.value.files[model.value.selectedLocaleFileIndex];

  function remove(nodes, parent) {
    const idx = nodes.findIndex(n => n.id === id);
    if (idx !== -1) {
      nodes.splice(idx, 1);
      if (parent?.isArray) {
        nodes.forEach((n, i) => { n.key = String(i); });
      }
      return true;
    }

    for (const n of nodes) {
      if (n.children && remove(n.children, n)) return true;
    }

    return false;
  }

  remove(file.tree, null);

  model.send(model.value);
}

export function addNewKey(parentId = null) {
  const file = model.value.files[model.value.selectedLocaleFileIndex];
  const parent = parentId ? findById(file.tree, parentId) : null;
  const isArray = parent?.isArray;

  const newNode = {
    id: "n_" + idCounter++,
    key: isArray ? String(parent.children?.length ?? 0) : "key",
    value: "value",
    children: null,
    expanded: false
  };

  if (!parentId) {
    file.tree.push(newNode);
  } else {
    if (!parent) return;
    if (!parent.children) parent.children = [];
    parent.children.push(newNode);
    if (isArray) parent.expanded = true;
  }

  model.send(model.value);
}

export function addNewSection(parentId = null) {
  const file = model.value.files[model.value.selectedLocaleFileIndex];
  const parent = parentId ? findById(file.tree, parentId) : null;
  const isArray = parent?.isArray;

  const newSection = {
    id: "node_" + idCounter++,
    key: isArray ? String(parent.children?.length ?? 0) : "section",
    value: null,
    children: [],
    expanded: true
  };

  if (!parentId) {
    file.tree.push(newSection);
  } else {
    if (!parent) return;

    if (!parent.children) parent.children = [];
    parent.children.push(newSection);

    parent.expanded = true;
  }

  model.send(model.value);
}