import { Account, Contact, addAccount, getAccounts } from "@/lib/accounts";

function isNonEmptyString(string: unknown): string is string {
  return (typeof string === "string" && string.trim() !== "");
}

function isObject(object: unknown): object is Record<string, unknown> {
  return (typeof object === "object" && object !== null);
}

function validateContact(contact: unknown, label: string): string | null {
  if (!isObject(contact)) {
    return `${label} must be an object with name and email`
  }
  if (!isNonEmptyString(contact.name)) {
    return `${label}.name is required`
  }
  if (!isValidEmail(contact.email)) {
    return `${label}.email must be a valid email`
  }
  return null
}
function normalizeContact(contact: Contact): Contact {
  return {
    name: contact.name.trim(),
    email: contact.email.trim().toLowerCase(),
  };
}
function isValidEmail(email: unknown): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && regex.test(email.trim());
}
function isValidDate(date: unknown): date is string {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  // Check correct shape
  if (typeof date !== "string" || !regex.test(date)) {
    return false;
  }
  const [year, month, day] = date.split("-").map(Number);
  const checkDate = new Date(Date.UTC(year, month - 1, day));
  return (checkDate.getUTCFullYear() === year && checkDate.getUTCMonth() + 1 === month && checkDate.getUTCDate() === day);
}

export async function GET() {
  return Response.json(getAccounts());
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON" }, { status: 400 });
  }
  if (!isObject(body) || Array.isArray(body)) {
    return Response.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }
  if (!isNonEmptyString(body.accountName)) {
    return Response.json({error: "accountName is required"}, {status: 400})
  }
  if (!isNonEmptyString(body.planSize)) {
    return Response.json({error: "planSize is required"}, {status: 400})
  }
  if (body.customerType !== "new_business" && body.customerType !== "existing_customer") {
    return Response.json({error: 'customerType must be "new_business" or "existing_customer"'}, {status: 400})
  }
  const ownerError = validateContact(body.owner, "owner");
  if (ownerError) {
    return Response.json({error: ownerError}, {status: 400});
  }
  if (!isValidDate(body.startDate)) {
    return Response.json({error: "startDate must be a real date in YYYY-MM-DD format"}, {status: 400})
  }
  if (body.authorizedContacts !== undefined && !Array.isArray(body.authorizedContacts)) {
    return Response.json({error: "authorizedContacts must be an array"}, {status: 400});
  }
  for (const [i, contact] of (body.authorizedContacts ?? []).entries()) {
    const contactError = validateContact(contact, `authorizedContacts[${i}]`);
    if (contactError) {
      return Response.json({error: contactError}, {status: 400})
    }
  }
  const account: Account = {
    id: crypto.randomUUID(),
    accountName: body.accountName,
    owner: normalizeContact(body.owner as Contact),
    planSize: body.planSize,
    customerType: body.customerType,
    authorizedContacts: ((body.authorizedContacts ?? []) as Contact[]).map(normalizeContact),
    startDate: body.startDate,
    welcomeSentOn: null,
    kickoffBookedOn: null,
    kickoffCallOn: null,
    planSharedOn: null,
    toolsSharedOn: null,
    handoffSentOn: null,
    remindersSentOn: [],
    kickoffOutcome: null,
    kickoffWaivedOn: null,
    rescheduleOutreachSentOn: null,
    checkInsSentOn: []
  };
  addAccount(account);
  return Response.json(account, { status: 201 });
}
