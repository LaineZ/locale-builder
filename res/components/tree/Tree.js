import { addNewKey, addNewSection } from "../../state/locale";
import { TreeNode } from "./TreeNode";

export function Tree(props) {
  const { data } = props;

  return (
    <div class="tree">
      {Object.entries(data).map(([key, value]) => (
        <TreeNode node={value} name={key} />
      ))}
      <button onclick={() => addNewKey()}>+</button>
    </div>
  );
}
