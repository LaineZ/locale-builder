import { toggle, isOpen } from "../../state/treeState.js";
import {addNewKey, removeKey} from "../../state/locale.js";

export function TreeNode({ node, name, path = "root" }) {
    const isObject = node && typeof node === "object";
    const currentPath = path + "." + name;

    return (
        <div class="tree-node">
            <div class="tree-row" onclick={() => isObject && toggle(currentPath)}>

                {isObject && (
                    <span class="arrow">
                        {isOpen(currentPath) ? "▼" : "▶"}
                    </span>
                )}
                <input
                    type="text"
                    value={name}
                    oninput={(e) => name = e.target.value}
                />

                {!isObject && (
                    <input
                        type="text"
                        value={node}
                        oninput={(e) => node = e.target.value}
                    />
                )}
                <button onclick={() => removeKey(currentPath)}>-</button>
            </div>

            {isObject && isOpen(currentPath) && (
                <div class="tree-children">
                    {Object.entries(node).map(([k, v]) => (
                        <TreeNode
                            node={v}
                            name={k}
                            path={currentPath}
                        />
                    ))}
            
                    <button onclick={() => addNewKey(currentPath)}>+</button>
                </div>
            )}
        </div>
    );
}