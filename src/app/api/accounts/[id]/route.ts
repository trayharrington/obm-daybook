import { getAccountById } from "@/lib/accounts";

export async function GET(_req: Request, ctx: RouteContext<'/api/accounts/[id]'>) {
  const { id } = await ctx.params;

  const account = getAccountById(id);

  if (account){
    return Response.json(account);
  }
  return Response.json({error: `Account ${id} not found`}, {status: 404});
}
