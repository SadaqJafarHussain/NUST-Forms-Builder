import { Prisma } from "@prisma/client";
import { cache as reactCache } from "react";
import { prisma } from "@formbricks/database";
import { ZString } from "@formbricks/types/common";
import { DatabaseError } from "@formbricks/types/errors";
import { TMembership, ZMembership } from "@formbricks/types/memberships";
import { validateInputs } from "@/lib/utils/validate";

export const getProjectsByUserId = reactCache(
  async (userId: string, orgMembership: TMembership): Promise<{ id: string; name: string }[]> => {
    validateInputs([userId, ZString], [orgMembership, ZMembership]);

    try {
      // Owners, managers, and viewers can access all projects
      if (
        orgMembership.role === "owner" ||
        orgMembership.role === "manager" ||
        orgMembership.role === "viewer"
      ) {
        const projects = await prisma.project.findMany({
          where: {
            organizationId: orgMembership.organizationId,
          },
          select: {
            id: true,
            name: true,
          },
        });
        return projects;
      }

      // Members can only access assigned projects
      if (orgMembership.role === "member") {
        const userProjects = await prisma.userProject.findMany({
          where: {
            userId,
            project: {
              organizationId: orgMembership.organizationId,
            },
          },
          select: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
        return userProjects.map((up) => up.project);
      }

      // Billing role has no project access
      return [];
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(error.message);
      }

      throw error;
    }
  }
);
