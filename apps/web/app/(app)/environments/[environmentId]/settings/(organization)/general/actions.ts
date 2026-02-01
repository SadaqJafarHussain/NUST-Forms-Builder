"use server";

import { z } from "zod";
import { prisma } from "@formbricks/database";
import { ZId } from "@formbricks/types/common";
import { InvalidInputError, OperationNotAllowedError, ValidationError } from "@formbricks/types/errors";
import { ZOrganizationRole } from "@formbricks/types/memberships";
import { ZOrganizationUpdateInput } from "@formbricks/types/organizations";
import { ZUserEmail, ZUserName, ZUserPassword } from "@formbricks/types/user";
import { hashPassword } from "@/lib/auth";
import { createMembership, updateMembership } from "@/lib/membership/service";
import { deleteOrganization, getOrganization, updateOrganization } from "@/lib/organization/service";
import { authenticatedActionClient } from "@/lib/utils/action-client";
import { checkAuthorizationUpdated } from "@/lib/utils/action-client/action-client-middleware";
import { AuthenticatedActionClientCtx } from "@/lib/utils/action-client/types/context";
import { createUser, getUserByEmail } from "@/modules/auth/lib/user";
import { withAuditLogging } from "@/modules/ee/audit-logs/lib/handler";
import { getIsMultiOrgEnabled } from "@/modules/ee/license-check/lib/utils";
import {
  deleteMembership,
  getMembershipByOrganizationId,
  getOrganizationOwnerCount,
} from "@/modules/organization/settings/teams/lib/membership";

const ZUpdateOrganizationNameAction = z.object({
  organizationId: ZId,
  data: ZOrganizationUpdateInput.pick({ name: true }),
});

export const updateOrganizationNameAction = authenticatedActionClient
  .schema(ZUpdateOrganizationNameAction)
  .action(
    withAuditLogging(
      "updated",
      "organization",
      async ({
        ctx,
        parsedInput,
      }: {
        ctx: AuthenticatedActionClientCtx;
        parsedInput: Record<string, any>;
      }) => {
        await checkAuthorizationUpdated({
          userId: ctx.user.id,
          organizationId: parsedInput.organizationId,
          access: [
            {
              type: "organization",
              schema: ZOrganizationUpdateInput.pick({ name: true }),
              data: parsedInput.data,
              roles: ["owner"],
            },
          ],
        });
        ctx.auditLoggingCtx.organizationId = parsedInput.organizationId;
        const oldObject = await getOrganization(parsedInput.organizationId);
        const result = await updateOrganization(parsedInput.organizationId, parsedInput.data);
        ctx.auditLoggingCtx.oldObject = oldObject;
        ctx.auditLoggingCtx.newObject = result;
        return result;
      }
    )
  );

const ZDeleteOrganizationAction = z.object({
  organizationId: ZId,
});

export const deleteOrganizationAction = authenticatedActionClient.schema(ZDeleteOrganizationAction).action(
  withAuditLogging(
    "deleted",
    "organization",
    async ({ ctx, parsedInput }: { ctx: AuthenticatedActionClientCtx; parsedInput: Record<string, any> }) => {
      const isMultiOrgEnabled = await getIsMultiOrgEnabled();
      if (!isMultiOrgEnabled) throw new OperationNotAllowedError("Organization deletion disabled");

      await checkAuthorizationUpdated({
        userId: ctx.user.id,
        organizationId: parsedInput.organizationId,
        access: [
          {
            type: "organization",
            roles: ["owner"],
          },
        ],
      });
      ctx.auditLoggingCtx.organizationId = parsedInput.organizationId;
      const oldObject = await getOrganization(parsedInput.organizationId);
      ctx.auditLoggingCtx.oldObject = oldObject;
      return await deleteOrganization(parsedInput.organizationId);
    }
  )
);

// Admin Management Actions
const ZGetAdminsAction = z.object({
  organizationId: ZId,
});

export const getAdminsAction = authenticatedActionClient
  .schema(ZGetAdminsAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: parsedInput.organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner"],
        },
      ],
    });

    const members = await getMembershipByOrganizationId(parsedInput.organizationId);
    return members.map((member) => ({
      id: member.userId,
      name: member.name,
      email: member.email,
      role: member.role,
    }));
  });

const ZCreateAdminAction = z.object({
  organizationId: ZId,
  name: ZUserName,
  email: ZUserEmail,
  password: ZUserPassword,
  role: ZOrganizationRole,
  projectIds: z.array(ZId).optional(),
});

export const createAdminAction = authenticatedActionClient.schema(ZCreateAdminAction).action(
  withAuditLogging(
    "created",
    "user",
    async ({ ctx, parsedInput }: { ctx: AuthenticatedActionClientCtx; parsedInput: Record<string, any> }) => {
      await checkAuthorizationUpdated({
        userId: ctx.user.id,
        organizationId: parsedInput.organizationId,
        access: [
          {
            type: "organization",
            roles: ["owner"],
          },
        ],
      });

      // Check if user already exists
      const existingUser = await getUserByEmail(parsedInput.email.toLowerCase());

      let user;
      if (existingUser) {
        // User exists - check if they're already a member of this organization
        const existingMembers = await getMembershipByOrganizationId(parsedInput.organizationId);
        const isAlreadyMember = existingMembers.some((m) => m.userId === existingUser.id);

        if (isAlreadyMember) {
          throw new InvalidInputError("User is already a member of this organization");
        }

        // Add existing user to organization
        user = existingUser;
      } else {
        // Create new user
        const hashedPassword = await hashPassword(parsedInput.password);
        user = await createUser({
          email: parsedInput.email.toLowerCase(),
          name: parsedInput.name,
          password: hashedPassword,
        });
      }

      await createMembership(parsedInput.organizationId, user.id, {
        role: parsedInput.role,
        accepted: true,
      });

      // If role is member and projectIds are provided, assign user to projects
      if (parsedInput.role === "member" && parsedInput.projectIds && parsedInput.projectIds.length > 0) {
        await prisma.userProject.createMany({
          data: parsedInput.projectIds.map((projectId: string) => ({
            userId: user.id,
            projectId,
          })),
          skipDuplicates: true,
        });
      }

      ctx.auditLoggingCtx.organizationId = parsedInput.organizationId;
      ctx.auditLoggingCtx.newObject = {
        userId: user.id,
        email: parsedInput.email,
        name: parsedInput.name,
        role: parsedInput.role,
        projectIds: parsedInput.projectIds,
      };

      return { success: true };
    }
  )
);

const ZDeleteAdminAction = z.object({
  organizationId: ZId,
  userId: ZId,
});

export const deleteAdminAction = authenticatedActionClient.schema(ZDeleteAdminAction).action(
  withAuditLogging(
    "deleted",
    "user",
    async ({ ctx, parsedInput }: { ctx: AuthenticatedActionClientCtx; parsedInput: Record<string, any> }) => {
      await checkAuthorizationUpdated({
        userId: ctx.user.id,
        organizationId: parsedInput.organizationId,
        access: [
          {
            type: "organization",
            roles: ["owner"],
          },
        ],
      });

      if (parsedInput.userId === ctx.user.id) {
        throw new OperationNotAllowedError("You cannot delete yourself");
      }

      const members = await getMembershipByOrganizationId(parsedInput.organizationId);
      const memberToDelete = members.find((m) => m.userId === parsedInput.userId);

      if (!memberToDelete) {
        throw new ValidationError("User is not a member of this organization");
      }

      if (memberToDelete.role === "owner") {
        const ownerCount = await getOrganizationOwnerCount(parsedInput.organizationId);
        if (ownerCount <= 1) {
          throw new ValidationError("Cannot delete the last owner of the organization");
        }
      }

      await deleteMembership(parsedInput.userId, parsedInput.organizationId);

      // Also delete user's project assignments
      await prisma.userProject.deleteMany({
        where: {
          userId: parsedInput.userId,
          project: {
            organizationId: parsedInput.organizationId,
          },
        },
      });

      ctx.auditLoggingCtx.organizationId = parsedInput.organizationId;
      ctx.auditLoggingCtx.oldObject = memberToDelete;

      return { success: true };
    }
  )
);

// Get projects for organization
const ZGetProjectsAction = z.object({
  organizationId: ZId,
});

export const getProjectsAction = authenticatedActionClient
  .schema(ZGetProjectsAction)
  .action(async ({ ctx, parsedInput }) => {
    await checkAuthorizationUpdated({
      userId: ctx.user.id,
      organizationId: parsedInput.organizationId,
      access: [
        {
          type: "organization",
          roles: ["owner"],
        },
      ],
    });

    const projects = await prisma.project.findMany({
      where: {
        organizationId: parsedInput.organizationId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return projects;
  });

// Transfer ownership action
const ZTransferOwnershipAction = z.object({
  organizationId: ZId,
  newOwnerId: ZId,
});

export const transferOwnershipAction = authenticatedActionClient.schema(ZTransferOwnershipAction).action(
  withAuditLogging(
    "updated",
    "membership",
    async ({ ctx, parsedInput }: { ctx: AuthenticatedActionClientCtx; parsedInput: Record<string, any> }) => {
      await checkAuthorizationUpdated({
        userId: ctx.user.id,
        organizationId: parsedInput.organizationId,
        access: [
          {
            type: "organization",
            roles: ["owner"],
          },
        ],
      });

      // Verify new owner exists and is a member
      const members = await getMembershipByOrganizationId(parsedInput.organizationId);
      const newOwner = members.find((m) => m.userId === parsedInput.newOwnerId);

      if (!newOwner) {
        throw new ValidationError("Selected user is not a member of this organization");
      }

      if (newOwner.role === "owner") {
        throw new ValidationError("Selected user is already an owner");
      }

      if (parsedInput.newOwnerId === ctx.user.id) {
        throw new ValidationError("You cannot transfer ownership to yourself");
      }

      // Update new owner's role to owner
      await updateMembership(parsedInput.newOwnerId, parsedInput.organizationId, {
        role: "owner",
      });

      // Demote current owner to manager
      await updateMembership(ctx.user.id, parsedInput.organizationId, {
        role: "manager",
      });

      ctx.auditLoggingCtx.organizationId = parsedInput.organizationId;
      ctx.auditLoggingCtx.oldObject = {
        previousOwner: ctx.user.id,
        previousOwnerNewRole: "manager",
      };
      ctx.auditLoggingCtx.newObject = {
        newOwner: parsedInput.newOwnerId,
        newOwnerPreviousRole: newOwner.role,
      };

      return { success: true };
    }
  )
);
