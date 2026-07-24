"use client";

import { CheckIcon, ChevronDownIcon, FolderPlusIcon, LogOutIcon, PencilIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { TOrganization } from "@formbricks/types/organizations";
import { TProject } from "@formbricks/types/project";
import { TUser } from "@formbricks/types/user";
import { useSignOut } from "@/modules/auth/hooks/use-sign-out";
import { CreateProjectModal } from "@/modules/projects/components/create-project-modal";
import { updateProjectAction } from "@/modules/projects/settings/actions";
import { ProfileAvatar } from "@/modules/ui/components/avatars";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/modules/ui/components/dropdown-menu";

interface NavTabProps {
  href: string;
  label: string;
}

const NavTab = ({ href, label }: NavTabProps) => {
  const pathname = usePathname();
  const isActive =
    pathname?.startsWith(
      href.split("/settings")[0] + (href.includes("/settings") ? "/settings" : "/surveys")
    ) ?? false;
  return (
    <Link
      href={href}
      className="flex h-full items-center gap-1.5 border-b-[3px] px-4 text-sm font-medium transition-colors"
      style={{
        borderBottomColor: isActive ? "#1b335f" : "transparent",
        color: isActive ? "#1b335f" : "#5f6368",
      }}>
      {label}
    </Link>
  );
};

interface TopNavbarProps {
  user: TUser;
  organization: TOrganization;
  environmentId: string;
  projects: Pick<TProject, "id" | "name" | "environments">[];
  currentProject: Pick<TProject, "id" | "name" | "environments"> | null;
  canCreateProject: boolean;
}

export const TopNavbar = ({
  user,
  organization,
  environmentId,
  projects,
  currentProject,
  canCreateProject,
}: TopNavbarProps) => {
  const router = useRouter();
  const { signOut } = useSignOut({ id: user.id, email: user.email });
  const projMenuId = useId();
  const avatarMenuId = useId();
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    const route = await signOut({
      reason: "user_initiated",
      redirectUrl: "/auth/login",
      organizationId: organization.id,
      redirect: false,
      callbackUrl: "/auth/login",
      clearEnvironmentId: true,
    });
    router.push(route?.url || "/auth/login");
  };

  const handleProjectSwitch = (project: Pick<TProject, "id" | "name" | "environments">) => {
    if (editingProjectId) return; // don't switch while editing
    const prodEnv = project.environments.find((e) => e.type === "production");
    if (prodEnv) {
      router.push(`/environments/${prodEnv.id}/surveys`);
    }
  };

  const startEditing = (project: Pick<TProject, "id" | "name" | "environments">, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project.id);
    setEditingName(project.name);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelEditing = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingProjectId(null);
    setEditingName("");
  };

  const saveEditing = async (projectId: string, e?: React.KeyboardEvent | React.FocusEvent) => {
    if (e && "key" in e && e.key === "Escape") {
      cancelEditing();
      return;
    }
    if (e && "key" in e && e.key !== "Enter") return;
    const trimmed = editingName.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      await updateProjectAction({ projectId, data: { name: trimmed } });
      router.refresh();
    } finally {
      setIsSaving(false);
      setEditingProjectId(null);
      setEditingName("");
    }
  };

  return (
    <>
      <header
        className="flex h-14 w-full shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6"
        dir="rtl">
        {/* Logo */}
        <Link
          href={`/environments/${environmentId}/surveys`}
          className="flex select-none items-center gap-1.5">
          <span className="text-xl font-bold" style={{ color: "#1b335f" }}>
            NUST
          </span>
          <span className="text-xl font-light" style={{ color: "#f4bf00" }}>
            |
          </span>
          <span className="text-xl font-medium" style={{ color: "#1b335f" }}>
            فورمات
          </span>
        </Link>

        {/* Right: project switcher + nav tabs + avatar */}
        <div className="flex h-full items-center gap-1">
          {/* Project Switcher — owners/managers only */}
          {canCreateProject ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-0">
                <span className="max-w-[140px] truncate">{currentProject?.name ?? "القسم/الكلية"}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                id={projMenuId}
                side="bottom"
                align="end"
                sideOffset={8}
                className="min-w-[240px]">
                <div className="px-3 py-1.5 text-right">
                  <p className="text-xs font-semibold text-slate-400">الأقسام والكليات</p>
                </div>

                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="group mx-1 flex cursor-pointer items-center justify-between gap-1 rounded-md px-2 py-1 hover:bg-slate-50"
                    onClick={() => handleProjectSwitch(project)}>
                    {editingProjectId === project.id ? (
                      /* ── Inline rename input ── */
                      <div className="flex flex-1 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <input
                          ref={inputRef}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => saveEditing(project.id, e)}
                          onBlur={(e) => saveEditing(project.id, e)}
                          disabled={isSaving}
                          className="flex-1 rounded border border-[#1b335f] px-2 py-0.5 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1b335f]"
                          dir="rtl"
                        />
                        <button
                          type="button"
                          onClick={(e) => cancelEditing(e)}
                          className="rounded p-0.5 text-slate-400 hover:text-slate-600">
                          <XIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      /* ── Normal row ── */
                      <>
                        <span className="flex-1 text-right text-sm text-slate-700">{project.name}</span>
                        <div className="flex items-center gap-1">
                          {project.id === currentProject?.id && (
                            <CheckIcon className="h-3.5 w-3.5 text-slate-500" />
                          )}
                          <button
                            type="button"
                            title="تعديل الاسم"
                            onClick={(e) => startEditing(project, e)}
                            className="rounded p-0.5 text-slate-300 opacity-0 transition-opacity hover:text-[#1b335f] group-hover:opacity-100">
                            <PencilIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsCreateProjectModalOpen(true)}
                  className="flex items-center gap-2 text-slate-600">
                  <FolderPlusIcon className="h-4 w-4 shrink-0" />
                  <span>إنشاء قسم/كلية جديد</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            currentProject && (
              <span className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600">
                {currentProject.name}
              </span>
            )
          )}

          <NavTab href={`/environments/${environmentId}/surveys`} label="فورماتي" />
          <NavTab href={`/environments/${environmentId}/settings/profile`} label="الإعدادات" />

          <DropdownMenu>
            <DropdownMenuTrigger className="mr-2 focus:outline-none focus:ring-0">
              <ProfileAvatar userId={user.id} />
            </DropdownMenuTrigger>
            <DropdownMenuContent id={avatarMenuId} side="bottom" align="end" sideOffset={8}>
              <div className="border-b border-slate-100 px-3 py-2 text-right">
                <p className="text-sm font-medium text-slate-800">{user.name ?? user.email}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOutIcon className="ml-2 h-4 w-4" strokeWidth={1.5} />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {canCreateProject && (
        <CreateProjectModal
          open={isCreateProjectModalOpen}
          setOpen={setIsCreateProjectModalOpen}
          organizationId={organization.id}
          isAccessControlAllowed={false}
        />
      )}
    </>
  );
};
