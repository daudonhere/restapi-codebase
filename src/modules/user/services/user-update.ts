import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { UserInterface } from "../../../interfaces/user-interface";
import { findUserByIdModel, findUserByEmailModel, findUserByPhoneModel} from "../models/user-read";
import { updateUserByIdModel, updateUserCredentialModel, updateLastLoginModel, updateUserRolesModel } from "../models/user-update";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import bcrypt from "bcrypt";
import sharp from "sharp";
import { supabase, SUPABASE_BUCKET } from "../../../configs/supabase";
import { updateUserAvatarModel } from "../models/user-update";
import { generateVerificationCode } from "./user-create";
import { saveTokenModel } from "../../auth/models/token-create";
import { deleteTokenByUserAndTypeModel } from "../../auth/models/token-delete";
import { sendVerificationEmail, isEmailOnAllowList } from "../../../utils/email";

export const uploadAvatarService = withActivityLog(
  { module: "user", action: "upload avatar" },

  async (context, userId: string, file: Express.Multer.File) => {
    if (!file) throw new ResponsError(Code.BAD_REQUEST, "file is required");

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype)) {
      throw new ResponsError(Code.BAD_REQUEST, "invalid file type");
    }

    const processed = await sharp(file.buffer)
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `avatar-${userId}-${Date.now()}.webp`;

    const user = await findUserByIdModel(userId);
    if (!user) throw new ResponsError(Code.NOT_FOUND, "user not found");

    if (user.avatar) {
      const oldPath = user.avatar.split(`${SUPABASE_BUCKET}/`)[1];
      if (oldPath) {
        await supabase.storage.from(SUPABASE_BUCKET).remove([oldPath]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filename, processed, {
        contentType: "image/webp",
        upsert: true,
      });

    if (uploadError) {
      throw new ResponsError(Code.INTERNAL_SERVER_ERROR, "failed to upload avatar");
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filename}`;
    const updated = await updateUserAvatarModel(userId, publicUrl);

    return {
      userId,
      statusCode: Code.OK,
      beforeData: { oldAvatar: user.avatar },
      afterData: updated,
      result: { avatar: publicUrl },
      description: "avatar updated successfully",
    };
  }
);

export const updateUserCredentialService = withActivityLog(
  { module: "user", action: "update credential" },

  async (context, id: string, data: any, actor: UserInterface) => {

    if (actor.id !== id) {
      throw new ResponsError(Code.FORBIDDEN, "cannot modify another user's credentials");
    }

    const beforeUser = await findUserByIdModel(id);
    if (!beforeUser) throw new ResponsError(Code.NOT_FOUND, "user not found");

    if (data.password)
      data.password = await bcrypt.hash(data.password, 10);

    if (data.pin)
      data.pin = await bcrypt.hash(data.pin, 10);

    if (data.code)
      data.code = await bcrypt.hash(data.code, 10);

    if (data.frequency)
      data.frequency = await bcrypt.hash(data.frequency, 10);

    const updatedId = await updateUserCredentialModel(id, data);
    const updatedUser = await findUserByIdModel(updatedId);

    await deleteTokenByUserAndTypeModel(id, "verify");

    const otp = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await saveTokenModel(id, otp, "verify", expiresAt);

    sendVerificationEmail(updatedUser!.email, otp)
      .catch(err => console.error("failed to send verification email:", err));

    return {
      userId: actor.id,
      statusCode: Code.OK,
      beforeData: "credential redacted",
      afterData: "credentials updated, verification reset",
      result: { 
        id: updatedUser!.id,
        email: updatedUser!.email,
        is_verified: updatedUser!.is_verified
      },
      description: "credentials updated, verification email sent"
    };
  }
);


export const updateUserByIdService = withActivityLog(
  { module: "user", action: "update user" },

  async (
    context,
    id: string,
    fields: any,
    actor: UserInterface,
    passphrase: string
  ) => {

    const user = await findUserByIdModel(id);
    if (!user) throw new ResponsError(Code.NOT_FOUND, "user not found");

    if (!passphrase || typeof passphrase !== "string") {
      throw new ResponsError(Code.BAD_REQUEST, "valid passphrase required");
    }

    if (!user.passphrase) {
      throw new ResponsError(Code.FORBIDDEN, "passphrase not set for this user");
    }

    const passphraseMatch = await bcrypt.compare(passphrase, user.passphrase);
    if (!passphraseMatch) {
      throw new ResponsError(Code.BAD_REQUEST, "invalid passphrase");
    }

    if (fields.email && !isEmailOnAllowList(fields.email)) {
      throw new ResponsError(Code.BAD_REQUEST, "email provider not allowed");
    }

    let resetVerification = false;

    if (fields.email && fields.email !== user.email) {
      const existing = await findUserByEmailModel(fields.email);
      if (existing) throw new ResponsError(Code.CONFLICT, "email already in use");
      resetVerification = true;
    }

    if (fields.phone && fields.phone !== user.phone) {
      const phoneOwner = await findUserByPhoneModel(fields.phone);
      if (phoneOwner) throw new ResponsError(Code.CONFLICT, "phone already in use");
    }

    const payload = {
      fullname: fields.fullname ?? null,
      phone: fields.phone ?? null,
      email: fields.email ?? null,
      resetVerification
    };

    const updated = await updateUserByIdModel(id, payload);

    if (resetVerification) {
      await deleteTokenByUserAndTypeModel(id, "verify");

      const otp = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await saveTokenModel(id, otp, "verify", expiresAt);

      sendVerificationEmail(updated.email, otp).catch(() => {});
    }

    const cleanResult = {
      id: updated.id,
      fullname: updated.fullname,
      email: updated.email,
      phone: updated.phone,
      is_verified: updated.is_verified
    };

    return {
      userId: actor.id,
      statusCode: Code.OK,
      beforeData: null,
      afterData: null,
      result: cleanResult,
      description: resetVerification
        ? "user updated, verification email sent"
        : "user updated"
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