import { toggle, isOpen } from "../../state/treeState.js";
import {addNewKey, addNewSection, removeKey, updateValue, updateKey, translate} from "../../state/locale.js";
import { Tree } from "./Tree.js";

export function TreeNode({ node, parentIsArray = false }) {
  const isSection = node.children && node.children.length >= 0;
  const isArrayContainer = node.isArray === true;
  const currentId = node.id;

  return (
    <div class="tree-node">
      <div class="tree-row">

        {isSection && (
          <span
            class="arrow"
            onclick={() => toggle(currentId)}
          >
            {isOpen(currentId) ? "▼" : "▶"}
          </span>
        )}

        <input
          type="text"
          class={"key-input" + (parentIsArray ? " key-input--readonly" : "")}
          value={node.key}
          oninput={(e) => updateKey(currentId, e.target.value)}
          readonly={parentIsArray}
        />

        {!isSection ? (
          <input
            type="text"
            value={node.value ?? ""}
            oninput={(e) => updateValue(currentId, e.target.value)}
          />
        ) : null}

        <button onclick={() => removeKey(currentId)}>−</button>
        <button onclick={() => translate(currentId, node.value)}>T</button>
      </div>

      {isSection && isOpen(currentId) && (
        <div class="tree-children">
          <Tree data={node.children} parentId={currentId} parentIsArray={isArrayContainer} />
        </div>
      )}
    </div>
  );
}