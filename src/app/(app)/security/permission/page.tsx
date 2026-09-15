"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { RoundLoader } from "@/components/ui/RoundLoader";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { TableSectionHeader } from "@/components/ui/TableSectionHeader";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError } from "@/lib/api/client";
import {
  groupMatrixRows,
  roleMenuService,
  type RoleMenuMatrixRow,
} from "@/lib/api/services/role-menu.service";
import { roleService } from "@/lib/api/services/role.service";

type RoleOption = {
  value: string;
  label: string;
  isAdmin: boolean;
};

export default function RoleMenuPermissionPage() {
  const toast = useToast();
  const [rolesLoading, setRolesLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roleOptions, setRoleOptions] = useState<RoleOption[]>([]);
  const [roleId, setRoleId] = useState("");
  const [matrixRows, setMatrixRows] = useState<RoleMenuMatrixRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [menuSearch, setMenuSearch] = useState("");

  const selectedRole = useMemo(
    () => roleOptions.find((option) => option.value === roleId) ?? null,
    [roleOptions, roleId],
  );
  const isAdminRole =
    selectedRole?.isAdmin === true || matrixRows.some((row) => row.isAdmin);

  const groups = useMemo(() => {
    const term = menuSearch.trim().toLowerCase();
    const filtered = term
      ? matrixRows.filter(
          (row) =>
            row.label.toLowerCase().includes(term) ||
            row.menuName.toLowerCase().includes(term) ||
            row.route.toLowerCase().includes(term),
        )
      : matrixRows;
    return groupMatrixRows(filtered);
  }, [matrixRows, menuSearch]);

  const selectedCount = selected.size;
  const totalCount = matrixRows.length;

  const loadRoles = useCallback(async () => {
    setRolesLoading(true);
    try {
      const rows = await roleService.list({ status: 1 });
      const options = rows
        .map((row) => {
          const id = Number(row.Role_Id ?? row.id ?? 0);
          if (!id) return null;
          return {
            value: String(id),
            label: String(row.Role_Name ?? `Role ${id}`),
            isAdmin: Boolean(row.Is_Admin),
          } satisfies RoleOption;
        })
        .filter((option): option is RoleOption => option !== null);

      setRoleOptions(options);
      setRoleId((prev) => {
        if (prev && options.some((option) => option.value === prev)) return prev;
        return options[0]?.value ?? "";
      });
    } catch (error) {
      setRoleOptions([]);
      setRoleId("");
      toast.error({
        title: "Unable to load roles",
        message: error instanceof ApiError ? error.message : "Check the API connection and try again.",
      });
    } finally {
      setRolesLoading(false);
    }
  }, [toast]);

  const loadMatrix = useCallback(
    async (nextRoleId: string) => {
      if (!nextRoleId) {
        setMatrixRows([]);
        setSelected(new Set());
        return;
      }

      setMatrixLoading(true);
      try {
        const rows = await roleMenuService.matrix({ role_id: Number(nextRoleId) });
        setMatrixRows(rows);
        setSelected(new Set(rows.filter((row) => row.isAssigned).map((row) => row.menuSl)));
      } catch (error) {
        setMatrixRows([]);
        setSelected(new Set());
        toast.error({
          title: "Unable to load permissions",
          message:
            error instanceof ApiError ? error.message : "Failed to load role menu permission matrix.",
        });
      } finally {
        setMatrixLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    void loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    void loadMatrix(roleId);
  }, [loadMatrix, roleId]);

  const toggleMenu = (menuSl: number, checked: boolean) => {
    if (isAdminRole || saving) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(menuSl);
      else next.delete(menuSl);
      return next;
    });
  };

  const setGroupSelection = (menuSls: number[], checked: boolean) => {
    if (isAdminRole || saving) return;
    setSelected((prev) => {
      const next = new Set(prev);
      for (const menuSl of menuSls) {
        if (checked) next.add(menuSl);
        else next.delete(menuSl);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (isAdminRole || saving) return;
    setSelected(new Set(matrixRows.map((row) => row.menuSl)));
  };

  const clearAll = () => {
    if (isAdminRole || saving) return;
    setSelected(new Set());
  };

  const handleSave = async () => {
    if (!roleId) {
      toast.error({
        title: "Select a role",
        message: "Choose a role before saving menu permissions.",
      });
      return;
    }
    if (isAdminRole) {
      toast.error({
        title: "Admin role",
        message: "Administrator roles already have access to all menus.",
      });
      return;
    }

    setSaving(true);
    try {
      await roleMenuService.sync({
        role_id: Number(roleId),
        menu_sls: Array.from(selected).sort((a, b) => a - b),
      });
      toast.success({
        title: "Permissions saved",
        message: `Updated menu access for ${selectedRole?.label ?? "selected role"}.`,
      });
      await loadMatrix(roleId);
    } catch (error) {
      toast.error({
        title: "Save failed",
        message:
          error instanceof ApiError ? error.message : "Failed to sync role menu permissions.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Role Menu Permission" section="Security" hideTitle />
      <div className="container-fluid">
        <div className="card">
          <div className="card-body">
            <TableSectionHeader
              title="Role Menu Permission"
              action={
                !rolesLoading && roleId && !isAdminRole ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving || matrixLoading}
                    onClick={() => void handleSave()}
                  >
                    {saving ? "Saving..." : "Save Permissions"}
                  </button>
                ) : undefined
              }
            />

            {rolesLoading ? (
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>Loading roles…</p>
              </div>
            ) : (
              <>
                <div className="permission-toolbar">
                  <div className="form-field permission-role-field">
                    <label className="form-field-label" htmlFor="permission-role">
                      Role
                    </label>
                    <SearchableSelect
                      id="permission-role"
                      value={roleId}
                      onChange={setRoleId}
                      options={roleOptions}
                      placeholder="Select role"
                      emptyLabel="Select role"
                      allowEmpty={false}
                      clearable={false}
                      disabled={saving || roleOptions.length === 0}
                    />
                  </div>

                  <div className="form-field permission-search-field">
                    <label className="form-field-label" htmlFor="permission-menu-search">
                      Search menus
                    </label>
                    <input
                      id="permission-menu-search"
                      className="form-control"
                      type="search"
                      value={menuSearch}
                      onChange={(event) => setMenuSearch(event.target.value)}
                      placeholder="Filter by menu name or route"
                      disabled={!roleId || matrixLoading}
                    />
                  </div>

                  <div className="permission-meta">
                    <span className="permission-count">
                      {selectedCount} of {totalCount} selected
                    </span>
                    {!isAdminRole ? (
                      <div className="permission-bulk-actions">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={selectAll}
                          disabled={!roleId || matrixLoading || saving || totalCount === 0}
                        >
                          Select all
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={clearAll}
                          disabled={!roleId || matrixLoading || saving || selectedCount === 0}
                        >
                          Clear
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {isAdminRole ? (
                  <div className="permission-admin-note" role="status">
                    This is an administrator role. All menus are granted automatically and cannot be
                    edited here.
                  </div>
                ) : null}

                {!roleId ? (
                  <div className="permission-empty">
                    <p>Select a role to manage menu permissions.</p>
                  </div>
                ) : matrixLoading ? (
                  <div className="employee-profile-loading">
                    <RoundLoader />
                    <p>Loading permission matrix…</p>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="permission-empty">
                    <p>No menus found for this role.</p>
                  </div>
                ) : (
                  <div className="permission-matrix">
                    {groups.map((group) => {
                      const groupIds = group.items.map((item) => item.menuSl);
                      const assignedInGroup = groupIds.filter((id) => selected.has(id)).length;
                      const allChecked = assignedInGroup === groupIds.length && groupIds.length > 0;
                      const someChecked = assignedInGroup > 0 && !allChecked;

                      return (
                        <section key={group.menuId} className="permission-group">
                          <div className="permission-group-head">
                            <label className="check-label permission-group-title">
                              <input
                                type="checkbox"
                                checked={allChecked}
                                ref={(element) => {
                                  if (element) element.indeterminate = someChecked;
                                }}
                                onChange={(event) =>
                                  setGroupSelection(groupIds, event.target.checked)
                                }
                                disabled={isAdminRole || saving}
                              />
                              <span>{group.menuName}</span>
                            </label>
                            <span className="permission-group-count">
                              {assignedInGroup}/{groupIds.length}
                            </span>
                          </div>

                          <div className="permission-group-items">
                            {group.items.map((item) => (
                              <label key={item.menuSl} className="check-label permission-item">
                                <input
                                  type="checkbox"
                                  checked={selected.has(item.menuSl)}
                                  onChange={(event) =>
                                    toggleMenu(item.menuSl, event.target.checked)
                                  }
                                  disabled={isAdminRole || saving}
                                />
                                <span className="permission-item-copy">
                                  <span className="permission-item-label">{item.label}</span>
                                  {item.route ? (
                                    <span className="permission-item-route">{item.route}</span>
                                  ) : null}
                                </span>
                              </label>
                            ))}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}

                {roleId && !isAdminRole && !matrixLoading && groups.length > 0 ? (
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={saving}
                      onClick={() => void handleSave()}
                    >
                      {saving ? "Saving..." : "Save Permissions"}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
