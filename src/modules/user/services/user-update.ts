import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { UserInterface } from "../../../interfaces/user-interface";
import { findUserByIdModel } from "../models/user-read";
import { updateUserByIdModel, updateLastLoginModel, updateUserRolesModel } from "../models/user-update";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import bcrypt from "bcrypt";
import { supabase, SUPABASE_BUCKET } from "../../../configs/supabase";
import { updateUserAvatarModel } from "../models/user-update";


export const uploadAvatarService = withActivityLog(
  { module: "user", action: "upload avatar" },

  async (context, userId: string, file: Express.Multer.File) => {
    if (!file) {
      throw new ResponsError(Code.BAD_REQUEST, "file is required");
    }

    const ext = file.originalname.split(".").pop();
    const filePath = `avatar-${userId}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      throw new ResponsError(Code.INTERNAL_SERVER_ERROR, "failed to upload file");
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filePath}`;

    const updated = await updateUserAvatarModel(userId, publicUrl);

    return {
      userId,
      statusCode: Code.OK,
      beforeData: null,
      afterData: updated,
      result: { avatar: publicUrl },
      description: "avatar updated"
    };
  }
);

export const updateUserByIdService = withActivityLog(
  { module: "user", action: "update user" },
  async (context, id: string, data: any, actor: UserInterface) => {
    const beforeUser = await findUserByIdModel(id);
    if (!beforeUser) throw new ResponsError(Code.NOT_FOUND, "user not found");

    if (actor.id === id && data.roles && !actor.roles.includes("superadmin"))
      throw new ResponsError(Code.FORBIDDEN, "cannot modify own roles");

    if (data.password)
      data.password = await bcrypt.hash(data.password, 10);

    const beforeData = {
      id: beforeUser.id,
      email: beforeUser.email,
      fullname: beforeUser.fullname,
      is_verified: beforeUser.is_verified
    };

    const payload = { ...data };
    delete payload.roles;
    const updatedId = await updateUserByIdModel(id, payload);
    const updated = await findUserByIdModel(updatedId);
    const afterData = {
      id: updated!.id,
      email: updated!.email,
      fullname: updated!.fullname,
      is_verified: updated!.is_verified
    };
    return {
      userId: actor.id,
      statusCode: Code.OK,
      beforeData,
      afterData,
      result: updated,
      description: `user ${id} updated`
    };
  }
);

export const updateUserRolesService = withActivityLog(
  { module: "user", action: "update user roles" },
  async (context, id: string, roles: string[], actor: UserInterface) => {
    if (!Array.isArray(roles))
      throw new ResponsError(Code.BAD_REQUEST, "roles must be an array");

    if (
      !actor.roles.includes("superadmin") &&
      !actor.roles.includes("administrator")
    )
      throw new ResponsError(Code.FORBIDDEN, "no permission");

    if (actor.id === id)
      throw new ResponsError(Code.FORBIDDEN, "cannot modify own roles");

    const beforeUser = await findUserByIdModel(id);
    if (!beforeUser)
      throw new ResponsError(Code.NOT_FOUND, "user not found");

    if (
      beforeUser.roles.includes("superadmin") &&
      !actor.roles.includes("superadmin")
    )
      throw new ResponsError(
        Code.FORBIDDEN,
        "cannot modify superadmin"
      );

    const beforeData = {
      id: beforeUser.id,
      email: beforeUser.email,
      roles: beforeUser.roles
    };

    await updateUserRolesModel(id, roles);

    const updated = await findUserByIdModel(id);
    const afterData = {
      id: updated!.id,
      email: updated!.email,
      roles: updated!.roles
    };
    return {
      userId: actor.id,
      statusCode: Code.OK,
      beforeData,
      afterData,
      result: updated,
      description: "roles updated"
    };
  }
);

export const updateLastLoginService = async (userId: string) =>
  updateLastLoginModel(userId);