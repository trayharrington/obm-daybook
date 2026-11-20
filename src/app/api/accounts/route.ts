import { getAccounts } from "@/lib/accounts";

function isNonEmptyString(string: unknown): boolean {
  return (typeof string === "string" && string.trim() !=="");
}
function isObject(object: unknown): boolean {
  return (typeof object === "object" && object !== null);
}
function isValidEmail(email: unknown): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && regex.test(email.trim());
}
function isValidDate(date: unknown): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;

  // Check correct shape
  if (typeof date !== "string" || !regex.test(date)) {
    return false;
  }
  const [year, month, day] = date.split("-").map(Number);
  const checkDate = new Date(Date.UTC(year, month - 1, day));
  return (checkDate.getUTCFullYear() === year && checkDate.getUTCMonth() + 1 === month && checkDate.getUTCDate() === day);
}
export async function GET() { return Response.json(getAccounts());}

export async function POST(request: Request) {
  const body = await request.json();

  if (!isNonEmptyString(body.accountName)) {
    return Response.json({error: "accountName is required"}, {status: 400})
  }
  if (!isNonEmptyString(body.planSize)) {
    return Response.json({error: "planSize is required"}, {status: 400})
  }
  if (body.customerType !== "new_business" && body.customerType !== "existing_customer") {
    return Response.json({error: 'customerType must be "new_business" or "existing_customer"'}, {status: 400})
  }

  // Owner Object Checks
  if (!isObject(body.owner)) {
    return Response.json({error: "owner is required"}, {status: 400})
  }
  if (!isNonEmptyString(body.owner.name)) {
    return Response.json({error: "owner.name is required"}, {status: 400})
  }
  if (!isValidEmail(body.owner.email)) {
    return Response.json({error: "owner.email must be a valid email"}, {status: 400})
  }

  if (!isValidDate(body.startDate)) {
    return Response.json({error: "startDate must be a real date in YYYY-MM-DD format"}, {status: 400})
  }

  return Response.json(body, {status: 201});
}
