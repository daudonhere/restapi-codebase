import bcrypt from "bcrypt";
import sharp from "sharp";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import {
  findUserByIdModel,
  findUserByEmailModel,
  findUserByPhoneModel,
} from "../models/user-read";
import {
  updateUserByIdModel,
  updateUserCredentialModel,
  updateUserRolesModel,
  updateUserAvatarModel,
} from "../models/user-update";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { supabase, SUPABASE_BUCKET } from "../../../configs/supabase";
import { generateVerificationCode } from "./user-create";
import { saveTokenModel } from "../../auth/models/token-create";
import { deleteTokenByUserAndTypeModel } from "../../auth/models/token-delete";
import { sendVerificationEmail, isEmailOnAllowList } from "../../../utils/email";
import {
  UpdateUserProfileSchema,
  UpdateUserCredentialSchema,
  UpdateUserRolesSchema,
} from "../schema/user-schema";
import { User } from "../schema/user-schema";

type CredentialUpdatePayload = Partial<{
  password: string;
  pin: string;
  code: string;
  frequency: string;
}>;

export const uploadAvatarService = withActivityLog(
  { module: "user", action: "upload avatar" },
  async (_context, userId: string, file: Express.Multer.File) => {
    if (!file) {
      throw new ResponsError(Code.BAD_REQUEST, "file is required");
    }

    if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.mimetype)) {
      throw new ResponsError(Code.BAD_REQUEST, "invalid file type");
    }

    const user = await findUserByIdModel(userId);
    if (!user) {
      throw new ResponsError(Code.NOT_FOUND, "user not found");
    }

    const processed = await sharp(file.buffer)
      .resize(512, 512, { fit: "cover" })
      .webp({ quality: 80 })
      .toBuffer();

    const filename = `avatar-${userId}-${Date.now()}.webp`;

    if (user.avatar) {
      const oldPath = user.avatar.split(`${SUPABASE_BUCKET}/`)[1];
      if (oldPath) {
        await supabase.storage.from(SUPABASE_BUCKET).remove([oldPath]);
      }
    }

    const { error } = await supabase.storage
      .from(SUPABASE_BUCKET)
      .upload(filename, processed, {
        contentType: "image/webp",
        upsert: true,
      });

    if (error) {
      throw new ResponsError(Code.INTERNAL_SERVER_ERROR, "failed to upload avatar");
    }

    const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${filename}`;
    await updateUserAvatarModel(userId, publicUrl);

    return {
      userId,
      statusCode: Code.OK,
      result: { avatar: publicUrl },
      description: "avatar updated successfully",
    };
  }
);

export const updateUserCredentialService = withActivityLog(
  { module: "user", action: "update credential" },
  async (_context, userId: string, input: unknown, actor: User) => {
    if (actor.id !== userId) {
      throw new ResponsError(Code.FORBIDDEN, "cannot modify another user's credentials");
    }

    const data = UpdateUserCredentialSchema.parse(input);
    const user = await findUserByIdModel(userId);

    if (!user) {
      throw new ResponsError(Code.NOT_FOUND, "user not found");
    }

    const payload: CredentialUpdatePayload = {};

    if (data.password) payload.password = await bcrypt.hash(data.password, 10);
    if (data.pin) payload.pin = await bcrypt.hash(data.pin, 10);
    if (data.code) payload.code = await bcrypt.hash(data.code, 10);
    if (data.frequency) payload.frequency = await bcrypt.hash(data.frequency, 10);

    if (Object.keys(payload).length === 0) {
      throw new ResponsError(Code.BAD_REQUEST, "no credential fields provided");
    }

    const updatedId = await updateUserCredentialModel(userId, payload);
    const updatedUser = await findUserByIdModel(updatedId);

    await deleteTokenByUserAndTypeModel(userId, "verify");

    const otp = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await saveTokenModel(userId, otp, "verify", expiresAt);
    sendVerificationEmail(updatedUser!.email, otp).catch(() => {});

    return {
      userId: actor.id,
      statusCode: Code.OK,
      result: {
        id: updatedUser!.id,
        email: updatedUser!.email,
        is_verified: updatedUser!.is_verified,
      },
      description: "credentials updated, verification email sent",
    };
  }
);

export const updateUserByIdService = withActivityLog(
  { module: "user", action: "update user" },
  async (_context, userId: string, input: unknown, actor: User, passphrase: string) => {

    const data = UpdateUserProfileSchema.parse({
      ...(input as Record<string, unknown>),
      passphrase,
    });

    const user = await findUserByIdModel(userId);
    if (!user) {
      throw new ResponsError(Code.NOT_FOUND, "user not found");
    }

    if (!user.passphrase) {
      throw new ResponsError(Code.FORBIDDEN, "passphrase not set");
    }

    const validPassphrase = await bcrypt.compare(passphrase, user.passphrase);
    if (!validPassphrase) {
      throw new ResponsError(Code.BAD_REQUEST, "invalid passphrase");
    }

    if (data.email && !isEmailOnAllowList(data.email)) {
      throw new ResponsError(Code.BAD_REQUEST, "email provider not allowed");
    }

    let resetVerification = false;

    if (data.email && data.email !== user.email) {
      const exists = await findUserByEmailModel(data.email);
      if (exists) {
        throw new ResponsError(Code.CONFLICT, "email already in use");
      }
      resetVerification = true;
    }

    if (data.phone && data.phone !== user.phone) {
      const phoneOwner = await findUserByPhoneModel(data.phone);
      if (phoneOwner) {
        throw new ResponsError(Code.CONFLICT, "phone already in use");
      }
    }

    const updated = await updateUserByIdModel(userId, {
      fullname: data.fullname ?? null,
      phone: data.phone ?? null,
      email: data.email ?? null,
      resetVerification,
    });

    if (resetVerification) {
      await deleteTokenByUserAndTypeModel(userId, "verify");

      const otp = generateVerificationCode();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await saveTokenModel(userId, otp, "verify", expiresAt);
      sendVerificationEmail(updated.email, otp).catch(() => {});
    }

    return {
      userId: actor.id,
      statusCode: Code.OK,
      result: {
        id: updated.id,
        fullname: updated.fullname,
        email: updated.email,
        phone: updated.phone,
        is_verified: updated.is_verified,
      },
      description: resetVerification
        ? "user updated, verification email sent"
        : "user updated",
    };
  }
);

export const updateUserRolesService = withActivityLog(
  { module: "user", action: "update user roles" },
  async (_context, userId: string, input: unknown, actor: User) => {
    const { roles } = UpdateUserRolesSchema.parse(input);

    if (
      !actor.roles.includes("superadmin") &&
      !actor.roles.includes("administrator")
    ) {
      throw new ResponsError(Code.FORBIDDEN, "no permission");
    }

    if (actor.id === userId) {
      throw new ResponsError(Code.FORBIDDEN, "cannot modify own roles");
    }

    const target = await findUserByIdModel(userId);
    if (!target) {
      throw new ResponsError(Code.NOT_FOUND, "user not found");
    }

    if (
      target.roles.includes("superadmin") &&
      !actor.roles.includes("superadmin")
    ) {
      throw new ResponsError(Code.FORBIDDEN, "cannot modify superadmin");
    }

    await updateUserRolesModel(userId, roles);
    const updated = await findUserByIdModel(userId);

    return {
      userId: actor.id,
      statusCode: Code.OK,
      result: updated,
      description: "roles updated",
    };
  }
);
