import { Prisma } from "@prisma/client";
import { prisma } from "@formbricks/database";
import { ZId } from "@formbricks/types/common";
import { DatabaseError } from "@formbricks/types/errors";
import { validateInputs } from "../utils/validate";

export const hasUserEnvironmentAccess = async (userId: string, environmentId: string) => {
  validateInputs([userId, ZId], [environmentId, ZId]);

  try {
    // First get the membership to check the role
    const membership = await prisma.membership.findFirst({
      where: {
        userId,
        organization: {
          projects: {
            some: {
              environments: {
                some: {
                  id: environmentId,
                },
              },
            },
          },
        },
      },
    });

    if (!membership) {
      return false;
    }

    // Owners, managers, and viewers have access to all environments
    if (membership.role === "owner" || membership.role === "manager" || membership.role === "viewer") {
      return true;
    }

    // For members, check if they are assigned to the project
    if (membership.role === "member") {
      const userProject = await prisma.userProject.findFirst({
        where: {
          userId,
          project: {
            environments: {
              some: {
                id: environmentId,
              },
            },
          },
        },
      });

      return !!userProject;
    }

    // Billing role doesn't have environment access
    return false;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      throw new DatabaseError(error.message);
    }
    throw error;
  }
};
