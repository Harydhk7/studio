import { AdminOptionListPage } from "./AdminOptionListPage";

export default function AdminColors() {
  return (
    <AdminOptionListPage
      type="colors"
      title="Color List"
      addButtonText="Add Color"
      helperText="Manage global colors used by products when color checkbox is enabled."
    />
  );
}
