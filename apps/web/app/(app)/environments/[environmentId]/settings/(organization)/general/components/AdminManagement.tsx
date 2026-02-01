"use client";

import { useTranslate } from "@tolgee/react";
import { ArrowRightLeftIcon, PlusIcon, TrashIcon, UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SettingsCard } from "@/app/(app)/environments/[environmentId]/settings/components/SettingsCard";
import { Button } from "@/modules/ui/components/button";
import { ConfirmationModal } from "@/modules/ui/components/confirmation-modal";
import { Input } from "@/modules/ui/components/input";
import { Label } from "@/modules/ui/components/label";
import { MultiSelect } from "@/modules/ui/components/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/modules/ui/components/select";
import {
  createAdminAction,
  deleteAdminAction,
  getAdminsAction,
  getProjectsAction,
  transferOwnershipAction,
} from "../actions";

interface Admin {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
}

interface AdminManagementProps {
  organizationId: string;
}

export const AdminManagement = ({ organizationId }: AdminManagementProps) => {
  const { t } = useTranslate();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState(false);

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    password: "",
    role: "manager",
    projectIds: [] as string[],
  });

  const fetchAdmins = async () => {
    setIsLoading(true);
    try {
      const result = await getAdminsAction({ organizationId });
      if (result?.data) {
        setAdmins(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const result = await getProjectsAction({ organizationId });
      if (result?.data) {
        setProjects(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  useEffect(() => {
    fetchAdmins();
    fetchProjects();
  }, [organizationId]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast.error(t("common.fill_all_fields"));
      return;
    }

    // Validate project selection for members
    if (newAdmin.role === "member" && newAdmin.projectIds.length === 0) {
      toast.error(t("environments.settings.general.select_projects_for_member"));
      return;
    }

    setIsAdding(true);
    try {
      const result = await createAdminAction({
        organizationId,
        name: newAdmin.name,
        email: newAdmin.email,
        password: newAdmin.password,
        role: newAdmin.role as "owner" | "manager" | "member" | "viewer",
        projectIds: newAdmin.role === "member" ? newAdmin.projectIds : undefined,
      });

      if (result?.data?.success) {
        toast.success(t("environments.settings.general.admin_created"));
        setNewAdmin({ name: "", email: "", password: "", role: "manager", projectIds: [] });
        setShowAddForm(false);
        fetchAdmins();
      } else {
        toast.error(result?.serverError || t("common.error"));
      }
    } catch (error) {
      console.error("Failed to create admin:", error);
      toast.error(t("common.error"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAdmin = async (adminId: string) => {
    setDeletingId(adminId);
    try {
      const result = await deleteAdminAction({ organizationId, userId: adminId });
      if (result?.data?.success) {
        toast.success(t("environments.settings.general.admin_deleted"));
        setAdmins(admins.filter((a) => a.id !== adminId));
      } else {
        toast.error(result?.serverError || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) {
      toast.error(t("environments.settings.general.select_new_owner"));
      return;
    }

    setIsTransferring(true);
    try {
      const result = await transferOwnershipAction({
        organizationId,
        newOwnerId: selectedNewOwner,
      });

      if (result?.data?.success) {
        toast.success(t("environments.settings.general.ownership_transferred"));
        setShowTransferModal(false);
        setSelectedNewOwner("");
        fetchAdmins();
      } else {
        toast.error(result?.serverError || t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setIsTransferring(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "owner":
        return t("common.owner");
      case "manager":
        return t("common.manager");
      case "member":
        return t("common.member");
      case "viewer":
        return t("common.viewer");
      default:
        return role;
    }
  };

  const projectOptions = projects.map((project) => ({
    label: project.name,
    value: project.id,
  }));

  // Filter admins who can receive ownership (not already owners)
  const eligibleNewOwners = admins.filter((admin) => admin.role !== "owner");

  return (
    <>
      <SettingsCard
        title={t("environments.settings.general.manage_admins")}
        description={t("environments.settings.general.manage_admins_description")}>
        <div className="space-y-4">
          {/* Admin List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-slate-800" />
            </div>
          ) : admins.length === 0 ? (
            <p className="text-sm text-slate-500">{t("environments.settings.general.no_admins")}</p>
          ) : (
            <div className="space-y-2">
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                      <UserIcon className="h-4 w-4 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{admin.name || admin.email}</p>
                      <p className="text-xs text-slate-500">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                      {getRoleLabel(admin.role)}
                    </span>
                    {admin.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAdmin(admin.id)}
                        disabled={deletingId === admin.id}
                        className="text-slate-500 hover:text-red-600">
                        <TrashIcon className={`h-4 w-4 ${deletingId === admin.id ? "animate-pulse" : ""}`} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Admin Form */}
          {showAddForm ? (
            <form
              onSubmit={handleAddAdmin}
              className="space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">{t("common.name")}</Label>
                  <Input
                    id="name"
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    placeholder={t("common.name")}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">{t("common.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    placeholder={t("common.email")}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">{t("common.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    placeholder={t("common.password")}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="role">{t("common.role")}</Label>
                  <Select
                    value={newAdmin.role}
                    onValueChange={(value) => setNewAdmin({ ...newAdmin, role: value, projectIds: [] })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">{t("common.owner")}</SelectItem>
                      <SelectItem value="manager">{t("common.manager")}</SelectItem>
                      <SelectItem value="member">{t("common.member")}</SelectItem>
                      <SelectItem value="viewer">{t("common.viewer")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Project selection for members */}
              {newAdmin.role === "member" && (
                <div>
                  <Label>{t("environments.settings.general.assign_projects")}</Label>
                  <MultiSelect
                    value={newAdmin.projectIds}
                    options={projectOptions}
                    placeholder={t("environments.settings.general.select_projects")}
                    onChange={(val) => setNewAdmin({ ...newAdmin, projectIds: val })}
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {t("environments.settings.general.member_project_access_info")}
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAddForm(false)}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? t("common.creating") : t("common.create")}
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex gap-2">
              <Button onClick={() => setShowAddForm(true)} variant="secondary" className="gap-2">
                <PlusIcon className="h-4 w-4" />
                {t("environments.settings.general.add_admin")}
              </Button>
              <Button onClick={() => setShowTransferModal(true)} variant="outline" className="gap-2">
                <ArrowRightLeftIcon className="h-4 w-4" />
                {t("environments.settings.general.transfer_ownership")}
              </Button>
            </div>
          )}
        </div>
      </SettingsCard>

      {/* Transfer Ownership Modal */}
      <ConfirmationModal
        open={showTransferModal}
        setOpen={setShowTransferModal}
        title={t("environments.settings.general.transfer_ownership")}
        text={t("environments.settings.general.transfer_ownership_description")}
        buttonText={isTransferring ? t("common.transferring") : t("common.transfer")}
        onConfirm={handleTransferOwnership}
        buttonVariant="primary"
        buttonDisabled={!selectedNewOwner || isTransferring || eligibleNewOwners.length === 0}>
        <div className="mt-4">
          {eligibleNewOwners.length === 0 ? (
            <p className="text-sm text-slate-500">{t("environments.settings.general.no_eligible_owners")}</p>
          ) : (
            <>
              <Label>{t("environments.settings.general.select_new_owner")}</Label>
              <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                <SelectTrigger>
                  <SelectValue placeholder={t("environments.settings.general.select_member")} />
                </SelectTrigger>
                <SelectContent>
                  {eligibleNewOwners.map((admin) => (
                    <SelectItem key={admin.id} value={admin.id}>
                      {admin.name || admin.email} ({getRoleLabel(admin.role)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>
      </ConfirmationModal>
    </>
  );
};
