"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, verificationTokens, subscriptions, subscriptionPlans, passwordResetTokens, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSession, deleteSession } from "@/lib/auth/session";
import crypto from "crypto";
import { redirect } from "next/navigation";
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";

const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function signUp(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    name: formData.get("name") as string,
  };

  const validated = signUpSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { email, password, name } = validated.data;

  // Check if user exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return { error: "User already exists" };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const [user] = await db
    .insert(users)
    .values({
      email,
      password: hashedPassword,
      name,
      emailVerified: false,
    })
    .returning();

  // Get free plan
  const freePlan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.name, "Free"),
  });

  if (freePlan) {
    // Create free subscription
    await db.insert(subscriptions).values({
      userId: user.id,
      planId: freePlan.id,
      status: "active",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });
  }

  // Create verification token
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(verificationTokens).values({
    email,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Send verification email
  const emailResult = await sendVerificationEmail(email, token);
  if (!emailResult.success) {
    console.error("Failed to send verification email:", emailResult.error);
    // Continue anyway - user is created, they can request a new verification email
  }

  // Create session (allow login even if email not verified)
  await createSession(user.id);

  return { success: true };
}

export async function signIn(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = signInSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { email, password } = validated.data;

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !user.password) {
    return { error: "Invalid credentials" };
  }

  // Verify password
  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return { error: "Invalid credentials" };
  }

  // Create session
  await createSession(user.id);

  return { success: true };
}

export async function signOut() {
  await deleteSession();
  redirect("/sign-in");
}

export async function verifyEmail(token: string) {
  const verification = await db.query.verificationTokens.findFirst({
    where: eq(verificationTokens.token, token),
  });

  if (!verification || verification.expiresAt < new Date()) {
    return { error: "Invalid or expired token" };
  }

  // Get user to send welcome email
  const user = await db.query.users.findFirst({
    where: eq(users.email, verification.email),
  });

  await db
    .update(users)
    .set({ emailVerified: true })
    .where(eq(users.email, verification.email));

  await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

  // Send welcome email
  if (user) {
    await sendWelcomeEmail(verification.email, user.name || "there");
  }

  return { success: true };
}

// Google OAuth handler (simplified - you'll need to implement full OAuth flow)
export async function handleGoogleCallback(googleUser: {
  id: string;
  email: string;
  name: string;
  picture: string;
}) {
  // Check if user exists
  let user = await db.query.users.findFirst({
    where: eq(users.googleId, googleUser.id),
  });

  if (!user) {
    // Check by email
    user = await db.query.users.findFirst({
      where: eq(users.email, googleUser.email),
    });

    if (user) {
      // Link Google account
      await db
        .update(users)
        .set({
          googleId: googleUser.id,
          image: googleUser.picture,
          emailVerified: true,
        })
        .where(eq(users.id, user.id));
    } else {
      // Create new user
      [user] = await db
        .insert(users)
        .values({
          email: googleUser.email,
          googleId: googleUser.id,
          name: googleUser.name,
          image: googleUser.picture,
          emailVerified: true,
        })
        .returning();

      // Get free plan and create subscription
      const freePlan = await db.query.subscriptionPlans.findFirst({
        where: eq(subscriptionPlans.name, "Free"),
      });

      if (freePlan) {
        await db.insert(subscriptions).values({
          userId: user.id,
          planId: freePlan.id,
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        });
      }
    }
  }

  await createSession(user.id);
  return { success: true };
}

// Password reset flow
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  token: z.string().min(1, "Token is required"),
});

export async function requestPasswordReset(formData: FormData) {
  const data = {
    email: formData.get("email") as string,
  };

  const validated = forgotPasswordSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { email } = validated.data;

  // Check if user exists
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  // Always return success even if user doesn't exist (security best practice)
  if (!user) {
    return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
  }

  // Delete any existing reset tokens for this email
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

  // Create password reset token
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(passwordResetTokens).values({
    email,
    token,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  });

  // Send password reset email
  const emailResult = await sendPasswordResetEmail(email, token);
  if (!emailResult.success) {
    console.error("Failed to send password reset email:", emailResult.error);
    return { error: "Failed to send password reset email. Please try again." };
  }

  return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
}

export async function resetPassword(formData: FormData) {
  const data = {
    password: formData.get("password") as string,
    token: formData.get("token") as string,
  };

  const validated = resetPasswordSchema.safeParse(data);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const { password, token } = validated.data;

  // Find reset token
  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: eq(passwordResetTokens.token, token),
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { error: "Invalid or expired reset token" };
  }

  // Find user
  const user = await db.query.users.findFirst({
    where: eq(users.email, resetToken.email),
  });

  if (!user) {
    return { error: "User not found" };
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update user password
  await db
    .update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, user.id));

  // Delete reset token
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

  // Delete all sessions for this user (force re-login)
  await db.delete(sessions).where(eq(sessions.userId, user.id));

  return { success: true, message: "Password reset successful. Please sign in with your new password." };
}

export async function resendVerificationEmail(email: string) {
  // Check if user exists
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return { error: "User not found" };
  }

  if (user.emailVerified) {
    return { error: "Email already verified" };
  }

  // Delete old verification tokens
  await db.delete(verificationTokens).where(eq(verificationTokens.email, email));

  // Create new verification token
  const token = crypto.randomBytes(32).toString("hex");
  await db.insert(verificationTokens).values({
    email,
    token,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // Send verification email
  const emailResult = await sendVerificationEmail(email, token);
  if (!emailResult.success) {
    return { error: "Failed to send verification email. Please try again." };
  }

  return { success: true, message: "Verification email sent successfully" };
}