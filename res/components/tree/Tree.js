import { addNewKey, addNewSection } from "../../state/locale";
import { TreeNode } from "./TreeNode";

export function Tree(props) {
  const { data, parentId = null, parentIsArray = false } = props;

  return (
    <div class="tree">
      {Array.isArray(data) && data.map(node => (
        <TreeNode node={node} parentIsArray={parentIsArray} />
      ))}

      <button onclick={() => addNewKey(parentId)}>
        +
      </button>
    </div>
  );
}