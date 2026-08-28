import { AdminOptionListPage } from "./AdminOptionListPage";

export default function AdminSizes() {
  return (
    <AdminOptionListPage
      type="sizes"
      title="Size List"
      addButtonText="Add Size"
      helperText="Manage global sizes used by products when size checkbox is enabled."
    />
  );
}
