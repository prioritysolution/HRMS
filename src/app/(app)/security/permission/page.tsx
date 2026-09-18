"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
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
import { useI18n } from "@/i18n";

type RoleOption = {
  value: string;
  label: string;
  isAdmin: boolean;
};

export default function RoleMenuPermissionPage() {
  const { t } = useI18n();
  const toast = useToast();
  const [rolesLoading, setRolesLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
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
        title: t("security.permission.loadRolesFailed"),
        message:
          error instanceof ApiError ? error.message : t("security.permission.loadRolesHint"),
      });
    } finally {
      setRolesLoading(false);
    }
  }, [toast, t]);

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
          title: t("security.permission.loadPermissionsFailed"),
          message:
            error instanceof ApiError
              ? error.message
              : t("security.permission.loadPermissionsHint"),
        });
      } finally {
        setMatrixLoading(false);
      }
    },
    [toast, t],
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

  const requestSave = () => {
    if (!roleId) {
      toast.error({
        title: t("security.permission.selectRoleTitle"),
        message: t("security.permission.selectRoleMessage"),
      });
      return;
    }
    if (isAdminRole) {
      toast.error({
        title: t("security.permission.adminRoleTitle"),
        message: t("security.permission.adminRoleMessage"),
      });
      return;
    }
    setConfirmSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!roleId || isAdminRole) {
      setConfirmSaveOpen(false);
      return;
    }

    setSaving(true);
    try {
      await roleMenuService.sync({
        role_id: Number(roleId),
        menu_sls: Array.from(selected).sort((a, b) => a - b),
      });
      setConfirmSaveOpen(false);
      toast.success({
        title: t("security.permission.savedTitle"),
        message: t("security.permission.savedMessage", {
          role: selectedRole?.label ?? t("security.permission.selectedRole"),
        }),
      });
      await loadMatrix(roleId);
    } catch (error) {
      toast.error({
        title: t("security.permission.saveFailedTitle"),
        message:
          error instanceof ApiError
            ? error.message
            : t("security.permission.saveFailedMessage"),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t("security.permission.title")}
        section={t("security.permission.section")}
        hideTitle
      />
      <div className="container-fluid">
        <div className="card">
          <div className="card-body">
            <TableSectionHeader
              title={t("security.permission.title")}
              action={
                !rolesLoading && roleId && !isAdminRole ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={saving || matrixLoading}
                    onClick={requestSave}
                  >
                    {saving ? t("security.permission.saving") : t("security.permission.save")}
                  </button>
                ) : undefined
              }
            />

            {rolesLoading ? (
              <div className="employee-profile-loading">
                <RoundLoader />
                <p>{t("security.permission.loadingRoles")}</p>
              </div>
            ) : (
              <>
                <div className="permission-toolbar">
                  <div className="form-field permission-role-field">
                    <label className="form-field-label" htmlFor="permission-role">
                      {t("security.permission.role")}
                    </label>
                    <SearchableSelect
                      id="permission-role"
                      value={roleId}
                      onChange={setRoleId}
                      options={roleOptions}
                      placeholder={t("security.permission.selectRole")}
                      emptyLabel={t("security.permission.selectRole")}
                      allowEmpty={false}
                      clearable={false}
                      disabled={saving || roleOptions.length === 0}
                    />
                  </div>

                  <div className="form-field permission-search-field">
                    <label className="form-field-label" htmlFor="permission-menu-search">
                      {t("security.permission.searchMenus")}
                    </label>
                    <input
                      id="permission-menu-search"
                      className="form-control"
                      type="search"
                      value={menuSearch}
                      onChange={(event) => setMenuSearch(event.target.value)}
                      placeholder={t("security.permission.searchPlaceholder")}
                      disabled={!roleId || matrixLoading}
                    />
                  </div>

                  <div className="permission-meta">
                    <span className="permission-count">
                      {t("security.permission.selectedCount", {
                        selected: selectedCount,
                        total: totalCount,
                      })}
                    </span>
                    {!isAdminRole ? (
                      <div className="permission-bulk-actions">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={selectAll}
                          disabled={!roleId || matrixLoading || saving || totalCount === 0}
                        >
                          {t("security.permission.selectAll")}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={clearAll}
                          disabled={!roleId || matrixLoading || saving || selectedCount === 0}
                        >
                          {t("security.permission.clear")}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {isAdminRole ? (
                  <div className="permission-admin-note" role="status">
                    {t("security.permission.adminNote")}
                  </div>
                ) : null}

                {!roleId ? (
                  <div className="permission-empty">
                    <p>{t("security.permission.selectRoleHint")}</p>
                  </div>
                ) : matrixLoading ? (
                  <div className="employee-profile-loading">
                    <RoundLoader />
                    <p>{t("security.permission.loadingMatrix")}</p>
                  </div>
                ) : groups.length === 0 ? (
                  <div className="permission-empty">
                    <p>{t("security.permission.noMenus")}</p>
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
                      onClick={requestSave}
                    >
                      {saving ? t("security.permission.saving") : t("security.permission.save")}
                    </button>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmSaveOpen}
        onClose={() => {
          if (!saving) setConfirmSaveOpen(false);
        }}
        onConfirm={handleConfirmSave}
        title={t("security.permission.confirmTitle")}
        message={t("security.permission.confirmMessage", {
          role: selectedRole?.label ?? t("security.permission.thisRole"),
          count: selectedCount,
        })}
        confirmLabel={t("security.permission.save")}
        cancelLabel={t("common.cancel")}
        loading={saving}
      />
    </>
  );
}
