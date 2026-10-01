import { NextResponse } from "next/server";
import { internalError, validationError } from "@/lib/api-response";
import { adminNoteSchema } from "@/lib/validation";
import { adminSetNote, requireAdmin } from "@/lib/admin";

/**
 * Write the private staff note on an account.
 *
 * Kept separate from the plan route on purpose. A note is a record of *why* a
 * decision was made and should never imply the decision itself, so combining
 * them would mean every "add a note" also rewrites plan state. An empty string
 * clears the note.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const { id } = await params;

    const parsed = adminNoteSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    await adminSetNote(adminId, id, parsed.data.note);

    return NextResponse.json({ adminNote: parsed.data.note || null });
  } catch (error) {
    return internalError("PATCH /api/admin/users/:id/note", error);
  }
}
