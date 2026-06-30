"use client";

import { useTranslate } from "@tolgee/react";
import { SendHorizonalIcon, ShareIcon, TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TMember } from "@formbricks/types/memberships";
import { TOrganization } from "@formbricks/types/organizations";
import { getFormattedErrorMessage } from "@/lib/utils/helper";
import {
  createInviteTokenAction,
  deleteInviteAction,
  deleteMembershipAction,
  resendInviteAction,
} from "@/modules/organization/settings/teams/actions";
import { ShareInviteModal } from "@/modules/organization/settings/teams/components/invite-member/share-invite-modal";
import { TInvite } from "@/modules/organization/settings/teams/types/invites";
import { DeleteDialog } from "@/modules/ui/components/delete-dialog";
import { TooltipRenderer } from "@/modules/ui/components/tooltip";

interface MemberActionsProps {
  organization: TOrganization;
  member?: TMember;
  invite?: TInvite;
  showDeleteButton?: boolean;
}

export const MemberActions = ({ organization, member, invite, showDeleteButton }: MemberActionsProps) => {
  const router = useRouter();
  const { t } = useTranslate();
  const [isDeleteMemberModalOpen, setDeleteMemberModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showShareInviteModal, setShowShareInviteModal] = useState(false);

  const [shareInviteToken, setShareInviteToken] = useState("");

  const handleDeleteMember = async () => {
    try {
      setIsDeleting(true);
      if (!member && invite) {
        // This is an invite

        await deleteInviteAction({ inviteId: invite?.id, organizationId: organization.id });
        toast.success(t("environments.settings.general.invite_deleted_successfully"));
      }

      if (member && !invite) {
        // This is a member

        await deleteMembershipAction({ userId: member.userId, organizationId: organization.id });
        toast.success(t("environments.settings.general.member_deleted_successfully"));
      }

      setIsDeleting(false);
      router.refresh();
    } catch (err) {
      setIsDeleting(false);
      toast.error(t("common.something_went_wrong_please_try_again"));
    }
  };

  const memberName = useMemo(() => {
    if (member) {
      return member.name;
    }

    if (invite) {
      return invite.name;
    }

    return "";
  }, [invite, member]);

  const handleShareInvite = async () => {
    try {
      if (!invite) return;
      const createInviteTokenResponse = await createInviteTokenAction({ inviteId: invite.id });
      if (createInviteTokenResponse?.data) {
        setShareInviteToken(createInviteTokenResponse.data.inviteToken);
        setShowShareInviteModal(true);
      } else {
        const errorMessage = getFormattedErrorMessage(createInviteTokenResponse);
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error(`${t("common.error")}: ${err.message}`);
    }
  };

  const handleResendInvite = async () => {
    try {
      if (!invite) return;

      const resendInviteResponse = await resendInviteAction({
        inviteId: invite.id,
        organizationId: organization.id,
      });
      if (resendInviteResponse?.data) {
        toast.success(t("environments.settings.general.invitation_sent_once_more"));
      } else {
        const errorMessage = getFormattedErrorMessage(resendInviteResponse);
        toast.error(errorMessage);
      }
    } catch (err) {
      toast.error(`${t("common.error")}: ${err.message}`);
    }
  };

  return (
    <div className="flex min-w-[125px] items-center gap-1.5">
      <TooltipRenderer tooltipContent="حذف العضو" shouldRender={!!showDeleteButton}>
        <button
          id="deleteMemberButton"
          disabled={!showDeleteButton}
          onClick={() => setDeleteMemberModalOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          style={showDeleteButton ? { color: "#dc2626" } : { color: "#94a3b8" }}
          onMouseEnter={(e) =>
            showDeleteButton && ((e.currentTarget as HTMLElement).style.backgroundColor = "#fee2e2")
          }
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}>
          <TrashIcon className="h-4 w-4" />
        </button>
      </TooltipRenderer>

      <TooltipRenderer tooltipContent="مشاركة رابط الدعوة" shouldRender={!!invite}>
        <button
          id="shareInviteButton"
          disabled={!invite}
          onClick={handleShareInvite}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          onMouseEnter={(e) => invite && ((e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}>
          <ShareIcon className="h-4 w-4" />
        </button>
      </TooltipRenderer>

      <TooltipRenderer tooltipContent="إعادة إرسال الدعوة" shouldRender={!!invite}>
        <button
          id="resendInviteButton"
          disabled={!invite}
          onClick={handleResendInvite}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          onMouseEnter={(e) => invite && ((e.currentTarget as HTMLElement).style.backgroundColor = "#f1f5f9")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "transparent")}>
          <SendHorizonalIcon className="h-4 w-4" />
        </button>
      </TooltipRenderer>

      <DeleteDialog
        open={isDeleteMemberModalOpen}
        setOpen={setDeleteMemberModalOpen}
        deleteWhat={`${memberName} من الجامعة`}
        onDelete={handleDeleteMember}
        isDeleting={isDeleting}
        text="سيتم حذف هذا العضو نهائياً من الجامعة. لا يمكن التراجع عن هذا الإجراء."
      />

      {showShareInviteModal && (
        <ShareInviteModal
          inviteToken={shareInviteToken}
          open={showShareInviteModal}
          setOpen={setShowShareInviteModal}
        />
      )}
    </div>
  );
};
