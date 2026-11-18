import { getAccounts } from "@/lib/accounts";
export async function GET() { return Response.json(getAccounts());}
